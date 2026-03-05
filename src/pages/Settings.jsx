import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, ArrowLeft, Trash2, HelpCircle, ChevronDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import ProfileSettings from '../components/settings/ProfileSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import RelationshipSettings from '../components/settings/RelationshipSettings';

export default function Settings() {
  const navigate = useNavigate();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

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
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors select-none"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </button>
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

        {/* Relationship Settings */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-800 mb-4">Relationship Space</h2>
          <RelationshipSettings />
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

        {/* Help */}
        <Link
          to={createPageUrl('Help')}
          className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 flex items-center gap-4 hover:bg-stone-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-stone-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-stone-800 text-sm">Help & Philosophy</p>
            <p className="text-xs text-stone-500 mt-0.5">App guide, philosophy, and feature tour</p>
          </div>
          <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>

        {/* Logout */}
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-stone-200 text-stone-600 hover:bg-stone-50 text-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>

        {/* Danger zone — collapsed by default */}
        <div>
          <button
            onClick={() => setShowDangerZone(v => !v)}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-stone-500 transition-colors mx-auto"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDangerZone ? 'rotate-180' : ''}`} />
            {showDangerZone ? 'Hide' : 'More options'}
          </button>

          {showDangerZone && (
            <div className="mt-3 bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
              <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirmText(''); }}>
                <AlertDialogTrigger asChild>
                  <button className="w-full text-left text-xs text-stone-400 hover:text-red-500 transition-colors flex items-center gap-2 py-1">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete my account
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account and all your logged moments. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="px-1 py-2">
                    <p className="text-sm text-stone-600 mb-2">Type <strong>delete</strong> to confirm:</p>
                    <Input
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="delete"
                      autoComplete="off"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                      className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
                    >
                      Yes, delete my account
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}