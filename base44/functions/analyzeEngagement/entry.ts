import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // propertyId is admin-supplied — read from request body, not URL params
    const body = await req.json().catch(() => ({}));
    const propertyId = body.propertyId;

    if (!propertyId) {
      return Response.json({ error: 'propertyId required' }, { status: 400 });
    }

    // Query Google Analytics for engagement metrics by event name
    const analyticsResponse = await fetch(
      'https://analyticsdata.googleapis.com/v1beta/properties/' + propertyId + ':runReport',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [
            {
              startDate: '30daysAgo',
              endDate: 'today',
            },
          ],
          dimensions: [
            {
              name: 'eventName',
            },
            {
              name: 'customEvent:moment_type',
            },
          ],
          metrics: [
            {
              name: 'eventCount',
            },
            {
              name: 'activeUsers',
            },
            {
              name: 'engagementRate',
            },
            {
              name: 'userEngagementDuration',
            },
          ],
          orderBys: [
            {
              metric: {
                name: 'eventCount',
              },
              desc: true,
            },
          ],
          limit: 50,
        }),
      }
    );

    if (!analyticsResponse.ok) {
      return Response.json(
        { error: 'Failed to fetch Google Analytics data' },
        { status: analyticsResponse.status }
      );
    }

    const analyticsData = await analyticsResponse.json();

    // Process the data to identify top engaging moment types
    const engagementByMomentType = {};

    if (analyticsData.rows) {
      analyticsData.rows.forEach((row) => {
        const momentType = row.dimensionValues[1]?.value || 'unknown';
        const eventName = row.dimensionValues[0]?.value || 'unknown';

        if (!engagementByMomentType[momentType]) {
          engagementByMomentType[momentType] = {
            momentType,
            events: 0,
            users: 0,
            engagementRate: 0,
            avgDuration: 0,
            eventBreakdown: [],
          };
        }

        const metrics = {
          eventName,
          eventCount: parseInt(row.metricValues[0]?.value || 0),
          activeUsers: parseInt(row.metricValues[1]?.value || 0),
          engagementRate: parseFloat(row.metricValues[2]?.value || 0),
          userEngagementDuration: parseInt(row.metricValues[3]?.value || 0),
        };

        engagementByMomentType[momentType].events += metrics.eventCount;
        engagementByMomentType[momentType].users += metrics.activeUsers;
        engagementByMomentType[momentType].engagementRate =
          (engagementByMomentType[momentType].engagementRate + metrics.engagementRate) / 2;
        engagementByMomentType[momentType].avgDuration += metrics.userEngagementDuration;
        engagementByMomentType[momentType].eventBreakdown.push(metrics);
      });
    }

    // Sort by engagement score (events + weighted engagement rate)
    const sortedMoments = Object.values(engagementByMomentType)
      .sort((a, b) => {
        const scoreA = a.events + a.engagementRate * 100;
        const scoreB = b.events + b.engagementRate * 100;
        return scoreB - scoreA;
      });

    return Response.json({
      success: true,
      period: '30 days',
      data: sortedMoments,
      rawAnalytics: analyticsData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});