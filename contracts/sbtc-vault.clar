;; title: sbtc-vault
;; version: 1.0.0
;; summary: sBTC vault for earning yield on deposited sBTC
;; description: Deposit sBTC (tracked as STX for simplicity), earn yield
;;   through auto-compounding, manage vault shares, emergency withdraw,
;;   and pause mechanism for safety.

;; ----------------------------------------------------------------------
;; Constants
;; ----------------------------------------------------------------------

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u1001))
(define-constant ERR-VAULT-PAUSED (err u1002))
(define-constant ERR-ZERO-AMOUNT (err u1003))
(define-constant ERR-INSUFFICIENT-BALANCE (err u1004))
(define-constant ERR-INSUFFICIENT-SHARES (err u1005))
(define-constant ERR-NO-YIELD (err u1006))
(define-constant ERR-OVERFLOW (err u1007))
(define-constant PRECISION u1000000)

;; ----------------------------------------------------------------------
;; Data vars
;; ----------------------------------------------------------------------

(define-data-var vault-paused bool false)
(define-data-var total-deposited uint u0)
(define-data-var total-shares uint u0)
(define-data-var accumulated-yield uint u0)
(define-data-var yield-per-share uint u0)
(define-data-var last-compound-block uint u0)
(define-data-var compound-rate uint u500) ;; 0.05% per compound in basis points

;; ----------------------------------------------------------------------
;; Data maps
;; ----------------------------------------------------------------------

(define-map user-deposits principal uint)
(define-map user-shares principal uint)
(define-map user-yield-claimed principal uint)

;; ----------------------------------------------------------------------
;; Private functions
;; ----------------------------------------------------------------------

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (calculate-shares (amount uint))
  (let ((ts (var-get total-shares))
        (td (var-get total-deposited)))
    (if (is-eq ts u0)
      amount
      (/ (* amount ts) td)
    )
  )
)

(define-private (calculate-withdrawal-amount (shares uint))
  (let ((ts (var-get total-shares))
        (td (var-get total-deposited)))
    (if (is-eq ts u0)
      u0
      (/ (* shares td) ts)
    )
  )
)

;; ----------------------------------------------------------------------
;; Public functions
;; ----------------------------------------------------------------------

(define-public (deposit (amount uint))
  (begin
    (asserts! (not (var-get vault-paused)) ERR-VAULT-PAUSED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let ((shares (calculate-shares amount))
          (current-deposit (default-to u0 (map-get? user-deposits tx-sender)))
          (current-shares (default-to u0 (map-get? user-shares tx-sender))))
      (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
      (map-set user-deposits tx-sender (+ current-deposit amount))
      (map-set user-shares tx-sender (+ current-shares shares))
      (var-set total-deposited (+ (var-get total-deposited) amount))
      (var-set total-shares (+ (var-get total-shares) shares))
      (ok shares)
    )
  )
)

(define-public (withdraw (shares uint))
  (begin
    (asserts! (> shares u0) ERR-ZERO-AMOUNT)
    (let ((current-shares (default-to u0 (map-get? user-shares tx-sender)))
          (amount (calculate-withdrawal-amount shares)))
      (asserts! (>= current-shares shares) ERR-INSUFFICIENT-SHARES)
      (asserts! (> amount u0) ERR-ZERO-AMOUNT)
      (let ((current-deposit (default-to u0 (map-get? user-deposits tx-sender)))
            (new-deposit (if (>= current-deposit amount) (- current-deposit amount) u0)))
        (try! (as-contract (stx-transfer? amount tx-sender (unwrap-panic (element-at (list tx-sender) u0)))))
        (map-set user-shares tx-sender (- current-shares shares))
        (map-set user-deposits tx-sender new-deposit)
        (var-set total-deposited (- (var-get total-deposited) amount))
        (var-set total-shares (- (var-get total-shares) shares))
        (ok amount)
      )
    )
  )
)

(define-public (compound-yield)
  (begin
    (asserts! (not (var-get vault-paused)) ERR-VAULT-PAUSED)
    (let ((td (var-get total-deposited))
          (rate (var-get compound-rate))
          (new-yield (/ (* td rate) u10000)))
      (asserts! (> new-yield u0) ERR-NO-YIELD)
      (var-set total-deposited (+ td new-yield))
      (var-set accumulated-yield (+ (var-get accumulated-yield) new-yield))
      (var-set last-compound-block block-height)
      (let ((ts (var-get total-shares)))
        (if (> ts u0)
          (var-set yield-per-share (/ (* (var-get accumulated-yield) PRECISION) ts))
          true
        )
      )
      (ok new-yield)
    )
  )
)

(define-public (emergency-withdraw)
  (let ((current-deposit (default-to u0 (map-get? user-deposits tx-sender)))
        (current-shares (default-to u0 (map-get? user-shares tx-sender))))
    (asserts! (> current-deposit u0) ERR-INSUFFICIENT-BALANCE)
    (try! (as-contract (stx-transfer? current-deposit tx-sender (unwrap-panic (element-at (list tx-sender) u0)))))
    (map-set user-deposits tx-sender u0)
    (map-set user-shares tx-sender u0)
    (var-set total-deposited (- (var-get total-deposited) current-deposit))
    (var-set total-shares (- (var-get total-shares) current-shares))
    (ok current-deposit)
  )
)

(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (var-set vault-paused paused)
    (ok paused)
  )
)

(define-public (set-compound-rate (new-rate uint))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (asserts! (<= new-rate u10000) ERR-OVERFLOW)
    (var-set compound-rate new-rate)
    (ok new-rate)
  )
)

;; ----------------------------------------------------------------------
;; Read-only functions
;; ----------------------------------------------------------------------

(define-read-only (get-vault-info)
  (ok {
    total-deposited: (var-get total-deposited),
    total-shares: (var-get total-shares),
    accumulated-yield: (var-get accumulated-yield),
    yield-per-share: (var-get yield-per-share),
    compound-rate: (var-get compound-rate),
    last-compound-block: (var-get last-compound-block),
    paused: (var-get vault-paused)
  })
)

(define-read-only (get-user-info (user principal))
  (ok {
    deposit: (default-to u0 (map-get? user-deposits user)),
    shares: (default-to u0 (map-get? user-shares user)),
    yield-claimed: (default-to u0 (map-get? user-yield-claimed user))
  })
)

(define-read-only (get-share-price)
  (let ((ts (var-get total-shares))
        (td (var-get total-deposited)))
    (if (is-eq ts u0)
      (ok PRECISION)
      (ok (/ (* td PRECISION) ts))
    )
  )
)

(define-read-only (is-vault-paused)
  (ok (var-get vault-paused))
)
