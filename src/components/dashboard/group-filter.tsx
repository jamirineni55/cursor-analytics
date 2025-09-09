import { useState } from 'react';
import { Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useGroupsStore } from '@/stores/groups-store';
import { useDashboardStore } from '@/stores/dashboard-store';
import { cn } from '@/lib/utils';

export const GroupFilter = (): JSX.Element => {
  const { groups, selectedGroupId, setSelectedGroup, getGroupMembers } = useGroupsStore();
  const { teamMembers } = useDashboardStore();
  const [open, setOpen] = useState(false);
  

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const selectedGroupName = selectedGroup ? selectedGroup.name : 'All Teams';

  const handleGroupSelect = (groupId: string | null): void => {
    setSelectedGroup(groupId);
    setOpen(false); // Close the popover
  };

  const getGroupMemberCount = (groupId: string): number => {
    return getGroupMembers(groupId, teamMembers).length;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-between min-w-[180px] h-10"
        >
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span className="truncate">{selectedGroupName}</span>
          </div>
          {selectedGroup && (
            <Badge 
              variant="secondary" 
              className="ml-2 text-xs"
              style={{ backgroundColor: `${selectedGroup.color}20`, color: selectedGroup.color }}
            >
              {getGroupMemberCount(selectedGroup.id)}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end" 
        side="bottom" 
        sideOffset={4}
        collisionPadding={16}
        avoidCollisions={true}
      >
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Filter by Team Group</h4>
          <p className="text-xs text-gray-500 mt-1">
            View analytics for specific team groups
          </p>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {/* All Teams Option */}
          <div
            className={cn(
              "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors",
              selectedGroupId === null && "bg-blue-50"
            )}
            onClick={() => handleGroupSelect(null)}
          >
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-400 mr-3" />
              <div>
                <div className="font-medium text-sm">All Teams</div>
                <div className="text-xs text-gray-500">
                  {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            {selectedGroupId === null && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
          </div>

          {/* Group Options */}
          {groups.map((group) => {
            const memberCount = getGroupMemberCount(group.id);
            const isSelected = selectedGroupId === group.id;
            
            return (
              <div
                key={group.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors",
                  isSelected && "bg-blue-50"
                )}
                onClick={() => handleGroupSelect(group.id)}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full mr-3 flex-shrink-0" 
                    style={{ backgroundColor: group.color }} 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{group.name}</div>
                    <div className="text-xs text-gray-500">
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                )}
              </div>
            );
          })}

          {groups.length === 0 && (
            <div className="px-3 py-6 text-center text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No groups created yet</p>
              <p className="text-xs mt-1">Create groups in Settings to filter analytics</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
