import React, { useState } from 'react';
import { Calendar, RotateCw, Zap, Users, User, Clock, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SchedulingGuide() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Calendar Integration: Purpose & Philosophy
          </CardTitle>
          <CardDescription>
            Plan dedicated time to connect in person, outside the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The calendar feature helps you turn insights from moments into intentional, in-person connection time. Rather than discussing your relationship in the app, you schedule real-world moments where you can be fully present with each other.
          </p>
          <p className="text-stone-600">
            <strong>Key principle:</strong> The app is for reflection; the calendar is for connection. The best relationships happen offline, with shared attention and vulnerability.
          </p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="types" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="types">Event Types</TabsTrigger>
          <TabsTrigger value="frequency">Frequency</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="solo">Solo Time</TabsTrigger>
        </TabsList>

        {/* EVENT TYPES */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCw className="w-4 h-4" />
                Scheduled & Recurring Events
              </CardTitle>
              <CardDescription>Regular, predictable connection time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-stone-800 mb-2">When to use</h4>
                  <ul className="text-sm text-stone-700 space-y-1 list-disc list-inside">
                    <li>Building consistency into your relationship</li>
                    <li>Creating a safe, predictable rhythm</li>
                    <li>When you want to guarantee dedicated time together</li>
                    <li>For relationships that benefit from routine (romantic partners, co-parents, business partners)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-800 mb-2">What it looks like</h4>
                  <ul className="text-sm text-stone-700 space-y-1">
                    <li>• <strong>Weekly check-in:</strong> 1 hour every Sunday evening</li>
                    <li>• <strong>Biweekly deep dive:</strong> 2 hours every other Saturday</li>
                    <li>• <strong>Monthly review:</strong> Quarterly reflection on relationship progress</li>
                    <li>• <strong>Standing date:</strong> Same time, same place builds intimacy</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                  <strong>Pro tip:</strong> Recurring events don't need agendas—their power is in consistency. But you can link moments beforehand to give context for deeper conversations.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Impromptu Events
              </CardTitle>
              <CardDescription>Spontaneous, responsive connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-stone-800 mb-2">When to use</h4>
                  <ul className="text-sm text-stone-700 space-y-1 list-disc list-inside">
                    <li>Something important came up that needs discussion</li>
                    <li>You're in the same place and can grab coffee unexpectedly</li>
                    <li>Celebrating a win or milestone together</li>
                    <li>Crisis or challenge that requires immediate support</li>
                    <li>Natural opportunities when you're already together</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-800 mb-2">How to handle</h4>
                  <ul className="text-sm text-stone-700 space-y-1">
                    <li>• <strong>Don't plan:</strong> Spontaneous moments are powerful because they're genuine</li>
                    <li>• <strong>Be present:</strong> Put phones away, give your full attention</li>
                    <li>• <strong>Reflect after:</strong> Create a moment afterward to capture what mattered</li>
                    <li>• <strong>Add to calendar later:</strong> If it becomes recurring, schedule it</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900">
                  <strong>Remember:</strong> The best connection sometimes happens without planning. Impromptu moments show you care enough to rearrange your schedule.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FREQUENCY RECOMMENDATIONS */}
        <TabsContent value="frequency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Connection Frequency by Relationship Type</CardTitle>
              <CardDescription>How often to schedule dedicated connection time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Romantic */}
                <div className="border-l-4 border-pink-400 pl-4">
                  <h4 className="font-semibold text-stone-800">Romantic Partners / Spouses</h4>
                  <p className="text-sm text-stone-700 mt-1">
                    <strong>Ideal:</strong> Weekly dedicated time + daily informal connection
                  </p>
                  <ul className="text-sm text-stone-600 mt-2 space-y-1 list-disc list-inside">
                    <li>1-2 hour weekly date (focused conversation or activity)</li>
                    <li>Monthly deeper dive (review moments, discuss relationship)</li>
                    <li>Impromptu daily moments (coffee, walk, evening conversation)</li>
                    <li>Quarterly longer retreat or getaway if possible</li>
                  </ul>
                </div>

                {/* Family */}
                <div className="border-l-4 border-amber-400 pl-4">
                  <h4 className="font-semibold text-stone-800">Parent & Adult Child / Siblings</h4>
                  <p className="text-sm text-stone-700 mt-1">
                    <strong>Ideal:</strong> Biweekly to monthly, depending on proximity
                  </p>
                  <ul className="text-sm text-stone-600 mt-2 space-y-1 list-disc list-inside">
                    <li>Biweekly or monthly in-person visit if nearby</li>
                    <li>Phone/video call if distance exists</li>
                    <li>Focused conversation (30-60 mins, not rushed)</li>
                    <li>Annual deeper retreat or longer visit</li>
                  </ul>
                </div>

                {/* Friends */}
                <div className="border-l-4 border-purple-400 pl-4">
                  <h4 className="font-semibold text-stone-800">Close Friendships</h4>
                  <p className="text-sm text-stone-700 mt-1">
                    <strong>Ideal:</strong> Biweekly to monthly, depending on life stage
                  </p>
                  <ul className="text-sm text-stone-600 mt-2 space-y-1 list-disc list-inside">
                    <li>Monthly dedicated hangout (2-3 hours)</li>
                    <li>Casual frequent touchpoints (text, calls, spontaneous meetups)</li>
                    <li>Quarterly longer activity (adventure, trip, day together)</li>
                  </ul>
                </div>

                {/* Professional */}
                <div className="border-l-4 border-blue-400 pl-4">
                  <h4 className="font-semibold text-stone-800">Business Partners / Cofounders</h4>
                  <p className="text-sm text-stone-700 mt-1">
                    <strong>Ideal:</strong> Weekly business meetings + monthly personal check-in
                  </p>
                  <ul className="text-sm text-stone-600 mt-2 space-y-1 list-disc list-inside">
                    <li>Weekly working sessions (separate from personal connection time)</li>
                    <li>Monthly personal check-in (how you're really doing)</li>
                    <li>Quarterly strategic review (business & relationship)</li>
                    <li>Annual offsite or longer retreat</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">⚡ The Consistency Principle</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900 space-y-2">
              <p>
                <strong>One consistent monthly connection is better than sporadic intensive efforts.</strong>
              </p>
              <p>
                Relationships thrive on predictability. Your brain knows what to expect, and you can show up prepared. Even 30 minutes of consistent, focused time builds trust faster than occasional long visits.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLANNING & PREPARATION */}
        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                How to Plan Connection Events
              </CardTitle>
              <CardDescription>Before, during, and after your scheduled time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Before */}
              <div>
                <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span> Before: Preparation (24-48 hours ahead)
                </h4>
                <ul className="text-sm text-stone-700 space-y-2 list-disc list-inside">
                  <li><strong>Link moments:</strong> Select 1-3 moments from the app that you want to discuss</li>
                  <li><strong>Review the description:</strong> Read the event description to remind yourself of the focus area</li>
                  <li><strong>Set intentions:</strong> What do you hope to accomplish or discuss?</li>
                  <li><strong>Prepare environment:</strong> Choose a location that feels safe and distraction-free</li>
                  <li><strong>Notice your mindset:</strong> Are you bringing defensiveness or openness?</li>
                </ul>
                <div className="mt-3 p-3 bg-stone-50 rounded-lg text-xs text-stone-600">
                  <strong>Pro tip:</strong> Don't over-prepare. The structure is just a container; the real value is in honest presence.
                </div>
              </div>

              {/* During */}
              <div>
                <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">🎯</span> During: The Event (Focus on presence)
                </h4>
                <ul className="text-sm text-stone-700 space-y-2 list-disc list-inside">
                  <li><strong>Start light:</strong> Begin with something easy before diving into moments</li>
                  <li><strong>Phones away:</strong> Put them in another room. This time is sacred.</li>
                  <li><strong>Follow the guidance:</strong> Use the focus area (listening, appreciation, growth, etc.)</li>
                  <li><strong>Listen more than you talk:</strong> Aim for 60% listening, 40% sharing</li>
                  <li><strong>Be vulnerable:</strong> Share something real about yourself or the relationship</li>
                  <li><strong>Notice moments:</strong> Pay attention to what feels important—you might reflect on it later</li>
                </ul>
              </div>

              {/* After */}
              <div>
                <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">🔄</span> After: Reflection (Same day or next day)
                </h4>
                <ul className="text-sm text-stone-700 space-y-2 list-disc list-inside">
                  <li><strong>Log a moment:</strong> Capture something that landed for you during the connection</li>
                  <li><strong>Note insights:</strong> What did you learn about yourself or the relationship?</li>
                  <li><strong>Appreciate them:</strong> Send a simple message thanking them for showing up</li>
                  <li><strong>Notice shifts:</strong> Did anything change in how you see the relationship?</li>
                  <li><strong>Plan next time:</strong> If it went well, ensure the next connection is scheduled</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <strong className="text-blue-900">What these events should NOT be:</strong>
                <ul className="text-blue-900 mt-2 space-y-1 list-disc list-inside">
                  <li>Crisis management or conflict resolution (unless it's impromptu)</li>
                  <li>Logistical planning (who's picking up kids, paying bills)</li>
                  <li>Lecture or therapy session</li>
                  <li>Obligation—if it feels forced, it defeats the purpose</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOLO REFLECTION TIME */}
        <TabsContent value="solo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Solo Reflection: Personal Growth & Individual Time
              </CardTitle>
              <CardDescription>Why some calendar events should be just for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-stone-800 mb-2">The Balance: Shared Connection + Personal Reflection</h4>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    The healthiest relationships have two rhythms: time together and time apart. Personal growth time—when you step back and reflect on yourself and the relationship—is not selfish. It's essential. You can't show up better for someone else if you're not understanding yourself.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-stone-800 mb-3">Types of Solo Reflection Time</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-stone-50 rounded-lg">
                      <p className="font-medium text-sm text-stone-800">💭 Personal Reflection Session</p>
                      <p className="text-xs text-stone-600 mt-1">
                        30-60 minutes alone to journal about moments, your feelings, patterns, and growth in the relationship. No app, no sharing—just your thoughts.
                      </p>
                      <p className="text-xs text-stone-600 mt-2">
                        <strong>When:</strong> Weekly or before major conversations. <strong>Why:</strong> Clarity before connection.
                      </p>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg">
                      <p className="font-medium text-sm text-stone-800">🧠 Therapy or Coaching Time</p>
                      <p className="text-xs text-stone-600 mt-1">
                        Individual sessions to work through your own stuff—wounds, triggers, patterns—that show up in the relationship. This work happens independently.
                      </p>
                      <p className="text-xs text-stone-600 mt-2">
                        <strong>When:</strong> As needed, but ideally ongoing. <strong>Why:</strong> You can only give from a healed place.
                      </p>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg">
                      <p className="font-medium text-sm text-stone-800">🎨 Personal Time for Joy & Interests</p>
                      <p className="text-xs text-stone-600 mt-1">
                        Time for your own hobbies, friendships, interests. This keeps you whole and interesting. Your partner/friend/family member benefits when you're fulfilled.
                      </p>
                      <p className="text-xs text-stone-600 mt-2">
                        <strong>When:</strong> Regular and protected. <strong>Why:</strong> Healthy independence strengthens relationships.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-stone-800 mb-2">How to Use the Calendar for Solo Reflection</h4>
                  <ul className="text-sm text-stone-700 space-y-2 list-disc list-inside">
                    <li>Schedule personal reflection time like you'd schedule a meeting (30 min weekly)</li>
                    <li>Use your linked moments to guide reflection—what patterns do you notice?</li>
                    <li>Write or journal—capture insights without filtering</li>
                    <li>Do NOT bring unprocessed stuff to shared connection time</li>
                    <li>Share selected insights if they're relevant, but keep personal work personal</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                  <strong className="text-green-900">The Rule of 70-30:</strong>
                  <p className="text-green-900 mt-2">
                    Aim for about 70% of your energy on shared connection, 30% on personal reflection and individual interests. If you're 100% focused on the relationship, you'll deplete yourself and blame the other person.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">When to Make Solo Reflection Public (on the Calendar)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-stone-700 space-y-2">
              <p>
                <strong>Make it visible if:</strong> You're in a shared household or the person expects to spend time with you. Protecting your reflection time shows you respect the relationship.
              </p>
              <p>
                <strong>Keep it private if:</strong> It's internal processing or personal therapy. You don't need to share details.
              </p>
              <p>
                <strong>The conversation:</strong> "I need protected time to think and reflect on our relationship. It helps me show up better for us." Most people respect this immediately.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card className="bg-stone-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Quick Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold mb-2">Scheduled/Recurring Events</p>
              <p className="text-stone-300">
                Consistent rhythm of connection. Plan lightly, focus heavily on presence. Weekly to monthly depending on relationship type.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">Impromptu Events</p>
              <p className="text-stone-300">
                Spontaneous moments. Don't plan—just show up fully. Often the most powerful.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">Solo Reflection</p>
              <p className="text-stone-300">
                Personal processing time. Essential for growth and shows up in shared time as clarity and presence.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">The Magic</p>
              <p className="text-stone-300">
                Consistency + presence + personal growth = deeper, more authentic relationships.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}