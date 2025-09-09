import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/auth-store';
import { APIKeySetup } from '@/components/auth/api-key-setup';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Overview } from '@/components/dashboard/overview';
import { TeamManagement } from '@/components/dashboard/team-management';
import { Settings } from '@/components/dashboard/settings';

function App(): JSX.Element {
  const { isAuthenticated } = useAuthStore();
  const [currentView, setCurrentView] = useState('overview');

  const renderView = (): JSX.Element => {
    switch (currentView) {
      case 'overview':
        return <Overview />;
      case 'team':
        return <TeamManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <APIKeySetup />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <DashboardLayout currentView={currentView} onViewChange={setCurrentView}>
        {renderView()}
      </DashboardLayout>
      <Toaster />
    </>
  );
}

export default App;