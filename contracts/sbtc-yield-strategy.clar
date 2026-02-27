;; title: sbtc-yield-strategy
;; version: 1.0.0
;; summary: Yield strategies for sBTC deposits
;; description: Register yield strategies, deposit to strategies,
;;   rebalance allocations, track APY and risk levels,
;;   and maintain strategy performance history.

;; ----------------------------------------------------------------------
;; Constants
;; ----------------------------------------------------------------------

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u2001))
(define-constant ERR-STRATEGY-EXISTS (err u2002))
(define-constant ERR-STRATEGY-NOT-FOUND (err u2003))
(define-constant ERR-STRATEGY-INACTIVE (err u2004))
(define-constant ERR-ZERO-AMOUNT (err u2005))
(define-constant ERR-INSUFFICIENT-BALANCE (err u2006))
(define-constant ERR-INVALID-RISK (err u2007))
(define-constant ERR-MAX-STRATEGIES (err u2008))

(define-constant MAX-RISK-LEVEL u10)
(define-constant MAX-STRATEGIES u20)

;; ----------------------------------------------------------------------
;; Data vars
;; ----------------------------------------------------------------------

(define-data-var strategy-count uint u0)
(define-data-var total-tvl uint u0)

;; ----------------------------------------------------------------------
;; Data maps
;; ----------------------------------------------------------------------

(define-map strategies uint {
  name: (string-ascii 64),
  risk-level: uint,
  target-apy: uint,
  realized-apy: uint,
  tvl: uint,
  active: bool,
  creator: principal,
  created-at: uint
})

(define-map user-strategy-deposits { user: principal, strategy-id: uint } uint)

(define-map strategy-history { strategy-id: uint, epoch: uint } {
  apy: uint,
  tvl: uint,
  recorded-at: uint
})

(define-map strategy-epoch-counter uint uint)

;; ----------------------------------------------------------------------
;; Private functions
;; ----------------------------------------------------------------------

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

;; ----------------------------------------------------------------------
;; Public functions
;; ----------------------------------------------------------------------

(define-public (register-strategy
    (name (string-ascii 64))
    (risk-level uint)
    (target-apy uint))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (asserts! (<= risk-level MAX-RISK-LEVEL) ERR-INVALID-RISK)
    (let ((sid (var-get strategy-count)))
      (asserts! (< sid MAX-STRATEGIES) ERR-MAX-STRATEGIES)
      (map-set strategies sid {
        name: name,
        risk-level: risk-level,
        target-apy: target-apy,
        realized-apy: u0,
        tvl: u0,
        active: true,
        creator: tx-sender,
        created-at: block-height
      })
      (map-set strategy-epoch-counter sid u0)
      (var-set strategy-count (+ sid u1))
      (ok sid)
    )
  )
)

(define-public (deposit-to-strategy (strategy-id uint) (amount uint))
  (let ((strategy (unwrap! (map-get? strategies strategy-id) ERR-STRATEGY-NOT-FOUND)))
    (asserts! (get active strategy) ERR-STRATEGY-INACTIVE)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (let ((current (default-to u0
            (map-get? user-strategy-deposits { user: tx-sender, strategy-id: strategy-id }))))
      (map-set user-strategy-deposits
        { user: tx-sender, strategy-id: strategy-id }
        (+ current amount))
      (map-set strategies strategy-id
        (merge strategy { tvl: (+ (get tvl strategy) amount) }))
      (var-set total-tvl (+ (var-get total-tvl) amount))
      (ok amount)
    )
  )
)

(define-public (withdraw-from-strategy (strategy-id uint) (amount uint))
  (let ((strategy (unwrap! (map-get? strategies strategy-id) ERR-STRATEGY-NOT-FOUND))
        (current (default-to u0
          (map-get? user-strategy-deposits { user: tx-sender, strategy-id: strategy-id }))))
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (>= current amount) ERR-INSUFFICIENT-BALANCE)
    (try! (as-contract (stx-transfer? amount tx-sender (unwrap-panic (element-at (list tx-sender) u0)))))
    (map-set user-strategy-deposits
      { user: tx-sender, strategy-id: strategy-id }
      (- current amount))
    (map-set strategies strategy-id
      (merge strategy { tvl: (- (get tvl strategy) amount) }))
    (var-set total-tvl (- (var-get total-tvl) amount))
    (ok amount)
  )
)

(define-public (update-strategy-apy (strategy-id uint) (new-apy uint))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (let ((strategy (unwrap! (map-get? strategies strategy-id) ERR-STRATEGY-NOT-FOUND))
          (epoch (default-to u0 (map-get? strategy-epoch-counter strategy-id))))
      (map-set strategy-history
        { strategy-id: strategy-id, epoch: epoch }
        { apy: new-apy, tvl: (get tvl strategy), recorded-at: block-height })
      (map-set strategy-epoch-counter strategy-id (+ epoch u1))
      (map-set strategies strategy-id
        (merge strategy { realized-apy: new-apy }))
      (ok new-apy)
    )
  )
)

(define-public (toggle-strategy (strategy-id uint) (active bool))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (let ((strategy (unwrap! (map-get? strategies strategy-id) ERR-STRATEGY-NOT-FOUND)))
      (map-set strategies strategy-id (merge strategy { active: active }))
      (ok active)
    )
  )
)

;; ----------------------------------------------------------------------
;; Read-only functions
;; ----------------------------------------------------------------------

(define-read-only (get-strategy (strategy-id uint))
  (ok (map-get? strategies strategy-id))
)

(define-read-only (get-strategy-count)
  (ok (var-get strategy-count))
)

(define-read-only (get-total-tvl)
  (ok (var-get total-tvl))
)

(define-read-only (get-user-deposit (user principal) (strategy-id uint))
  (ok (default-to u0
    (map-get? user-strategy-deposits { user: user, strategy-id: strategy-id })))
)

(define-read-only (get-strategy-history-entry (strategy-id uint) (epoch uint))
  (ok (map-get? strategy-history { strategy-id: strategy-id, epoch: epoch }))
)

(define-read-only (get-strategy-epoch (strategy-id uint))
  (ok (default-to u0 (map-get? strategy-epoch-counter strategy-id)))
)
