;; Simple Vault - Minimal deposit/withdraw
(define-constant ERR-ZERO (err u1))
(define-constant ERR-INSUFFICIENT (err u2))
(define-constant CONTRACT-OWNER tx-sender)

(define-data-var total-deposits uint u0)
(define-map balances principal uint)

(define-public (deposit (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set balances tx-sender (+ (default-to u0 (map-get? balances tx-sender)) amount))
    (var-set total-deposits (+ (var-get total-deposits) amount))
    (ok amount)))

(define-read-only (get-balance (user principal))
  (default-to u0 (map-get? balances user)))

(define-read-only (get-total)
  (var-get total-deposits))
