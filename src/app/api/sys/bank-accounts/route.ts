import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";

export interface BankAccountItem {
  id: string;
  bankName: string;
  currency: "CRC" | "USD";
  iban: string;
  accountNumber: string;
  ownerName: string;
  idCard: string;
  type?: string; // "SINPE", "CORRIENTE", "AHORROS"
  notes?: string;
  isSinpe?: boolean;
}

export async function GET() {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const workshop = await prisma.workshopInfo.findFirst();
    if (!workshop) {
      return NextResponse.json({ success: true, accounts: [] });
    }

    let accounts: BankAccountItem[] = [];
    try {
      const raw = JSON.parse(workshop.bankAccountsJson || "[]");
      let needsSave = false;
      accounts = raw.map((acc: any, index: number) => {
        let stableId = acc.id;
        if (!stableId) {
          stableId = `acc-${index + 1}-${(acc.currency || "crc").toLowerCase()}`;
          needsSave = true;
        }
        return {
          id: stableId,
          bankName: acc.bankName || "",
          currency: acc.currency === "USD" ? "USD" : "CRC",
          iban: acc.iban || "",
          accountNumber: acc.accountNumber || "",
          ownerName: acc.ownerName || "",
          idCard: acc.idCard || "",
          type: acc.type || (acc.bankName?.toLowerCase().includes("sinpe") ? "SINPE" : "CORRIENTE"),
          notes: acc.notes || "",
          isSinpe: acc.isSinpe || acc.bankName?.toLowerCase().includes("sinpe") || false,
        };
      });

      if (needsSave) {
        await prisma.workshopInfo.update({
          where: { id: workshop.id },
          data: { bankAccountsJson: JSON.stringify(accounts) },
        });
      }
    } catch {
      accounts = [];
    }

    return NextResponse.json({ success: true, accounts });
  } catch (error) {
    console.error("[SYS_BANK_ACCOUNTS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar cuentas bancarias" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      bankName,
      currency = "CRC",
      iban,
      accountNumber,
      ownerName,
      idCard,
      type = "CORRIENTE",
      notes = "",
    } = body;

    if (!bankName || !iban || !ownerName) {
      return NextResponse.json(
        { success: false, error: "Nombre del banco, IBAN y titular son requeridos" },
        { status: 400 }
      );
    }

    const workshop = await prisma.workshopInfo.findFirst();
    if (!workshop) {
      return NextResponse.json(
        { success: false, error: "Registro de taller no inicializado" },
        { status: 404 }
      );
    }

    let currentAccounts: BankAccountItem[] = [];
    try {
      currentAccounts = JSON.parse(workshop.bankAccountsJson || "[]");
    } catch {
      currentAccounts = [];
    }

    const newAccount: BankAccountItem = {
      id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bankName: bankName.trim(),
      currency: currency === "USD" ? "USD" : "CRC",
      iban: iban.trim(),
      accountNumber: (accountNumber || iban).trim(),
      ownerName: ownerName.trim(),
      idCard: (idCard || "").trim(),
      type: type || "CORRIENTE",
      notes: (notes || "").trim(),
      isSinpe: type === "SINPE" || bankName.toLowerCase().includes("sinpe"),
    };

    const updatedAccounts = [...currentAccounts, newAccount];

    await prisma.workshopInfo.update({
      where: { id: workshop.id },
      data: { bankAccountsJson: JSON.stringify(updatedAccounts) },
    });

    return NextResponse.json({
      success: true,
      message: "Cuenta bancaria agregada exitosamente",
      accounts: updatedAccounts,
      account: newAccount,
    });
  } catch (error) {
    console.error("[SYS_BANK_ACCOUNTS_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al agregar cuenta bancaria" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      id,
      bankName,
      currency = "CRC",
      iban,
      accountNumber,
      ownerName,
      idCard,
      type = "CORRIENTE",
      notes = "",
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de cuenta bancaria es requerido" },
        { status: 400 }
      );
    }

    const workshop = await prisma.workshopInfo.findFirst();
    if (!workshop) {
      return NextResponse.json(
        { success: false, error: "Registro de taller no encontrado" },
        { status: 404 }
      );
    }

    let currentAccounts: BankAccountItem[] = [];
    try {
      currentAccounts = JSON.parse(workshop.bankAccountsJson || "[]");
    } catch {
      currentAccounts = [];
    }

    const targetIdx = currentAccounts.findIndex((acc) => acc.id === id);
    if (targetIdx === -1) {
      return NextResponse.json(
        { success: false, error: "Cuenta bancaria no encontrada" },
        { status: 404 }
      );
    }

    const existingAcc = currentAccounts[targetIdx];
    const updatedAccount: BankAccountItem = {
      ...existingAcc,
      bankName: bankName ? bankName.trim() : existingAcc.bankName,
      currency: currency === "USD" ? "USD" : "CRC",
      iban: iban ? iban.trim() : existingAcc.iban,
      accountNumber: accountNumber ? accountNumber.trim() : existingAcc.accountNumber,
      ownerName: ownerName ? ownerName.trim() : existingAcc.ownerName,
      idCard: idCard !== undefined ? idCard.trim() : existingAcc.idCard,
      type: type || existingAcc.type || "CORRIENTE",
      notes: notes !== undefined ? notes.trim() : existingAcc.notes,
      isSinpe: type === "SINPE" || (bankName || existingAcc.bankName).toLowerCase().includes("sinpe"),
    };

    currentAccounts[targetIdx] = updatedAccount;

    await prisma.workshopInfo.update({
      where: { id: workshop.id },
      data: { bankAccountsJson: JSON.stringify(currentAccounts) },
    });

    return NextResponse.json({
      success: true,
      message: "Cuenta bancaria actualizada exitosamente",
      accounts: currentAccounts,
      account: updatedAccount,
    });
  } catch (error) {
    console.error("[SYS_BANK_ACCOUNTS_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar cuenta bancaria" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de cuenta es requerido" },
        { status: 400 }
      );
    }

    const workshop = await prisma.workshopInfo.findFirst();
    if (!workshop) {
      return NextResponse.json(
        { success: false, error: "Registro de taller no encontrado" },
        { status: 404 }
      );
    }

    let currentAccounts: any[] = [];
    try {
      currentAccounts = JSON.parse(workshop.bankAccountsJson || "[]");
    } catch {
      currentAccounts = [];
    }

    const targetIdx = currentAccounts.findIndex((acc: any, idx: number) => {
      if (acc.id && acc.id === id) return true;
      if (acc.iban && acc.iban === id) return true;
      if (acc.accountNumber && acc.accountNumber === id) return true;
      if (`acc-${idx + 1}-${(acc.currency || "crc").toLowerCase()}` === id) return true;
      return false;
    });

    if (targetIdx === -1) {
      return NextResponse.json(
        { success: false, error: "Cuenta bancaria no encontrada" },
        { status: 404 }
      );
    }

    currentAccounts.splice(targetIdx, 1);

    await prisma.workshopInfo.update({
      where: { id: workshop.id },
      data: { bankAccountsJson: JSON.stringify(currentAccounts) },
    });

    return NextResponse.json({
      success: true,
      message: "Cuenta bancaria eliminada exitosamente",
      accounts: currentAccounts,
    });
  } catch (error) {
    console.error("[SYS_BANK_ACCOUNTS_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar cuenta bancaria" },
      { status: 500 }
    );
  }
}
