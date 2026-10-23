/**
 * ZxZ Mods - Global Company Configuration
 * Single source of truth for all contact details, addresses, warranties, and company info.
 * Synchronized dynamically with the Master backdoor settings (/api/sys/workshop & /api/location).
 */

export let GLOBAL_MASTER_PHONE = "+506 7033-2560";
export let GLOBAL_MASTER_WHATSAPP = "+50670332560";
export let GLOBAL_LEGAL_NAME = "Tecnicas de Redes Y Sistemas A&V";
export let GLOBAL_CEDULA_JURIDICA = "3-101-436132";

export function formatWhatsappDigits(rawPhone: string): string {
  const digits = String(rawPhone || GLOBAL_MASTER_PHONE).replace(/[^0-9]/g, "");
  if (!digits) return "50670332560";
  if (digits.length === 8) return `506${digits}`;
  return digits;
}

export const COMPANY_CONFIG = {
  name: "ZxZ Mods",
  legalName: GLOBAL_LEGAL_NAME,
  cedulaJuridica: GLOBAL_CEDULA_JURIDICA,
  tagline: {
    es: "Especialistas en CFMOTO, UTV & ATV Performance, Modificaciones e Importación en Costa Rica",
    en: "CFMOTO Specialists, UTV & ATV Performance, Modifications & US Imports in Costa Rica",
  },
  speciality: {
    brand: "CFMOTO",
    headlineEs: "Especialidad de la Casa: Plataforma CFMOTO ZForce, CForce & UForce",
    headlineEn: "Our Core Specialty: CFMOTO ZForce, CForce & UForce Platforms",
    descriptionEs: "Somos el centro de modificación técnica líder en Costa Rica para CFMOTO. Reprogramación de ECU, clutch kits optimizados, suspensión reforzada y accesorios de importación directa.",
    descriptionEn: "Costa Rica's premier CFMOTO technical modification center. Custom ECU remapping, tuned clutch kits, high-clearance suspension, and direct US-imported performance parts.",
  },

  // Contact Information (Synchronized with GLOBAL_MASTER_PHONE from Master Backdoor)
  contact: {
    phone: GLOBAL_MASTER_PHONE,
    phoneDisplay: GLOBAL_MASTER_PHONE,
    mobilePhone: GLOBAL_MASTER_PHONE,
    whatsapp: GLOBAL_MASTER_WHATSAPP,
    whatsappDigits: formatWhatsappDigits(GLOBAL_MASTER_WHATSAPP),
    whatsappDisplay: GLOBAL_MASTER_PHONE,
    email: "info@zxzmods.com",
    salesEmail: "ventas@zxzmods.com",
    quotesEmail: "cotizaciones@zxzmods.com",
    social: {
      facebook: "https://www.facebook.com/profile.php?id=61595486847238",
      instagram: "https://www.instagram.com/zxz.mods/?hl=en",
    },
  },

  // Physical Location & Direction (Easily editable global variables)
  location: {
    country: "Costa Rica",
    province: "San José",
    canton: "Santa Ana",
    district: "Pozos",
    address: "Calle 34, Pozos, Santa Ana, San José, Costa Rica",
    addressEs: "Calle 34, Pozos, Santa Ana, San José, Costa Rica",
    addressEn: "Calle 34, Pozos, Santa Ana, San Jose, Costa Rica",
    shortAddress: "Calle 34, Pozos, Santa Ana, Costa Rica",
    embedMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.8058!2d-84.1995461!3d9.9486399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8fa0f997866d0a41%3A0x91788b58125fbebd!2sZxZ%20Mods!5e0!3m2!1ses!2scr!4v1710000000000!5m2!1ses!2scr",
    googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.8058!2d-84.1995461!3d9.9486399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8fa0f997866d0a41%3A0x91788b58125fbebd!2sZxZ%20Mods!5e0!3m2!1ses!2scr!4v1710000000000!5m2!1ses!2scr",
    googleMapsUrl: "https://maps.app.goo.gl/CT6yAuDJ7m1sCP5g6",
    googleMapsLink: "https://maps.app.goo.gl/CT6yAuDJ7m1sCP5g6",
    wazeUrl: "https://waze.com/ul?ll=9.9486399,-84.1969712&navigate=yes",
    wazeLink: "https://waze.com/ul?ll=9.9486399,-84.1969712&navigate=yes",
    latitude: 9.9486399,
    longitude: -84.1969712,
  },

  // Operating Hours
  hours: {
    es: "8:00 AM - 8:00 PM",
    en: "8:00 AM - 8:00 PM",
    scheduleLines: [
      { daysEs: "Lunes a Sábado", daysEn: "Monday to Saturday", time: "8:00 AM - 8:00 PM" },
      { daysEs: "Domingos", daysEn: "Sundays", time: "Cerrado (Atención WhatsApp)" },
    ],
  },
  businessHours: {
    weekdays: "8:00 AM - 8:00 PM",
    saturday: "8:00 AM - 8:00 PM",
    sunday: "Cerrado (Atención WhatsApp)",
  },

  // Warranties (Updated Mechanical to 60 Days per user instruction)
  warranties: {
    boltOnElectrical: {
      days: 90,
      titleEs: "Bolt-On & Eléctrico",
      titleEn: "Bolt-On & Electrical",
      termEs: "90 Días de Garantía de Mano de Obra",
      termEn: "90 Days Labor Warranty",
      coverageEs: "Iluminación LED, winches, defensas, arneses eléctricos y accesorios de acople directo.",
      coverageEn: "LED lighting, winches, bumpers, electrical wiring harnesses, and bolt-on accessories.",
    },
    mechanicalDrivetrain: {
      days: 60, // Changed from 30 to 60 days
      titleEs: "Mecánica & Drivetrain",
      titleEn: "Mechanical & Drivetrain",
      termEs: "60 Días de Garantía de Mano de Obra",
      termEn: "60 Days Labor Warranty",
      coverageEs: "Sistemas de embrague (clutch), fajas reforzadas, brazos de suspensión, ejes y transmisión.",
      coverageEn: "Clutch systems, heavy-duty belts, suspension control arms, axles, and drivetrain components.",
    },
    ecuTuning: {
      days: -1, // Lifetime
      titleEs: "Reprogramación ECU",
      titleEn: "ECU Tuning & Remaps",
      termEs: "Archivo de por Vida (Lifetime File)",
      termEn: "Lifetime File Warranty",
      coverageEs: "Garantía de software y calibración de por vida. Cero cobertura de motor físico.",
      coverageEn: "Lifetime software file guarantee. Zero engine mechanical coverage.",
    },
    productWarranty: {
      titleEs: "Garantía Original de Fábrica",
      titleEn: "Factory Manufacturer Warranty",
      termEs: "Garantía Oficial de Marca",
      termEn: "Official Brand Warranty",
      coverageEs: "Tramitamos directamente el respaldo del fabricante en EE.UU. para cada pieza vendida.",
      coverageEn: "We directly process original US manufacturer warranty claims for every part sold.",
    },
    partsOriginal: {
      titleEs: "Garantía Original de Fábrica",
      titleEn: "Factory Manufacturer Warranty",
      termEs: "Garantía Oficial de Marca",
      termEn: "Official Brand Warranty",
      coverageEs: "Tramitamos directamente el respaldo del fabricante en EE.UU. para cada pieza vendida.",
      coverageEn: "We directly process original US manufacturer warranty claims for every part sold.",
    },
    installationVolumeDiscount: {
      thresholdItems: 5,
      discountPercent: 5,
      descriptionEs: "Al instalar 5 o más productos en tu orden, obtienes 5% de descuento directo en el costo de mano de obra.",
      descriptionEn: "When selecting installation for 5 or more products in your order, you receive a 5% discount strictly on labor costs.",
    },
  },
};

