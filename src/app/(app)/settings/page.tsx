"use client";

import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const { theme, setTheme } = useTheme();
  
  const [name, setName] = useState(user?.name || "");
  const [confidence, setConfidence] = useState([65]);
  const [showLandmarks, setShowLandmarks] = useState(false);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[var(--fg-secondary)] mt-1">
          Manage your account settings and application preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="camera">Camera & ML</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.avatar || ""} />
                  <AvatarFallback className="text-xl bg-brand-100 text-brand-700">{user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Avatar</Button>
              </div>
              
              <div className="grid gap-4 max-w-md">
                <Input 
                  label="Full Name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
                <Input 
                  label="Email Address" 
                  value={user?.email || ""} 
                  disabled 
                  helperText="Contact support to change your email."
                />
              </div>
              
              <Button onClick={() => updateProfile({ name })}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how SignBridge looks on your device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Theme</Label>
                <div className="grid grid-cols-3 gap-4 max-w-lg">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${theme === 'light' ? 'border-brand-500 bg-brand-50/50' : 'border-[var(--border)] hover:border-brand-200'}`}
                  >
                    <Sun className="w-6 h-6" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${theme === 'dark' ? 'border-brand-500 bg-brand-900/10' : 'border-[var(--border)] hover:border-brand-800'}`}
                  >
                    <Moon className="w-6 h-6" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${theme === 'system' ? 'border-brand-500 bg-[var(--bg-secondary)]' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}
                  >
                    <Monitor className="w-6 h-6" />
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camera" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Camera & Detection Settings</CardTitle>
              <CardDescription>Fine-tune the computer vision pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 max-w-lg">
              <div className="space-y-3">
                <Label>Default Camera Device</Label>
                <Select defaultValue="auto">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-select (Default)</SelectItem>
                    <SelectItem value="facetime">FaceTime HD Camera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Machine Learning Model</Label>
                <Select defaultValue="mediapipe">
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mediapipe">MediaPipe Hands (Fast)</SelectItem>
                    <SelectItem value="custom" disabled>SignBridge Vision V2</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--fg-secondary)]">The ML model used for gesture classification.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Confidence Threshold: {confidence[0]}%</Label>
                </div>
                <Slider 
                  value={confidence} 
                  onValueChange={setConfidence} 
                  max={99} 
                  min={50} 
                  step={1} 
                />
                <p className="text-xs text-[var(--fg-secondary)]">Higher values mean fewer false positives but might miss signs.</p>
              </div>

              <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Show Landmarks Overlay</Label>
                  <p className="text-sm text-[var(--fg-secondary)]">Draw skeleton on hands during detection</p>
                </div>
                <Switch checked={showLandmarks} onCheckedChange={setShowLandmarks} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Summary Report</Label>
                  <p className="text-sm text-[var(--fg-secondary)]">Receive an email with your translation stats.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Product Updates</Label>
                  <p className="text-sm text-[var(--fg-secondary)]">News about new models and features.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card className="border-error/20">
            <CardHeader>
              <CardTitle className="text-error">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-[var(--fg)]">Delete Account</h4>
                  <p className="text-sm text-[var(--fg-secondary)]">Permanently delete your account and all data.</p>
                </div>
                <Button variant="danger">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


