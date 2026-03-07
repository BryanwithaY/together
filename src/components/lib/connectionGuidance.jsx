/**
 * Behavioral science-based guidance for in-person connections
 * Draws from relationship science, coaching principles, and emotional intelligence
 */

const focusAreas = {
  listening: {
    title: "Active Listening & Understanding",
    principles: [
      "Listen to understand, not to respond",
      "Ask clarifying questions with genuine curiosity",
      "Notice non-verbal cues — body language matters",
      "Reflect back what you hear to confirm understanding"
    ],
    tips: [
      "Put phones away for at least 50% of the time",
      "Use open-ended questions: 'Tell me more about...'",
      "Pause for 5 seconds after they finish — let silence be okay",
      "Notice what emotions might be underneath the words"
    ]
  },

  appreciation: {
    title: "Gratitude & Appreciation",
    principles: [
      "Specific appreciation lands deeper than general praise",
      "Notice the effort, not just the outcome",
      "Share impact: 'When you did X, it made me feel Y'",
      "Regular appreciation prevents resentment"
    ],
    tips: [
      "Name 3 specific things you appreciate about them",
      "Share a moment when they made a positive difference",
      "Acknowledge growth and effort, especially during hard times",
      "Express appreciation for their presence in your life"
    ]
  },

  growth: {
    title: "Learning & Growth Together",
    principles: [
      "Healthy relationships involve mutual growth",
      "Vulnerability creates connection",
      "Share what you're learning about yourself",
      "Support each other's development"
    ],
    tips: [
      "Discuss what you've learned about the relationship",
      "Share a recent insight or moment of growth",
      "Ask: 'How do you want to grow together?'",
      "Celebrate each other's personal development"
    ]
  },

  intimacy: {
    title: "Presence & Emotional Intimacy",
    principles: [
      "Being fully present is the highest form of respect",
      "Emotional intimacy requires vulnerability",
      "Safe spaces allow authentic sharing",
      "Quality time rebuilds connection"
    ],
    tips: [
      "Start with something light and fun to ease in",
      "Share something true and a bit vulnerable",
      "Sit close, maintain eye contact, minimize distractions",
      "Create a ritual: same place, same time builds safety"
    ]
  },

  general: {
    title: "Building Connection",
    principles: [
      "Connection happens through showing up",
      "Small consistent moments compound over time",
      "Relationships need tending like gardens",
      "Being together outside the app deepens bonds"
    ],
    tips: [
      "Notice what brings you both joy and laughter",
      "Discuss one moment that resonated with you both",
      "Create a shared practice or ritual",
      "Reflect on how you're showing up for each other"
    ]
  }
};

export const generateEventDescription = (focusArea = 'general', linkedMoments = []) => {
  const guidance = focusAreas[focusArea] || focusAreas.general;

  let description = `🤝 Connection Time: ${guidance.title}\n\n`;

  // Add moment summaries if available
  if (linkedMoments.length > 0) {
    description += `📌 Topics to Discuss:\n`;
    linkedMoments.forEach(moment => {
      description += `• ${moment.type}: ${moment.subtype || 'reflection'}\n`;
    });
    description += `\n`;
  }

  // Add behavioral science principles
  description += `💡 Relationship Principles:\n`;
  guidance.principles.forEach(principle => {
    description += `• ${principle}\n`;
  });

  description += `\n✨ How to Connect:\n`;
  guidance.tips.forEach(tip => {
    description += `• ${tip}\n`;
  });

  description += `\n---\n💬 Remember: This time is for being together, not problem-solving. Listen with curiosity, speak with honesty, and enjoy the presence of someone you care about.`;

  return description;
};

export const getConnectionReminders = (focusArea = 'general') => {
  const guidance = focusAreas[focusArea] || focusAreas.general;
  return {
    title: guidance.title,
    tips: guidance.tips,
    principles: guidance.principles
  };
};

export default { focusAreas, generateEventDescription, getConnectionReminders };