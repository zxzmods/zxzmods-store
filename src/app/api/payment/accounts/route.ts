import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const workshopInfo = await prisma.workshopInfo.findFirst();
    if (!workshopInfo) {
      return NextResponse.json({ success: true, accounts: [] });
    }

    const accountsStr = workshopInfo.bankAccountsJson || "[]";
    let accounts = [];
    try {
      accounts = JSON.parse(accountsStr);
    } catch {
      accounts = [];
    }

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las cuentas" },
      { status: 500 }
    );
  }
}
