import { useState, type JSX } from 'react';
import { Eye, EyeOff, Key, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth-store';

export const APIKeySetup = (): JSX.Element => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const { setApiKey: storeApiKey, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    
    await storeApiKey(apiKey.trim());
  };

  const isValidFormat = apiKey.startsWith('key_') || apiKey.length === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Cursor Analytics</CardTitle>
          <CardDescription>
            Enter your Cursor Admin API key to access your team's analytics
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={`pr-10 ${!isValidFormat ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={isLoading}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!isValidFormat && (
                <p className="text-sm text-red-600">
                  API key should start with "key_"
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !apiKey.trim() || !isValidFormat}
            >
              {isLoading ? 'Connecting...' : 'Connect to Cursor API'}
            </Button>
          </form>

          <div className="space-y-3 rounded-lg bg-blue-50 p-4">
            <h4 className="text-sm font-medium text-blue-900">
              How to get your API key:
            </h4>
            <ol className="space-y-1 text-sm text-blue-700">
              <li>1. Go to your Cursor Dashboard</li>
              <li>2. Navigate to Settings → Cursor Admin API Keys</li>
              <li>3. Click "Create New API Key"</li>
              <li>4. Copy the generated key and paste it above</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('https://cursor.com/dashboard', '_blank')}
            >
              Open Cursor Dashboard
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your API key is stored locally and never sent to any third-party servers.
            All analytics are processed in your browser only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
