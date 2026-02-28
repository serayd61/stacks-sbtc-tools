import { useState } from 'react';
import { UserSession } from '../App';

interface VaultsProps {
  userSession: UserSession;
}

interface Vault {
  id: number;
  owner: string;
  collateral: number;
  debt: number;
  collateralRatio: number;
  healthFactor: number;
  createdAt: number;
}

const mockVaults: Vault[] = [
  { id: 1, owner: 'SP2PE...9R2N', collateral: 5.5, debt: 2.8, collateralRatio: 196, healthFactor: 1.96, createdAt: 890000 },
  { id: 2, owner: 'SP3K8...0KBR', collateral: 12.3, debt: 5.5, collateralRatio: 224, healthFactor: 2.24, createdAt: 885000 },
  { id: 3, owner: 'SP1CG...PJ0Y', collateral: 3.2, debt: 2.1, collateralRatio: 152, healthFactor: 1.52, createdAt: 880000 },
  { id: 4, owner: 'SP1G4...BQC0', collateral: 8.7, debt: 3.2, collateralRatio: 272, healthFactor: 2.72, createdAt: 875000 },
  { id: 5, owner: 'SP2J6...KN3M', collateral: 1.8, debt: 1.4, collateralRatio: 129, healthFactor: 1.29, createdAt: 870000 },
];

export default function Vaults({ userSession }: VaultsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');

  const getHealthColor = (hf: number) => {
    if (hf >= 1.8) return 'var(--accent-green)';
    if (hf >= 1.3) return 'var(--btc-orange)';
    return 'var(--accent-red)';
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
            <span className="gradient-btc">sBTC Vaults</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Deposit sBTC as collateral and borrow against it
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          disabled={!userSession.isConnected}
        >
          + Create Vault
        </button>
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
            Your Vaults
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700 }}>
            {userSession.isConnected ? '2' : '-'}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Total Collateral
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700 }}>
            {userSession.isConnected ? '7.8 sBTC' : '-'}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Total Debt
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700 }}>
            {userSession.isConnected ? '3.5 sBTC' : '-'}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Avg Health Factor
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-green)' }}>
            {userSession.isConnected ? '2.23' : '-'}
          </div>
        </div>
      </div>

      {/* Vaults Table */}
      <div className="card">
        <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600 }}>
          All Vaults
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Vault ID
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
                  Ratio
                </th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Health
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '13px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mockVaults.map((vault) => (
                <tr key={vault.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="mono" style={{ padding: '16px', fontWeight: 600 }}>
                    #{vault.id}
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
                  <td className="mono" style={{ textAlign: 'right', padding: '16px' }}>
                    {vault.collateralRatio}%
                  </td>
                  <td style={{ textAlign: 'right', padding: '16px' }}>
                    <span className="mono" style={{
                      fontWeight: 600,
                      color: getHealthColor(vault.healthFactor),
                    }}>
                      {vault.healthFactor.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '16px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Vault Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowCreateModal(false)}>
          <div
            className="card"
            style={{ width: '480px', maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>
              Create New Vault
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Deposit Amount (sBTC)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Borrow Amount (sBTC)
              </label>
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            {depositAmount && borrowAmount && (
              <div style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Collateral Ratio</span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {((parseFloat(depositAmount) / parseFloat(borrowAmount)) * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Health Factor</span>
                  <span className="mono" style={{
                    fontWeight: 600,
                    color: getHealthColor(parseFloat(depositAmount) / parseFloat(borrowAmount)),
                  }}>
                    {(parseFloat(depositAmount) / parseFloat(borrowAmount)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }}>
                Create Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
