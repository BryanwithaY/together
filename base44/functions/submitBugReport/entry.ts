import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const GITHUB_OWNER = 'BryanwithaY';
const GITHUB_REPO = 'together';

const TYPE_LABELS = {
  bug: ['bug'],
  feature_request: ['enhancement'],
  feedback: ['feedback'],
  support: ['question'],
};

async function createGithubIssue(accessToken, { title, body, labels }) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub issue creation failed: ${err}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, type, attachments } = await req.json();
  if (!title || !description) {
    return Response.json({ error: 'Title and description are required' }, { status: 400 });
  }

  // Input length guard — prevents oversized payloads from being stored or sent to GitHub
  if (title.length > 200) return Response.json({ error: 'Title too long (max 200 chars)' }, { status: 400 });
  if (description.length > 5000) return Response.json({ error: 'Description too long (max 5000 chars)' }, { status: 400 });

  const ALLOWED_TYPES = ['bug', 'feature_request', 'feedback', 'support'];
  if (type && !ALLOWED_TYPES.includes(type)) {
    return Response.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Save to DB first
  const bugReport = await base44.asServiceRole.entities.BugReport.create({
    reporter_email: user.email,
    reporter_name: user.full_name,
    title,
    description,
    type: type || 'support',
    status: 'open',
    priority: 'medium',
    attachments: attachments || [],
    admin_notes: '',
  });

  // Create GitHub issue + send email in parallel
  const issueBody = [
    `**Reported by:** ${user.full_name} (${user.email})`,
    `**Type:** ${type || 'support'}`,
    `**App Report ID:** ${bugReport.id}`,
    ``,
    `### Description`,
    description,
    attachments?.length ? `\n### Attachments\n${attachments.map(a => `- [${a.name}](${a.url})`).join('\n')}` : '',
  ].filter(Boolean).join('\n');

  const labels = TYPE_LABELS[type] || ['question'];

  const [githubIssue] = await Promise.all([
    (async () => {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');
      return createGithubIssue(accessToken, { title, body: issueBody, labels });
    })(),
    base44.integrations.Core.SendEmail({
      to: 'bryan.atkins@gmail.com',
      subject: `[${type || 'Support'}] ${title}`,
      from_name: 'Together App Support',
      body: `New ${type || 'Support'} Report\n\nUser: ${user.full_name}\nEmail: ${user.email}\n\nTitle: ${title}\n\nDescription:\n${description}${attachments?.length ? '\n\nAttachments:\n' + attachments.map(a => `- ${a.name}: ${a.url}`).join('\n') : ''}\n\n---\nSubmitted on: ${new Date().toLocaleString()}`,
    }),
  ]);

  // Save GitHub issue number + URL back to the report
  await base44.asServiceRole.entities.BugReport.update(bugReport.id, {
    admin_notes: `GitHub: #${githubIssue.number} ${githubIssue.html_url}`,
  });

  return Response.json({ success: true, id: bugReport.id, github_issue: githubIssue.number });
});