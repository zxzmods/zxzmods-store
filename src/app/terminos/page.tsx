"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TermsSkeleton } from "@/components/terms/TermsSkeleton";

export default function TermsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/documentos?doc=terminos-condiciones");
  }, [router]);

  return (
    <div className="min-h-screen bg-white pt-24 px-4 flex items-center justify-center">
      <TermsSkeleton />
    </div>
  );
}
