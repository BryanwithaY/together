import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Copy, Share2, Check, Users } from 'lucide-react';

// Deterministic code from user email — short, unique-enough, readable
function generateCode(email) {
  const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 6);
  const hash = Math.abs(
    email.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
  ).toString(36).slice(0, 4);
  return `${base}${hash}`.toUpperCase();
}

export default function InviteCard({ user }) {
  const [code, setCode] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const appUrl = window.location.origin;

  useEffect(() => {
    if (!user?.email) return;

    const init = async () => {
      setLoading(true);
      // Find or create this user's referral record (the "owner" record — no referred_email)
      const existing = await base44.entities.Referral.filter({
        referrer_email: user.email,
        status: 'pending',
      });

      // Look for the primary code record (no referred_email = this is the user's own code record)
      const primary = existing.find(r => !r.referred_email);

      let userCode;
      if (primary) {
        userCode = primary.code;
      } else {
        const newCode = generateCode(user.email);
        await base44.entities.Referral.create({
          referrer_email: user.email,
          code: newCode,
          status: 'pending',
        });
        userCode = newCode;
      }

      setCode(userCode);

      // Count completed referrals (records with referred_email set)
      const completed = await base44.entities.Referral.filter({
        referrer_email: user.email,
        status: 'completed',
      });
      setReferralCount(completed.length);
      setLoading(false);
    };

    init();
  }, [user?.email]);

  const inviteUrl = code ? `${appUrl}?ref=${code}` : appUrl;
  const shareText = `I've been using Together to build a stronger relationship — you should try it. Join here:`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${inviteUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Join me on Together',
        text: shareText,
        url: inviteUrl,
      });
    } else {
      handleCopy();
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <Users className="w-4 h-4 text-stone-400" />
        {referralCount === 0
          ? 'No one has signed up with your link yet'
          : `${referralCount} person${referralCount !== 1 ? 's' : ''} joined using your link`}
      </div>

      {/* Link display */}
      <div className="bg-stone-50 rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
        <span className="flex-1 text-sm text-stone-600 font-mono truncate">{inviteUrl}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Share button — triggers native share sheet on mobile */}
      <Button
        onClick={handleShare}
        className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-xl h-11 text-sm font-medium"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Invite Link
      </Button>

      <p className="text-xs text-stone-400 text-center leading-relaxed">
        Share via text, email, WhatsApp, Slack, or any app.
        <br />Your unique code <span className="font-mono font-semibold text-stone-500">{code}</span> is included automatically.
      </p>
    </div>
  );
}