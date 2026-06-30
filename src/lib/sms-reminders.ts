import { prisma } from "@/lib/prisma";

export type SmsResult = {
  sent: boolean;
  channel: "sms" | "whatsapp";
  reason?: string;
};

async function dispatchMessage(phone: string, message: string, channel: "sms" | "whatsapp"): Promise<SmsResult> {
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return { sent: false, channel, reason: "invalid_phone" };

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom =
    channel === "whatsapp"
      ? process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"
      : process.env.TWILIO_SMS_FROM;

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const to =
        channel === "whatsapp"
          ? normalized.startsWith("whatsapp:")
            ? normalized
            : `whatsapp:+${normalized.replace(/^0/, "92")}`
          : `+${normalized.replace(/^0/, "92")}`;

      const body = new URLSearchParams({
        To: to,
        From: twilioFrom,
        Body: message.slice(0, 1600),
      });

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }
      );

      if (res.ok) return { sent: true, channel };
      const err = await res.text();
      console.error(`[${channel.toUpperCase()}] Twilio error:`, err);
      return { sent: false, channel, reason: "provider_error" };
    } catch (error) {
      console.error(`[${channel.toUpperCase()}] send failed:`, error);
      return { sent: false, channel, reason: "network_error" };
    }
  }

  if (process.env.SMS_API_URL && process.env.SMS_API_KEY && channel === "sms") {
    try {
      const res = await fetch(process.env.SMS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SMS_API_KEY}`,
        },
        body: JSON.stringify({ to: normalized, message }),
      });
      if (res.ok) return { sent: true, channel };
    } catch (error) {
      console.error("[SMS] custom API failed:", error);
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[${channel.toUpperCase()} stub] → ${phone}: ${message}`);
  }
  return { sent: false, channel, reason: "not_configured" };
}

export async function sendSmsToUser(userId: string, message: string): Promise<SmsResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  if (!user?.phone) return { sent: false, channel: "sms", reason: "no_phone" };
  return dispatchMessage(user.phone, message, "sms");
}

export async function sendWhatsAppToUser(userId: string, message: string): Promise<SmsResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  if (!user?.phone) return { sent: false, channel: "whatsapp", reason: "no_phone" };
  return dispatchMessage(user.phone, message, "whatsapp");
}
