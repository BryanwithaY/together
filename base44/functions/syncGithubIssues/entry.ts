import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GITHUB_OWNER = 'BryanwithaY';
const GITHUB_REPO = 'together';

// Maps GitHub state → BugReport status
function githubStateToBugStatus(ghState, ghStateReason) {
  if (ghState === 'open') return 'open';
  if (ghState === 'closed') {
    if (ghStateReason === 'not_planned') return 'wont_fix';
    return 'resolved';
  }
  return 'open';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (no user) or admin-triggered
    const isScheduled = req.headers.get('x-base44-scheduled') === 'true';
    const user = isScheduled ? null : await base44.auth.me().catch(() => null);
    if (!isScheduled && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get GitHub OAuth token
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('github');
      accessToken = conn.accessToken;
    } catch (connErr) {
      return Response.json({ error: `GitHub connector unavailable: ${connErr.message}` }, { status: 503 });
    }

    // Fetch open + recently closed issues from GitHub
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    const [openRes, closedRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&per_page=100`, { headers }),
      fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=closed&per_page=50&sort=updated&direction=desc`, { headers }),
    ]);

    if (!openRes.ok) {
      const body = await openRes.text();
      return Response.json({ error: `GitHub API error (open issues): ${openRes.status} ${body}` }, { status: 502 });
    }
    if (!closedRes.ok) {
      const body = await closedRes.text();
      return Response.json({ error: `GitHub API error (closed issues): ${closedRes.status} ${body}` }, { status: 502 });
    }

    const [openIssues, closedIssues] = await Promise.all([openRes.json(), closedRes.json()]);
    const allIssues = [
      ...(Array.isArray(openIssues) ? openIssues : []),
      ...(Array.isArray(closedIssues) ? closedIssues : []),
    ].filter(i => !i.pull_request);

    // Get all BugReports that have a GitHub issue number in admin_notes
    const allReports = await base44.asServiceRole.entities.BugReport.list('-created_date', 200);
    const reportsWithGithub = allReports.filter(r => r.admin_notes?.includes('GitHub: #'));

    let synced = 0;
    for (const report of reportsWithGithub) {
      const match = report.admin_notes.match(/GitHub: #(\d+)/);
      if (!match) continue;
      const issueNumber = parseInt(match[1]);
      const ghIssue = allIssues.find(i => i.number === issueNumber);
      if (!ghIssue) continue;

      const newStatus = githubStateToBugStatus(ghIssue.state, ghIssue.state_reason);
      if (report.status !== newStatus) {
        await base44.asServiceRole.entities.BugReport.update(report.id, {
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : report.resolved_at,
        });
        synced++;
      }
    }

    return Response.json({ success: true, synced, total_checked: reportsWithGithub.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});