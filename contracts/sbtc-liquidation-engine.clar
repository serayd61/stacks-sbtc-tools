;; title: sbtc-liquidation-engine
;; version: 1.0.0
;; summary: Liquidation engine for undercollateralized sBTC positions
;; description: Monitor positions, trigger liquidations on unhealthy
;;   positions, run liquidation auctions, distribute penalties,
;;   and incentivize liquidation bots.

;; ----------------------------------------------------------------------
;; Constants
;; ----------------------------------------------------------------------

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u5001))
(define-constant ERR-POSITION-NOT-FOUND (err u5002))
(define-constant ERR-POSITION-HEALTHY (err u5003))
(define-constant ERR-ALREADY-LIQUIDATED (err u5004))
(define-constant ERR-AUCTION-NOT-FOUND (err u5005))
(define-constant ERR-AUCTION-ENDED (err u5006))
(define-constant ERR-BID-TOO-LOW (err u5007))
(define-constant ERR-ZERO-AMOUNT (err u5008))
(define-constant ERR-AUCTION-ACTIVE (err u5009))

(define-constant LIQUIDATION-PENALTY u1000)    ;; 10% penalty
(define-constant BOT-INCENTIVE u200)           ;; 2% to liquidation bot
(define-constant AUCTION-DURATION u72)         ;; ~12 hours in blocks
(define-constant MIN-HEALTH-FACTOR u8000)      ;; 80% = liquidation threshold
(define-constant BASIS-POINTS u10000)

;; ----------------------------------------------------------------------
;; Data vars
;; ----------------------------------------------------------------------

(define-data-var auction-nonce uint u0)
(define-data-var total-liquidations uint u0)
(define-data-var total-penalties-collected uint u0)
(define-data-var total-bot-rewards uint u0)

;; ----------------------------------------------------------------------
;; Data maps
;; ----------------------------------------------------------------------

(define-map tracked-positions uint {
  owner: principal,
  collateral: uint,
  debt: uint,
  health-factor: uint,
  is-liquidatable: bool
})

(define-map auctions uint {
  position-id: uint,
  collateral-amount: uint,
  debt-to-cover: uint,
  highest-bid: uint,
  highest-bidder: (optional principal),
  started-at: uint,
  ended: bool,
  liquidator: principal
})

(define-map bot-rewards principal uint)

;; ----------------------------------------------------------------------
;; Private functions
;; ----------------------------------------------------------------------

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (calculate-penalty (amount uint))
  (/ (* amount LIQUIDATION-PENALTY) BASIS-POINTS)
)

(define-private (calculate-bot-reward (amount uint))
  (/ (* amount BOT-INCENTIVE) BASIS-POINTS)
)

;; ----------------------------------------------------------------------
;; Public functions
;; ----------------------------------------------------------------------

(define-public (monitor-position
    (position-id uint)
    (owner principal)
    (collateral uint)
    (debt uint))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (let ((hf (if (is-eq debt u0)
                BASIS-POINTS
                (/ (* collateral BASIS-POINTS) debt))))
      (map-set tracked-positions position-id {
        owner: owner,
        collateral: collateral,
        debt: debt,
        health-factor: hf,
        is-liquidatable: (< hf MIN-HEALTH-FACTOR)
      })
      (ok hf)
    )
  )
)

