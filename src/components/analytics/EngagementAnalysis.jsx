import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981'];

export default function EngagementAnalysis() {
  const [propertyId, setPropertyId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['engagement', propertyId],
    queryFn: () =>
      base44.functions.invoke('analyzeEngagement', { propertyId }),
    enabled: submitted && !!propertyId,
  });

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (propertyId.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Moment Engagement Analysis
            </CardTitle>
            <CardDescription>
              Analyze Google Analytics data to identify which moment types drive the most engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Google Analytics Property ID
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 123456789"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Found in your Google Analytics admin panel
                </p>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Engagement'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">
              {error?.response?.data?.error || 'Failed to fetch analytics data'}
            </p>
          </CardContent>
        </Card>
      )}

      {data?.data && data.data.length > 0 && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.data.slice(0, 3).map((moment, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground capitalize">
                    {moment.momentType}
                  </p>
                  <p className="text-2xl font-bold mt-2">{moment.events}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {moment.users} active users • {(moment.engagementRate * 100).toFixed(1)}% engagement
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Event Count Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Events by Moment Type (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="momentType" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="events" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Engagement Rate Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.data}
                    dataKey="engagementRate"
                    nameKey="momentType"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {data.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Moment Type</th>
                      <th className="text-right py-2">Events</th>
                      <th className="text-right py-2">Users</th>
                      <th className="text-right py-2">Engagement Rate</th>
                      <th className="text-right py-2">Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((moment, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-3 capitalize">{moment.momentType}</td>
                        <td className="text-right py-3">{moment.events}</td>
                        <td className="text-right py-3">{moment.users}</td>
                        <td className="text-right py-3">{(moment.engagementRate * 100).toFixed(1)}%</td>
                        <td className="text-right py-3">{moment.avgDuration}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {submitted && !isLoading && !data && !error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800">
              No data available. Make sure you've entered the correct Property ID and that Google Analytics has tracked moment events.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}