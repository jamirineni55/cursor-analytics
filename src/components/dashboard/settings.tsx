import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  Key, 
  Download, 
  Trash2, 
  Settings as SettingsIcon,
  Shield,
  Database,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useGroupsStore } from '@/stores/groups-store';
import { toast } from 'sonner';

export const Settings = (): JSX.Element => {
  const { apiKey, setApiKey, clearAuth } = useAuthStore();
  const { clearAllData } = useDashboardStore();
  const { groups } = useGroupsStore();
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [isChangeKeyDialogOpen, setIsChangeKeyDialogOpen] = useState(false);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);

  const maskedApiKey = apiKey ? `${apiKey.slice(0, 8)}${'*'.repeat(20)}${apiKey.slice(-4)}` : '';

  const handleUpdateApiKey = (): void => {
    if (!newApiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setApiKey(newApiKey.trim());
    setNewApiKey('');
    setIsChangeKeyDialogOpen(false);
    toast.success('API key updated successfully');
    
    // Clear existing data to force refresh with new key
    clearAllData();
  };

  const handleLogout = (): void => {
    clearAuth();
    toast.success('Logged out successfully');
  };

  const handleClearData = (): void => {
    clearAllData();
    setIsClearDataDialogOpen(false);
    toast.success('All data cleared successfully');
  };

  const exportGroupsData = (): void => {
    try {
      const data = {
        groups,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `cursor-analytics-groups-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Groups data exported successfully');
    } catch (error) {
      toast.error('Failed to export groups data');
    }
  };

  const copyApiKey = (): void => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success('API key copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">
          Manage your account, API keys, and application preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-fit grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="api">API & Security</TabsTrigger>
          <TabsTrigger value="data">Data & Export</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="mr-2 h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and session information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <p className="text-sm font-medium text-green-600 mt-1">Connected</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Session</Label>
                  <p className="text-sm text-gray-900 mt-1">Active</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">API Key</Label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {maskedApiKey || 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleLogout} variant="destructive">
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          {/* API Key Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2 h-5 w-5" />
                API Key Management
              </CardTitle>
              <CardDescription>
                Manage your Cursor Admin API key for accessing analytics data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentKey">Current API Key</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="currentKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={showApiKey ? (apiKey || '') : maskedApiKey}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyApiKey}
                    disabled={!apiKey}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Need a new API key? Get one from your{' '}
                    <a 
                      href="https://cursor.com/dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center"
                    >
                      Cursor Dashboard
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </p>
                </div>
                <Button onClick={() => setIsChangeKeyDialogOpen(true)}>
                  Update API Key
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-sm">Local Storage Only</p>
                  <p className="text-sm text-gray-500">
                    Your API key is stored locally in your browser and never sent to third parties
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-sm">HTTPS Only</p>
                  <p className="text-sm text-gray-500">
                    All API communications use secure HTTPS connections
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-sm">No Server Storage</p>
                  <p className="text-sm text-gray-500">
                    Analytics data is processed in your browser without server-side storage
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export, backup, and manage your analytics data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Section */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Export Data</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Groups Configuration</p>
                      <p className="text-sm text-gray-500">
                        Export your team groups and configurations ({groups.length} groups)
                      </p>
                    </div>
                    <Button onClick={exportGroupsData} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Clear Data Section */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Clear Data</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <p className="font-medium text-sm text-red-900">Clear All Analytics Data</p>
                      <p className="text-sm text-red-600">
                        Remove all cached analytics data from your browser
                      </p>
                    </div>
                    <Button 
                      onClick={() => setIsClearDataDialogOpen(true)} 
                      variant="destructive" 
                      size="sm"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Data
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Information */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Groups</Label>
                  <p className="font-medium">{groups.length} configured</p>
                </div>
                <div>
                  <Label className="text-gray-500">API Key</Label>
                  <p className="font-medium">{apiKey ? 'Stored' : 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Storage Type</Label>
                  <p className="font-medium">Browser Local Storage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About Cursor Analytics</CardTitle>
              <CardDescription>
                Information about this application and available features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Version</Label>
                  <p className="text-sm text-gray-900 mt-1">1.0.0</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Built With</Label>
                  <p className="text-sm text-gray-900 mt-1">React + TypeScript + Vite</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data Source</Label>
                  <p className="text-sm text-gray-900 mt-1">Cursor Admin API</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">License</Label>
                  <p className="text-sm text-gray-900 mt-1">MIT</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Features</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Team member analytics and insights</li>
                  <li>• Usage analytics with interactive charts</li>
                  <li>• Group-based filtering and organization</li>
                  <li>• Secure local data processing</li>
                  <li>• CSV export capabilities</li>
                  <li>• Responsive design for all devices</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Resources</h3>
                <div className="space-y-2">
                  <a 
                    href="https://docs.cursor.com/en/account/teams/admin-api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm inline-flex items-center"
                  >
                    Cursor Admin API Documentation
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                  <br />
                  <a 
                    href="https://cursor.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm inline-flex items-center"
                  >
                    Cursor Dashboard
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change API Key Dialog */}
      <Dialog open={isChangeKeyDialogOpen} onOpenChange={setIsChangeKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update API Key</DialogTitle>
            <DialogDescription>
              Enter your new Cursor Admin API key. This will replace your current key.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="newApiKey">New API Key</Label>
              <Input
                id="newApiKey"
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter your new API key"
                className="font-mono"
              />
            </div>
            <div className="text-sm text-gray-500">
              <p>Get your API key from the Cursor Dashboard → Settings → API Keys</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangeKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateApiKey}>
              Update Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Clear All Data
            </DialogTitle>
            <DialogDescription>
              This will permanently remove all cached analytics data from your browser. 
              Your groups and API key will be preserved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-sm text-gray-600">
            <p>This action will clear:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Team member data</li>
              <li>Daily usage analytics</li>
              <li>Usage events</li>
              <li>Cached analytics results</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearDataDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