(define-public (trigger-liquidation (position-id uint))
  (let ((pos (unwrap! (map-get? tracked-positions position-id) ERR-POSITION-NOT-FOUND)))
    (asserts! (get is-liquidatable pos) ERR-POSITION-HEALTHY)
    (let ((aid (var-get auction-nonce))
          (penalty (calculate-penalty (get collateral pos)))
          (bot-reward (calculate-bot-reward (get collateral pos)))
          (collateral-for-auction (- (get collateral pos) penalty)))
      (map-set auctions aid {
        position-id: position-id,
        collateral-amount: collateral-for-auction,
        debt-to-cover: (get debt pos),
        highest-bid: u0,
        highest-bidder: none,
        started-at: block-height,
        ended: false,
        liquidator: tx-sender
      })
      ;; reward the bot that triggered the liquidation
      (let ((existing-rewards (default-to u0 (map-get? bot-rewards tx-sender))))
        (map-set bot-rewards tx-sender (+ existing-rewards bot-reward))
      )
      (map-set tracked-positions position-id
        (merge pos { is-liquidatable: false }))
      (var-set auction-nonce (+ aid u1))
      (var-set total-liquidations (+ (var-get total-liquidations) u1))
      (var-set total-penalties-collected (+ (var-get total-penalties-collected) penalty))
      (var-set total-bot-rewards (+ (var-get total-bot-rewards) bot-reward))
      (ok aid)
    )
  )
)

(define-public (place-bid (auction-id uint) (bid-amount uint))
  (let ((auction (unwrap! (map-get? auctions auction-id) ERR-AUCTION-NOT-FOUND)))
    (asserts! (not (get ended auction)) ERR-AUCTION-ENDED)
    (asserts! (> bid-amount u0) ERR-ZERO-AMOUNT)
    (asserts! (> bid-amount (get highest-bid auction)) ERR-BID-TOO-LOW)
    (asserts! (<= (- block-height (get started-at auction)) AUCTION-DURATION)
      ERR-AUCTION-ENDED)
    (try! (stx-transfer? bid-amount tx-sender (as-contract tx-sender)))
    ;; refund previous bidder if exists
    (match (get highest-bidder auction)
      prev-bidder (begin
        (try! (as-contract (stx-transfer? (get highest-bid auction) tx-sender prev-bidder)))
        true
      )
      true
    )
    (map-set auctions auction-id
      (merge auction {
        highest-bid: bid-amount,
        highest-bidder: (some tx-sender)
      }))
    (ok bid-amount)
  )
)

(define-public (finalize-auction (auction-id uint))
  (let ((auction (unwrap! (map-get? auctions auction-id) ERR-AUCTION-NOT-FOUND)))
    (asserts! (not (get ended auction)) ERR-AUCTION-ENDED)
    (asserts! (> (- block-height (get started-at auction)) AUCTION-DURATION)
      ERR-AUCTION-ACTIVE)
    (map-set auctions auction-id (merge auction { ended: true }))
    (ok {
      winner: (get highest-bidder auction),
      winning-bid: (get highest-bid auction),
      collateral: (get collateral-amount auction)
    })
  )
)

(define-public (claim-bot-reward)
  (let ((reward (default-to u0 (map-get? bot-rewards tx-sender))))
    (asserts! (> reward u0) ERR-ZERO-AMOUNT)
    (map-set bot-rewards tx-sender u0)
    (try! (as-contract (stx-transfer? reward tx-sender (unwrap-panic (element-at (list tx-sender) u0)))))
    (ok reward)
  )
)

;; ----------------------------------------------------------------------
;; Read-only functions
;; ----------------------------------------------------------------------

(define-read-only (get-tracked-position (position-id uint))
  (ok (map-get? tracked-positions position-id))
)

(define-read-only (get-auction (auction-id uint))
  (ok (map-get? auctions auction-id))
)

(define-read-only (get-bot-reward (bot principal))
  (ok (default-to u0 (map-get? bot-rewards bot)))
)

(define-read-only (get-engine-stats)
  (ok {
    total-liquidations: (var-get total-liquidations),
    total-penalties: (var-get total-penalties-collected),
    total-bot-rewards: (var-get total-bot-rewards),
    active-auctions: (var-get auction-nonce)
  })
)

(define-read-only (is-position-liquidatable (position-id uint))
  (match (map-get? tracked-positions position-id)
    pos (ok (get is-liquidatable pos))
    ERR-POSITION-NOT-FOUND
  )
)
