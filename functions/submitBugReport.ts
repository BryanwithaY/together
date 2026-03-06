import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, type, attachments } = await req.json();

    if (!title || !description) {
      return Response.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Persist to BugReport entity + send email in parallel
    const [bugReport] = await Promise.all([
      base44.asServiceRole.entities.BugReport.create({
        reporter_email: user.email,
        reporter_name: user.full_name,
        title,
        description,
        type: type || 'support',
        status: 'open',
        priority: 'medium',
        attachments: attachments || [],
        admin_notes: '',
      }),
      base44.integrations.Core.SendEmail({
        to: 'bryan.atkins@gmail.com',
        subject: `[${type || 'Support'}] ${title}`,
        from_name: 'Together App Support',
        body: `New ${type || 'Support'} Report\n\nUser: ${user.full_name}\nEmail: ${user.email}\n\nTitle: ${title}\n\nDescription:\n${description}${attachments?.length ? '\n\nAttachments:\n' + attachments.map(a => `- ${a.name}: ${a.url}`).join('\n') : ''}\n\n---\nSubmitted on: ${new Date().toLocaleString()}`,
      }),
    ]);

    return Response.json({ success: true, id: bugReport.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});