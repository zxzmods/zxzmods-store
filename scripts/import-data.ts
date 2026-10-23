import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function importData() {
  console.log("==================================================");
  console.log("   ZxZ MODS - Database Import Protocol (Postgres)  ");
  console.log("==================================================");

  const backupPath = path.join(process.cwd(), "scripts", "data-backup.json");
  const raw = await fs.readFile(backupPath, "utf-8");
  const bundle = JSON.parse(raw);
  const data = bundle.data;

  try {
    // 1. Brands
    console.log(`Importing ${data.brands.length} Brands...`);
    for (const b of data.brands) {
      await prisma.brand.upsert({
        where: { id: b.id },
        update: b,
        create: b,
      });
    }

    // 2. Vehicle Models
    console.log(`Importing ${data.vehicleModels.length} Vehicle Models...`);
    for (const vm of data.vehicleModels) {
      await prisma.vehicleModel.upsert({
        where: { id: vm.id },
        update: vm,
        create: vm,
      });
    }

    // 3. Categories
    console.log(`Importing ${data.categories.length} Categories...`);
    for (const cat of data.categories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: cat,
        create: cat,
      });
    }

    // 4. Products
    console.log(`Importing ${data.products.length} Products...`);
    for (const p of data.products) {
      const { compatibilities, category, ...prodData } = p;
      if (prodData.createdAt) prodData.createdAt = new Date(prodData.createdAt);
      if (prodData.updatedAt) prodData.updatedAt = new Date(prodData.updatedAt);
      if (prodData.supplierStockCheckedAt) prodData.supplierStockCheckedAt = new Date(prodData.supplierStockCheckedAt);

      await prisma.product.upsert({
        where: { id: prodData.id },
        update: prodData,
        create: prodData,
      });
    }

    // 5. Product Compatibilities
    console.log(`Importing ${data.productCompatibilities.length} Product Compatibilities...`);
    for (const pc of data.productCompatibilities) {
      await prisma.productCompatibility.upsert({
        where: { id: pc.id },
        update: pc,
        create: pc,
      });
    }

    // 6. Combos
    console.log(`Importing ${data.combos.length} Combos...`);
    for (const combo of data.combos) {
      if (combo.createdAt) combo.createdAt = new Date(combo.createdAt);
      if (combo.updatedAt) combo.updatedAt = new Date(combo.updatedAt);
      await prisma.combo.upsert({
        where: { id: combo.id },
        update: combo,
        create: combo,
      });
    }

    // 7. Performance Packages
    console.log(`Importing ${data.performancePackages.length} Performance Packages...`);
    for (const pkg of data.performancePackages) {
      if (pkg.createdAt) pkg.createdAt = new Date(pkg.createdAt);
      await prisma.performancePackage.upsert({
        where: { id: pkg.id },
        update: pkg,
        create: pkg,
      });
    }

    // 8. Workshop Info
    console.log(`Importing Workshop Info...`);
    for (const w of data.workshopInfo) {
      await prisma.workshopInfo.upsert({
        where: { id: w.id },
        update: w,
        create: w,
      });
    }

    // 9. Logistics Rates
    console.log(`Importing Logistics Rates...`);
    for (const r of data.logisticsRates) {
      if (r.createdAt) r.createdAt = new Date(r.createdAt);
      if (r.updatedAt) r.updatedAt = new Date(r.updatedAt);
      await prisma.logisticsRateConfig.upsert({
        where: { id: r.id },
        update: r,
        create: r,
      });
    }

    // 10. Dealer Brands
    console.log(`Importing ${data.dealerBrands.length} Dealer Brands...`);
    for (const db of data.dealerBrands) {
      if (db.createdAt) db.createdAt = new Date(db.createdAt);
      if (db.updatedAt) db.updatedAt = new Date(db.updatedAt);
      await prisma.dealerBrand.upsert({
        where: { id: db.id },
        update: db,
        create: db,
      });
    }

    // 11. Legal Documents
    console.log(`Importing ${data.legalDocuments.length} Legal Documents...`);
    for (const ld of data.legalDocuments) {
      if (ld.createdAt) ld.createdAt = new Date(ld.createdAt);
      if (ld.updatedAt) ld.updatedAt = new Date(ld.updatedAt);
      await prisma.legalDocument.upsert({
        where: { id: ld.id },
        update: ld,
        create: ld,
      });
    }

    // 12. HomePage Items
    console.log(`Importing ${data.homePageItems.length} HomePage Items...`);
    for (const hpi of data.homePageItems) {
      if (hpi.createdAt) hpi.createdAt = new Date(hpi.createdAt);
      if (hpi.updatedAt) hpi.updatedAt = new Date(hpi.updatedAt);
      await prisma.homePageItem.upsert({
        where: { id: hpi.id },
        update: hpi,
        create: hpi,
      });
    }

    console.log("[SUCCESS] Database import completed successfully!");
  } catch (error) {
    console.error("[IMPORT_FAILED]:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
