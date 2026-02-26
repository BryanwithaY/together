import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, User, Loader2 } from 'lucide-react';

export default function ProfileSettings({ user }) {
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

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
    </div>
  );
}