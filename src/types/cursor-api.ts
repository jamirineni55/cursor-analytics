// Cursor Admin API Types
export interface TeamMember {
  name: string;
  email: string;
  role: 'owner' | 'member' | 'free-owner';
}

export interface TeamMembersResponse {
  teamMembers: TeamMember[];
}

export interface DailyUsageData {
  date: number;
  isActive: boolean;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  acceptedLinesAdded: number;
  acceptedLinesDeleted: number;
  totalApplies: number;
  totalAccepts: number;
  totalRejects: number;
  totalTabsShown: number;
  totalTabsAccepted: number;
  composerRequests: number;
  chatRequests: number;
  agentRequests: number;
  cmdkUsages: number;
  subscriptionIncludedReqs: number;
  apiKeyReqs: number;
  usageBasedReqs: number;
  bugbotUsages: number;
  mostUsedModel: string;
  applyMostUsedExtension?: string;
  tabMostUsedExtension?: string;
  clientVersion?: string;
  email?: string;
}

export interface DailyUsageResponse {
  data: DailyUsageData[];
  period: {
    startDate: number;
    endDate: number;
  };
}


export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  totalCents: number;
}

export interface UsageEvent {
  timestamp: string;
  model: string;
  kind: string;
  maxMode: boolean;
  requestsCosts: number;
  isTokenBasedCall: boolean;
  tokenUsage?: TokenUsage;
  isFreeBugbot: boolean;
  userEmail: string;
}

export interface UsageEventsResponse {
  totalUsageEventsCount: number;
  pagination: {
    numPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  usageEvents: UsageEvent[];
  period: {
    startDate: number;
    endDate: number;
  };
}


// User Groups
export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  memberEmails: string[];
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface GroupedAnalytics {
  groupId: string;
  groupName: string;
  memberCount: number;
  totalRequests: number;
  totalLines: number;
  aiLines: number;
  aiPercentage: number;
  dailyData: DailyUsageData[];
}

// Request types
export interface DateRangeRequest {
  startDate: number;
  endDate: number;
}

export interface PaginatedRequest extends DateRangeRequest {
  page?: number;
  pageSize?: number;
}

export interface FilteredUsageEventsRequest extends PaginatedRequest {
  userId?: number;
  email?: string;
}

