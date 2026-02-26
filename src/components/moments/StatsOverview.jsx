import React from 'react';
import { Heart, HandHeart, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-[0.07] ${color}`} />
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <p className="text-2xl font-semibold text-stone-800 tracking-tight">{value}</p>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wider mt-0.5">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function StatsOverview({ moments }) {
  const egoAside = moments.filter(m => m.type === 'ego_aside').length;
  const gratitude = moments.filter(m => m.type === 'gratitude').length;
  const total = moments.length;

  // Calculate streak (consecutive days with at least one moment)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let checkDate = new Date(today);

  while (true) {
    const dayStr = checkDate.toISOString().split('T')[0];
    const hasMoment = moments.some(m => {
      const mDate = new Date(m.date).toISOString().split('T')[0];
      return mDate === dayStr;
    });
    if (hasMoment) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard icon={Heart} label="Total Moments" value={total} color="bg-rose-400" delay={0} />
      <StatCard icon={HandHeart} label="Ego Aside" value={egoAside} color="bg-amber-500" delay={0.1} />
      <StatCard icon={Sparkles} label="Gratitude" value={gratitude} color="bg-emerald-500" delay={0.2} />
      <StatCard icon={TrendingUp} label="Day Streak" value={streak} color="bg-violet-500" delay={0.3} />
    </div>
  );
}