/**
 * Behavioral science-based guidance for in-person connections
 * Tailored to different relationship types with contextual coaching
 */

const relationshipTypeGuidance = {
  // ROMANTIC RELATIONSHIPS
  romantic_partner: {
    focusAreas: {
      listening: {
        title: "Active Listening & Emotional Understanding",
        principles: [
          "Listen to understand your partner's inner world",
          "Emotional validation comes before problem-solving",
          "Notice both spoken words and emotional undertones",
          "Curiosity about their experience deepens intimacy"
        ],
        tips: [
          "Ask 'How did that make you feel?' not just 'What happened?'",
          "Reflect emotions: 'I hear that you felt frustrated'",
          "Minimize interruptions — give them your full presence",
          "Follow up later: 'I was thinking about what you said...'"
        ]
      },
      appreciation: {
        title: "Romantic Appreciation & Presence",
        principles: [
          "Specific appreciation keeps attraction alive",
          "Notice small acts of service and kindness",
          "Regular appreciation prevents resentment buildup",
          "Celebrating your partner strengthens the bond"
        ],
        tips: [
          "Express appreciation for specific actions",
          "Notice something physical or personal you admire",
          "Share how they make you feel safe or loved",
          "Give genuine compliments about their character"
        ]
      },
      intimacy: {
        title: "Emotional & Physical Intimacy",
        principles: [
          "Vulnerability deepens romantic connection",
          "Physical affection communicates care",
          "Emotional safety enables authentic connection",
          "Regular quality time sustains attraction"
        ],
        tips: [
          "Share something vulnerable about yourself",
          "Use touch: holding hands, hugs, closeness",
          "Make eye contact during important conversations",
          "Create space for playfulness and fun"
        ]
      },
      growth: {
        title: "Growing Together as Partners",
        principles: [
          "Partners support each other's individual growth",
          "Share goals and dreams together",
          "Navigate challenges as a team",
          "Celebrate milestones in each other's lives"
        ],
        tips: [
          "Discuss personal goals and how to support them",
          "Share something you're working on improving",
          "Ask how you can better support each other",
          "Celebrate wins together, no matter how small"
        ]
      }
    },
    defaultFocusArea: "intimacy"
  },

  // FAMILY RELATIONSHIPS
  parent_adult_child: {
    focusAreas: {
      listening: {
        title: "Understanding Without Judgment",
        principles: [
          "Adult children need to be heard as peers",
          "Parents need to listen to understand, not advise",
          "Old family patterns can be healed through presence",
          "Genuine curiosity bridges generational gaps"
        ],
        tips: [
          "Ask open questions about their life and choices",
          "Resist the urge to give advice unless asked",
          "Acknowledge their perspective, even if different",
          "Show interest in their growth and decisions"
        ]
      },
      appreciation: {
        title: "Honoring Contribution & Growth",
        principles: [
          "Acknowledge what you've learned from each other",
          "Recognize your parent's sacrifices and your own resilience",
          "Appreciate each other's changes over time",
          "Healing comes through honest gratitude"
        ],
        tips: [
          "Share something your parent taught you (implicitly or explicitly)",
          "Acknowledge how they showed up during hard times",
          "Thank them for respecting your independence",
          "Recognize ways you've grown as a person"
        ]
      },
      growth: {
        title: "Rebuilding Relationship as Adults",
        principles: [
          "Adult relationships require renegotiation",
          "Old wounds can be addressed with maturity",
          "Parents can learn from adult children's perspective",
          "Mutual respect deepens the bond"
        ],
        tips: [
          "Discuss how your relationship has evolved",
          "Share insights about your childhood experience",
          "Ask them about their perspective and struggles",
          "Explore how to relate as adults"
        ]
      },
      general: {
        title: "Strengthening Adult Family Bonds",
        principles: [
          "Quality time matters across the lifespan",
          "Consistency shows you value the relationship",
          "Small moments create lasting connections",
          "Vulnerability is courageous in any relationship"
        ],
        tips: [
          "Share something meaningful about your life",
          "Ask genuine questions about theirs",
          "Create a new tradition or ritual together",
          "Be present without agenda or judgment"
        ]
      }
    },
    defaultFocusArea: "growth"
  },

  siblings: {
    focusAreas: {
      listening: {
        title: "Hearing Each Other as Adults",
        principles: [
          "Siblings often revert to childhood roles — resist this",
          "Listen to understand their adult perspective",
          "Old grievances can block current understanding",
          "Genuine interest rebuilds sibling bonds"
        ],
        tips: [
          "Ask about their life, goals, and challenges",
          "Listen without defending your childhood position",
          "Acknowledge their experience as valid",
          "Follow up on things they care about"
        ]
      },
      appreciation: {
        title: "Recognizing Shared History & Growth",
        principles: [
          "You're each other's witnesses to life",
          "Shared experiences create unique bonds",
          "Appreciating differences strengthens connection",
          "Sibling relationships can evolve and deepen"
        ],
        tips: [
          "Acknowledge something they've overcome",
          "Appreciate how they show up differently than you",
          "Share a positive memory from growing up",
          "Recognize ways they've supported you"
        ]
      },
      growth: {
        title: "Breaking Old Patterns, Building New Ones",
        principles: [
          "Sibling dynamics need conscious renegotiation",
          "Adult siblings can relate as peers, not competitors",
          "Shared family history is valuable context",
          "Growth happens when you step out of old roles"
        ],
        tips: [
          "Discuss how your relationship has changed",
          "Address old patterns gently: 'I notice we sometimes...'",
          "Share what you value about who they've become",
          "Ask how they'd like the relationship to evolve"
        ]
      }
    },
    defaultFocusArea: "appreciation"
  },

  // FRIEND RELATIONSHIPS
  friends: {
    focusAreas: {
      listening: {
        title: "Deep Listening Between Friends",
        principles: [
          "True friendship involves really knowing each other",
          "Friends need to feel truly heard and understood",
          "Validation matters more than solutions",
          "Listening is how you show you care"
        ],
        tips: [
          "Put away your phone — be fully present",
          "Ask follow-up questions that show you care",
          "Remember details and ask about them later",
          "Reflect back what you hear"
        ]
      },
      appreciation: {
        title: "Celebrating Your Friendship",
        principles: [
          "Friendships are chosen — appreciate that choice",
          "Notice specific qualities you value in them",
          "Express gratitude for being in their life",
          "Regular appreciation strengthens bonds"
        ],
        tips: [
          "Tell them what you appreciate about them",
          "Acknowledge how they've supported you",
          "Share how they've influenced your life positively",
          "Express gratitude for the friendship itself"
        ]
      },
      growth: {
        title: "Growing & Evolving Together",
        principles: [
          "Good friends support each other's growth",
          "Friendships can weather change and difference",
          "Vulnerability deepens friendship",
          "Mutual encouragement sustains connection"
        ],
        tips: [
          "Share something you're working on",
          "Ask what they're learning about themselves",
          "Encourage their pursuits and dreams",
          "Discuss how you've both changed and grown"
        ]
      },
      general: {
        title: "Tending Your Friendship",
        principles: [
          "Friendship requires intentional time and effort",
          "Consistency demonstrates you value the relationship",
          "Fun and laughter are essential",
          "Good friends show up and stay present"
        ],
        tips: [
          "Do an activity you both enjoy",
          "Share something real and authentic",
          "Create inside jokes and shared memories",
          "Make plans and follow through"
        ]
      }
    },
    defaultFocusArea: "appreciation"
  },

  friend_group: {
    focusAreas: {
      listening: {
        title: "Creating Space for Everyone to Be Heard",
        principles: [
          "Group dynamics require intentional listening",
          "Everyone's voice matters in group friendship",
          "One-on-one moments within groups deepen bonds",
          "Listening helps prevent misunderstandings"
        ],
        tips: [
          "Check in with quieter members one-on-one",
          "Ask questions that invite multiple perspectives",
          "Make sure not one person dominates the conversation",
          "Follow up with individuals about what they shared"
        ]
      },
      appreciation: {
        title: "Appreciating Each Person & the Group",
        principles: [
          "Groups thrive when members feel valued",
          "Appreciating individuals strengthens the group",
          "Gratitude for the group itself is powerful",
          "Recognition prevents resentment"
        ],
        tips: [
          "Appreciate each person for their unique contribution",
          "Express gratitude for the group experience",
          "Notice and acknowledge what each person brings",
          "Share what the group means to you"
        ]
      }
    },
    defaultFocusArea: "listening"
  },

  // PROFESSIONAL RELATIONSHIPS
  business_partners: {
    focusAreas: {
      listening: {
        title: "Understanding Each Other's Vision",
        principles: [
          "Partners must truly understand each other's goals",
          "Listening prevents misalignment",
          "Understanding motivations builds trust",
          "Regular communication prevents conflicts"
        ],
        tips: [
          "Ask about their vision for the business",
          "Understand their concerns and challenges",
          "Listen to understand, not to counter-argue",
          "Acknowledge different perspectives as valid"
        ]
      },
      appreciation: {
        title: "Recognizing Each Other's Contributions",
        principles: [
          "Partners need to feel their work is valued",
          "Different strengths create complementary teams",
          "Appreciation prevents burnout and resentment",
          "Celebrating wins together builds morale"
        ],
        tips: [
          "Acknowledge specific contributions and impact",
          "Appreciate their skills and expertise",
          "Recognize effort, not just outcomes",
          "Celebrate milestones together"
        ]
      },
      growth: {
        title: "Growing Your Business & Partnership",
        principles: [
          "Both partners need to grow alongside the business",
          "Learning together strengthens the partnership",
          "Adapting to change requires mutual support",
          "Vision alignment evolves over time"
        ],
        tips: [
          "Discuss what you're each learning",
          "Share growth goals and support each other",
          "Adapt your partnership as the business evolves",
          "Plan for future growth together"
        ]
      }
    },
    defaultFocusArea: "appreciation"
  },

  cofounders: {
    focusAreas: {
      listening: {
        title: "Understanding Your Co-Founder's Reality",
        principles: [
          "Co-founders need to understand each other's stress",
          "Listening builds resilience through challenges",
          "Founders often hide struggles — create safety",
          "Understanding context prevents conflict"
        ],
        tips: [
          "Ask how they're really doing, not just about work",
          "Listen without trying to solve everything",
          "Acknowledge the emotional weight of building",
          "Be available for non-work conversations too"
        ]
      },
      appreciation: {
        title: "Honoring the Founder Journey",
        principles: [
          "Founding is hard — appreciation sustains morale",
          "Co-founders need to feel their sacrifice is seen",
          "Mutual respect is essential for the long haul",
          "Celebrating small wins matters"
        ],
        tips: [
          "Acknowledge the courage it takes to build",
          "Appreciate their unique skills and perspective",
          "Recognize the personal sacrifices made",
          "Celebrate wins, even small ones"
        ]
      },
      growth: {
        title: "Growing Together as Founders",
        principles: [
          "Both founders must evolve as the company grows",
          "Learning together strengthens the partnership",
          "Navigating changes requires communication",
          "Founders succeed when both succeed"
        ],
        tips: [
          "Discuss what you're each learning",
          "Share concerns about your abilities/roles",
          "Plan for how you'll both grow with the company",
          "Address skill gaps and development needs"
        ]
      }
    },
    defaultFocusArea: "growth"
  },

  // CO-PARENTING
  co_parents: {
    focusAreas: {
      listening: {
        title: "Understanding Each Other's Parenting Perspective",
        principles: [
          "Co-parents have different perspectives — listen to them",
          "Understanding doesn't mean agreement",
          "Listening prevents misunderstandings about the kids",
          "Respect for each other's role matters"
        ],
        tips: [
          "Ask about their perspective on parenting approaches",
          "Listen without judgment or defensiveness",
          "Understand their concerns for the children",
          "Acknowledge their effort and commitment"
        ]
      },
      appreciation: {
        title: "Appreciating Your Co-Parenting Partnership",
        principles: [
          "Co-parenting is a shared commitment",
          "Appreciating each other benefits the kids",
          "Respect for each other models good relationships",
          "Recognition builds cooperation"
        ],
        tips: [
          "Acknowledge their involvement and effort with kids",
          "Appreciate their strengths as a parent",
          "Thank them for showing up for the children",
          "Recognize when they handle something well"
        ]
      },
      growth: {
        title: "Growing Your Co-Parenting Relationship",
        principles: [
          "Co-parenting improves when both parents develop",
          "Aligned values help co-parenting",
          "Flexibility and adaptation are key",
          "Children benefit from healthy co-parent relationships"
        ],
        tips: [
          "Discuss parenting goals and values together",
          "Share what you're learning about parenting",
          "Adapt approaches as kids grow",
          "Plan how to handle future challenges together"
        ]
      }
    },
    defaultFocusArea: "appreciation"
  },

  other: {
    focusAreas: {
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
    }
  }
};

