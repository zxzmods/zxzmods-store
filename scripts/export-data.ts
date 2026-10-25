import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function exportData() {
  console.log("==================================================");
  console.log("   ZxZ MODS - Database Export Protocol (SQLite)   ");
  console.log("==================================================");

  try {
    const [
      brands,
      vehicleModels,
      categories,
      products,
      productCompatibilities,
      combos,
      performancePackages,
      workshopInfo,
      logisticsRates,
      dealerBrands,
      legalDocuments,
      homePageItems,
      discountCodes,
      barrialCrConfig,
    ] = await Promise.all([
      prisma.brand.findMany(),
      prisma.vehicleModel.findMany(),
      prisma.category.findMany(),
      prisma.product.findMany(),
      prisma.productCompatibility.findMany(),
      prisma.combo.findMany(),
      prisma.performancePackage.findMany(),
      prisma.workshopInfo.findMany(),
      prisma.logisticsRateConfig.findMany(),
      prisma.dealerBrand.findMany(),
      prisma.legalDocument.findMany(),
      prisma.homePageItem.findMany(),
      prisma.discountCode.findMany(),
      prisma.barrialCrConfig.findMany(),
    ]);

    const backupBundle = {
      exportedAt: new Date().toISOString(),
      counts: {
        brands: brands.length,
        vehicleModels: vehicleModels.length,
        categories: categories.length,
        products: products.length,
        productCompatibilities: productCompatibilities.length,
        combos: combos.length,
        performancePackages: performancePackages.length,
        workshopInfo: workshopInfo.length,
        logisticsRates: logisticsRates.length,
        dealerBrands: dealerBrands.length,
        legalDocuments: legalDocuments.length,
        homePageItems: homePageItems.length,
        discountCodes: discountCodes.length,
        barrialCrConfig: barrialCrConfig.length,
      },
      data: {
        brands,
        vehicleModels,
        categories,
        products,
        productCompatibilities,
        combos,
        performancePackages,
        workshopInfo,
        logisticsRates,
        dealerBrands,
        legalDocuments,
        homePageItems,
        discountCodes,
        barrialCrConfig,
      },
    };

    const outputPath = path.join(process.cwd(), "scripts", "data-backup.json");
    await fs.writeFile(outputPath, JSON.stringify(backupBundle, null, 2), "utf-8");

    console.log(`[SUCCESS] Database exported to ${outputPath}`);
    console.log("Summary of exported records:");
    console.table(backupBundle.counts);
  } catch (error) {
    console.error("[EXPORT_FAILED]:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
