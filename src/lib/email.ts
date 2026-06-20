import nodemailer from "nodemailer";

type ParentWelcomeEmailParams = {
  to: string;
  parentName: string;
  studentName: string;
  studentId: string;
  instituteName: string;
  loginUrl: string;
  email: string;
  temporaryPassword: string;
};

function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendParentWelcomeEmail(params: ParentWelcomeEmailParams): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.info("[email] SMTP not configured — skipping parent welcome email to", params.to);
    return false;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `Welcome to ${params.instituteName} — Parent Portal Access`;

  const text = [
    `Assalamu Alaikum ${params.parentName},`,
    "",
    `${params.studentName} (${params.studentId}) has been enrolled at ${params.instituteName}.`,
    "",
    "Your parent portal login:",
    `  URL: ${params.loginUrl}`,
    `  Email: ${params.email}`,
    `  Temporary password: ${params.temporaryPassword}`,
    "",
    "Please sign in and change your password on first login.",
    "",
    "— QEMS",
  ].join("\n");

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
      <h2 style="color:#166534">Welcome to ${params.instituteName}</h2>
      <p>Assalamu Alaikum <strong>${params.parentName}</strong>,</p>
      <p><strong>${params.studentName}</strong> (${params.studentId}) has been enrolled.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px;font-weight:600">Parent portal login</p>
        <p style="margin:4px 0"><strong>URL:</strong> <a href="${params.loginUrl}">${params.loginUrl}</a></p>
        <p style="margin:4px 0"><strong>Email:</strong> ${params.email}</p>
        <p style="margin:4px 0"><strong>Temporary password:</strong> ${params.temporaryPassword}</p>
      </div>
      <p style="color:#6b7280;font-size:14px">Please sign in and change your password on first login.</p>
    </div>
  `;

  try {
    await getTransporter().sendMail({ from, to: params.to, subject, text, html });
    return true;
  } catch (error) {
    console.error("[email] Failed to send parent welcome email:", error);
    return false;
  }
}
