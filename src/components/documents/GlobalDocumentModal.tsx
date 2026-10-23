"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { DocumentViewerModal } from "./DocumentViewerModal";

export function GlobalDocumentModal() {
  const { isDocumentModalOpen, activeDocumentSlug, closeDocumentModal } = useAuth();

  return (
    <DocumentViewerModal
      isOpen={isDocumentModalOpen}
      slug={activeDocumentSlug}
      onClose={closeDocumentModal}
    />
  );
}
