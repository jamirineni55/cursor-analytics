import type {
  TeamMembersResponse,
  DailyUsageResponse,
  UsageEventsResponse,
  DateRangeRequest,
  FilteredUsageEventsRequest,
} from '@/types/cursor-api';

const CURSOR_API_BASE = 'https://api.cursor.com';

export class CursorAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'CursorAPIError';
  }
}

class CursorAPIClient {
  private apiKey: string | null = null;

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  clearApiKey(): void {
    this.apiKey = null;
  }

  private getAuthHeaders(): HeadersInit {
    if (!this.apiKey) {
      throw new CursorAPIError('API key not set');
    }

    const credentials = btoa(`${this.apiKey}:`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${CURSOR_API_BASE}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new CursorAPIError(
          `API request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
          response.status,
          response
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof CursorAPIError) {
        throw error;
      }
      throw new CursorAPIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Admin API endpoints
  async getTeamMembers(): Promise<TeamMembersResponse> {
    return this.request<TeamMembersResponse>('/teams/members');
  }

  async getDailyUsageData(request: DateRangeRequest): Promise<DailyUsageResponse> {
    return this.request<DailyUsageResponse>('/teams/daily-usage-data', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }


  async getUsageEvents(request: FilteredUsageEventsRequest): Promise<UsageEventsResponse> {
    return this.request<UsageEventsResponse>('/teams/filtered-usage-events', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }


  // Utility methods
  isAuthenticated(): boolean {
    return this.apiKey !== null;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getTeamMembers();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const cursorAPI = new CursorAPIClient();

// Utility functions for date handling
export const dateUtils = {
  getDaysAgo(days: number): number {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.getTime();
  },

  getStartOfDay(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  },

  getEndOfDay(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  },

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  },

  formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  },

  getLast30Days(): { startDate: number; endDate: number } {
    const endDate = this.getEndOfDay(Date.now());
    const startDate = this.getStartOfDay(this.getDaysAgo(30));
    return { startDate, endDate };
  },

  getLast7Days(): { startDate: number; endDate: number } {
    const endDate = this.getEndOfDay(Date.now());
    const startDate = this.getStartOfDay(this.getDaysAgo(7));
    return { startDate, endDate };
  },

  getLastWeek(): { startDate: number; endDate: number } {
    const today = new Date();
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - today.getDay()); // Last Sunday
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // Previous Monday
    
    return {
      startDate: this.getStartOfDay(lastWeekStart.getTime()),
      endDate: this.getEndOfDay(lastWeekEnd.getTime()),
    };
  },
};
