// functions/api/contact.ts
export const onRequestPost = async (context: any) => {
  try {
    const form = await context.request.formData();

    // Required fields
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const message = String(form.get("message") || "").trim();

    // Optional fields
    const company = String(form.get("company") || "").trim();
    const phone = String(form.get("phone") || "").trim();

    // Honeypot (bots fill this; humans won’t)
    // If filled, treat as spam: do NOT send email. Return ok:false (200) to avoid training bots.
    const honey = String(form.get("website") || "").trim();
    if (honey) {
      return new Response(JSON.stringify({ ok: false, error: "honeypot_triggered" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields." }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // (Optional) basic email sanity check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_email" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const apiKey = context.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Server not configured." }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const to = context.env.CONTACT_TO || "info@pichonia.com";
    const from = context.env.CONTACT_FROM || "noreply@pichonia.com";

    const escapeHtml = (s: string) =>
      s.replace(/[&<>"']/g, (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        } as Record<string, string>)[c]
      );

    const subject = `New inquiry from ${name}${company ? ` (${company})` : ""}`;

    const html = `
      <h2>New project inquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ""}
      ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:system-ui">${escapeHtml(message)}</pre>
    `;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!resendResp.ok) {
      const details = await resendResp.text();
      return new Response(
        JSON.stringify({ ok: false, error: "Email send failed.", details }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (_err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: "Unexpected error." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};
