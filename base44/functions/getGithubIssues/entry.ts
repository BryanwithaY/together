import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

  const body = await req.json().catch(() => ({}));
  const owner = body.owner || 'BryanwithaY';
  const repo = body.repo || 'together';

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: res.status });
  }

  const issues = await res.json();

  // Filter out pull requests (GitHub returns PRs in the issues endpoint)
  const onlyIssues = issues.filter(i => !i.pull_request).map(i => ({
    number: i.number,
    title: i.title,
    state: i.state,
    created_at: i.created_at,
    updated_at: i.updated_at,
    user: i.user?.login,
    labels: i.labels?.map(l => l.name),
    url: i.html_url,
    body: i.body,
  }));

  return Response.json({ issues: onlyIssues, total: onlyIssues.length });
});