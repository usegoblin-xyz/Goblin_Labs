// Transactional email for auth flows (email changes and verification).
// Uses Resend when RESEND_API_KEY is set; otherwise Better Auth
// Infrastructure's hosted templates (BETTER_AUTH_API_KEY, needs email enabled
// on the Better Auth plan). Throws if neither can send, so the console shows
// an error instead of claiming an email went out.
import { sendEmail } from "@better-auth/infra/email";

const env = process.env;
const FROM = env.MAIL_FROM || "Goblin <hello@mail.usegoblin.xyz>";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(heading: string, body: string, cta: string, url: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f1;font-family:Inter,Helvetica,Arial,sans-serif;color:#0d1512">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td>
<img src="https://www.usegoblin.xyz/favicon-192.png" width="40" height="40" alt="Goblin" style="border-radius:10px;display:block">
<h1 style="font-size:20px;margin:20px 0 8px">${heading}</h1>
<p style="font-size:14px;line-height:1.6;color:#4b5650;margin:0 0 24px">${body}</p>
<a href="${esc(url)}" style="display:inline-block;background:#22a03a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px">${cta}</a>
<p style="font-size:12px;line-height:1.6;color:#8a938d;margin:24px 0 0">The link expires in 1 hour. If you didn't ask for this, you can ignore this email and nothing will change.</p>
</td></tr></table>
<p style="font-size:12px;color:#8a938d;margin:16px 0 0">Goblin · usegoblin.xyz</p>
</td></tr></table></body></html>`;
}

async function viaResend(to: string, subject: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!r.ok) throw new Error(`Email failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
}

// The new address confirms it's theirs; clicking the link switches the email.
export async function sendVerifyNewEmail(to: string, url: string, name?: string | null) {
  if (env.RESEND_API_KEY) {
    return viaResend(
      to,
      "Confirm your new Goblin email",
      layout("Confirm your new email", `Hi${name ? ` ${esc(name)}` : ""}, click below to use <b>${esc(to)}</b> for your Goblin account.`, "Confirm email", url),
    );
  }
  const r = await sendEmail({ template: "verify-email", to, variables: { verificationUrl: url, userEmail: to, userName: name ?? undefined, appName: "Goblin", expirationMinutes: "60" } });
  if (!r.success) throw new Error(r.error || "Email failed");
}

// Accounts with a verified email (e.g. Google) approve the change from the
// current inbox first; Better Auth then emails the new address.
export async function sendApproveEmailChange(currentEmail: string, newEmail: string, url: string, name?: string | null) {
  if (env.RESEND_API_KEY) {
    return viaResend(
      currentEmail,
      "Approve your Goblin email change",
      layout("Approve your email change", `Someone asked to change your Goblin email from <b>${esc(currentEmail)}</b> to <b>${esc(newEmail)}</b>. If that was you, approve it below.`, "Approve change", url),
    );
  }
  const r = await sendEmail({ template: "change-email", to: currentEmail, variables: { confirmationLink: url, newEmail, currentEmail, userName: name ?? undefined, appName: "Goblin", expirationMinutes: "60" } });
  if (!r.success) throw new Error(r.error || "Email failed");
}
