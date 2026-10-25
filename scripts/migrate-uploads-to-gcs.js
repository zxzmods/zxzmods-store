/**
 * ZxZ MODS - Migrate Local Store Media (/public/uploads) to Google Cloud Storage
 * Uploads active catalog/store media (brands, products, combos, videos, audios)
 * to GCS bucket and updates Prisma database URLs automatically.
 */
const fs = require("fs");
const path = require("path");
const { Storage } = require("@google-cloud/storage");
const { PrismaClient } = require("@prisma/client");

// Parse .env manually to ensure all variables are loaded
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const prisma = new PrismaClient();

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    default:
      return "application/octet-stream";
  }
}

async function migrateMediaToGCS() {
  console.log("==================================================");
  console.log("   ZxZ MODS - Media Migration to Google Cloud     ");
  console.log("==================================================");

  const projectId = process.env.GCS_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.GCS_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.GCS_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : null;
  const bucketName = process.env.GCS_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET || "zxz-mods-media";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const storeFolders = ["brands", "products", "combos", "videos", "audios"];
  const urlMap = new Map(); // "/uploads/..." -> cloud public URL

  // Mode A: Supabase Storage
  if (supabaseUrl && supabaseServiceKey) {
    console.log(`Using Supabase Storage (${supabaseUrl}) bucket: ${bucketName}`);
    const cleanBaseUrl = supabaseUrl.replace(/\/+$/, "");

    // Ensure bucket exists on Supabase Storage
    try {
      await fetch(`${cleanBaseUrl}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: bucketName, name: bucketName, public: true }),
      });
    } catch {}

    for (const folder of storeFolders) {
      const folderPath = path.join(uploadsRoot, folder);
      if (!fs.existsSync(folderPath)) continue;

      const files = fs.readdirSync(folderPath);
      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const localFilePath = path.join(folderPath, fileName);
        const stat = fs.statSync(localFilePath);
        if (!stat.isFile()) continue;

        const destination = `${folder}/${fileName}`;
        const localRelativeUrl = `/uploads/${folder}/${fileName}`;
        const publicUrl = `${cleanBaseUrl}/storage/v1/object/public/${bucketName}/${destination}`;

        try {
          console.log(`[SUPABASE UPLOADING] ${localRelativeUrl} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);
          const buffer = fs.readFileSync(localFilePath);
          const res = await fetch(`${cleanBaseUrl}/storage/v1/object/${bucketName}/${destination}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              apikey: supabaseServiceKey,
              "Content-Type": getMimeType(fileName),
              "x-upsert": "true",
            },
            body: buffer,
          });
          if (res.ok) {
            urlMap.set(localRelativeUrl, publicUrl);
          } else {
            console.warn(`[WARN] Supabase upload returned ${res.status} for ${localRelativeUrl}`);
          }
        } catch (err) {
          console.warn(`[WARN] Could not upload ${localRelativeUrl} to Supabase:`, err.message);
        }
      }
    }
  } else if (projectId && clientEmail && privateKey) {
    // Mode B: Google Cloud Storage
    const storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });

    let activeBucketName = bucketName;
    try {
      const [buckets] = await storage.getBuckets();
      console.log("Available buckets in GCP project:", buckets.map((b) => b.name));
      const found = buckets.find((b) => b.name === bucketName);
      if (!found && buckets.length > 0) {
        activeBucketName = buckets[0].name;
        console.log(`Using existing project bucket: ${activeBucketName}`);
      } else if (!found) {
        console.log(`Creating bucket ${bucketName}...`);
        await storage.createBucket(bucketName, { location: "US" });
      }
    } catch (bucketErr) {
      console.warn("Bucket discovery/creation warning:", bucketErr.message);
    }

    const bucket = storage.bucket(activeBucketName);
    for (const folder of storeFolders) {
      const folderPath = path.join(uploadsRoot, folder);
      if (!fs.existsSync(folderPath)) continue;

      const files = fs.readdirSync(folderPath);
      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const localFilePath = path.join(folderPath, fileName);
        const stat = fs.statSync(localFilePath);
        if (!stat.isFile()) continue;

        const destination = `${folder}/${fileName}`;
        const localRelativeUrl = `/uploads/${folder}/${fileName}`;
        const gcsPublicUrl = `https://storage.googleapis.com/${activeBucketName}/${destination}`;

        try {
          const gcsFile = bucket.file(destination);
          const [exists] = await gcsFile.exists();
          if (!exists) {
            console.log(`[UPLOADING] ${localRelativeUrl} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);
            await bucket.upload(localFilePath, {
              destination,
              metadata: {
                contentType: getMimeType(fileName),
                cacheControl: "public, max-age=31536000",
              },
            });
          } else {
            console.log(`[EXISTS] ${destination}`);
          }
          urlMap.set(localRelativeUrl, gcsPublicUrl);
        } catch (err) {
          console.warn(`[WARN] Could not upload ${localRelativeUrl}:`, err.message);
        }
      }
    }
  } else {
    console.error("[ERROR] Missing Supabase Storage or GCS credentials in .env");
    process.exit(1);
  }

  console.log(`\nMapped ${urlMap.size} store media files to GCS.`);
  if (urlMap.size === 0) {
    await prisma.$disconnect();
    return;
  }

  const replaceUrlsInString = (str) => {
    if (!str || typeof str !== "string") return str;
    let out = str;
    for (const [localUrl, cloudUrl] of urlMap.entries()) {
      if (out.includes(localUrl)) {
        out = out.split(localUrl).join(cloudUrl);
      }
    }
    return out;
  };

  // 1. Update Products
  const products = await prisma.product.findMany();
  let updatedProducts = 0;
  for (const p of products) {
    const newImageUrl = replaceUrlsInString(p.imageUrl);
    const newImagesJson = replaceUrlsInString(p.imagesJson);
    const newAdditionalImagesJson = replaceUrlsInString(p.additionalImagesJson);
    const newVideoUrl = replaceUrlsInString(p.videoUrl);
    const newVideosJson = replaceUrlsInString(p.videosJson);
    const newAudioUrl = replaceUrlsInString(p.audioUrl);
    const newAudiosJson = replaceUrlsInString(p.audiosJson);

    if (
      newImageUrl !== p.imageUrl ||
      newImagesJson !== p.imagesJson ||
      newAdditionalImagesJson !== p.additionalImagesJson ||
      newVideoUrl !== p.videoUrl ||
      newVideosJson !== p.videosJson ||
      newAudioUrl !== p.audioUrl ||
      newAudiosJson !== p.audiosJson
    ) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          imageUrl: newImageUrl,
          imagesJson: newImagesJson,
          additionalImagesJson: newAdditionalImagesJson,
          videoUrl: newVideoUrl,
          videosJson: newVideosJson,
          audioUrl: newAudioUrl,
          audiosJson: newAudiosJson,
        },
      });
      updatedProducts++;
    }
  }

  // 2. Update DealerBrands
  const dealerBrands = await prisma.dealerBrand.findMany();
  let updatedDealerBrands = 0;
  for (const db of dealerBrands) {
    const newLogoUrl = replaceUrlsInString(db.logoUrl);
    if (newLogoUrl !== db.logoUrl) {
      await prisma.dealerBrand.update({
        where: { id: db.id },
        data: { logoUrl: newLogoUrl },
      });
      updatedDealerBrands++;
    }
  }

  // 3. Update Brands
  const brands = await prisma.brand.findMany();
  let updatedBrands = 0;
  for (const b of brands) {
    const newLogoUrl = replaceUrlsInString(b.logoUrl);
    if (newLogoUrl !== b.logoUrl) {
      await prisma.brand.update({
        where: { id: b.id },
        data: { logoUrl: newLogoUrl },
      });
      updatedBrands++;
    }
  }

  // 4. Update Combos
  const combos = await prisma.combo.findMany();
  let updatedCombos = 0;
  for (const c of combos) {
    const newImageUrl = replaceUrlsInString(c.imageUrl);
    if (newImageUrl !== c.imageUrl) {
      await prisma.combo.update({
        where: { id: c.id },
        data: { imageUrl: newImageUrl },
      });
      updatedCombos++;
    }
  }

  // 5. Update HomePageItems
  const homeItems = await prisma.homePageItem.findMany();
  let updatedHomeItems = 0;
  for (const item of homeItems) {
    const newMediaUrl = replaceUrlsInString(item.mediaUrl);
    const newVideoUrl = replaceUrlsInString(item.videoUrl);
    if (newMediaUrl !== item.mediaUrl || newVideoUrl !== item.videoUrl) {
      await prisma.homePageItem.update({
        where: { id: item.id },
        data: { mediaUrl: newMediaUrl, videoUrl: newVideoUrl },
      });
      updatedHomeItems++;
    }
  }

  // 6. Update BarrialCrConfig
  const barrialConfigs = await prisma.barrialCrConfig.findMany();
  let updatedBarrial = 0;
  for (const bc of barrialConfigs) {
    const newVideoUrl = replaceUrlsInString(bc.videoUrl);
    const newPosterUrl = replaceUrlsInString(bc.posterImageUrl);
    const newLogoUrl = replaceUrlsInString(bc.logoUrl);
    if (
      newVideoUrl !== bc.videoUrl ||
      newPosterUrl !== bc.posterImageUrl ||
      newLogoUrl !== bc.logoUrl
    ) {
      await prisma.barrialCrConfig.update({
        where: { id: bc.id },
        data: {
          videoUrl: newVideoUrl,
          posterImageUrl: newPosterUrl,
          logoUrl: newLogoUrl,
        },
      });
      updatedBarrial++;
    }
  }

  // 7. Also update src/data/products.json if present
  const productsJsonPath = path.join(process.cwd(), "src", "data", "products.json");
  if (fs.existsSync(productsJsonPath)) {
    const rawJson = fs.readFileSync(productsJsonPath, "utf8");
    const updatedJson = replaceUrlsInString(rawJson);
    if (updatedJson !== rawJson) {
      fs.writeFileSync(productsJsonPath, updatedJson, "utf8");
      console.log("[UPDATED] src/data/products.json URLs migrated to GCS.");
    }
  }

  console.log("==================================================");
  console.log("Database URL Migration Summary:");
  console.table({
    updatedProducts,
    updatedDealerBrands,
    updatedBrands,
    updatedCombos,
    updatedHomeItems,
    updatedBarrial,
  });
  console.log("==================================================");
  await prisma.$disconnect();
}

migrateMediaToGCS().catch((err) => {
  console.error("[MIGRATION_ERROR]:", err);
  process.exit(1);
});
