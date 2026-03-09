import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Loader2, ShieldCheck, ShieldOff, UserCog, Mail, Calendar, Clock, Activity, Heart, Users, CreditCard, ChevronLeft } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

function fmt(val, type = 'text') {
  if (val == null || val === '') return '—';
  if (type === 'date') {
    try { return format(new Date(val), 'MMM d, yyyy'); } catch { return val; }
  }
  if (type === 'datetime') {
    try { return format(new Date(val), 'MMM d, yyyy h:mm a'); } catch { return val; }
  }
  if (type === 'ago') {
    try { return formatDistanceToNow(new Date(val), { addSuffix: true }); } catch { return val; }
  }
  return String(val);
}

function InfoRow({ label, value, valueClass = '' }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-stone-100 last:border-0">
      <span className="text-xs font-medium text-stone-400 uppercase tracking-wide shrink-0 w-36">{label}</span>
      <span className={`text-sm text-stone-800 text-right break-all ${valueClass}`}>{value || '—'}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-stone-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {title}
      </p>
      {children}
    </div>
  );
}

export default function UserDetailModal({ userEmail, onClose }) {
  const queryClient = useQueryClient();
  const [confirmDisable, setConfirmDisable] = useState(false);

  // Fetch user
  const { data: users = [], isLoading: loadingUser } = useQuery({
    queryKey: ['adminUser', userEmail],
    queryFn: () => base44.entities.User.filter({ email: userEmail }),
    enabled: !!userEmail,
    staleTime: 30_000,
  });
  const user = users[0];

  // Fetch subscription
  const { data: subs = [] } = useQuery({
    queryKey: ['adminUserSub', userEmail],
    queryFn: () => base44.entities.UserSubscription.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    staleTime: 30_000,
  });
  const sub = subs[0];

  // Fetch memberships
  const { data: memberships = [] } = useQuery({
    queryKey: ['adminUserMemberships', userEmail],
    queryFn: () => base44.entities.RelationshipMember.filter({ user_email: userEmail, status: 'active' }),
    enabled: !!userEmail,
    staleTime: 30_000,
  });

  // Fetch recent events
  const { data: events = [] } = useQuery({
    queryKey: ['adminUserEvents', userEmail],
    queryFn: () => base44.entities.AppEvent.filter({ user_email: userEmail }, '-occurred_at', 10),
    enabled: !!userEmail,
    staleTime: 30_000,
  });

  // Toggle disable
  const disableMutation = useMutation({
    mutationFn: (disabled) => base44.entities.User.update(user.id, { is_disabled: disabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUser', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['statDetail'] });
      setConfirmDisable(false);
    },
  });

  // Change role
  const roleMutation = useMutation({
    mutationFn: (role) => base44.entities.User.update(user.id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUser', userEmail] }),
  });

  const isDisabled = user?.is_disabled === true;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-200 flex-shrink-0">
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-stone-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-stone-800 truncate">{user?.full_name || userEmail}</h2>
            <p className="text-xs text-stone-400 truncate">{userEmail}</p>
          </div>
          {user && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isDisabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isDisabled ? 'Disabled' : 'Active'}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingUser ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
          ) : !user ? (
            <p className="text-sm text-stone-400 text-center py-8">User record not found.</p>
          ) : (
            <>
              {/* Account Info */}
              <Section title="Account" icon={Mail}>
                <InfoRow label="Full Name" value={user.full_name} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Role" value={user.role} />
                <InfoRow label="Enrolled" value={fmt(user.created_date, 'date')} />
                <InfoRow label="Last Active" value={user.last_active_at ? fmt(user.last_active_at, 'ago') : '—'} />
                <InfoRow label="Timezone" value={user.timezone} />
                <InfoRow label="Theme" value={user.theme} />
                <InfoRow label="Onboarding" value={user.onboarding_completed ? 'Completed' : 'Incomplete'} />
                {isDisabled && <InfoRow label="Status" value="⚠️ Disabled by admin" valueClass="text-red-700 font-semibold" />}
              </Section>

              {/* Subscription */}
              <Section title="Subscription" icon={CreditCard}>
                {sub ? (
                  <>
                    <InfoRow label="Plan" value={sub.plan_slug} />
                    <InfoRow label="Status" value={sub.status} />
                    <InfoRow label="Amount Paid" value={sub.amount_paid_usd != null ? `$${sub.amount_paid_usd}` : null} />
                    <InfoRow label="Period Start" value={fmt(sub.current_period_start, 'date')} />
                    <InfoRow label="Period End" value={fmt(sub.current_period_end, 'date')} />
                    <InfoRow label="Last Payment" value={fmt(sub.last_payment_at, 'date')} />
                    <InfoRow label="Cancelled At" value={fmt(sub.cancelled_at, 'date')} />
                    <InfoRow label="Stripe Customer" value={sub.stripe_customer_id} />
                  </>
                ) : (
                  <p className="text-sm text-stone-400">No subscription record — likely on free plan.</p>
                )}
              </Section>

              {/* Facilitator */}
              {(user.role === 'facilitator' || user.facilitator_approved_at) && (
                <Section title="Facilitator" icon={ShieldCheck}>
                  <InfoRow label="Type" value={user.facilitator_type} />
                  <InfoRow label="Tier" value={user.facilitator_tier} />
                  <InfoRow label="Approved At" value={fmt(user.facilitator_approved_at, 'date')} />
                </Section>
              )}

              {/* Activity */}
              <Section title="Activity" icon={Activity}>
                <InfoRow label="Moments Logged" value={user.total_moments_logged} />
                <InfoRow label="Relationships" value={memberships.length} />
                <InfoRow
                  label="Rel. Roles"
                  value={memberships.length ? memberships.map(m => m.role).join(', ') : null}
                />
                <InfoRow label="Notifications" value={[
                  user.notification_reminders ? 'Reminders' : null,
                  user.notification_partner_moments ? 'Partner Moments' : null,
                ].filter(Boolean).join(', ') || 'All off'} />
              </Section>

              {/* Relationships */}
              {memberships.length > 0 && (
                <Section title="Relationships" icon={Users}>
                  <div className="space-y-1">
                    {memberships.map(m => (
                      <div key={m.id} className="flex justify-between text-sm py-1">
                        <span className="text-stone-600 truncate">{m.relationship_id}</span>
                        <span className="text-stone-400 ml-2 capitalize flex-shrink-0">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Recent Events */}
              {events.length > 0 && (
                <Section title="Recent Activity" icon={Heart}>
                  <div className="space-y-1">
                    {events.map(e => (
                      <div key={e.id} className="flex justify-between text-xs py-1 border-b border-stone-100 last:border-0">
                        <span className="text-stone-600">{e.event_type?.replace(/_/g, ' ')}</span>
                        <span className="text-stone-400">{fmt(e.occurred_at, 'ago')}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Permissions */}
              <Section title="Permissions & Access" icon={UserCog}>
                <div className="space-y-2 pt-1">
                  <div>
                    <p className="text-xs text-stone-400 mb-1.5">Change Role</p>
                    <div className="flex gap-2">
                      {['user', 'facilitator', 'admin'].map(r => (
                        <button
                          key={r}
                          onClick={() => roleMutation.mutate(r)}
                          disabled={roleMutation.isPending || user.role === r}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                            user.role === r
                              ? 'bg-stone-800 text-white border-stone-800'
                              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>

        {/* Footer actions */}
        {user && (
          <div className="px-5 py-4 border-t border-stone-200 flex-shrink-0">
            {confirmDisable ? (
              <div className="space-y-2">
                <p className="text-sm text-stone-700 font-medium text-center">
                  {isDisabled ? 'Re-enable this account?' : 'Disable this account?'}
                </p>
                <p className="text-xs text-stone-400 text-center">
                  {isDisabled
                    ? 'The user will be able to log in again.'
                    : 'The user will be blocked from logging in until re-enabled.'}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmDisable(false)}>
                    Cancel
                  </Button>
                  <Button
                    className={`flex-1 ${isDisabled ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-600 hover:bg-red-700'}`}
                    onClick={() => disableMutation.mutate(!isDisabled)}
                    disabled={disableMutation.isPending}
                  >
                    {disableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isDisabled ? 'Enable Account' : 'Disable Account'}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDisable(true)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  isDisabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                {isDisabled ? <><ShieldCheck className="w-4 h-4 inline mr-1.5" />Enable Account</> : <><ShieldOff className="w-4 h-4 inline mr-1.5" />Disable Account</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}