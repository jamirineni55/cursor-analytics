import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cursorAPI } from '@/services/cursor-api';

interface AuthState {
  apiKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setApiKey: (apiKey: string) => Promise<boolean>;
  clearAuth: () => void;
  testConnection: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setApiKey: async (apiKey: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          // Validate API key format
          if (!apiKey.startsWith('key_')) {
            throw new Error('Invalid API key format. API key should start with "key_"');
          }

          // Set the API key in the service
          cursorAPI.setApiKey(apiKey);

          // Test the connection
          const isValid = await cursorAPI.testConnection();
          
          if (isValid) {
            set({
              apiKey,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            cursorAPI.clearApiKey();
            set({
              apiKey: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Invalid API key or insufficient permissions',
            });
            return false;
          }
        } catch (error) {
          cursorAPI.clearApiKey();
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          set({
            apiKey: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      clearAuth: () => {
        cursorAPI.clearApiKey();
        set({
          apiKey: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      testConnection: async (): Promise<boolean> => {
        const { apiKey } = get();
        if (!apiKey) return false;

        set({ isLoading: true, error: null });
        
        try {
          cursorAPI.setApiKey(apiKey);
          const isValid = await cursorAPI.testConnection();
          
          set({
            isAuthenticated: isValid,
            isLoading: false,
            error: isValid ? null : 'Connection test failed',
          });
          
          return isValid;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
          set({
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },
    }),
    {
      name: 'cursor-analytics-auth',
      partialize: (state) => ({
        apiKey: state.apiKey,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-authenticate on app load if we have a stored API key
        if (state?.apiKey) {
          cursorAPI.setApiKey(state.apiKey);
          // Note: We don't automatically test connection on rehydration
          // to avoid unnecessary API calls on every app load
          state.isAuthenticated = true;
        }
      },
    }
  )
);
