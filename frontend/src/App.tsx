import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Vaults from './components/Vaults';
import YieldStrategies from './components/YieldStrategies';
import Liquidations from './components/Liquidations';

export interface UserSession {
  isConnected: boolean;
  address: string | null;
}

function App() {
  const [userSession, setUserSession] = useState<UserSession>({
    isConnected: false,
    address: null,
  });

  return (
    <BrowserRouter>
      <div className="app">
        <Header userSession={userSession} setUserSession={setUserSession} />
        <main style={{ paddingTop: '100px', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard userSession={userSession} />} />
            <Route path="/vaults" element={<Vaults userSession={userSession} />} />
            <Route path="/yield" element={<YieldStrategies userSession={userSession} />} />
            <Route path="/liquidations" element={<Liquidations />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
