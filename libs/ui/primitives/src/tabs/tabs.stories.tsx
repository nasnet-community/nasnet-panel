import * as React from 'react';

import { Settings, User, Bell, Lock } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Button } from '../button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../card';
import { Input } from '../input';
import { Label } from '../label';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Tabs> = {
  title: 'Primitives/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A tabs component built on Radix UI Tabs primitive for organizing content into switchable panels.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save password</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alerts
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Security
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="p-4">
        <h3 className="font-medium">Profile Settings</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your profile information and preferences.
        </p>
      </TabsContent>
      <TabsContent value="settings" className="p-4">
        <h3 className="font-medium">Application Settings</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Configure your application settings and preferences.
        </p>
      </TabsContent>
      <TabsContent value="notifications" className="p-4">
        <h3 className="font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Manage how and when you receive notifications.
        </p>
      </TabsContent>
      <TabsContent value="security" className="p-4">
        <h3 className="font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your security settings and two-factor authentication.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const Controlled: Story = {
  render: function ControlledTabs() {
    const [value, setValue] = React.useState('tab1');

    return (
      <div className="flex flex-col gap-4 items-center">
        <p className="text-sm text-muted-foreground">Active tab: {value}</p>
        <Tabs value={value} onValueChange={setValue} className="w-[400px]">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="p-4">
            Content for Tab 1
          </TabsContent>
          <TabsContent value="tab2" className="p-4">
            Content for Tab 2
          </TabsContent>
          <TabsContent value="tab3" className="p-4">
            Content for Tab 3
          </TabsContent>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setValue('tab1')}>
            Go to Tab 1
          </Button>
          <Button variant="outline" size="sm" onClick={() => setValue('tab2')}>
            Go to Tab 2
          </Button>
          <Button variant="outline" size="sm" onClick={() => setValue('tab3')}>
            Go to Tab 3
          </Button>
        </div>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="another">Another</TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="p-4">
        This tab is active and clickable.
      </TabsContent>
      <TabsContent value="disabled" className="p-4">
        You can't see this content because the tab is disabled.
      </TabsContent>
      <TabsContent value="another" className="p-4">
        Another tab that works normally.
      </TabsContent>
    </Tabs>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-2xl">
      <TabsList className="w-full">
        <TabsTrigger value="overview" className="flex-1">
          Overview
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex-1">
          Analytics
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex-1">
          Reports
        </TabsTrigger>
        <TabsTrigger value="export" className="flex-1">
          Export
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="p-4 border rounded-lg mt-2">
        <h3 className="font-medium mb-2">Dashboard Overview</h3>
        <p className="text-sm text-muted-foreground">
          Get a quick summary of your network status and recent activity.
        </p>
      </TabsContent>
      <TabsContent value="analytics" className="p-4 border rounded-lg mt-2">
        <h3 className="font-medium mb-2">Traffic Analytics</h3>
        <p className="text-sm text-muted-foreground">
          View detailed traffic analytics and bandwidth usage over time.
        </p>
      </TabsContent>
      <TabsContent value="reports" className="p-4 border rounded-lg mt-2">
        <h3 className="font-medium mb-2">Generated Reports</h3>
        <p className="text-sm text-muted-foreground">
          Access and download generated reports for compliance and auditing.
        </p>
      </TabsContent>
      <TabsContent value="export" className="p-4 border rounded-lg mt-2">
        <h3 className="font-medium mb-2">Export Data</h3>
        <p className="text-sm text-muted-foreground">
          Export your data in various formats for external analysis.
        </p>
      </TabsContent>
    </Tabs>
  ),
};
