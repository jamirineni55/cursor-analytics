import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserGroup, TeamMember } from '@/types/cursor-api';

interface GroupsState {
  groups: UserGroup[];
  selectedGroupId: string | null; // null means "All Teams"
  
  // Actions
  addGroup: (group: Omit<UserGroup, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGroup: (id: string, updates: Partial<Omit<UserGroup, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteGroup: (id: string) => void;
  setSelectedGroup: (groupId: string | null) => void;
  
  // Utility functions
  getGroupMembers: (groupId: string, allMembers: TeamMember[]) => TeamMember[];
  getGroupByMember: (memberEmail: string) => UserGroup[];
  getMemberGroups: (memberEmail: string) => UserGroup[];
}

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};


export const useGroupsStore = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: [],
      selectedGroupId: null,

      addGroup: (groupData) => {
        const now = Date.now();
        const newGroup: UserGroup = {
          ...groupData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          groups: [...state.groups, newGroup],
        }));
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id
              ? { ...group, ...updates, updatedAt: Date.now() }
              : group
          ),
        }));
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          selectedGroupId: state.selectedGroupId === id ? null : state.selectedGroupId,
        }));
      },

      setSelectedGroup: (groupId) => {
        set({ selectedGroupId: groupId });
      },

      getGroupMembers: (groupId, allMembers) => {
        const group = get().groups.find((g) => g.id === groupId);
        if (!group) return [];

        return allMembers.filter((member) => {
          // Check if member is explicitly included
          return group.memberEmails.includes(member.email);
        });
      },

      getGroupByMember: (memberEmail) => {
        return get().groups.filter((group) => {
          // Check explicit inclusion
          return group.memberEmails.includes(memberEmail);
        });
      },

      getMemberGroups: (memberEmail) => {
        return get().getGroupByMember(memberEmail);
      },

    }),
    {
      name: 'cursor-analytics-groups',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
