const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Upserting Kawasaki brand and vehicle models...');

  const brand = await prisma.brand.upsert({
    where: { slug: 'kawasaki' },
    update: {
      name: 'Kawasaki',
      logoUrl: '/images/logos/kawasaki.svg',
      descriptionEs: 'Ingeniería japonesa de alta exigencia para la línea Teryx KRX 1000 y KRX4 1000.',
      descriptionEn: 'High-demand Japanese engineering for the Teryx KRX 1000 and KRX4 1000 lineup.',
      featured: true,
    },
    create: {
      slug: 'kawasaki',
      name: 'Kawasaki',
      logoUrl: '/images/logos/kawasaki.svg',
      descriptionEs: 'Ingeniería japonesa de alta exigencia para la línea Teryx KRX 1000 y KRX4 1000.',
      descriptionEn: 'High-demand Japanese engineering for the Teryx KRX 1000 and KRX4 1000 lineup.',
      featured: true,
    },
  });

  const models = [
    {
      slug: 'teryx-krx-1000',
      name: 'Teryx KRX 1000',
      category: 'Sport UTV',
      yearsJson: JSON.stringify([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]),
      imageUrl: '/images/sxs/kawasaki_sxs.png',
      pickupServiceAvailable: true,
    },
    {
      slug: 'teryx-krx4-1000',
      name: 'Teryx KRX4 1000',
      category: 'Sport UTV',
      yearsJson: JSON.stringify([2021, 2022, 2023, 2024, 2025, 2026, 2027]),
      imageUrl: '/images/sxs/kawasaki_sxs.png',
      pickupServiceAvailable: true,
    },
  ];

  for (const m of models) {
    await prisma.vehicleModel.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        category: m.category,
        yearsJson: m.yearsJson,
        imageUrl: m.imageUrl,
        pickupServiceAvailable: m.pickupServiceAvailable,
        brandId: brand.id,
      },
      create: {
        slug: m.slug,
        name: m.name,
        category: m.category,
        yearsJson: m.yearsJson,
        imageUrl: m.imageUrl,
        pickupServiceAvailable: m.pickupServiceAvailable,
        brandId: brand.id,
      },
    });
  }

  console.log('Successfully upserted Kawasaki and models!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
