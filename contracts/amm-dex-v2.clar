;; title: amm-dex-v2
;; version: 2.0.0
;; summary: Fixed AMM DEX for Stacks

(define-constant ERR-NOT-AUTHORIZED   (err u3000))
(define-constant ERR-POOL-EXISTS      (err u3001))
(define-constant ERR-NO-POOL          (err u3002))
(define-constant ERR-ZERO-AMOUNT      (err u3003))
(define-constant ERR-SLIPPAGE         (err u3004))
(define-constant ERR-INSUFFICIENT-LIQ (err u3005))

(define-constant CONTRACT-OWNER  tx-sender)
(define-constant PRECISION       u1000000)
(define-constant SWAP-FEE        u3000)

(define-data-var pool-nonce uint u0)
(define-data-var total-liquidity uint u0)

(define-map pools uint {reserve-a: uint, reserve-b: uint, total-lp: uint, enabled: bool})
(define-map lp-balances {pool-id: uint, owner: principal} uint)

(define-private (min-uint (a uint) (b uint))
  (if (<= a b) a b))

(define-private (sqrt (x uint))
  (if (<= x u1) x (/ (+ x u1) u2)))

(define-public (create-pool (amount-a uint) (amount-b uint))
  (let ((id (var-get pool-nonce))
        (init-lp (sqrt (* amount-a amount-b))))
    (asserts! (> amount-a u0) ERR-ZERO-AMOUNT)
    (asserts! (> amount-b u0) ERR-ZERO-AMOUNT)
    (try! (stx-transfer? (+ amount-a amount-b) tx-sender (as-contract tx-sender)))
    (map-set pools id {reserve-a: amount-a, reserve-b: amount-b, total-lp: init-lp, enabled: true})
    (map-set lp-balances {pool-id: id, owner: tx-sender} init-lp)
    (var-set pool-nonce (+ id u1))
    (var-set total-liquidity (+ (var-get total-liquidity) (+ amount-a amount-b)))
    (ok {pool-id: id, lp-tokens: init-lp})))

(define-public (add-liquidity (pool-id uint) (amount-a uint) (amount-b uint))
  (let ((pool (unwrap! (map-get? pools pool-id) ERR-NO-POOL)))
    (asserts! (get enabled pool) ERR-NO-POOL)
    (try! (stx-transfer? (+ amount-a amount-b) tx-sender (as-contract tx-sender)))
    (let ((new-lp (/ (* amount-a (get total-lp pool)) (get reserve-a pool))))
      (map-set pools pool-id (merge pool {
        reserve-a: (+ (get reserve-a pool) amount-a),
        reserve-b: (+ (get reserve-b pool) amount-b),
        total-lp: (+ (get total-lp pool) new-lp)}))
      (map-set lp-balances {pool-id: pool-id, owner: tx-sender}
        (+ (default-to u0 (map-get? lp-balances {pool-id: pool-id, owner: tx-sender})) new-lp))
      (ok {lp-tokens: new-lp}))))

(define-public (set-pool-enabled (pool-id uint) (enabled bool))
  (let ((pool (unwrap! (map-get? pools pool-id) ERR-NO-POOL)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set pools pool-id (merge pool {enabled: enabled}))
    (ok enabled)))

(define-read-only (get-pool-info (pool-id uint))
  (ok (map-get? pools pool-id)))

(define-read-only (get-lp-balance (pool-id uint) (owner principal))
  (ok (default-to u0 (map-get? lp-balances {pool-id: pool-id, owner: owner}))))

(define-read-only (get-pool-count)
  (var-get pool-nonce))

(define-read-only (get-total-liquidity)
  (var-get total-liquidity))
