import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { usePageLoading } from '../components/PageLoadingContext';
import RelationshipGate from '../components/relationship/RelationshipGate';
import CoachOnboarding from '../components/coach/CoachOnboarding';
import CoachChatView from '../components/coach/CoachChatView';
import { Analytics } from '../components/lib/analytics';

export default function Coach() {
  const { setPageReady } = usePageLoading();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Analytics.pageViewed('coach');
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
      setPageReady();
    });
  }, []);

  const handleOnboardingComplete = async ({ why, goal, summary }) => {
    await base44.auth.updateMe({
      coaching_onboarded: true,
      coaching_why: why,
      coaching_goal: goal,
      coaching_context: summary,
    });
    setUser(u => ({ ...u, coaching_onboarded: true, coaching_why: why, coaching_goal: goal, coaching_context: summary }));
  };

  if (loading) return null;

  return (
    <RelationshipGate>
      {!user?.coaching_onboarded ? (
        <CoachOnboarding onComplete={handleOnboardingComplete} />
      ) : (
        <CoachChatView user={user} />
      )}
    </RelationshipGate>
  );
}