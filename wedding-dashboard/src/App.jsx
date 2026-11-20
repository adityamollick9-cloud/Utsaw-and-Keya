import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { RsvpsPage } from './pages/RsvpsPage';
import { BlessingsPage } from './pages/BlessingsPage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStatistics = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setStatsLoading(true);

    try {
      const res = await api.getStatistics();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setStatsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStatistics();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Initializing secure session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={() => loadStatistics(true)}
      isRefreshing={isRefreshing}
    >
      {activeTab === 'overview' && (
        <OverviewPage
          stats={stats}
          loading={statsLoading}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}
      {activeTab === 'rsvps' && <RsvpsPage />}
      {activeTab === 'blessings' && <BlessingsPage />}
    </DashboardLayout>
  );
}

