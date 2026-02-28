import txPkg from '@stacks/transactions';
const { makeContractDeploy, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

const CONTRACTS = [
  {
    name: 'defi-oracle-v1',
    code: `
;; DeFi Price Oracle
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u1))

(define-data-var stx-price uint u270000)
(define-data-var btc-price uint u67000000000)
(define-data-var last-update uint block-height)

(define-map token-prices (string-ascii 10) uint)

(define-public (set-price (token (string-ascii 10)) (price uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set token-prices token price)
    (var-set last-update block-height)
    (ok price)))

(define-public (set-stx-price (price uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set stx-price price)
    (var-set last-update block-height)
    (ok price)))

(define-read-only (get-price (token (string-ascii 10)))
  (default-to u0 (map-get? token-prices token)))

(define-read-only (get-stx-price) (var-get stx-price))
(define-read-only (get-btc-price) (var-get btc-price))
(define-read-only (get-last-update) (var-get last-update))
`
  },
  {
    name: 'defi-registry-v1',
    code: `
;; DeFi Protocol Registry
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-ALREADY-EXISTS (err u2))

(define-data-var protocol-count uint u0)
(define-map protocols uint {name: (string-ascii 50), tvl: uint, active: bool})
(define-map protocol-by-name (string-ascii 50) uint)

(define-public (register-protocol (name (string-ascii 50)) (tvl uint))
  (let ((id (var-get protocol-count)))
    (asserts! (is-none (map-get? protocol-by-name name)) ERR-ALREADY-EXISTS)
    (map-set protocols id {name: name, tvl: tvl, active: true})
    (map-set protocol-by-name name id)
    (var-set protocol-count (+ id u1))
    (ok id)))

(define-public (update-tvl (id uint) (tvl uint))
  (let ((p (unwrap! (map-get? protocols id) ERR-NOT-AUTHORIZED)))
    (map-set protocols id (merge p {tvl: tvl}))
    (ok tvl)))

(define-public (set-active (id uint) (active bool))
  (let ((p (unwrap! (map-get? protocols id) ERR-NOT-AUTHORIZED)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set protocols id (merge p {active: active}))
    (ok active)))

(define-read-only (get-protocol (id uint))
  (map-get? protocols id))

(define-read-only (get-protocol-count)
  (var-get protocol-count))
`
  },
  {
    name: 'defi-governance-v1',
    code: `
;; DeFi Governance
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-ALREADY-VOTED (err u2))

(define-data-var proposal-count uint u0)
(define-map proposals uint {title: (string-ascii 100), votes-for: uint, votes-against: uint, active: bool})
(define-map votes {proposal: uint, voter: principal} bool)

(define-public (create-proposal (title (string-ascii 100)))
  (let ((id (var-get proposal-count)))
    (map-set proposals id {title: title, votes-for: u0, votes-against: u0, active: true})
    (var-set proposal-count (+ id u1))
    (ok id)))

(define-public (vote (proposal-id uint) (support bool))
  (let ((p (unwrap! (map-get? proposals proposal-id) ERR-NOT-AUTHORIZED)))
    (asserts! (is-none (map-get? votes {proposal: proposal-id, voter: tx-sender})) ERR-ALREADY-VOTED)
    (asserts! (get active p) ERR-NOT-AUTHORIZED)
    (map-set votes {proposal: proposal-id, voter: tx-sender} support)
    (if support
      (map-set proposals proposal-id (merge p {votes-for: (+ (get votes-for p) u1)}))
      (map-set proposals proposal-id (merge p {votes-against: (+ (get votes-against p) u1)})))
    (ok support)))

(define-public (close-proposal (id uint))
  (let ((p (unwrap! (map-get? proposals id) ERR-NOT-AUTHORIZED)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set proposals id (merge p {active: false}))
    (ok true)))

(define-read-only (get-proposal (id uint))
  (map-get? proposals id))

(define-read-only (get-proposal-count)
  (var-get proposal-count))
`
  },
  {
    name: 'defi-staking-v1',
    code: `
;; DeFi Staking Tracker
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-ZERO (err u2))

(define-data-var total-staked uint u0)
(define-data-var reward-rate uint u500)
(define-map stakes principal {amount: uint, start-block: uint})

(define-public (stake (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO)
    (map-set stakes tx-sender {amount: (+ (get-stake tx-sender) amount), start-block: block-height})
    (var-set total-staked (+ (var-get total-staked) amount))
    (ok amount)))

(define-public (unstake (amount uint))
  (let ((current (get-stake tx-sender)))
    (asserts! (>= current amount) ERR-NOT-AUTHORIZED)
    (map-set stakes tx-sender {amount: (- current amount), start-block: block-height})
    (var-set total-staked (- (var-get total-staked) amount))
    (ok amount)))

(define-public (set-reward-rate (rate uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set reward-rate rate)
    (ok rate)))

(define-private (get-stake (user principal))
  (default-to u0 (get amount (map-get? stakes user))))

(define-read-only (get-stake-info (user principal))
  (map-get? stakes user))

(define-read-only (get-total-staked)
  (var-get total-staked))

(define-read-only (get-reward-rate)
  (var-get reward-rate))
`
  },
  {
    name: 'defi-pool-v1',
    code: `
;; DeFi Liquidity Pool Tracker
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u1))

(define-data-var pool-count uint u0)
(define-map pools uint {token-a: (string-ascii 10), token-b: (string-ascii 10), reserve-a: uint, reserve-b: uint, lp-supply: uint})
(define-map lp-balances {pool: uint, owner: principal} uint)

(define-public (create-pool (token-a (string-ascii 10)) (token-b (string-ascii 10)) (amount-a uint) (amount-b uint))
  (let ((id (var-get pool-count)))
    (map-set pools id {token-a: token-a, token-b: token-b, reserve-a: amount-a, reserve-b: amount-b, lp-supply: amount-a})
    (map-set lp-balances {pool: id, owner: tx-sender} amount-a)
    (var-set pool-count (+ id u1))
    (ok id)))

(define-public (add-liquidity (pool-id uint) (amount-a uint) (amount-b uint))
  (let ((p (unwrap! (map-get? pools pool-id) ERR-NOT-AUTHORIZED))
        (lp-amount (/ (* amount-a (get lp-supply p)) (get reserve-a p))))
    (map-set pools pool-id (merge p {
      reserve-a: (+ (get reserve-a p) amount-a),
      reserve-b: (+ (get reserve-b p) amount-b),
      lp-supply: (+ (get lp-supply p) lp-amount)}))
    (map-set lp-balances {pool: pool-id, owner: tx-sender}
      (+ (default-to u0 (map-get? lp-balances {pool: pool-id, owner: tx-sender})) lp-amount))
    (ok lp-amount)))

(define-read-only (get-pool (id uint))
  (map-get? pools id))

(define-read-only (get-lp-balance (pool-id uint) (owner principal))
  (default-to u0 (map-get? lp-balances {pool: pool-id, owner: owner})))

(define-read-only (get-pool-count)
  (var-get pool-count))
`
  }
];

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function deploy(name, code, nonce) {
  const tx = await makeContractDeploy({
    contractName: name,
    codeBody: code,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    fee: 12000n,
    nonce
  });
  const res = await broadcastTransaction({ transaction: tx, network });
  if (res.error) {
    console.log(`✗ ${name}: ${res.reason}`);
    return false;
  }
  console.log(`✓ ${name}: ${res.txid.slice(0, 16)}...`);
  return true;
}

async function main() {
  console.log('='.repeat(50));
  console.log('DeFi Contracts Deploy (No STX Transfer)');
  console.log('='.repeat(50));
  
  let nonce = await getCurrentNonce();
  console.log('Nonce:', nonce.toString(), '\n');
  
  let success = 0;
  for (const c of CONTRACTS) {
    if (await deploy(c.name, c.code, nonce++)) success++;
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\n${success}/${CONTRACTS.length} deployed`);
  console.log(`Fee: ~${(success * 12000) / 1000000} STX`);
}

main().catch(console.error);
