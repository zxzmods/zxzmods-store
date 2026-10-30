const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Setting modelCategory on existing and standard models...");

  // Update existing models
  await prisma.vehicleModel.updateMany({
    where: { slug: "zforce-950-sport" },
    data: { modelCategory: "ZForce 950" },
  });
  await prisma.vehicleModel.updateMany({
    where: { slug: "zforce-1000" },
    data: { modelCategory: "ZForce 1000" },
  });
  await prisma.vehicleModel.updateMany({
    where: { slug: "zforce-z10" },
    data: { modelCategory: "ZForce Z10" },
  });
  await prisma.vehicleModel.updateMany({
    where: { slug: "zforce-z10-4" },
    data: { modelCategory: "ZForce Z10" },
  });
  await prisma.vehicleModel.updateMany({
    where: { slug: "can-amx3" },
    data: { modelCategory: "Maverick X3", name: "Maverick X3 Turbo RR" },
  });
  await prisma.vehicleModel.updateMany({
    where: { slug: "villain-sx10" },
    data: { modelCategory: "Villain SX10" },
  });

  // Ensure Can-Am models exist with proper categories
  const canAmBrand = await prisma.brand.findUnique({ where: { slug: "can-am" } });
  if (canAmBrand) {
    const canAmModels = [
      {
        slug: "maverick-x3-rs",
        name: "Maverick X3 X RS Turbo RR",
        code: "X3-XRS",
        category: "UTV",
        modelCategory: "Maverick X3",
        yearsJson: JSON.stringify([2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/canam_x3_front.png",
      },
      {
        slug: "maverick-r-x",
        name: "Maverick R X",
        code: "MAV-R",
        category: "UTV",
        modelCategory: "Maverick R",
        yearsJson: JSON.stringify([2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/canam_sxs.png",
      },
      {
        slug: "maverick-r-xrs",
        name: "Maverick R X RS",
        code: "MAV-RXRS",
        category: "UTV",
        modelCategory: "Maverick R",
        yearsJson: JSON.stringify([2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/canam_sxs.png",
      },
      {
        slug: "defender-hd10",
        name: "Defender HD10 / MAX",
        code: "DEF-HD10",
        category: "UTV",
        modelCategory: "Defender",
        yearsJson: JSON.stringify([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/canam_sxs.png",
      },
      {
        slug: "commander-xt",
        name: "Commander XT 1000R",
        code: "CMD-XT",
        category: "UTV",
        modelCategory: "Commander",
        yearsJson: JSON.stringify([2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/canam_sxs.png",
      },
      {
        slug: "outlander-1000",
        name: "Outlander 1000 X mr",
        code: "OUT-1000",
        category: "ATV",
        modelCategory: "Outlander (ATV)",
        yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/canam_sxs.png",
      },
      {
        slug: "renegade-1000",
        name: "Renegade 1000 X xc",
        code: "REN-1000",
        category: "ATV",
        modelCategory: "Renegade (ATV)",
        yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/canam_sxs.png",
      },
    ];

    for (const m of canAmModels) {
      const existing = await prisma.vehicleModel.findUnique({ where: { slug: m.slug } });
      if (!existing) {
        await prisma.vehicleModel.create({
          data: {
            ...m,
            brandId: canAmBrand.id,
            pickupServiceAvailable: true,
          },
        });
      } else {
        await prisma.vehicleModel.update({
          where: { slug: m.slug },
          data: { modelCategory: m.modelCategory },
        });
      }
    }
  }

  // Ensure CFMOTO CForce (ATV) and UForce exist
  const cfmotoBrand = await prisma.brand.findUnique({ where: { slug: "cfmoto" } });
  if (cfmotoBrand) {
    const cfModels = [
      {
        slug: "cforce-1000",
        name: "CForce 1000 Overland",
        code: "CF1000",
        category: "ATV",
        modelCategory: "CForce (ATV)",
        yearsJson: JSON.stringify([2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/cfmoto_sxs.png",
      },
      {
        slug: "uforce-1000",
        name: "UForce 1000 XL",
        code: "UF1000",
        category: "UTV",
        modelCategory: "UForce",
        yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/cfmoto_sxs.png",
      },
    ];
    for (const m of cfModels) {
      const existing = await prisma.vehicleModel.findUnique({ where: { slug: m.slug } });
      if (!existing) {
        await prisma.vehicleModel.create({
          data: {
            ...m,
            brandId: cfmotoBrand.id,
            pickupServiceAvailable: true,
          },
        });
      } else {
        await prisma.vehicleModel.update({
          where: { slug: m.slug },
          data: { modelCategory: m.modelCategory },
        });
      }
    }
  }

  // Ensure Polaris models exist
  const polarisBrand = await prisma.brand.findUnique({ where: { slug: "polaris" } });
  if (polarisBrand) {
    const polarisModels = [
      {
        slug: "rzr-pro-r",
        name: "RZR Pro R",
        code: "PROR",
        category: "UTV",
        modelCategory: "RZR Pro R",
        yearsJson: JSON.stringify([2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/polaris_pror_front.png",
      },
      {
        slug: "rzr-turbo-r",
        name: "RZR Turbo R",
        code: "TURBOR",
        category: "UTV",
        modelCategory: "RZR Turbo R",
        yearsJson: JSON.stringify([2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/polaris_sxs.png",
      },
      {
        slug: "rzr-pro-xp",
        name: "RZR Pro XP",
        code: "PROXP",
        category: "UTV",
        modelCategory: "RZR Pro XP",
        yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/polaris_sxs.png",
      },
      {
        slug: "sportsman-1000",
        name: "Sportsman XP 1000",
        code: "SPT-1000",
        category: "ATV",
        modelCategory: "Sportsman (ATV)",
        yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/polaris_sxs.png",
      },
    ];
    for (const m of polarisModels) {
      const existing = await prisma.vehicleModel.findUnique({ where: { slug: m.slug } });
      if (!existing) {
        await prisma.vehicleModel.create({
          data: {
            ...m,
            brandId: polarisBrand.id,
            pickupServiceAvailable: true,
          },
        });
      } else {
        await prisma.vehicleModel.update({
          where: { slug: m.slug },
          data: { modelCategory: m.modelCategory },
        });
      }
    }
  }

  // Ensure Kawasaki models exist
  const kawasakiBrand = await prisma.brand.findUnique({ where: { slug: "kawasaki" } });
  if (kawasakiBrand) {
    const kawasakiModels = [
      {
        slug: "teryx-krx-1000",
        name: "Teryx KRX 1000 / 4",
        code: "KRX1000",
        category: "UTV",
        modelCategory: "Teryx KRX",
        yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/kawasaki_sxs.png",
      },
      {
        slug: "brute-force-750",
        name: "Brute Force 750 4x4i",
        code: "BF750",
        category: "ATV",
        modelCategory: "Brute Force (ATV)",
        yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
        imageUrl: "/images/sxs/kawasaki_sxs.png",
      },
    ];
    for (const m of kawasakiModels) {
      const existing = await prisma.vehicleModel.findUnique({ where: { slug: m.slug } });
      if (!existing) {
        await prisma.vehicleModel.create({
          data: {
            ...m,
            brandId: kawasakiBrand.id,
            pickupServiceAvailable: true,
          },
        });
      } else {
        await prisma.vehicleModel.update({
          where: { slug: m.slug },
          data: { modelCategory: m.modelCategory },
        });
      }
    }
  }

  console.log("Model categories seeded successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