/**
 * Synchronize the global phone and WhatsApp variables at runtime when fetched from DB
 * or updated by Master in the backdoor.
 */
export function setGlobalMasterPhone(
  newPhone?: string | null,
  newWhatsapp?: string | null,
  addressEs?: string | null,
  addressEn?: string | null,
  legalName?: string | null,
  cedulaJuridica?: string | null
) {
  const cleanPhone = String(newPhone || GLOBAL_MASTER_PHONE).trim();
  if (cleanPhone) {
    GLOBAL_MASTER_PHONE = cleanPhone;
  }

  // Synchronize WhatsApp to the phone number set by Master (or explicit whatsapp if provided)
  const rawWhatsapp = String(newWhatsapp || cleanPhone || GLOBAL_MASTER_WHATSAPP).trim();
  const waDigits = formatWhatsappDigits(rawWhatsapp);
  GLOBAL_MASTER_WHATSAPP = `+${waDigits}`;

  if (legalName && String(legalName).trim()) {
    GLOBAL_LEGAL_NAME = String(legalName).trim();
    COMPANY_CONFIG.legalName = GLOBAL_LEGAL_NAME;
  }
  if (cedulaJuridica !== undefined && cedulaJuridica !== null) {
    GLOBAL_CEDULA_JURIDICA = String(cedulaJuridica).trim();
    COMPANY_CONFIG.cedulaJuridica = GLOBAL_CEDULA_JURIDICA;
  }

  COMPANY_CONFIG.contact.phone = GLOBAL_MASTER_PHONE;
  COMPANY_CONFIG.contact.phoneDisplay = GLOBAL_MASTER_PHONE;
  COMPANY_CONFIG.contact.mobilePhone = GLOBAL_MASTER_PHONE;
  COMPANY_CONFIG.contact.whatsapp = GLOBAL_MASTER_WHATSAPP;
  COMPANY_CONFIG.contact.whatsappDigits = waDigits;
  COMPANY_CONFIG.contact.whatsappDisplay = GLOBAL_MASTER_PHONE;

  if (addressEs && String(addressEs).trim()) {
    COMPANY_CONFIG.location.address = String(addressEs).trim();
    COMPANY_CONFIG.location.addressEs = String(addressEs).trim();
    COMPANY_CONFIG.location.shortAddress = String(addressEs).trim();
  }
  if (addressEn && String(addressEn).trim()) {
    COMPANY_CONFIG.location.addressEn = String(addressEn).trim();
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("zxz-company-config-updated", {
        detail: {
          phone: GLOBAL_MASTER_PHONE,
          whatsapp: GLOBAL_MASTER_WHATSAPP,
          whatsappDigits: waDigits,
          whatsappDisplay: GLOBAL_MASTER_PHONE,
          legalName: GLOBAL_LEGAL_NAME,
          cedulaJuridica: GLOBAL_CEDULA_JURIDICA,
        },
      })
    );
  }
}

/**
 * Generates an official WhatsApp wa.me URL using the live global number set by Master.
 */
export function getWhatsAppUrl(message?: string, customPhone?: string): string {
  const digits = formatWhatsappDigits(
    customPhone || COMPANY_CONFIG.contact.whatsapp || GLOBAL_MASTER_PHONE
  );
  if (message && message.trim().length > 0) {
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${digits}`;
}

/**
 * Generates a tel: URL using the live global phone number set by Master.
 */
export function getTelUrl(customPhone?: string): string {
  const raw = customPhone || COMPANY_CONFIG.contact.phone || GLOBAL_MASTER_PHONE;
  return `tel:${String(raw).replace(/[^0-9+]/g, "")}`;
}

