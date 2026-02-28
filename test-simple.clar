;; Simple test contract
(define-constant CONTRACT-OWNER tx-sender)
(define-data-var counter uint u0)

(define-public (increment)
  (begin
    (var-set counter (+ (var-get counter) u1))
    (ok (var-get counter))))

(define-read-only (get-counter)
  (var-get counter))
