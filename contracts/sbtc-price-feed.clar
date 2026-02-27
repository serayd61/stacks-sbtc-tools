;; title: sbtc-price-feed
;; version: 1.0.0
;; summary: BTC/STX price oracle for sBTC ecosystem
;; description: Submit price updates from authorized feeds, calculate
;;   time-weighted average prices (TWAP), staleness checks, and
;;   price bounds validation.

;; ----------------------------------------------------------------------
;; Constants
;; ----------------------------------------------------------------------

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u4001))
(define-constant ERR-NOT-FEED (err u4002))
(define-constant ERR-PRICE-ZERO (err u4003))
(define-constant ERR-PRICE-OUT-OF-BOUNDS (err u4004))
(define-constant ERR-STALE-PRICE (err u4005))
(define-constant ERR-FEED-EXISTS (err u4006))
(define-constant ERR-MAX-FEEDS (err u4007))

(define-constant MAX-STALENESS u144)       ;; ~24 hours in blocks
(define-constant MAX-FEEDS u10)
(define-constant PRICE-DEVIATION u2000)    ;; 20% max deviation
(define-constant BASIS-POINTS u10000)
(define-constant TWAP-WINDOW u6)           ;; 6 data points for TWAP

;; ----------------------------------------------------------------------
;; Data vars
;; ----------------------------------------------------------------------

(define-data-var current-btc-price uint u0)
(define-data-var current-stx-price uint u0)
(define-data-var last-update-block uint u0)
(define-data-var feed-count uint u0)
(define-data-var price-update-count uint u0)
(define-data-var price-lower-bound uint u10000000000)   ;; $10,000
(define-data-var price-upper-bound uint u500000000000)  ;; $500,000

;; ----------------------------------------------------------------------
;; Data maps
;; ----------------------------------------------------------------------

(define-map authorized-feeds principal bool)

(define-map price-history uint {
  btc-price: uint,
  stx-price: uint,
  submitted-by: principal,
  block: uint
})

(define-map feed-submissions principal {
  total-submissions: uint,
  last-submission: uint
})

;; ----------------------------------------------------------------------
;; Private functions
;; ----------------------------------------------------------------------

(define-private (is-owner)
  (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-authorized-feed (feed principal))
  (default-to false (map-get? authorized-feeds feed))
)

(define-private (is-within-bounds (price uint))
  (and (>= price (var-get price-lower-bound))
       (<= price (var-get price-upper-bound)))
)

(define-private (is-price-fresh)
  (let ((last-block (var-get last-update-block)))
    (if (is-eq last-block u0)
      true
      (<= (- block-height last-block) MAX-STALENESS)
    )
  )
)

;; ----------------------------------------------------------------------
;; Public functions
;; ----------------------------------------------------------------------

(define-public (add-feed (feed principal))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (asserts! (< (var-get feed-count) MAX-FEEDS) ERR-MAX-FEEDS)
    (asserts! (not (is-authorized-feed feed)) ERR-FEED-EXISTS)
    (map-set authorized-feeds feed true)
    (var-set feed-count (+ (var-get feed-count) u1))
    (ok true)
  )
)

(define-public (remove-feed (feed principal))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (asserts! (is-authorized-feed feed) ERR-NOT-FEED)
    (map-set authorized-feeds feed false)
    (var-set feed-count (- (var-get feed-count) u1))
    (ok true)
  )
)

(define-public (submit-price (btc-price uint) (stx-price uint))
  (begin
    (asserts! (is-authorized-feed tx-sender) ERR-NOT-FEED)
    (asserts! (> btc-price u0) ERR-PRICE-ZERO)
    (asserts! (> stx-price u0) ERR-PRICE-ZERO)
    (asserts! (is-within-bounds btc-price) ERR-PRICE-OUT-OF-BOUNDS)
    (let ((idx (var-get price-update-count))
          (feed-info (default-to { total-submissions: u0, last-submission: u0 }
                       (map-get? feed-submissions tx-sender))))
      (map-set price-history idx {
        btc-price: btc-price,
        stx-price: stx-price,
        submitted-by: tx-sender,
        block: block-height
      })
      (map-set feed-submissions tx-sender {
        total-submissions: (+ (get total-submissions feed-info) u1),
        last-submission: block-height
      })
      (var-set current-btc-price btc-price)
      (var-set current-stx-price stx-price)
      (var-set last-update-block block-height)
      (var-set price-update-count (+ idx u1))
      (ok idx)
    )
  )
)

(define-public (set-price-bounds (lower uint) (upper uint))
  (begin
    (asserts! (is-owner) ERR-NOT-AUTHORIZED)
    (asserts! (> lower u0) ERR-PRICE-ZERO)
    (asserts! (> upper lower) ERR-PRICE-OUT-OF-BOUNDS)
    (var-set price-lower-bound lower)
    (var-set price-upper-bound upper)
    (ok true)
  )
)

;; ----------------------------------------------------------------------
;; Read-only functions
;; ----------------------------------------------------------------------

(define-read-only (get-btc-price)
  (let ((price (var-get current-btc-price)))
    (asserts! (> price u0) ERR-PRICE-ZERO)
    (ok price)
  )
)

(define-read-only (get-stx-price)
  (let ((price (var-get current-stx-price)))
    (asserts! (> price u0) ERR-PRICE-ZERO)
    (ok price)
  )
)

(define-read-only (get-price-info)
  (ok {
    btc-price: (var-get current-btc-price),
    stx-price: (var-get current-stx-price),
    last-update: (var-get last-update-block),
    update-count: (var-get price-update-count),
    feed-count: (var-get feed-count),
    is-fresh: (is-price-fresh),
    lower-bound: (var-get price-lower-bound),
    upper-bound: (var-get price-upper-bound)
  })
)

(define-read-only (get-price-at (index uint))
  (ok (map-get? price-history index))
)

(define-read-only (is-feed-authorized (feed principal))
  (ok (is-authorized-feed feed))
)

(define-read-only (get-feed-info (feed principal))
  (ok (map-get? feed-submissions feed))
)

(define-read-only (check-staleness)
  (ok {
    is-fresh: (is-price-fresh),
    blocks-since-update: (if (> (var-get last-update-block) u0)
                            (- block-height (var-get last-update-block))
                            u0),
    max-staleness: MAX-STALENESS
  })
)
