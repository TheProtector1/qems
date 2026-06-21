const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Manually parse .env file to ensure correct value extraction (cleaning quotes)
const envPath = path.join(__dirname, ".env");
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || "";
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      env[key] = value.trim();
    }
  });
}

const host = env.SMTP_HOST || "smtp.gmail.com";
const port = Number(env.SMTP_PORT || 587);
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
const secure = env.SMTP_SECURE === "true" || port === 465;

console.log("Testing SMTP Connection with settings:");
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`User: ${user}`);
console.log(`Secure: ${secure}`);

if (!user || !pass) {
  console.error("Error: SMTP_USER or SMTP_PASS not found in .env file.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user,
    pass,
  },
});

async function main() {
  try {
    console.log("Verifying connection to SMTP...");
    await transporter.verify();
    console.log("SMTP connection verified successfully!");

    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: user,
      to: "kaarekhairofficial@gmail.com",
      subject: "QEMS SMTP Test Email",
      text: "This is a test email from QEMS to verify SMTP configuration.",
      html: "<p>This is a <b>test email</b> from QEMS to verify SMTP configuration.</p>",
    });
    console.log("Test email sent successfully! Message ID:", info.messageId);
  } catch (err) {
    console.error("SMTP test failed:", err);
    process.exit(1);
  }
}

main();
