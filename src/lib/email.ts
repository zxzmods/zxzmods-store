import nodemailer, { type Transporter, type SendMailOptions } from "nodemailer";
import { generateReceiptHtml, ReceiptPaymentType } from "@/lib/orderReceipt";

interface SendVerificationEmailParams {
  to: string;
  code: string;
  lang?: "es" | "en";
}

export interface SendOrderReceiptEmailParams {
  to: string;
  order: any;
  lang?: "es" | "en";
  receiptType?: ReceiptPaymentType;
}

// Global cached transporter
let cachedTransporter: Transporter | null = null;

// Daily dispatch ceiling (max 300 emails per 24h rolling window)
const MAX_DAILY_EMAILS = 300;
let dailyEmailCount = 0;
let dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;

export function checkDailyLimit(recipient?: string): boolean {
  const now = Date.now();
  if (now > dailyResetAt) {
    dailyEmailCount = 0;
    dailyResetAt = now + 24 * 60 * 60 * 1000;
  }
  if (dailyEmailCount >= MAX_DAILY_EMAILS) {
    console.warn(
      `[EMAIL_SPEND_ALERT]: Daily email limit reached (${dailyEmailCount}/${MAX_DAILY_EMAILS}). Suppressing dispatch to ${recipient || "recipient"}.`
    );
    return false;
  }
  return true;
}

export function incrementDailyCount() {
  dailyEmailCount++;
}

export function resetTransporterCache() {
  cachedTransporter = null;
}

export async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  // Clean password: strip accidental internal spaces from Google App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const rawPass = process.env.SMTP_PASS || "";
  const smtpPass = rawPass.replace(/\s+/g, "").trim();

  if (smtpHost && smtpUser && smtpPass) {
    cachedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount().catch(() => null);
    if (testAccount) {
      cachedTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      cachedTransporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return cachedTransporter;
}

/**
 * Sends email safely, catching Google Workspace auth errors and logging actionable remediation.
 */
export async function sendEmailSafely(mailOptions: SendMailOptions): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  authError?: boolean;
}> {
  const primaryTransporter = await getTransporter();

  try {
    const info = await primaryTransporter.sendMail(mailOptions);
    incrementDailyCount();
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL_DISPATCH_SUCCESS]: To=${mailOptions.to} Preview: ${previewUrl}`);
    } else {
      console.log(`[EMAIL_DISPATCH_SUCCESS]: To=${mailOptions.to} MessageId=${info.messageId}`);
    }
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || undefined };
  } catch (error: any) {
    const errorMsg = String(error?.message || error || "");
    const isAuthErr = error?.code === "EAUTH" || errorMsg.includes("Application-specific password") || errorMsg.includes("Invalid login");

    if (isAuthErr) {
      console.error(
        `\n============================================================\n` +
        `[CRITICAL SMTP AUTH FAILURE]\n` +
        `Google Workspace rejected login for "${process.env.SMTP_USER}".\n` +
        `REASON: Application-specific password required by Google.\n` +
        `ACTION: Generate a 16-character App Password at:\n` +
        `https://myaccount.google.com/apppasswords\n` +
        `and set SMTP_PASS="your16charcode" in your .env file.\n` +
        `============================================================\n`
      );
    } else {
      console.error(`[EMAIL_SEND_ERROR]: Failed to dispatch to ${mailOptions.to}:`, errorMsg);
    }

    // In non-production, generate fallback ethereal preview so developers can inspect email rendering
    if (process.env.NODE_ENV !== "production") {
      try {
        console.warn(`[EMAIL_DEV_FALLBACK]: Dispatching to ethereal test transport for inspection...`);
        const testAccount = await nodemailer.createTestAccount();
        const fallbackTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
        const fallbackPreview = nodemailer.getTestMessageUrl(fallbackInfo);
        console.log(`[EMAIL_FALLBACK_PREVIEW]: ${fallbackPreview}`);
        return {
          success: false,
          authError: isAuthErr,
          error: isAuthErr ? "Google Workspace App Password required" : errorMsg,
          previewUrl: fallbackPreview || undefined,
        };
      } catch {}
    }

    return {
      success: false,
      authError: isAuthErr,
      error: isAuthErr ? "Google Workspace App Password required" : errorMsg,
    };
  }
}

