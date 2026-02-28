;; title: lending-pool-v2
;; version: 2.0.0
;; summary: Fixed Lending Pool for Stacks

(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-INSUFFICIENT-BAL (err u1002))
(define-constant ERR-ZERO-AMOUNT (err u1003))

(define-constant CONTRACT-OWNER tx-sender)
(define-constant PRECISION u1000000)
(define-constant LTV-RATIO u750000)

(define-data-var pool-enabled bool true)
(define-data-var total-deposits uint u0)
(define-data-var total-borrows uint u0)

(define-map user-deposits principal uint)
(define-map user-borrows principal uint)

(define-public (deposit (amount uint))
  (begin
    (asserts! (var-get pool-enabled) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set user-deposits tx-sender 
      (+ (default-to u0 (map-get? user-deposits tx-sender)) amount))
    (var-set total-deposits (+ (var-get total-deposits) amount))
    (ok amount)))

(define-public (withdraw (amount uint))
  (let ((balance (default-to u0 (map-get? user-deposits tx-sender)))
        (caller tx-sender))
    (asserts! (>= balance amount) ERR-INSUFFICIENT-BAL)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (try! (as-contract (stx-transfer? amount tx-sender caller)))
    (map-set user-deposits caller (- balance amount))
    (var-set total-deposits (- (var-get total-deposits) amount))
    (ok amount)))

(define-public (borrow (amount uint))
  (let ((collateral (default-to u0 (map-get? user-deposits tx-sender)))
        (max-borrow (/ (* collateral LTV-RATIO) PRECISION))
        (caller tx-sender))
    (asserts! (var-get pool-enabled) ERR-NOT-AUTHORIZED)
    (asserts! (<= amount max-borrow) ERR-INSUFFICIENT-BAL)
    (try! (as-contract (stx-transfer? amount tx-sender caller)))
    (map-set user-borrows caller 
      (+ (default-to u0 (map-get? user-borrows caller)) amount))
    (var-set total-borrows (+ (var-get total-borrows) amount))
    (ok amount)))

(define-public (set-pool-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set pool-enabled enabled)
    (ok enabled)))

(define-read-only (get-user-position (user principal))
  (ok {
    deposits: (default-to u0 (map-get? user-deposits user)),
    borrows: (default-to u0 (map-get? user-borrows user))}))

(define-read-only (get-pool-stats)
  (ok {
    total-deposits: (var-get total-deposits),
    total-borrows: (var-get total-borrows),
    enabled: (var-get pool-enabled)}))
