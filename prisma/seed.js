const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ZxZ Mods database with CFMOTO focus and updated warranty terms...");

  // Clean existing
  await prisma.productCompatibility.deleteMany();
  await prisma.product.deleteMany();
  await prisma.combo.deleteMany();
  await prisma.performancePackage.deleteMany();
  await prisma.vehicleModel.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.workshopInfo.deleteMany();
  await prisma.logisticsRateConfig.deleteMany();

  // Workshop Information
  await prisma.workshopInfo.create({
    data: {
      id: "zxz-hq",
      name: "ZxZ Mods Performance Center & Workshop",
      taglineEs: "Especialistas en CFMOTO, UTV & ATV Performance, Modificaciones e Importación en Costa Rica",
      taglineEn: "Specialists in CFMOTO, UTV & ATV Performance, Modifications & US Imports in Costa Rica",
      addressEs: "Calle 34, Pozos, Santa Ana, San José, Costa Rica",
      addressEn: "Calle 34, Pozos, Santa Ana, San Jose, Costa Rica",
      province: "San José",
      phone: "+506 2203-8900",
      whatsapp: "+50688889999",
      googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.8058!2d-84.1995461!3d9.9486399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8fa0f997866d0a41%3A0x91788b58125fbebd!2sZxZ%20Mods!5e0!3m2!1ses!2scr!4v1710000000000!5m2!1ses!2scr",
      googleMapsLink: "https://maps.app.goo.gl/CT6yAuDJ7m1sCP5g6",
      hoursJson: JSON.stringify({
        es: "8:00 AM - 8:00 PM",
        en: "8:00 AM - 8:00 PM"
      }),
      latitude: 9.9486399,
      longitude: -84.1969712
    }
  });

  // Default Logistics & Km Rates Configuration
  await prisma.logisticsRateConfig.create({
    data: {
      id: "rates-config",
      pickupRatePerKmCRC: 1500,
      deliveryRatePerKmCRC: 800,
      homeInstallationRatePerKmCRC: 2000,
      pickupBaseFeeCRC: 10000,
      deliveryBaseFeeCRC: 3000,
      homeInstallationBaseFeeCRC: 15000,
      garageAddress: "Calle 34, Pozos, Santa Ana, San José, Costa Rica",
      garageLatitude: 9.9486399,
      garageLongitude: -84.1969712
    }
  });

  // Brands - CFMOTO is #1 Speciality
  const cfmoto = await prisma.brand.create({
    data: {
      slug: "cfmoto",
      name: "CFMOTO",
      logoUrl: "/images/logos/cfmoto.png",
      descriptionEs: "Nuestra especialidad insignia. Centro técnico certificado en Costa Rica para potenciación, clutch y suspensión de la línea ZForce, CForce y UForce.",
      descriptionEn: "Our premier flagship specialty. Costa Rica's certified technical hub for tuning, clutches, and suspension on ZForce, CForce, and UForce lines.",
      featured: true,
      models: {
        create: [
          {
            slug: "zforce-z10",
            name: "ZForce Z10 / Z10-4",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2026, 2027]),
            imageUrl: "/images/sxs/z10_front.png"
          },
          {
            slug: "zforce-950-sport",
            name: "ZForce 950 Sport / Sport-4",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
          },
          {
            slug: "zforce-1000",
            name: "ZForce 1000 Sport R",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
          },
          {
            slug: "cforce-1000-overland",
            name: "CForce 1000 Overland",
            category: "ATV",
            yearsJson: JSON.stringify([2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1579273166152-d725a4e2b755?auto=format&fit=crop&w=800&q=80"
          },
          {
            slug: "uforce-1000-xl",
            name: "UForce 1000 / 1000 XL",
            category: "Utility UTV",
            yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
          }
        ]
      }
    }
  });

  const canAm = await prisma.brand.create({
    data: {
      slug: "can-am",
      name: "CAN-AM",
      logoUrl: "/images/logos/can-am.png",
      descriptionEs: "Líder mundial en potencia pura con las plataformas Maverick X3 Turbo RR, Maverick R y Defender HD10.",
      descriptionEn: "World leader in sheer horsepower with the Maverick X3 Turbo RR, Maverick R, and Defender HD10 platforms.",
      featured: true,
      models: {
        create: [
          {
            slug: "maverick-x3",
            name: "Maverick X3 Turbo RR (64\" / 72\")",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "/images/sxs/canam_x3_front.png"
          },
          {
            slug: "maverick-r",
            name: "Maverick R (DCT 240 HP)",
            category: "Hyper UTV",
            yearsJson: JSON.stringify([2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
          },
          {
            slug: "defender-hd10",
            name: "Defender HD10 / MAX Lone Star",
            category: "Utility UTV",
            yearsJson: JSON.stringify([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
          }
        ]
      }
    }
  });

  const polaris = await prisma.brand.create({
    data: {
      slug: "polaris",
      name: "Polaris",
      logoUrl: "/images/logos/polaris.png",
      descriptionEs: "Ingeniería de suspensión DYNAMIX DV y el motor ProStar Fury de 4 cilindros y 2.0 litros.",
      descriptionEn: "DYNAMIX DV suspension dynamics and the high-revving 2.0L 4-cylinder ProStar Fury engine.",
      featured: true,
      models: {
        create: [
          {
            slug: "rzr-pro-r",
            name: "RZR Pro R (2.0L 4-Cyl 225 HP)",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "/images/sxs/polaris_pror_front.png"
          },
          {
            slug: "rzr-turbo-r",
            name: "RZR Turbo R (74\" Stance)",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1579273166152-d725a4e2b755?auto=format&fit=crop&w=800&q=80"
          },
          {
            slug: "rzr-pro-xp",
            name: "RZR Pro XP Ultimate (64\")",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
          }
        ]
      }
    }
  });

  const honda = await prisma.brand.create({
    data: {
      slug: "honda",
      name: "Honda",
      logoUrl: "/images/logos/honda.png",
      descriptionEs: "Transmisión de doble embrague DCT (sin fajas) y suspensión FOX Live Valve inteligente.",
      descriptionEn: "Dual-Clutch Transmission (belt-free) with FOX Live Valve semi-active suspension.",
      featured: true,
      models: {
        create: [
          {
            slug: "talon-1000r",
            name: "Talon 1000R-4 FOX Live Valve",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "/images/sxs/honda_sxs.png"
          },
          {
            slug: "pioneer-1000-5",
            name: "Pioneer 1000-5 Deluxe",
            category: "Utility UTV",
            yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
          }
        ]
      }
    }
  });

  const yamaha = await prisma.brand.create({
    data: {
      slug: "yamaha",
      name: "Yamaha",
      logoUrl: "/images/logos/yamaha.png",
      descriptionEs: "Fiabilidad japonesa legendaria y cambios secuenciales por paletas en el YXZ1000R.",
      descriptionEn: "Legendary Japanese durability paired with pure paddle-shift sequential dynamics.",
      featured: true,
      models: {
        create: [
          {
            slug: "yxz1000r-ss",
            name: "YXZ1000R SS Paddle Shift",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "/images/sxs/yamaha_sxs.png"
          },
          {
            slug: "wolverine-rmax-1000",
            name: "Wolverine RMAX2 / RMAX4 1000",
            category: "Rec/Utility UTV",
            yearsJson: JSON.stringify([2021, 2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
          }
        ]
      }
    }
  });

  const segway = await prisma.brand.create({
    data: {
      slug: "segway",
      name: "Segway",
      logoUrl: "/images/logos/segway.png",
      descriptionEs: "Tecnología Smart Moving y chasis deportivo de alto desempeño en las plataformas Villain SX10 y Fugleman UT10.",
      descriptionEn: "Smart Moving powertrain technology and high-performance sport chassis on the Villain SX10 and Fugleman UT10 platforms.",
      featured: true,
      models: {
        create: [
          {
            slug: "villain-sx10",
            name: "Villain SX10 / SX10 W",
            category: "Sport UTV",
            yearsJson: JSON.stringify([2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "/images/sxs/segway_sxs.png"
          },
          {
            slug: "fugleman-ut10",
            name: "Fugleman UT10",
            category: "Utility UTV",
            yearsJson: JSON.stringify([2022, 2023, 2024, 2025, 2026, 2027]),
            imageUrl: "/images/sxs/segway_sxs.png"
          }
        ]
      }
    }
  });

  // Categories
  const catSuspension = await prisma.category.create({
    data: { slug: "suspension-brakes", nameEs: "Suspensión & Brazos", nameEn: "Suspension & Control Arms" }
  });
  const catClutch = await prisma.category.create({
    data: { slug: "clutch-belts", nameEs: "Clutch & Fajas Reforzadas", nameEn: "Clutching & Heavy-Duty Belts" }
  });
  const catLighting = await prisma.category.create({
    data: { slug: "lighting-electrical", nameEs: "Iluminación LED & Eléctrico", nameEn: "LED Lighting & Electrical" }
  });
  const catProtection = await prisma.category.create({
    data: { slug: "protection-cages", nameEs: "Protección & Cages", nameEn: "Protection, Cages & Bumpers" }
  });
  const catPerformance = await prisma.category.create({
    data: { slug: "exhaust-tuning", nameEs: "Escapes & Reprogramaciones ECU", nameEn: "Exhaust & ECU Remapping" }
  });

  // Combos
  await prisma.combo.create({
    data: {
      slug: "combo-rendimiento-clutch-faja-hd",
      category: "performance",
      titleEs: "Combo Rendimiento: Clutch Stage 1 + Faja Carbono",
      titleEn: "Performance Combo: Stage 1 Clutch + Carbon Belt",
      badgeEs: "Potencia & Respuesta",
      badgeEn: "Power & Throttle Response",
      descriptionEs: "Calibración completa de transmisión CVT para aceleración explosiva y protección térmica en rutas duras.",
      descriptionEn: "Complete CVT transmission calibration for explosive acceleration and thermal protection on hard trails.",
      priceCRC: 485000,
      originalPriceCRC: 540000,
      installationPriceCRC: 45000,
      discountPercent: 10,
      imageUrl: "/images/sxs/z10_front.png",
      itemsJson: JSON.stringify([
        "Kit de pesas y resortes de clutch calibrados",
        "Faja de transmisión reforzada en fibra de carbono",
        "Limpieza y calibración dinámica de poleas"
      ]),
      featured: true,
      homeInstallationAvailable: true
    }
  });

  await prisma.combo.create({
    data: {
      slug: "combo-aros-beadlock-llantas-32",
      category: "rings",
      titleEs: "Combo Aros Beadlock 15\" + Llantas Tensor 32\"",
      titleEn: "15\" Beadlock Wheels + Tensor 32\" Tires Combo",
      badgeEs: "Tracción & Durabilidad",
      badgeEn: "Traction & Durability",
      descriptionEs: "Juego de 4 aros beadlock forjados con llantas todoterreno de 8 lonas resistentes a ponchaduras.",
      descriptionEn: "Set of 4 forged beadlock wheels mounted on puncture-resistant 8-ply all-terrain tires.",
      priceCRC: 1450000,
      originalPriceCRC: 1650000,
      installationPriceCRC: 45000,
      discountPercent: 12,
      imageUrl: "/images/sxs/canam_x3_front.png",
      itemsJson: JSON.stringify([
        "4x Aros Beadlock 15x7 de alta resistencia",
        "4x Llantas 32x10R15 8 capas",
        "16x Tuercas reforzadas cromo-molibdeno",
        "Montaje, sellado y torqueo de aros"
      ]),
      featured: true,
      homeInstallationAvailable: true
    }
  });

  await prisma.combo.create({
    data: {
      slug: "combo-iluminacion-barra-led-curva-40",
      category: "lights",
      titleEs: "Combo Iluminación: Barra LED Curva 40\" + Arnés HD",
      titleEn: "Lighting Combo: 40\" Curved LED Light Bar + HD Harness",
      badgeEs: "Visión Nocturna Extrema",
      badgeEn: "Extreme Night Vision",
      descriptionEs: "Sistema de iluminación de largo alcance para noche con brackets antivibración para jaula roll-cage.",
      descriptionEn: "Long-range night lighting system with anti-vibration brackets designed for roll cages.",
      priceCRC: 420000,
      originalPriceCRC: 480000,
      installationPriceCRC: 35000,
      discountPercent: 12,
      imageUrl: "/images/sxs/polaris_pror_front.png",
      itemsJson: JSON.stringify([
        "Barra LED curva de 40\" de alta penetración",
        "Brackets CNC de aluminio para jaula",
        "Arnés con relevador sellado y switch impermeable"
      ]),
      featured: true,
      homeInstallationAvailable: true
    }
  });

  // Performance Packages (With updated 60 days mechanical warranty)
  await prisma.performancePackage.create({
    data: {
      slug: "stage-1-cfmoto-clutch-cooling",
      stageNumber: 1,
      titleEs: "Stage 1 CFMOTO: Optimización de Clutch & Faja HD",
      titleEn: "Stage 1 CFMOTO: Tuned Clutch & Heavy-Duty Belt",
      targetVehicleEs: "CFMOTO ZForce 950 / 1000 / CForce 1000",
      targetVehicleEn: "CFMOTO ZForce 950 / 1000 / CForce 1000",
      hpGain: "+12 HP",
      torqueGain: "+14 lb-ft",
      priceCRC: 460000,
      installationPriceCRC: 50000,
      includesDyno: false,
      includesWarranty: true,
      featuresJson: JSON.stringify([
        "Kit de Pesas y Resortes de Clutch Especializado CFMOTO",
        "Faja Reforzada de Compuesto de Carbono G-Boost Bad Ass",
        "Alineación y Calibración Dinámica en Banco de Taller ZxZ",
        "Garantía Mecánica: 60 Días de Mano de Obra en Taller ZxZ"
      ]),
      featured: true
    }
  });

  await prisma.performancePackage.create({
    data: {
      slug: "stage-2-power-clutch-tune",
      stageNumber: 2,
      titleEs: "Stage 2: Repro ECU DynoJet + Escape + Clutch",
      titleEn: "Stage 2: DynoJet ECU Flash + Exhaust + Clutch Kit",
      targetVehicleEs: "CFMOTO ZForce 950 / Can-Am Maverick X3 / RZR Turbo",
      targetVehicleEn: "CFMOTO ZForce 950 / Can-Am Maverick X3 / RZR Turbo",
      hpGain: "+38 HP",
      torqueGain: "+32 lb-ft",
      priceCRC: 1150000,
      installationPriceCRC: 85000,
      includesDyno: true,
      includesWarranty: true,
      featuresJson: JSON.stringify([
        "Reprogramación DynoJet / Whalen Speed ECU Flash",
        "Escape Inoxidable MBRP / Trinity Racing con Supresor de Chispa",
        "Kit de Clutch Secundario y Primario Ajustable",
        "Garantía de Archivo ECU de por Vida (Lifetime File)",
        "Garantía Mecánica: 60 Días de Mano de Obra en Taller ZxZ"
      ]),
      featured: true
    }
  });

  await prisma.performancePackage.create({
    data: {
      slug: "stage-3-monster-race-dunes",
      stageNumber: 3,
      titleEs: "Stage 3: Competición Extrema & Big Turbo",
      titleEn: "Stage 3: Extreme Competition & Big Turbo",
      targetVehicleEs: "Can-Am Maverick X3 / Maverick R / RZR Pro R",
      targetVehicleEn: "Can-Am Maverick X3 / Maverick R / RZR Pro R",
      hpGain: "+85 HP",
      torqueGain: "+65 lb-ft",
      priceCRC: 2890000,
      installationPriceCRC: 195000,
      includesDyno: true,
      includesWarranty: true,
      featuresJson: JSON.stringify([
        "Turbo Híbrido Garrett PowerMax con Rueda Compresora Billet CNC",
        "Intercooler de Aluminio de Alta Eficiencia PWR Core",
        "Inyectores Bosch Motorsport de Alto Caudal + Bomba HD",
        "Calibración y Registro en Banco de Pruebas Dyno",
        "Garantía de Software Vitalicia + 60 Días de Mano de Obra Mecánica"
      ]),
      featured: true
    }
  });

  // Real Website Product from products.json
  await prisma.product.create({
    data: {
      sku: "BMP-Z10-EXH-01",
      slug: "BMP-Z10-EXH-01",
      nameEs: "Mufla Deportiva CFMOTO Z10 - Doble Barril Salida Central",
      nameEn: "CFMOTO Z10 Sport Exhaust - Dual Barrel Center Exit",
      priceCRC: 656000,
      installationPriceCRC: 0,
      isInstallationIncluded: true,
      warrantyCategory: "BOLT_ON_ELECTRICAL",
      descriptionEs: "Desata a la Bestia Dentro de tu Z10. Diseñado como un sistema completo tipo slip-on de alto rendimiento con múltiple de alto flujo y escape doble barril central.",
      descriptionEn: "Unleash the Beast Within Your Z10. Engineered as a comprehensive slip-on full system with high-performance header and double-barrel center-exit exhaust.",
      imageUrl: "/products/z10_bikeman_exhaust.webp",
      categoryId: catPerformance.id,
      stockStatus: "IN_STOCK_US",
      featured: true,
      homeInstallationAvailable: true,
      compatibilities: {
        create: [
          { brandSlug: "cfmoto", modelSlug: "z10", yearFrom: 2024, yearTo: 2027 },
          { brandSlug: "cfmoto", modelSlug: "z10-4", yearFrom: 2024, yearTo: 2027 }
        ]
      }
    }
  });

  console.log("Database seeded successfully with CFMOTO flagship and 60-day mechanical warranty!");
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
