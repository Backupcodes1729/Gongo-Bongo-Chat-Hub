import { Settings as SettingsIcon, User, Bell, Lock, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CustomAvatar } from "@/components/common/CustomAvatar";
// This is a client component because we'll likely need user state and form handling
// "use client"; (Add if needed for interactivity)

export default function SettingsPage() {
  // const { user } = useAuth(); // Example: Get user data

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 bg-background">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-primary" />
          Settings
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Settings */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Profile
            </CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <CustomAvatar src={"https://placehold.co/128x128.png"} alt="User Name" className="h-24 w-24 mb-2" data-ai-hint="person avatar"/>
              <Button variant="outline" size="sm">Change Photo</Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" defaultValue={"User Name Placeholder"} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={"user@example.com"} disabled />
            </div>
            <Button className="w-full">Save Profile</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="desktopNotifications" className="flex flex-col space-y-1">
                <span>Desktop Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receive notifications on your computer.
                </span>
              </Label>
              <Switch id="desktopNotifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Get important updates via email.
                </span>
              </Label>
              <Switch id="emailNotifications" />
            </div>
             <div className="flex items-center justify-between">
              <Label htmlFor="soundNotifications" className="flex flex-col space-y-1">
                <span>Sound Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Play a sound for new messages.
                </span>
              </Label>
              <Switch id="soundNotifications" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Security
            </CardTitle>
            <CardDescription>Manage your account security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">Change Password</Button>
            <Button variant="outline" className="w-full">Two-Factor Authentication</Button>
            <Button variant="destructive" className="w-full">Delete Account</Button>
          </CardContent>
        </Card>
        
        {/* Appearance Settings - Removed as theme is primarily light as per initial proposal and globals.css setup */}
      </div>
    </div>
  );
}
