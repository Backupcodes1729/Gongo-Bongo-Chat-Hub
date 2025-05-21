// This is now a client component
"use client";

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Lock, Palette, Sun, Moon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CustomAvatar } from "@/components/common/CustomAvatar";
import { useAuth } from '@/hooks/useAuth'; // Assuming you might want user data for profile

export default function SettingsPage() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState(false);

  // Effect to set initial theme from localStorage or system preference
  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Effect to apply theme and save to localStorage
  useEffect(() => {
    if (!isMounted) return;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme, isMounted]);

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  if (!isMounted) {
    // Optional: render a loading state or null to avoid hydration issues with theme-dependent rendering
    return null; 
  }

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
              <CustomAvatar 
                src={user?.photoURL || undefined} // Use undefined if null to trigger fallback correctly
                alt={user?.displayName || user?.email || "User"} 
                className="h-24 w-24 mb-2" 
                data-ai-hint="person avatar"
                fallback={(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
              />
              <Button variant="outline" size="sm" disabled>Change Photo</Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" defaultValue={user?.displayName || ""} disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
            </div>
            <Button className="w-full" disabled>Save Profile</Button>
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
              <Switch id="desktopNotifications" defaultChecked disabled />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Get important updates via email.
                </span>
              </Label>
              <Switch id="emailNotifications" disabled />
            </div>
             <div className="flex items-center justify-between">
              <Label htmlFor="soundNotifications" className="flex flex-col space-y-1">
                <span>Sound Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Play a sound for new messages.
                </span>
              </Label>
              <Switch id="soundNotifications" defaultChecked disabled />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" /> Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode" className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span>Dark Mode</span>
              </Label>
              <Switch 
                id="darkMode" 
                checked={theme === 'dark'}
                onCheckedChange={handleThemeChange}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Automatically switches based on your system settings if no preference is set.
            </p>
          </CardContent>
        </Card>
        
        {/* Security Settings (Original Card, moved down for typical grouping) */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Security
            </CardTitle>
            <CardDescription>Manage your account security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" disabled>Change Password</Button>
            <Button variant="outline" className="w-full" disabled>Two-Factor Authentication</Button>
            <Button variant="destructive" className="w-full" disabled>Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
