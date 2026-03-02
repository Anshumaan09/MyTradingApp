import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { Dashboard } from './pages/Dashboard';
import { Auth } from './pages/Auth';
import { MarketBrowser } from './pages/MarketBrowser';
import { Orders } from './pages/Orders';
import { Portfolio } from './pages/Portfolio';
import { Funds } from './pages/Funds';
import { Settings } from './pages/Settings';
import { CryptoTrading } from './pages/CryptoTrading';
import { Investments } from './pages/Investments';
import { AIInsights } from './pages/AIInsights';
import { Notifications } from './pages/Notifications';
import { AdvancedTrading } from './pages/AdvancedTrading';
import { Analytics } from './pages/Analytics';
import { Legal } from './pages/Legal';
import { NotFound } from './pages/NotFound';
import { Profile } from './pages/Profile';
import { Landing } from './pages/Landing';
import { useAuth } from './lib/useAuth';
import { AuthProfileProvider, RequireAuth } from './lib/middleware.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="animate-pulse" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Loading NexusTrade...</div>
    </div>
  );

  if (!user) return <Navigate to="/auth" replace />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProfileProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          <Route
            element={
              <ProtectedRoute>
                <WorkspaceLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/markets" element={<MarketBrowser />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/crypto" element={<CryptoTrading />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/advanced" element={<AdvancedTrading />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProfileProvider>
    </BrowserRouter>
  );
}

export default App;
