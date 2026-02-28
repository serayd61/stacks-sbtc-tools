import { UserSession } from '../App';

interface YieldStrategiesProps {
  userSession: UserSession;
}

interface Strategy {
  id: number;
  name: string;
  protocol: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  description: string;
}

const strategies: Strategy[] = [
  {
    id: 1,
    name: 'sBTC Staking',
    protocol: 'Stacks Protocol',
    apy: 5.2,
    tvl: 25000000,
    risk: 'low',
    description: 'Stake sBTC to earn native staking rewards',
  },
  {
    id: 2,
    name: 'sBTC-STX LP',
    protocol: 'ALEX DEX',
    apy: 12.8,
    tvl: 18500000,
    risk: 'medium',
    description: 'Provide liquidity to sBTC-STX pool',
  },
  {
    id: 3,
    name: 'sBTC Lending',
    protocol: 'Arkadiko',
    apy: 8.5,
    tvl: 12000000,
    risk: 'low',
    description: 'Lend sBTC to earn interest',
  },
  {
    id: 4,
    name: 'Leveraged Yield',
    protocol: 'Velar',
    apy: 24.5,
    tvl: 8500000,
    risk: 'high',
    description: 'Leveraged yield farming with sBTC',
  },
  {
    id: 5,
    name: 'sBTC-USDA LP',
    protocol: 'ALEX DEX',
    apy: 15.2,
    tvl: 9200000,
    risk: 'medium',
    description: 'Provide liquidity to sBTC-USDA stable pool',
  },
];

export default function YieldStrategies({ userSession }: YieldStrategiesProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'var(--accent-green)';
      case 'medium': return 'var(--btc-orange)';
      case 'high': return 'var(--accent-red)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
          <span className="gradient-btc">Yield Strategies</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Earn yield on your sBTC with various DeFi strategies
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
            Your Deposits
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700 }}>
            {userSession.isConnected ? '1.5 sBTC' : '-'}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Earned Yield
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-green)' }}>
            {userSession.isConnected ? '+0.032 sBTC' : '-'}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Avg APY
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--btc-orange)' }}>
            {userSession.isConnected ? '9.8%' : '-'}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Active Positions
          </div>
          <div className="mono" style={{ fontSize: '28px', fontWeight: 700 }}>
            {userSession.isConnected ? '2' : '-'}
          </div>
        </div>
      </div>

      {/* Strategies Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '24px',
      }}>
        {strategies.map((strategy) => (
          <div key={strategy.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                  {strategy.name}
                </h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {strategy.protocol}
                </span>
              </div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                background: `${getRiskColor(strategy.risk)}20`,
                color: getRiskColor(strategy.risk),
                textTransform: 'capitalize',
              }}>
                {strategy.risk} risk
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              {strategy.description}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <div style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>
                  APY
                </div>
                <div className="mono" style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--accent-green)',
                }}>
                  {strategy.apy}%
                </div>
              </div>
              <div style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>
                  TVL
                </div>
                <div className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>
                  ${(strategy.tvl / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={!userSession.isConnected}
            >
              {userSession.isConnected ? 'Deposit' : 'Connect Wallet'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
