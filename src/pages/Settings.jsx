import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import ProfileSettings from '../components/settings/ProfileSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import PartnerConnection from '../components/settings/PartnerConnection';

export default function Settings() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/60">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to={createPageUrl('Home')}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Settings</h1>
                <p className="text-sm text-stone-500 mt-0.5">Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-800 mb-6">Profile</h2>
          <ProfileSettings user={user} />
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-800 mb-6">Notifications</h2>
          <NotificationSettings user={user} />
        </div>

        {/* Appearance Settings */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-800 mb-6">Appearance</h2>
          <AppearanceSettings user={user} />
        </div>

        {/* Logout */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}