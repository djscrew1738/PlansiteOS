import React from 'react';
import { Settings as SettingsIcon, User, DollarSign, Bell, Shield } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../stores/useUserStore';

export function Settings() {
  const { user } = useUserStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader title="Profile Information" />
            <CardContent>
              <div className="space-y-4">
                <Input label="Full Name" defaultValue={user?.name} />
                <Input label="Email" type="email" defaultValue={user?.email} />
                <Input label="Phone" type="tel" defaultValue={user?.phone} />
                <Input label="Company" defaultValue="CTL Plumbing LLC" />
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader
              title="Default Pricing"
              subtitle="DFW market rates per fixture"
            />
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Water Heater" defaultValue="$450" />
                <Input label="Lavatory" defaultValue="$175" />
                <Input label="Kitchen Sink" defaultValue="$225" />
                <Input label="Toilet" defaultValue="$150" />
                <Input label="Tub" defaultValue="$350" />
                <Input label="Shower" defaultValue="$400" />
                <Input
                  label="Labor Rate (per hour)"
                  defaultValue="$85"
                  className="col-span-2"
                />
                <Input
                  label="Markup %"
                  defaultValue="25"
                  className="col-span-2"
                />
              </div>
              <Button className="mt-4">Update Pricing</Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader title="Notification Preferences" />
            <CardContent>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Email notifications</p>
                    <p className="text-sm text-gray-600">
                      Receive updates via email
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Job updates</p>
                    <p className="text-sm text-gray-600">
                      Notifications for job status changes
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Marketing emails</p>
                    <p className="text-sm text-gray-600">
                      Updates about new features
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <User className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Account</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Billing</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Notifications</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Security</span>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">Version 2.0.0</p>
              <p className="text-xs text-gray-500">
                Built for Texas tradesmen, by Texas tradesmen
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
