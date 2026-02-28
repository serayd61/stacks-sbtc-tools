import { Link, useLocation } from 'react-router-dom';
import { UserSession } from '../App';

interface HeaderProps {
  userSession: UserSession;
  setUserSession: (session: UserSession) => void;
}

export default function Header({ userSession, setUserSession }: HeaderProps) {
  const location = useLocation();

  const connectWallet = async () => {
    try {
      const { showConnect } = await import('@stacks/connect');
      showConnect({
        appDetails: {
          name: 'sBTC DeFi Tools',
          icon: 'https://stacks.co/favicon.ico',
        },
        onFinish: () => {
          const userData = (window as any).userSession?.loadUserData();
          if (userData) {
            setUserSession({
              isConnected: true,
              address: userData.profile.stxAddress.mainnet,
            });
          }
        },
        userSession: (window as any).userSession,
      });
    } catch (e) {
      console.error('Wallet connection error:', e);
    }
  };

  const disconnectWallet = () => {
    setUserSession({ isConnected: false, address: null });
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/vaults', label: 'Vaults', icon: '🏦' },
    { path: '/yield', label: 'Yield', icon: '📈' },
    { path: '/liquidations', label: 'Liquidations', icon: '⚡' },
  ];

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(13, 13, 18, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '80px',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--gradient-btc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 700,
            color: '#000',
          }}>
            ₿
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700 }} className="gradient-btc">
            sBTC Tools
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: '4px' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: location.pathname === item.path ? 'var(--btc-orange)' : 'var(--text-secondary)',
                background: location.pathname === item.path ? 'rgba(247, 147, 26, 0.1)' : 'transparent',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div>
          {userSession.isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="mono" style={{
                padding: '8px 16px',
                background: 'var(--bg-card)',
                borderRadius: '10px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                {userSession.address?.slice(0, 6)}...{userSession.address?.slice(-4)}
              </span>
              <button className="btn btn-secondary" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
