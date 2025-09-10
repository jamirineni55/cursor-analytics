import { useState, type JSX } from 'react';
import { 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { GroupFilter } from '@/components/dashboard/group-filter';
import { useAuthStore } from '@/stores/auth-store';
import { useDashboardStore } from '@/stores/dashboard-store';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

const navigationItems = [
  {
    id: 'overview',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'Analytics and insights',
  },
  {
    id: 'team',
    label: 'Team Management',
    icon: Users,
    description: 'Members and groups',
  },
];

export const DashboardLayout = ({
  children,
  currentView,
  onViewChange,
}: DashboardLayoutProps): JSX.Element => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clearAuth } = useAuthStore();
  const { dateRange, setDateRange } = useDashboardStore();

  const handleLogout = (): void => {
    clearAuth();
  };

  const currentNavItem = navigationItems.find(item => item.id === currentView);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-bold text-gray-900">
              Cursor Analytics
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          <Separator />

          {/* Bottom section */}
          <div className="p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-700 hover:bg-gray-50"
              onClick={() => onViewChange('settings')}
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 mt-1"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentNavItem?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {currentNavItem?.description || 'Cursor analytics and insights'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <GroupFilter />
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onDateRangeChange={(start, end) => setDateRange(start, end)}
                />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span>Connected</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="container mx-auto p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
