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

    const attachmentLinks = attachments && attachments.length > 0
      ? '\n\nAttachments:\n' + attachments.map(att => `- ${att.name}: ${att.url}`).join('\n')
      : '';

    const emailBody = `
New ${type || 'Support'} Report

User: ${user.full_name}
Email: ${user.email}

Title: ${title}

Description:
${description}
${attachmentLinks}

---
Submitted on: ${new Date().toLocaleString()}
    `;

    await base44.integrations.Core.SendEmail({
      to: 'bryan.atkins@gmail.com',
      subject: `[${type || 'Support'}] ${title}`,
      from_name: 'Together App Support',
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});