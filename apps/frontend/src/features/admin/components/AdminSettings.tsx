import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import {
  Settings as SettingsIcon,
  Save,
  Bell,
  Shield,
  Database,
  Mail,
  Webhook,
  Key
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'MivraTec Trading',
    supportEmail: 'support@mivratec.com',
    maintenanceMode: false,

    // Trading Settings
    maxDailyTrades: 100,
    maxDrawdown: 20,
    enableAutoStop: true,

    // Notifications
    emailNotifications: true,
    webhookNotifications: false,
    alertThreshold: 15,

    // Security
    twoFactorAuth: true,
    sessionTimeout: 30,
    ipWhitelist: false,

    // API Keys
    binanceApiKey: 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢',
    telegramBotToken: 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢',
    webhookUrl: 'https://api.mivratec.com/webhooks'
  });

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // TODO: Implement save functionality
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure platform settings and preferences
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access to the platform
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Trading Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Trading Settings</CardTitle>
            </div>
            <CardDescription>Risk management and trading limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxDailyTrades">Max Daily Trades</Label>
                <Input
                  id="maxDailyTrades"
                  type="number"
                  value={settings.maxDailyTrades}
                  onChange={(e) => setSettings({ ...settings, maxDailyTrades: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Per user per day</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
                <Input
                  id="maxDrawdown"
                  type="number"
                  value={settings.maxDrawdown}
                  onChange={(e) => setSettings({ ...settings, maxDrawdown: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Automatic stop trigger</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="enableAutoStop">Enable Auto-Stop</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically stop bots when drawdown limit is reached
                </p>
              </div>
              <Switch
                id="enableAutoStop"
                checked={settings.enableAutoStop}
                onCheckedChange={(checked) => setSettings({ ...settings, enableAutoStop: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Alert and notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send alerts via email
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="webhookNotifications">Webhook Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send alerts via webhooks
                </p>
              </div>
              <Switch
                id="webhookNotifications"
                checked={settings.webhookNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, webhookNotifications: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
              <Input
                id="alertThreshold"
                type="number"
                value={settings.alertThreshold}
                onChange={(e) => setSettings({ ...settings, alertThreshold: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Trigger alerts when P/L change exceeds this percentage
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Authentication and access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all admin users
                </p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="ipWhitelist">IP Whitelist</Label>
                <p className="text-sm text-muted-foreground">
                  Restrict access to specific IP addresses
                </p>
              </div>
              <Switch
                id="ipWhitelist"
                checked={settings.ipWhitelist}
                onCheckedChange={(checked) => setSettings({ ...settings, ipWhitelist: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Auto-logout after period of inactivity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Keys & Integrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle>API Keys & Integrations</CardTitle>
            </div>
            <CardDescription>External service connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="binanceApiKey">Binance API Key</Label>
              <Input
                id="binanceApiKey"
                type="password"
                value={settings.binanceApiKey}
                onChange={(e) => setSettings({ ...settings, binanceApiKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
              <Input
                id="telegramBotToken"
                type="password"
                value={settings.telegramBotToken}
                onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Endpoint for receiving webhook notifications
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