export const generateEventDescription = (relationshipType = 'other', focusArea = null, linkedMoments = []) => {
  const typeGuidance = relationshipTypeGuidance[relationshipType] || relationshipTypeGuidance.other;
  const defaultArea = typeGuidance.defaultFocusArea || 'general';
  const selectedArea = focusArea || defaultArea;
  const guidance = typeGuidance.focusAreas[selectedArea] || typeGuidance.focusAreas.general;

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

  description += `\n---\n💬 Remember: This time is for being together. Be present, listen with genuine curiosity, and share authentically.`;

  return description;
};

export const getConnectionReminders = (relationshipType = 'other', focusArea = null) => {
  const typeGuidance = relationshipTypeGuidance[relationshipType] || relationshipTypeGuidance.other;
  const defaultArea = typeGuidance.defaultFocusArea || 'general';
  const selectedArea = focusArea || defaultArea;
  const guidance = typeGuidance.focusAreas[selectedArea] || typeGuidance.focusAreas.general;
  
  return {
    title: guidance.title,
    tips: guidance.tips,
    principles: guidance.principles
  };
};

export const getFocusAreasForType = (relationshipType = 'other') => {
  const typeGuidance = relationshipTypeGuidance[relationshipType] || relationshipTypeGuidance.other;
  return Object.keys(typeGuidance.focusAreas);
};

export default { 
  relationshipTypeGuidance, 
  generateEventDescription, 
  getConnectionReminders,
  getFocusAreasForType
};