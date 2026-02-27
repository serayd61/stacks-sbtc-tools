# stacks-sbtc-tools

Clarity smart contracts for sBTC (Stacks Bitcoin) DeFi tooling on the Stacks blockchain.

sBTC is a decentralized, programmable 1:1 Bitcoin-backed asset on Stacks. This project
provides a suite of contracts for vault management, yield strategies, collateral lending,
price oracles, and liquidation mechanics -- all built around sBTC.

## Contracts

### sbtc-vault

sBTC vault for earning yield on deposited sBTC (tracked as STX for simplicity).

- Deposit and withdraw sBTC, receiving vault shares in return
- Auto-compound yield at a configurable compound rate
- Emergency withdraw bypasses pause state for user safety
- Owner can pause/unpause the vault

Key functions: `deposit`, `withdraw`, `compound-yield`, `emergency-withdraw`, `set-paused`

### sbtc-yield-strategy

Manage multiple yield strategies for sBTC allocations.

- Register named strategies with risk levels (1-10) and target APY
- Users deposit into specific strategies
- Owner updates realized APY and records performance history by epoch
- Toggle strategies active/inactive

Key functions: `register-strategy`, `deposit-to-strategy`, `withdraw-from-strategy`,
`update-strategy-apy`, `toggle-strategy`

### sbtc-collateral-manager

Use sBTC as collateral for borrowing.

- Open a collateral position by depositing sBTC
- Borrow up to 60% LTV against your collateral
- Repay debt or add more collateral to improve health factor
- Margin call triggered at 70% LTV; liquidation threshold at 80% LTV

Key functions: `open-position`, `borrow`, `repay`, `add-collateral`, `trigger-margin-call`

### sbtc-price-feed

BTC/STX price oracle for the sBTC ecosystem.

- Authorized price feeds submit BTC and STX prices
- Price bounds validation prevents extreme outliers
- Staleness check (max 144 blocks / ~24 hours)
- Full price history stored on-chain

Key functions: `add-feed`, `remove-feed`, `submit-price`, `set-price-bounds`

### sbtc-liquidation-engine

Liquidation engine for undercollateralized sBTC positions.

- Monitor positions and flag liquidatable ones (health factor below 80%)
- Trigger liquidation to start a collateral auction
- Place bids on auctions; highest bidder wins after auction duration
- 10% liquidation penalty; 2% reward for the bot that triggers liquidation

Key functions: `monitor-position`, `trigger-liquidation`, `place-bid`,
`finalize-auction`, `claim-bot-reward`

## Architecture

```
+------------------+     +----------------------+
| sbtc-price-feed  |---->| sbtc-collateral-mgr  |
| (BTC/STX oracle) |     | (positions & LTV)    |
+------------------+     +----------+-----------+
                                    |
                                    v
+------------------+     +----------------------+
| sbtc-vault       |     | sbtc-liquidation-eng |
| (deposit/yield)  |     | (auctions & bots)    |
+------------------+     +----------------------+
        |
        v
+------------------+
| sbtc-yield-strat |
| (APY & risk)     |
+------------------+
```

## Getting Started

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) v2.x+
- Node.js 18+ (for tests)

### Setup

```bash
# Clone the repository
git clone https://github.com/serayd61/stacks-sbtc-tools.git
cd stacks-sbtc-tools

# Check all contracts compile
clarinet check

# Run tests
npm install
npm test

# Open the Clarinet console for interactive testing
clarinet console
```

### Example: Deposit to Vault

```clarity
;; In clarinet console
(contract-call? .sbtc-vault deposit u1000000)
;; => (ok u1000000)

(contract-call? .sbtc-vault get-vault-info)
;; => (ok { total-deposited: u1000000, total-shares: u1000000, ... })
```

### Example: Open Collateral Position

```clarity
;; Deposit 10 STX as collateral
(contract-call? .sbtc-collateral-manager open-position u10000000)
;; => (ok u0)

;; Borrow up to 60% LTV
(contract-call? .sbtc-collateral-manager borrow u0 u6000000)
;; => (ok u6000000)
```

## Configuration

All contracts use Clarity version 2 with epoch 2.5 (see `Clarinet.toml`).

Key parameters:

| Parameter              | Contract              | Value       |
|------------------------|-----------------------|-------------|
| Compound rate          | sbtc-vault            | 0.05%       |
| Max risk level         | sbtc-yield-strategy   | 10          |
| LTV ratio              | sbtc-collateral-mgr   | 60%         |
| Margin call threshold  | sbtc-collateral-mgr   | 70%         |
| Liquidation threshold  | sbtc-collateral-mgr   | 80%         |
| Max price staleness    | sbtc-price-feed       | 144 blocks  |
| Liquidation penalty    | sbtc-liquidation-eng  | 10%         |
| Bot incentive          | sbtc-liquidation-eng  | 2%          |
| Auction duration       | sbtc-liquidation-eng  | 72 blocks   |

## License

MIT
