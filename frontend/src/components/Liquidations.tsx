interface Liquidation {
  id: number;
  vaultId: number;
  owner: string;
  collateral: number;
  debt: number;
  healthFactor: number;
  liquidationPrice: number;
  currentPrice: number;
  discount: number;
}

const atRiskVaults: Liquidation[] = [
  {
    id: 1,
    vaultId: 5,
    owner: 'SP2J6...KN3M',
    collateral: 1.8,
    debt: 1.4,
    healthFactor: 1.29,
    liquidationPrice: 92500,
    currentPrice: 97500,
    discount: 5,
  },
  {
    id: 2,
    vaultId: 12,
    owner: 'SP4KN...M2PQ',
    collateral: 2.3,
    debt: 1.9,
    healthFactor: 1.21,
    liquidationPrice: 94200,
    currentPrice: 97500,
    discount: 5,
  },
  {
    id: 3,
    vaultId: 23,
    owner: 'SP8MN...Q3RS',
    collateral: 0.8,
    debt: 0.72,
    healthFactor: 1.11,
    liquidationPrice: 96800,
    currentPrice: 97500,
    discount: 5,
  },
];

const recentLiquidations = [
  { id: 1, vaultId: 45, collateral: 3.2, debt: 2.8, liquidator: 'SP3K8...0KBR', profit: 0.16, block: 895420 },
  { id: 2, vaultId: 38, collateral: 1.5, debt: 1.35, liquidator: 'SP1CG...PJ0Y', profit: 0.075, block: 895380 },
  { id: 3, vaultId: 67, collateral: 5.8, debt: 5.1, liquidator: 'SP3K8...0KBR', profit: 0.29, block: 895210 },
];

export default function Liquidations() {
  const getHealthColor = (hf: number) => {
    if (hf >= 1.3) return 'var(--btc-orange)';
    return 'var(--accent-red)';
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          <span className="gradient-btc">Liquidations</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitor at-risk vaults and participate in liquidations
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            At-Risk Vaults
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-red)' }}>
            {atRiskVaults.length}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            At-Risk Value
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700 }}>
            {atRiskVaults.reduce((sum, v) => sum + v.collateral, 0).toFixed(2)} sBTC
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            24h Liquidations
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700 }}>
            {recentLiquidations.length}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Liquidation Bonus
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-green)' }}>
            5%
          </div>
        </div>
      </div>

      {/* At-Risk Vaults */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent-red)' }}>⚠️</span>
          At-Risk Vaults
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Vault
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Owner
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Collateral
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Debt
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Health
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Liq. Price
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {atRiskVaults.map((vault) => (
                <tr key={vault.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="mono" style={{ padding: '16px', fontWeight: 600 }}>
                    #{vault.vaultId}
                  </td>
                  <td className="mono" style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                    {vault.owner}
                  </td>
                  <td className="mono" style={{ textAlign: 'right', padding: '16px' }}>
                    {vault.collateral} sBTC
                  </td>
                  <td className="mono" style={{ textAlign: 'right', padding: '16px' }}>
                    {vault.debt} sBTC
                  </td>
                  <td style={{ textAlign: 'right', padding: '16px' }}>
                    <span className="mono" style={{
                      fontWeight: 600,
                      color: getHealthColor(vault.healthFactor),
                    }}>
                      {vault.healthFactor.toFixed(2)}
                    </span>
                  </td>
                  <td className="mono" style={{ textAlign: 'right', padding: '16px' }}>
                    ${vault.liquidationPrice.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center', padding: '16px' }}>
                    <button
                      className="btn"
                      style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        background: 'var(--accent-red)',
                        color: '#fff',
                      }}
                    >
                      Liquidate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Liquidations */}
      <div className="card">
        <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600 }}>
          Recent Liquidations
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Vault
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Collateral
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Debt Repaid
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Liquidator
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Profit
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Block
                </th>
              </tr>
            </thead>
            <tbody>
              {recentLiquidations.map((liq) => (
                <tr key={liq.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="mono" style={{ padding: '16px', fontWeight: 600 }}>
                    #{liq.vaultId}
                  </td>
                  <td className="mono" style={{ textAlign: 'right', padding: '16px' }}>
                    {liq.collateral} sBTC
                  </td>
                  <td className="mono" style={{ textAlign: 'right', padding: '16px' }}>
                    {liq.debt} sBTC
                  </td>
                  <td className="mono" style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                    {liq.liquidator}
                  </td>
                  <td className="mono" style={{ textAlign: 'right', padding: '16px', color: 'var(--accent-green)' }}>
                    +{liq.profit} sBTC
                  </td>
                  <td className="mono" style={{ textAlign: 'right', padding: '16px', color: 'var(--text-muted)' }}>
                    #{liq.block.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
