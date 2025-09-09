import { create } from 'zustand';
import type {
  TeamMember,
  DailyUsageData,
  UsageEvent,
  GroupedAnalytics,
} from '@/types/cursor-api';

interface DashboardState {
  // Team data
  teamMembers: TeamMember[];
  
  // Usage data
  dailyUsageData: DailyUsageData[];
  usageEvents: UsageEvent[];
  
  // Grouped analytics
  groupedAnalytics: GroupedAnalytics[];
  
  
  // Loading states
  loading: {
    teamMembers: boolean;
    dailyUsage: boolean;
    usageEvents: boolean;
    groupedAnalytics: boolean;
  };
  
  // Error states
  errors: {
    teamMembers: string | null;
    dailyUsage: string | null;
    usageEvents: string | null;
    groupedAnalytics: string | null;
  };
  
  // Date range for queries
  dateRange: {
    startDate: number;
    endDate: number;
  };
  
  // Actions
  setTeamMembers: (members: TeamMember[]) => void;
  setDailyUsageData: (data: DailyUsageData[]) => void;
  setUsageEvents: (events: UsageEvent[]) => void;
  setGroupedAnalytics: (analytics: GroupedAnalytics[]) => void;
  
  setLoading: (key: keyof DashboardState['loading'], value: boolean) => void;
  setError: (key: keyof DashboardState['errors'], error: string | null) => void;
  setDateRange: (startDate: number, endDate: number) => void;
  
  clearAllData: () => void;
  clearErrors: () => void;
}

const initialLoadingState = {
  teamMembers: false,
  dailyUsage: false,
  usageEvents: false,
  groupedAnalytics: false,
};

const initialErrorState = {
  teamMembers: null,
  dailyUsage: null,
  usageEvents: null,
  groupedAnalytics: null,
};

// Default to last 30 days
const getDefaultDateRange = () => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);
  startDate.setHours(0, 0, 0, 0);
  
  return {
    startDate: startDate.getTime(),
    endDate: endDate.getTime(),
  };
};

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial state
  teamMembers: [],
  dailyUsageData: [],
  usageEvents: [],
  groupedAnalytics: [],
  
  loading: { ...initialLoadingState },
  errors: { ...initialErrorState },
  dateRange: getDefaultDateRange(),
  
  // Actions
  setTeamMembers: (members) => set({ teamMembers: members }),
  setDailyUsageData: (data) => set({ dailyUsageData: data }),
  setUsageEvents: (events) => set({ usageEvents: events }),
  setGroupedAnalytics: (analytics) => set({ groupedAnalytics: analytics }),
  
  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),
    
  setError: (key, error) =>
    set((state) => ({
      errors: { ...state.errors, [key]: error },
    })),
    
  setDateRange: (startDate, endDate) =>
    set({ dateRange: { startDate, endDate } }),
    
  clearAllData: () =>
    set({
      teamMembers: [],
      dailyUsageData: [],
      usageEvents: [],
      groupedAnalytics: [],
      loading: { ...initialLoadingState },
      errors: { ...initialErrorState },
    }),
    
  clearErrors: () =>
    set({
      errors: { ...initialErrorState },
    }),
}));
