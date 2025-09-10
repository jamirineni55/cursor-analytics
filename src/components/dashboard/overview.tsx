import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Bot,
  Zap,
  RefreshCw,
  // Code,
  // BarChart3,
  Download,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useGroupsStore } from '@/stores/groups-store';
import { cursorAPI } from '@/services/cursor-api';
import { toast } from 'sonner';

interface ChartDataPoint {
  date: string;
  totalRequests: number;
  composerRequests: number;
  chatRequests: number;
  agentRequests: number;
  totalLines: number;
  acceptedLinesAdded: number;
  acceptedLinesDeleted: number;
  activeUsers: number;
}

interface RequestTypeData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  composer: '#3B82F6',
  chat: '#10B981', 
  agent: '#F59E0B',
  totalLines: '#8B5CF6',
  acceptedAdded: '#22C55E',
  acceptedDeleted: '#EF4444',
};

export const Overview = (): React.JSX.Element => {
  const {
    teamMembers,
    dailyUsageData,
    loading,
    dateRange,
    setTeamMembers,
    setDailyUsageData,
    setLoading,
    setError,
  } = useDashboardStore();
  
  const { selectedGroupId, getGroupMembers } = useGroupsStore();
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = async (): Promise<void> => {
    try {
      // Load team members
      setLoading('teamMembers', true);
      setError('teamMembers', null);
      const membersResponse = await cursorAPI.getTeamMembers();
      setTeamMembers(membersResponse.teamMembers);
      setLoading('teamMembers', false);
      

      // Load daily usage data
      setLoading('dailyUsage', true);
      setError('dailyUsage', null);
      const usageResponse = await cursorAPI.getDailyUsageData(dateRange);
      setDailyUsageData(usageResponse.data);
      setLoading('dailyUsage', false);

      // Note: usage events view removed for now



    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      toast.error(errorMessage);
      
      // Set individual errors based on what failed
      if (loading.teamMembers) {
        setError('teamMembers', errorMessage);
        setLoading('teamMembers', false);
      }
      if (loading.dailyUsage) {
        setError('dailyUsage', errorMessage);
        setLoading('dailyUsage', false);
      }
      if (loading.usageEvents) {
        setError('usageEvents', errorMessage);
        setLoading('usageEvents', false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);


  // Filter data by selected group
  const filteredMembers = selectedGroupId 
    ? getGroupMembers(selectedGroupId, teamMembers)
    : teamMembers;
    
    
  const filteredMemberEmails = new Set(filteredMembers.map(m => m.email));
  
  const filteredDailyData = dailyUsageData.filter(d => {
    const email = (d as any).userEmail ?? d.email;
    return selectedGroupId ? filteredMemberEmails.has(email) : true;
  });

  // Calculate metrics
  
  const totalLinesAdded = filteredDailyData.reduce((sum, d) => sum + d.totalLinesAdded, 0);
  const totalAcceptedLinesAdded = filteredDailyData.reduce((sum, d) => sum + d.acceptedLinesAdded, 0);
  const totalAcceptedLinesDeleted = filteredDailyData.reduce((sum, d) => sum + (d.acceptedLinesDeleted ?? 0), 0);

  const totalRequests = filteredDailyData.reduce((sum, d) => 
    sum + d.composerRequests + d.chatRequests + d.agentRequests, 0
  );
  const totalAcceptedEditedLines = totalAcceptedLinesAdded + totalAcceptedLinesDeleted;

  // Prepare chart data
  const prepareChartData = (): ChartDataPoint[] => {
    const dataMap = new Map<string, ChartDataPoint>();
    
    filteredDailyData.forEach(d => {
      const dateKey = new Date(d.date).toISOString().split('T')[0];
      
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, {
          date: dateKey,
          totalRequests: 0,
          composerRequests: 0,
          chatRequests: 0,
          agentRequests: 0,
          totalLines: 0,
          acceptedLinesAdded: 0,
          acceptedLinesDeleted: 0,
          activeUsers: 0,
        });
      }
      
      const existing = dataMap.get(dateKey)!;
      existing.totalRequests += d.composerRequests + d.chatRequests + d.agentRequests;
      existing.composerRequests += d.composerRequests;
      existing.chatRequests += d.chatRequests;
      existing.agentRequests += d.agentRequests;
      existing.totalLines += d.totalLinesAdded;
      existing.acceptedLinesAdded += d.acceptedLinesAdded;
      existing.acceptedLinesDeleted += d.acceptedLinesDeleted ?? 0;
      existing.activeUsers += d.isActive ? 1 : 0;
    });
    
    const chartData = Array.from(dataMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return chartData;
  };

  const chartData = prepareChartData();

  // Prepare pie chart data for request types
  const totalComposer = filteredDailyData.reduce((sum, d) => sum + d.composerRequests, 0);
  const totalChat = filteredDailyData.reduce((sum, d) => sum + d.chatRequests, 0);
  const totalAgent = filteredDailyData.reduce((sum, d) => sum + d.agentRequests, 0);

  const requestTypeData: RequestTypeData[] = [
    { name: 'Composer', value: totalComposer, color: COLORS.composer },
    { name: 'Chat', value: totalChat, color: COLORS.chat },
    { name: 'Agent', value: totalAgent, color: COLORS.agent },
  ].filter(d => d.value > 0);

  // Utility functions
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const exportData = async (): Promise<void> => {
    try {
      const csvContent = [
        ['Date', 'Total Requests', 'Composer', 'Chat', 'Agent', 'Total Lines', 'Accepted Lines Added', 'Accepted Lines Deleted', 'Active Users'],
        ...chartData.map(d => [
          d.date,
          d.totalRequests,
          d.composerRequests,
          d.chatRequests,
          d.agentRequests,
          d.totalLines,
          d.acceptedLinesAdded,
          d.acceptedLinesDeleted,
          d.activeUsers
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `cursor-usage-analytics-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Usage analytics exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const isLoading = Object.values(loading).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">
            Analytics for the selected period
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={loadData}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Accepted Edited Lines (Added + Deleted) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Edited Lines</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAcceptedEditedLines.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalAcceptedLinesAdded.toLocaleString()} added + {totalAcceptedLinesDeleted.toLocaleString()} deleted
            </p>
          </CardContent>
        </Card>

        {/* Accepted Lines Added */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Lines Added</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAcceptedLinesAdded.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total lines accepted from AI suggestions</p>
          </CardContent>
        </Card>

        {/* Accepted Lines Deleted */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Lines Deleted</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAcceptedLinesDeleted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total deletions accepted from AI suggestions</p>
          </CardContent>
        </Card>

        {/* AI Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Composer, Chat & Agent requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          </TabsList>
          
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Daily Activity Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Daily Activity Overview
              </CardTitle>
              <CardDescription>
                Requests, code generation, and user activity over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value as string)}
                      formatter={(value: number, name: string) => [
                        formatNumber(value),
                        name === 'totalRequests' ? 'Total Requests' :
                        name === 'activeUsers' ? 'Active Users' : name
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalRequests" 
                      stroke={COLORS.composer} 
                      fill={COLORS.composer} 
                      fillOpacity={0.3}
                      name="totalRequests"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke={COLORS.chat} 
                      fill={COLORS.chat} 
                      fillOpacity={0.3}
                      name="activeUsers"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {/* Request Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Request Trends by Type</CardTitle>
              <CardDescription>
                Daily breakdown of Composer, Chat, and Agent requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => formatDate(value as string)}
                      formatter={(value: number, name: string) => [
                        formatNumber(value),
                        name === 'composerRequests' ? 'Composer' :
                        name === 'chatRequests' ? 'Chat' :
                        name === 'agentRequests' ? 'Agent' : name
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="composerRequests" 
                      stroke={COLORS.composer} 
                      strokeWidth={2}
                      name="composerRequests"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="chatRequests" 
                      stroke={COLORS.chat} 
                      strokeWidth={2}
                      name="chatRequests"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="agentRequests" 
                      stroke={COLORS.agent} 
                      strokeWidth={2}
                      name="agentRequests"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Request Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of request types in selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={requestTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={(entry) => `${entry.name}`}
                      >
                        {requestTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>
                  Key metrics for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Average Daily Requests</span>
                    <span className="font-medium">
                      {chartData.length > 0 ? Math.round(totalRequests / chartData.length) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Average Daily Lines</span>
                    <span className="font-medium">
                      {chartData.length > 0 ? Math.round(totalLinesAdded / chartData.length) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Peak Daily Requests</span>
                    <span className="font-medium">
                      {Math.max(...chartData.map(d => d.totalRequests), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Peak Daily Lines</span>
                    <span className="font-medium">
                      {Math.max(...chartData.map(d => d.totalLines), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Most Active Day</span>
                    <span className="font-medium">
                      {chartData.length > 0 ? formatDate(
                        chartData.reduce((max, d) => 
                          d.totalRequests > max.totalRequests ? d : max
                        ).date
                      ) : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {chartData.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Usage Data Found</h3>
            <p className="text-gray-500">
              No usage data available for the selected time period{selectedGroupId ? ' and group' : ''}.
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
