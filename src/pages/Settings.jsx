import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';

import ProfileSettings from '../components/settings/ProfileSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import PartnerConnection from '../components/settings/PartnerConnection';

export default function Settings() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    await base44.entities.Moment.list('-created_date', 500).then(async (moments) => {
      await Promise.all(moments.map(m => base44.entities.Moment.delete(m.id)));
    });
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

        {/* Partner Connection */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Partner</h2>
          <PartnerConnection user={user} />
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

        {/* Logout + Delete */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6 space-y-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full text-stone-400 hover:text-red-500 hover:bg-red-50 text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all your logged moments. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}