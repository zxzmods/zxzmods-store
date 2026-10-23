import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { nameEs: "asc" },
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("[SYS_CATEGORIES_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { nameEs, nameEn, slug, icon } = body;

    if (!nameEs || typeof nameEs !== "string" || !nameEs.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name in Spanish is required" },
        { status: 400 }
      );
    }

    // USER REQUIREMENT: First letter always caps!
    const cleanEs = nameEs.trim();
    const formattedNameEs = cleanEs.charAt(0).toUpperCase() + cleanEs.slice(1);

    const cleanEn = (nameEn && typeof nameEn === "string" && nameEn.trim()) ? nameEn.trim() : cleanEs;
    const formattedNameEn = cleanEn.charAt(0).toUpperCase() + cleanEn.slice(1);

    // Generate clean unique slug
    let cleanSlug = slug && typeof slug === "string" && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : formattedNameEs
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // remove diacritics
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

    if (!cleanSlug) {
      cleanSlug = `cat-${Date.now()}`;
    }

    // Check if category with this slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        category: existing,
        alreadyExisted: true,
      });
    }

    const newCategory = await prisma.category.create({
      data: {
        slug: cleanSlug,
        nameEs: formattedNameEs,
        nameEn: formattedNameEn,
        icon: icon || null,
      },
    });

    return NextResponse.json({
      success: true,
      category: newCategory,
    });
  } catch (error) {
    console.error("[SYS_CATEGORIES_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