export async function sendVerificationEmail({ to, code, lang = "es" }: SendVerificationEmailParams) {
  if (!checkDailyLimit(to)) {
    throw new Error("Límite diario de envío de correos alcanzado por seguridad");
  }

  const isEs = lang === "es";
  const smtpFrom = process.env.SMTP_FROM || '"ZxZ Mods Costa Rica" <ventas@zxzmods.com>';

  const subject = isEs
    ? `Tu código de verificación de ZxZ Mods: ${code}`
    : `Your ZxZ Mods verification code: ${code}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 20px; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: #111827; padding: 28px 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; }
        .header span { color: #C02030; }
        .content { padding: 36px 32px; text-align: center; }
        .title { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 12px; }
        .text { font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
        .code-box { background: #fef2f2; border: 2px dashed #C02030; border-radius: 12px; padding: 20px; margin: 24px 0; display: inline-block; }
        .code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #C02030; margin: 0; }
        .expiry { font-size: 12px; color: #9ca3af; margin-top: 16px; }
        .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ZXZ <span>MODS</span> COSTA RICA</h1>
        </div>
        <div class="content">
          <div class="title">${isEs ? "Código de Verificación" : "Verification Code"}</div>
          <p class="text">
            ${isEs 
              ? "Usa este código de 6 dígitos para iniciar sesión de forma segura y acceder a tu Garaje, pedidos y cotizaciones:" 
              : "Use this 6-digit code to securely sign in and access your Garage, orders, and quotations:"}
          </p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p class="expiry">
            ${isEs ? "Válido durante los próximos 10 minutos." : "Valid for the next 10 minutes."}
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ZxZ Mods Costa Rica • Centro de Alto Rendimiento Powersports</p>
          <p>${isEs ? "Si no solicitaste este código, puedes ignorar este mensaje con seguridad." : "If you did not request this code, you can safely ignore this email."}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailSafely({
    from: smtpFrom,
    to,
    subject,
    html,
  });
}

export async function sendOrderReceiptEmail({
  to,
  order,
  lang = "es",
  receiptType = "ORDER",
}: SendOrderReceiptEmailParams) {
  if (!checkDailyLimit(to)) {
    return { success: false, error: "Límite diario de envío alcanzado" };
  }

  if (!to || !to.includes("@")) {
    console.warn("[RECEIPT_EMAIL_SKIP]: Invalid or missing recipient email address:", to);
    return { success: false, error: "Invalid recipient email" };
  }

  const isEs = lang === "es";
  const smtpFrom = process.env.SMTP_FROM_SALES || '"ZxZ Mods Costa Rica" <ventas@zxzmods.com>';

  // Ensure latest legal name and cedula juridica from DB
  try {
    const { prisma } = await import("@/lib/prisma");
    const { COMPANY_CONFIG } = await import("@/config/company");
    const workshop = await prisma.workshopInfo.findUnique({
      where: { id: "zxz-hq" },
    });
    if (workshop) {
      if (workshop.legalName) COMPANY_CONFIG.legalName = workshop.legalName;
      if (workshop.cedulaJuridica !== undefined && workshop.cedulaJuridica !== null) {
        COMPANY_CONFIG.cedulaJuridica = workshop.cedulaJuridica;
      }
      if (workshop.phone) COMPANY_CONFIG.contact.phone = workshop.phone;
      if (workshop.whatsapp) COMPANY_CONFIG.contact.whatsapp = workshop.whatsapp;
    }
  } catch {}

  let subject = "";
  if (receiptType === "INSTALLATION") {
    subject = isEs
      ? `Comprobante de Instalación ZxZ Mods #${order.orderNumber}`
      : `ZxZ Mods Installation & Labor Receipt #${order.orderNumber}`;
  } else if (receiptType === "SERVICE") {
    subject = isEs
      ? `Comprobante de Servicio de Transporte ZxZ Mods #${order.orderNumber}`
      : `ZxZ Mods Transport Service Receipt #${order.orderNumber}`;
  } else if (receiptType === "COMPLETE") {
    subject = isEs
      ? `Comprobante Consolidado de Pago ZxZ Mods #${order.orderNumber}`
      : `ZxZ Mods Consolidated Payment Receipt #${order.orderNumber}`;
  } else {
    subject = isEs
      ? `Comprobante de Compra ZxZ Mods #${order.orderNumber}`
      : `ZxZ Mods Purchase Receipt #${order.orderNumber}`;
  }

  const html = generateReceiptHtml(order, lang, { isEmail: true, receiptType });

  return sendEmailSafely({
    from: smtpFrom,
    to,
    subject,
    html,
  });
}

export * from "./orderStepEmails";
