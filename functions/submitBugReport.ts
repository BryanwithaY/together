import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, type } = await req.json();

    if (!title || !description) {
      return Response.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const emailBody = `
New ${type || 'Support'} Report from ${user.full_name} (${user.email})

Title: ${title}

Description:
${description}

---
Submitted on: ${new Date().toLocaleString()}
User Email: ${user.email}
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