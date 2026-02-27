;; title: sbtc-collateral-manager
;; version: 1.0.0
;; summary: Use sBTC as collateral for borrowing
;; description: Open collateral positions with sBTC, borrow against
;;   collateral at 60% LTV, health factor monitoring, and margin calls.

;; ----------------------------------------------------------------------
;; Constants
;; ----------------------------------------------------------------------

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u3001))
(define-constant ERR-POSITION-NOT-FOUND (err u3002))
(define-constant ERR-ZERO-AMOUNT (err u3003))
(define-constant ERR-EXCEEDS-LTV (err u3004))
(define-constant ERR-POSITION-HEALTHY (err u3005))
(define-constant ERR-INSUFFICIENT-COLLATERAL (err u3006))
(define-constant ERR-ALREADY-LIQUIDATED (err u3007))
(define-constant ERR-INSUFFICIENT-REPAY (err u3008))

(define-constant LTV-RATIO u6000)            ;; 60% in basis points
(define-constant LIQUIDATION-THRESHOLD u8000) ;; 80% LTV triggers liquidation
(define-constant MARGIN-CALL-THRESHOLD u7000) ;; 70% LTV triggers margin call
(define-constant BASIS-POINTS u10000)

;; ----------------------------------------------------------------------
;; Data vars
;; ----------------------------------------------------------------------

(define-data-var position-nonce uint u0)
(define-data-var total-collateral uint u0)
(define-data-var total-borrowed uint u0)
(define-data-var btc-price uint u50000000000) ;; $50,000 in micro-units

;; ----------------------------------------------------------------------
;; Data maps
;; ----------------------------------------------------------------------

(define-map positions uint {
  owner: principal,
  collateral: uint,
  borrowed: uint,
  opened-at: uint,
  margin-called: bool,
  liquidated: bool
})

(define-map user-positions principal (list 10 uint))

;; ----------------------------------------------------------------------
;; Private functions
;; ----------------------------------------------------------------------

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (calculate-max-borrow (collateral uint))
  (/ (* collateral LTV-RATIO) BASIS-POINTS)
)

(define-private (calculate-health-factor (collateral uint) (borrowed uint))
  (if (is-eq borrowed u0)
    BASIS-POINTS
    (/ (* collateral BASIS-POINTS) borrowed)
  )
)

;; ----------------------------------------------------------------------
;; Public functions
;; ----------------------------------------------------------------------

(define-public (open-position (collateral-amount uint))
  (begin
    (asserts! (> collateral-amount u0) ERR-ZERO-AMOUNT)
    (try! (stx-transfer? collateral-amount tx-sender (as-contract tx-sender)))
    (let ((pid (var-get position-nonce))
          (existing (default-to (list) (map-get? user-positions tx-sender))))
      (map-set positions pid {
        owner: tx-sender,
        collateral: collateral-amount,
        borrowed: u0,
        opened-at: block-height,
        margin-called: false,
        liquidated: false
      })
      (map-set user-positions tx-sender
        (unwrap! (as-max-len? (append existing pid) u10) ERR-NOT-AUTHORIZED))
      (var-set position-nonce (+ pid u1))
      (var-set total-collateral (+ (var-get total-collateral) collateral-amount))
      (ok pid)
    )
  )
)

(define-public (borrow (position-id uint) (amount uint))
  (let ((pos (unwrap! (map-get? positions position-id) ERR-POSITION-NOT-FOUND)))
    (asserts! (is-eq (get owner pos) tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (not (get liquidated pos)) ERR-ALREADY-LIQUIDATED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let ((new-borrowed (+ (get borrowed pos) amount))
          (max-borrow (calculate-max-borrow (get collateral pos))))
      (asserts! (<= new-borrowed max-borrow) ERR-EXCEEDS-LTV)
      (try! (as-contract (stx-transfer? amount tx-sender (unwrap-panic (element-at (list tx-sender) u0)))))
      (map-set positions position-id
        (merge pos { borrowed: new-borrowed }))
      (var-set total-borrowed (+ (var-get total-borrowed) amount))
      (ok new-borrowed)
    )
  )
)

(define-public (repay (position-id uint) (amount uint))
  (let ((pos (unwrap! (map-get? positions position-id) ERR-POSITION-NOT-FOUND)))
    (asserts! (is-eq (get owner pos) tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let ((repay-amount (if (> amount (get borrowed pos)) (get borrowed pos) amount)))
      (try! (stx-transfer? repay-amount tx-sender (as-contract tx-sender)))
      (map-set positions position-id
        (merge pos {
          borrowed: (- (get borrowed pos) repay-amount),
          margin-called: false
        }))
      (var-set total-borrowed (- (var-get total-borrowed) repay-amount))
      (ok (- (get borrowed pos) repay-amount))
    )
  )
)

(define-public (add-collateral (position-id uint) (amount uint))
  (let ((pos (unwrap! (map-get? positions position-id) ERR-POSITION-NOT-FOUND)))
    (asserts! (is-eq (get owner pos) tx-sender) ERR-NOT-AUTHORIZED)
    (asserts! (not (get liquidated pos)) ERR-ALREADY-LIQUIDATED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set positions position-id
      (merge pos {
        collateral: (+ (get collateral pos) amount),
        margin-called: false
      }))
    (var-set total-collateral (+ (var-get total-collateral) amount))
    (ok (+ (get collateral pos) amount))
  )
)

(define-public (trigger-margin-call (position-id uint))
  (let ((pos (unwrap! (map-get? positions position-id) ERR-POSITION-NOT-FOUND))
        (hf (calculate-health-factor (get collateral pos) (get borrowed pos))))
    (asserts! (not (get liquidated pos)) ERR-ALREADY-LIQUIDATED)
    (asserts! (< hf MARGIN-CALL-THRESHOLD) ERR-POSITION-HEALTHY)
    (map-set positions position-id
      (merge pos { margin-called: true }))
    (ok hf)
  )
)

(define-public (set-btc-price (price uint))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (asserts! (> price u0) ERR-ZERO-AMOUNT)
    (var-set btc-price price)
    (ok price)
  )
)

;; ----------------------------------------------------------------------
;; Read-only functions
;; ----------------------------------------------------------------------

(define-read-only (get-position (position-id uint))
  (ok (map-get? positions position-id))
)

(define-read-only (get-position-health (position-id uint))
  (let ((pos (unwrap! (map-get? positions position-id) ERR-POSITION-NOT-FOUND)))
    (ok {
      health-factor: (calculate-health-factor (get collateral pos) (get borrowed pos)),
      collateral: (get collateral pos),
      borrowed: (get borrowed pos),
      max-borrow: (calculate-max-borrow (get collateral pos)),
      margin-called: (get margin-called pos),
      liquidated: (get liquidated pos)
    })
  )
)

(define-read-only (get-user-positions (user principal))
  (ok (default-to (list) (map-get? user-positions user)))
)

(define-read-only (get-protocol-stats)
  (ok {
    total-collateral: (var-get total-collateral),
    total-borrowed: (var-get total-borrowed),
    position-count: (var-get position-nonce),
    btc-price: (var-get btc-price),
    ltv-ratio: LTV-RATIO,
    liquidation-threshold: LIQUIDATION-THRESHOLD
  })
)

(define-read-only (get-max-borrow (collateral uint))
  (ok (calculate-max-borrow collateral))
)
