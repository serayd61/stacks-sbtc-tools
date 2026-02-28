import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { UserSession } from '../App';

interface DashboardProps {
  userSession: UserSession;
}

const mockTVLHistory = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  tvl: 45000000 + Math.random() * 15000000 + (i * 500000),
}));

const mockProtocolStats = {
  totalTVL: 68500000,
  totalVaults: 1247,
  totalBorrowed: 32500000,
  avgCollateralRatio: 185,
  btcPrice: 97500,
  sbtcSupply: 2150,
};

export default function Dashboard({ userSession }: DashboardProps) {
  const userStats = userSession.isConnected ? {
    totalDeposited: 2.5,
    totalBorrowed: 1.2,
    healthFactor: 1.85,
    earnedYield: 0.045,
  } : null;

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '8px' }}>
          <span className="gradient-btc">sBTC DeFi Dashboard</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
          Manage your sBTC vaults, yield strategies, and monitor liquidations.
        </p>
      </div>

      {/* Protocol Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Total TVL
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>
            ${(mockProtocolStats.totalTVL / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Active Vaults
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>
            {mockProtocolStats.totalVaults.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Total Borrowed
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>
            ${(mockProtocolStats.totalBorrowed / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Avg Collateral
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-green)' }}>
            {mockProtocolStats.avgCollateralRatio}%
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            BTC Price
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--btc-orange)' }}>
            ${mockProtocolStats.btcPrice.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            sBTC Supply
          </div>
          <div className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>
            {mockProtocolStats.sbtcSupply.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* TVL Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600 }}>
            Protocol TVL
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTVLHistory}>
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickFormatter={(v) => `Day ${v}`}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                  }}
                  formatter={(v: number) => [`$${(v / 1000000).toFixed(2)}M`, 'TVL']}
                />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  stroke="#f7931a"
                  strokeWidth={2}
                  fill="url(#tvlGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Position */}
        <div className="card">
          <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600 }}>
            Your Position
          </h3>
          
          {userSession.isConnected && userStats ? (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Deposited</span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {userStats.totalDeposited} sBTC
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Borrowed</span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {userStats.totalBorrowed} sBTC
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Earned Yield</span>
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                    +{userStats.earnedYield} sBTC
                  </span>
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Health Factor</span>
                  <span className={`mono health-${userStats.healthFactor > 1.5 ? 'good' : userStats.healthFactor > 1.2 ? 'warning' : 'danger'}`}
                    style={{ fontSize: '24px', fontWeight: 700 }}>
                    {userStats.healthFactor.toFixed(2)}
                  </span>
                </div>
                <div style={{
                  marginTop: '12px',
                  height: '8px',
                  background: 'var(--bg-primary)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(userStats.healthFactor / 2 * 100, 100)}%`,
                    height: '100%',
                    background: userStats.healthFactor > 1.5 ? 'var(--accent-green)' : userStats.healthFactor > 1.2 ? 'var(--btc-orange)' : 'var(--accent-red)',
                    borderRadius: '4px',
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }}>
                  Deposit
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>
                  Withdraw
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 16px',
              }}>
                🔒
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Connect your wallet to view your position
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginTop: '32px',
      }}>
        {[
          { icon: '🏦', title: 'Create Vault', desc: 'Deposit sBTC as collateral' },
          { icon: '💰', title: 'Borrow', desc: 'Borrow against your sBTC' },
          { icon: '📈', title: 'Yield Farming', desc: 'Earn yield on your sBTC' },
          { icon: '🔄', title: 'Swap', desc: 'Trade sBTC for other assets' },
        ].map((action, i) => (
          <div key={i} className="card" style={{ cursor: 'pointer' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px',
            }}>
              {action.icon}
            </div>
            <h4 style={{ marginBottom: '8px', fontWeight: 600 }}>{action.title}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{action.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
