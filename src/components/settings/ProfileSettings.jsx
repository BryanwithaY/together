import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, User, Loader2 } from 'lucide-react';
import { detectTimezone } from '@/components/utils/detectTimezone';

const TIMEZONES = [
  // North America - Organized by region
  { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
  { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
  { label: 'America/Denver (MST/MDT)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'America/Anchorage (AKST/AKDT)', value: 'America/Anchorage' },
  { label: 'Pacific/Honolulu (HST)', value: 'Pacific/Honolulu' },
  { label: 'Canada/Eastern (EST/EDT)', value: 'Canada/Eastern' },
  { label: 'Canada/Central (CST/CDT)', value: 'Canada/Central' },
  { label: 'Canada/Mountain (MST/MDT)', value: 'Canada/Mountain' },
  { label: 'Canada/Pacific (PST/PDT)', value: 'Canada/Pacific' },
  // Europe
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (CET/CEST)', value: 'Europe/Berlin' },
  { label: 'Europe/Moscow (MSK)', value: 'Europe/Moscow' },
  // Asia
  { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
  { label: 'Asia/Bangkok (ICT)', value: 'Asia/Bangkok' },
  { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Asia/Hong_Kong (HKT)', value: 'Asia/Hong_Kong' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  // Oceania
  { label: 'Australia/Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
  { label: 'Australia/Melbourne (AEST/AEDT)', value: 'Australia/Melbourne' },
  { label: 'Pacific/Auckland (NZST/NZDT)', value: 'Pacific/Auckland' },
  // UTC
  { label: 'UTC', value: 'UTC' }
];

export default function ProfileSettings({ user }) {
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [timezone, setTimezone] = useState(() => user?.timezone || detectTimezone());
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Update timezone if user data changes
  useEffect(() => {
    if (user?.timezone) {
      setTimezone(user.timezone);
    }
  }, [user?.timezone]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateProfileMutation.mutateAsync({ profile_picture: file_url });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleNameSave = () => {
    updateProfileMutation.mutate({ display_name: displayName });
  };

  const handleTimezoneSave = () => {
    updateProfileMutation.mutate({ timezone });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-4">Profile Picture</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-stone-400" />
            )}
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
              ) : (
                <Upload className="w-4 h-4 text-stone-500" />
              )}
              <span className="text-sm text-stone-600">
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </span>
            </div>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Display Name</h3>
        <div className="flex gap-2">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="max-w-xs"
          />
          <Button
            onClick={handleNameSave}
            disabled={updateProfileMutation.isPending || displayName === user?.display_name}
            className="bg-stone-800 hover:bg-stone-900"
          >
            Save
          </Button>
        </div>
        <p className="text-xs text-stone-500 mt-2">Email: {user?.email}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3">Timezone</h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1 max-w-xs">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleTimezoneSave}
            disabled={updateProfileMutation.isPending || timezone === user?.timezone}
            className="bg-stone-800 hover:bg-stone-900"
          >
            Save
          </Button>
        </div>
        <p className="text-xs text-stone-500 mt-2">Current: {TIMEZONES.find(t => t.value === timezone)?.label || 'Loading...'}</p>
      </div>
    </div>
  );
}