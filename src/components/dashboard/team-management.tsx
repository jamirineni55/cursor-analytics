import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Mail, 
  Crown, 
  Shield, 
  User,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  BarChart3,
  Calendar,
  RefreshCw,
  MoreHorizontal,
  UserPlus,
  Check
} from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useGroupsStore } from '@/stores/groups-store';
import { cursorAPI } from '@/services/cursor-api';
import { toast } from 'sonner';
import type { TeamMember, UserGroup } from '@/types/cursor-api';

interface GroupFormData {
  name: string;
  description: string;
  memberEmails: string[];
  color: string;
}

const predefinedColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
];

export const TeamManagement = (): JSX.Element => {
  const {
    teamMembers,
    dailyUsageData,
    loading,
    errors,
    setTeamMembers,
    setDailyUsageData,
    setLoading,
    setError,
  } = useDashboardStore();
  
  const { 
    groups, 
    addGroup, 
    updateGroup, 
    deleteGroup, 
    getGroupMembers, 
    getMemberGroups 
  } = useGroupsStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  
  // Selection state
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isAddToGroupDialogOpen, setIsAddToGroupDialogOpen] = useState(false);
  
  // Group selection state
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [groupForm, setGroupForm] = useState<GroupFormData>({
    name: '',
    description: '',
    memberEmails: [],
    color: predefinedColors[0],
  });
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const loadTeamData = async (): Promise<void> => {
    try {
      // Load team members
      setLoading('teamMembers', true);
      setError('teamMembers', null);
      const membersResponse = await cursorAPI.getTeamMembers();
      setTeamMembers(membersResponse.teamMembers);
      setLoading('teamMembers', false);

      // Load usage data for statistics
      setLoading('dailyUsage', true);
      setError('dailyUsage', null);
      const usageResponse = await cursorAPI.getDailyUsageData({
        startDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: Date.now()
      });
      setDailyUsageData(usageResponse.data);
      setLoading('dailyUsage', false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load team data';
      if (loading.teamMembers) {
        setError('teamMembers', errorMessage);
        setLoading('teamMembers', false);
      }
      if (loading.dailyUsage) {
        setError('dailyUsage', errorMessage);
        setLoading('dailyUsage', false);
      }
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  // Filter team members
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    
    let matchesGroup = true;
    if (selectedGroup !== 'all') {
      const memberGroups = getMemberGroups(member.email);
      matchesGroup = memberGroups.some(group => group.id === selectedGroup);
    }
    
    return matchesSearch && matchesRole && matchesGroup;
  });

  // Calculate member statistics
  const getMemberStats = (member: TeamMember) => {
    const memberData = dailyUsageData.filter(d => (d as any).userEmail === member.email || d.email === member.email);
    const totalRequests = memberData.reduce((sum, d) => 
      sum + d.composerRequests + d.chatRequests + d.agentRequests, 0
    );
    const totalLines = memberData.reduce((sum, d) => sum + d.totalLinesAdded, 0);
    const aiLines = memberData.reduce((sum, d) => sum + d.acceptedLinesAdded, 0);
    const aiPercentage = totalLines > 0 ? (aiLines / totalLines) * 100 : 0;
    const activeDays = memberData.filter(d => d.isActive).length;
    
    return { totalRequests, totalLines, aiLines, aiPercentage, activeDays };
  };

  // Group management functions
  const handleCreateGroup = (): void => {
    setEditingGroup(null);
    setGroupForm({
      name: '',
      description: '',
      memberEmails: [],
      color: predefinedColors[groups.length % predefinedColors.length],
    });
    setMemberSearchTerm('');
    setShowMemberDropdown(false);
    setIsGroupDialogOpen(true);
  };

  const handleEditGroup = (group: UserGroup): void => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || '',
      memberEmails: [...group.memberEmails],
      color: group.color,
    });
    setMemberSearchTerm('');
    setShowMemberDropdown(false);
    setIsGroupDialogOpen(true);
  };

  const handleSaveGroup = (): void => {
    if (!groupForm.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (editingGroup) {
      updateGroup(editingGroup.id, groupForm);
      toast.success('Group updated successfully');
    } else {
      addGroup(groupForm);
      toast.success('Group created successfully');
    }
    
    setIsGroupDialogOpen(false);
  };

  const handleDeleteGroup = (groupId: string): void => {
    if (confirm('Are you sure you want to delete this group?')) {
      deleteGroup(groupId);
      toast.success('Group deleted successfully');
    }
  };

  const addMemberToGroup = (member: TeamMember): void => {
    if (!groupForm.memberEmails.includes(member.email)) {
      setGroupForm(prev => ({
        ...prev,
        memberEmails: [...prev.memberEmails, member.email]
      }));
    }
    setMemberSearchTerm('');
    setShowMemberDropdown(false);
  };

  const removeMemberFromGroup = (email: string): void => {
    setGroupForm(prev => ({
      ...prev,
      memberEmails: prev.memberEmails.filter(e => e !== email)
    }));
  };

  // Filter available members for selection
  const availableMembers = teamMembers.filter(member => 
    !groupForm.memberEmails.includes(member.email) &&
    (member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
     member.email.toLowerCase().includes(memberSearchTerm.toLowerCase()))
  );

  const getRoleIcon = (role: string): JSX.Element => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Selection functions
  const toggleMemberSelection = (email: string): void => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedMembers(newSelected);
  };

  const toggleAllMembers = (): void => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.email)));
    }
  };

  const addSelectedToGroup = (groupId: string): void => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const newMemberEmails = [...new Set([
      ...group.memberEmails,
      ...Array.from(selectedMembers)
    ])];

    updateGroup(groupId, { memberEmails: newMemberEmails });
    setSelectedMembers(new Set());
    setIsAddToGroupDialogOpen(false);
    toast.success(`Added ${selectedMembers.size} member(s) to ${group.name}`);
  };

  const removeFromGroup = (memberEmail: string, groupId: string): void => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const newMemberEmails = group.memberEmails.filter(email => email !== memberEmail);
    updateGroup(groupId, { memberEmails: newMemberEmails });
    toast.success(`Removed ${memberEmail} from ${group.name}`);
  };

  // Group selection functions
  const toggleGroupSelection = (groupId: string): void => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const toggleAllGroups = (): void => {
    const filteredGroupIds = filteredGroups.map(g => g.id);
    if (selectedGroups.size === filteredGroupIds.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredGroupIds));
    }
  };

  const deleteSelectedGroups = (): void => {
    if (selectedGroups.size === 0) return;
    
    const groupNames = Array.from(selectedGroups).map(id => 
      groups.find(g => g.id === id)?.name
    ).filter(Boolean);
    
    if (confirm(`Delete ${selectedGroups.size} group(s): ${groupNames.join(', ')}?`)) {
      Array.from(selectedGroups).forEach(groupId => deleteGroup(groupId));
      setSelectedGroups(new Set());
      toast.success(`Deleted ${selectedGroups.size} group(s)`);
    }
  };

  // Filter groups by search term
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  if (loading.teamMembers) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (errors.teamMembers) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-sm mb-4">{errors.teamMembers}</div>
        <Button onClick={loadTeamData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Groups</p>
                <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(dailyUsageData.filter(d => d.isActive).map(d => (d as any).userEmail ?? d.email)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {/* Filters and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                    
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Groups</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Bulk Actions */}
                {selectedMembers.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMembers(new Set())}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        Clear Selection
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setIsAddToGroupDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add to Group
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                        onChange={toggleAllMembers}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Lines</TableHead>
                    <TableHead className="text-right">AI %</TableHead>
                    <TableHead className="text-right">Days Active</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const stats = getMemberStats(member);
                    const memberGroups = getMemberGroups(member.email);
                    const isSelected = selectedMembers.has(member.email);
                    
                    return (
                      <TableRow 
                        key={member.email}
                        className={isSelected ? "bg-blue-50" : ""}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMemberSelection(member.email)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(member.role)}
                            <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                              {member.role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {memberGroups.length > 0 ? (
                              memberGroups.map(group => (
                                <Badge 
                                  key={group.id} 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ borderColor: group.color, color: group.color }}
                                >
                                  {group.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">No groups</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(stats.totalRequests)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(stats.totalLines)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {stats.aiPercentage.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {stats.activeDays}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {memberGroups.map(group => (
                                <DropdownMenuItem 
                                  key={group.id}
                                  onClick={() => removeFromGroup(member.email, group.id)}
                                  className="text-red-600"
                                >
                                  Remove from {group.name}
                                </DropdownMenuItem>
                              ))}
                              {memberGroups.length === 0 && (
                                <DropdownMenuItem disabled>
                                  No group actions available
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredMembers.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Found</h3>
                  <p className="text-gray-500">
                    No team members match your current filter criteria.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          {/* Groups Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Team Groups</h3>
              <p className="text-sm text-gray-500">Organize team members into groups for better analytics</p>
            </div>
            <Button onClick={handleCreateGroup}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>

          {/* Groups Filters and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search groups..."
                        value={groupSearchTerm}
                        onChange={(e) => setGroupSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">
                      {filteredGroups.length} of {groups.length} groups
                    </div>
                  </div>
                </div>
                
                {/* Bulk Actions */}
                {selectedGroups.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-900">
                        {selectedGroups.size} group{selectedGroups.size !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGroups(new Set())}
                        className="text-red-700 border-red-300 hover:bg-red-100"
                      >
                        Clear Selection
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={deleteSelectedGroups}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Groups Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedGroups.size === filteredGroups.length && filteredGroups.length > 0}
                        onChange={toggleAllGroups}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Member Emails</TableHead>
                    <TableHead className="text-right">Total Members</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group) => {
                    const groupMembers = getGroupMembers(group.id, teamMembers);
                    const isSelected = selectedGroups.has(group.id);
                    
                    return (
                      <TableRow 
                        key={group.id}
                        className={isSelected ? "bg-red-50" : ""}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleGroupSelection(group.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: group.color }}
                            />
                            <div>
                              <div className="font-medium text-gray-900">{group.name}</div>
                              {group.description && (
                                <div className="text-sm text-gray-500">{group.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {groupMembers.length > 0 ? (
                              groupMembers.slice(0, 3).map(member => (
                                <div key={member.email} className="flex items-center space-x-1">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">No members</span>
                            )}
                            {groupMembers.length > 3 && (
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium">
                                +{groupMembers.length - 3}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {group.memberEmails.length > 0 ? (
                              group.memberEmails.slice(0, 3).map(email => (
                                <Badge key={email} variant="outline" className="text-xs">
                                  {email.split('@')[0]}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">No members</span>
                            )}
                            {group.memberEmails.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{group.memberEmails.length - 3} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {groupMembers.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Group
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteGroup(group.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredGroups.length === 0 && groups.length > 0 && (
                <div className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Match Search</h3>
                  <p className="text-gray-500">
                    Try adjusting your search terms or create a new group.
                  </p>
                </div>
              )}
              
              {groups.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Created</h3>
                  <p className="text-gray-500 mb-4">
                    Create groups to organize your team members and filter analytics data.
                  </p>
                  <Button onClick={handleCreateGroup}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Group
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Group Creation/Edit Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: groupForm.color }}
              />
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </DialogTitle>
            <DialogDescription>
              Groups help you organize team members and filter analytics data. Members can belong to multiple groups.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="groupName">Group Name *</Label>
                  <Input
                    id="groupName"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Frontend Team, Backend Team, Design Team"
                  />
                </div>
                
                <div>
                  <Label htmlFor="groupDescription">Description</Label>
                  <Input
                    id="groupDescription"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this group's purpose"
                  />
                </div>
                
                {/* Color Picker */}
                <div>
                  <Label>Group Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          groupForm.color === color ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setGroupForm(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Team Members</CardTitle>
                <CardDescription>
                  Search and select team members to include in this group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search members by name or email..."
                      value={memberSearchTerm}
                      onChange={(e) => {
                        setMemberSearchTerm(e.target.value);
                        setShowMemberDropdown(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowMemberDropdown(memberSearchTerm.length > 0)}
                      className="pl-10"
                    />
                    
                    {/* Dropdown with search results */}
                    {showMemberDropdown && availableMembers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {availableMembers.slice(0, 10).map(member => (
                          <button
                            key={member.email}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                            onClick={() => addMemberToGroup(member)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{member.name}</div>
                                <div className="text-sm text-gray-500 truncate">{member.email}</div>
                              </div>
                              <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                                {member.role}
                              </Badge>
                            </div>
                          </button>
                        ))}
                        {availableMembers.length > 10 && (
                          <div className="px-3 py-2 text-sm text-gray-500 border-t">
                            {availableMembers.length - 10} more members available...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Members */}
                  <div>
                    <Label className="text-sm font-medium">Selected Members ({groupForm.memberEmails.length})</Label>
                    <div className="mt-2">
                      {groupForm.memberEmails.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {groupForm.memberEmails.map(email => {
                            const member = teamMembers.find(m => m.email === email);
                            return (
                              <div key={email} className="flex items-center space-x-2 bg-blue-50 rounded-md px-3 py-1 border">
                                {member && (
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm font-medium">
                                  {member ? member.name : email}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeMemberFromGroup(email)}
                                  className="text-red-500 hover:text-red-700 ml-1"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic py-4 px-3 bg-gray-50 rounded-md">
                          No members selected. Search and click on members above to add them.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={!groupForm.name.trim()}>
              {editingGroup ? 'Update Group' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Group Dialog */}
      <Dialog open={isAddToGroupDialogOpen} onOpenChange={setIsAddToGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Members to Group</DialogTitle>
            <DialogDescription>
              Select a group to add the {selectedMembers.size} selected member{selectedMembers.size !== 1 ? 's' : ''} to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Selected Members</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-md max-h-32 overflow-y-auto">
                {Array.from(selectedMembers).map(email => {
                  const member = teamMembers.find(m => m.email === email);
                  return (
                    <div key={email} className="text-sm">
                      {member?.name} ({email})
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <Label>Available Groups</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {groups.map(group => (
                  <Button
                    key={group.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addSelectedToGroup(group.id)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-3" 
                      style={{ backgroundColor: group.color }}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-xs text-gray-500">
                        {getGroupMembers(group.id, teamMembers).length} members
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            {groups.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No groups available</p>
                <p className="text-xs">Create a group first to add members</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddToGroupDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
