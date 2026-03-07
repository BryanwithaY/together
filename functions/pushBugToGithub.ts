import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const GITHUB_OWNER = 'BryanwithaY';
const GITHUB_REPO = 'together';

const TYPE_LABELS = {
  bug: ['bug'],
  feature_request: ['enhancement'],
  feedback: ['feedback'],
  support: ['question'],
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { bug_id } = await req.json();
  if (!bug_id) return Response.json({ error: 'bug_id required' }, { status: 400 });

  const [report] = await base44.asServiceRole.entities.BugReport.filter({ id: bug_id });
  if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

  const body = [
    `**Reported by:** ${report.reporter_name} (${report.reporter_email})`,
    `**Type:** ${report.type}`,
    `**Priority:** ${report.priority}`,
    `**App Report ID:** ${report.id}`,
    ``,
    `### Description`,
    report.description,
    report.attachments?.length
      ? `\n### Attachments\n${report.attachments.map(a => `- [${a.name}](${a.url})`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n');

  const labels = TYPE_LABELS[report.type] || ['question'];

  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: report.title, body, labels }),
  });

  if (!res.ok) {
    const err = await res.text();
    return Response.json({ error: err }, { status: res.status });
  }

  const issue = await res.json();

  await base44.asServiceRole.entities.BugReport.update(report.id, {
    admin_notes: `${report.admin_notes ? report.admin_notes + '\n' : ''}GitHub: #${issue.number} ${issue.html_url}`,
  });

  return Response.json({ success: true, issue_number: issue.number, issue_url: issue.html_url });
});