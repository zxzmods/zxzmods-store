import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { getTransporter, sendEmailSafely, resetTransporterCache } from "@/lib/email";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || "";
  const rawPass = process.env.SMTP_PASS || "";
  const isConfigured = Boolean(host && user && rawPass);

  if (!isConfigured) {
    return NextResponse.json({
      success: true,
      configured: false,
      host,
      port,
      user,
      verified: false,
      status: "NOT_CONFIGURED",
      message: "SMTP no está completamente configurado en .env",
    });
  }

  // Force clean check
  resetTransporterCache();
  const transporter = await getTransporter();

  try {
    await transporter.verify();
    return NextResponse.json({
      success: true,
      configured: true,
      host,
      port,
      user,
      verified: true,
      status: "CONNECTED",
      message: "Conexión SMTP verificada y autenticada exitosamente",
    });
  } catch (error: any) {
    const errorMsg = String(error?.message || error || "");
    const isAppPasswordRequired =
      error?.code === "EAUTH" ||
      errorMsg.includes("Application-specific password") ||
      errorMsg.includes("Invalid login");

    return NextResponse.json({
      success: true,
      configured: true,
      host,
      port,
      user,
      verified: false,
      status: isAppPasswordRequired ? "APP_PASSWORD_REQUIRED" : "CONNECTION_FAILED",
      requiresAppPassword: isAppPasswordRequired,
      error: errorMsg,
      remediationUrl: "https://myaccount.google.com/apppasswords",
      message: isAppPasswordRequired
        ? "Google Workspace requiere una Contraseña de Aplicación de 16 caracteres. Genera una en https://myaccount.google.com/apppasswords e ingrésala en SMTP_PASS."
        : `Error de conexión SMTP: ${errorMsg}`,
    });
  }
}

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const targetEmail = (body.to || auth.session.email || "santi2106sandoval@gmail.com").trim();

    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Dirección de correo destino inválida" },
        { status: 400 }
      );
    }

    const testType = body.testType || "TEST";
    const smtpFrom = process.env.SMTP_FROM_SALES || '"ZxZ Mods Costa Rica" <ventas@zxzmods.com>';

    let subject = `[ZxZ Mods] Prueba de Diagnóstico de Correo Saliente`;
    let html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background:#f4f5f7; padding:20px; color:#111827;">
        <div style="max-width:540px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid #e5e7eb; padding:28px;">
          <h1 style="color:#C02030; font-size:18px; margin:0 0 12px 0;">ZxZ Mods Costa Rica • Diagnóstico SMTP</h1>
          <p style="font-size:13px; line-height:1.5; color:#374151;">
            Este es un correo de prueba enviado desde <strong>${smtpFrom}</strong> hacia <strong>${targetEmail}</strong> para validar el pipeline de despacho del sistema.
          </p>
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px 16px; margin:18px 0; font-size:12px; color:#166534;">
            ✓ El servidor SMTP ${process.env.SMTP_HOST} autenticó correctamente el remitente.
          </div>
          <p style="font-size:11px; color:#9ca3af; margin:0;">
            Hora de prueba: ${new Date().toISOString()} • Remitente: ${process.env.SMTP_USER}
          </p>
        </div>
      </body>
      </html>
    `;

    if (testType === "REJECTION") {
      subject = `Atención: Comprobante de Pago Rechazado - Pedido de Prueba #ZXZ-TEST`;
      html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background:#f4f5f7; padding:20px; color:#111827;">
          <div style="max-width:540px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid #e5e7eb; padding:28px;">
            <div style="display:inline-block; font-size:11px; font-weight:700; color:#9f1239; background:#fff1f2; border:1px solid #fecdd3; padding:2px 8px; border-radius:4px; margin-bottom:12px;">
              ● ACCIÓN REQUERIDA: PAGO RECHAZADO
            </div>
            <h1 style="color:#111827; font-size:18px; margin:0 0 12px 0;">Tu Comprobante no Pudo ser Validado</h1>
            <p style="font-size:13px; line-height:1.5; color:#374151;">
              Revisamos el comprobante de pago adjunto a tu pedido de prueba, pero no fue posible validar los fondos bancarios correspondientes.
            </p>
            <div style="background:#fff1f2; border:2px dashed #f43f5e; border-radius:8px; padding:12px 16px; margin:18px 0; font-size:12px; color:#881337;">
              <strong>Motivo:</strong> Prueba de diagnóstico de notificación de rechazo de pago enviada a ${targetEmail}.
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const result = await sendEmailSafely({
      from: smtpFrom,
      to: targetEmail,
      subject,
      html,
    });

    return NextResponse.json({
      success: result.success,
      targetEmail,
      authError: result.authError,
      requiresAppPassword: result.authError,
      error: result.error,
      previewUrl: result.previewUrl,
      message: result.success
        ? `Correo de prueba enviado con éxito a ${targetEmail}`
        : result.authError
        ? "Google Workspace rechazó la contraseña: se requiere Contraseña de Aplicación de 16 caracteres."
        : `Fallo al enviar correo: ${result.error}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Error al procesar prueba de correo" },
      { status: 500 }
    );
  }
}
