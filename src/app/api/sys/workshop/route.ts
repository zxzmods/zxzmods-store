import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import {
  GLOBAL_MASTER_PHONE,
  GLOBAL_MASTER_WHATSAPP,
  formatWhatsappDigits,
  setGlobalMasterPhone,
} from "@/config/company";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const workshop = await prisma.workshopInfo.findUnique({
      where: { id: "zxz-hq" },
    });

    if (!workshop) {
      return NextResponse.json(
        { success: false, error: "Workshop info not found" },
        { status: 404 }
      );
    }

    setGlobalMasterPhone(
      workshop.phone,
      workshop.whatsapp,
      workshop.addressEs,
      workshop.addressEn,
      workshop.legalName,
      workshop.cedulaJuridica
    );

    return NextResponse.json({
      success: true,
      data: workshop,
    });
  } catch (error) {
    console.error("[SYS_WORKSHOP_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load workshop data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      phone,
      whatsapp,
      legalName,
      cedulaJuridica,
      addressEs,
      addressEn,
      hoursText,
      googleMapsEmbedUrl,
      googleMapsLink,
      latitude,
      longitude,
    } = body;

    const dataToUpdate: any = {};

    if (phone !== undefined) {
      const cleanPhone = String(phone).trim();
      dataToUpdate.phone = cleanPhone;
      // Synchronize whatsapp to the global phone number unless an explicit different whatsapp was provided
      const rawWa = whatsapp !== undefined && String(whatsapp).trim() ? String(whatsapp).trim() : cleanPhone;
      dataToUpdate.whatsapp = `+${formatWhatsappDigits(rawWa)}`;
    } else if (whatsapp !== undefined) {
      dataToUpdate.whatsapp = `+${formatWhatsappDigits(String(whatsapp).trim())}`;
    }
    if (legalName !== undefined) {
      dataToUpdate.legalName = String(legalName).trim();
    }
    if (cedulaJuridica !== undefined) {
      dataToUpdate.cedulaJuridica = String(cedulaJuridica).trim();
    }
    if (addressEs !== undefined) {
      dataToUpdate.addressEs = String(addressEs).trim();
    }
    if (addressEn !== undefined) {
      dataToUpdate.addressEn = String(addressEn).trim();
    }
    if (hoursText !== undefined) {
      const cleanHours = String(hoursText).trim();
      dataToUpdate.hoursJson = JSON.stringify({
        es: cleanHours,
        en: cleanHours,
      });
    }
    if (googleMapsEmbedUrl !== undefined) {
      dataToUpdate.googleMapsEmbedUrl = String(googleMapsEmbedUrl).trim();
    }
    if (googleMapsLink !== undefined) {
      dataToUpdate.googleMapsLink = String(googleMapsLink).trim();
    }
    if (latitude !== undefined && !isNaN(Number(latitude))) {
      dataToUpdate.latitude = Number(latitude);
    }
    if (longitude !== undefined && !isNaN(Number(longitude))) {
      dataToUpdate.longitude = Number(longitude);
    }

    const updated = await prisma.workshopInfo.upsert({
      where: { id: "zxz-hq" },
      update: dataToUpdate,
      create: {
        id: "zxz-hq",
        name: "ZxZ Mods Performance Center & Workshop",
        legalName: dataToUpdate.legalName || "ZxZ Mods Costa Rica S.A.",
        cedulaJuridica: dataToUpdate.cedulaJuridica || "",
        taglineEs: "Especialistas en CFMOTO, UTV & ATV Performance, Modificaciones e Importación en Costa Rica",
        taglineEn: "Specialists in CFMOTO, UTV & ATV Performance, Modifications & US Imports in Costa Rica",
        addressEs: dataToUpdate.addressEs || "Calle 34, Pozos, Santa Ana, San José, Costa Rica",
        addressEn: dataToUpdate.addressEn || "Calle 34, Pozos, Santa Ana, San Jose, Costa Rica",
        province: "San José",
        phone: dataToUpdate.phone || GLOBAL_MASTER_PHONE,
        whatsapp: dataToUpdate.whatsapp || GLOBAL_MASTER_WHATSAPP,
        googleMapsEmbedUrl: dataToUpdate.googleMapsEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.8058!2d-84.1995461!3d9.9486399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8fa0f997866d0a41%3A0x91788b58125fbebd!2sZxZ%20Mods!5e0!3m2!1ses!2scr!4v1710000000000!5m2!1ses!2scr",
        googleMapsLink: dataToUpdate.googleMapsLink || "https://maps.app.goo.gl/CT6yAuDJ7m1sCP5g6",
        hoursJson: dataToUpdate.hoursJson || JSON.stringify({ es: "8:00 AM - 8:00 PM", en: "8:00 AM - 8:00 PM" }),
        latitude: dataToUpdate.latitude || 9.9486399,
        longitude: dataToUpdate.longitude || -84.1969712,
      },
    });

    // Synchronize in-memory global variables
    setGlobalMasterPhone(
      updated.phone,
      updated.whatsapp,
      updated.addressEs,
      updated.addressEn,
      updated.legalName,
      updated.cedulaJuridica
    );

    // Also keep GLOBAL_MASTER_PHONE and GLOBAL_MASTER_WHATSAPP in src/config/company.ts synced (local dev only)
    if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
      try {
        const companyConfigPath = path.join(process.cwd(), "src", "config", "company.ts");
        if (fs.existsSync(companyConfigPath)) {
          let content = fs.readFileSync(companyConfigPath, "utf8");
          content = content.replace(
            /export let GLOBAL_MASTER_PHONE = "[^"]*";/,
            `export let GLOBAL_MASTER_PHONE = ${JSON.stringify(updated.phone)};`
          );
          content = content.replace(
            /export let GLOBAL_MASTER_WHATSAPP = "[^"]*";/,
            `export let GLOBAL_MASTER_WHATSAPP = ${JSON.stringify(updated.whatsapp)};`
          );
          if (updated.legalName) {
            content = content.replace(
              /export let GLOBAL_LEGAL_NAME = "[^"]*";/,
              `export let GLOBAL_LEGAL_NAME = ${JSON.stringify(updated.legalName)};`
            );
          }
          if (updated.cedulaJuridica !== undefined && updated.cedulaJuridica !== null) {
            content = content.replace(
              /export let GLOBAL_CEDULA_JURIDICA = "[^"]*";/,
              `export let GLOBAL_CEDULA_JURIDICA = ${JSON.stringify(updated.cedulaJuridica)};`
            );
          }
          fs.writeFileSync(companyConfigPath, content, "utf8");
        }
      } catch (syncErr) {
        console.warn("Could not write updated global phone to company.ts:", syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("[SYS_WORKSHOP_PUT_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update workshop info" },
      { status: 500 }
    );
  }
}

