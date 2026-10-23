"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  History,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Package,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  oldDataJson: string | null;
  newDataJson: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export function AuditHistoryTab() {
  const { lang } = useLanguage();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sys/audit");
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Audit fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const getActionLabel = (action: string) => {
    switch (action) {
      case "UPDATE_PRODUCT_PRICE":
        return "Cambio de Precio Base";
      case "UPDATE_INSTALLATION_COST":
        return "Cambio Costo Instalación";
      case "CREATE_PRODUCT":
        return "Nuevo Producto Creado";
      case "UPDATE_PRODUCT":
        return "Modificación de Producto";
      case "DELETE_PRODUCT":
        return "Producto Archivado";
      case "CREATE_COMBO":
        return "Nuevo Combo Creado";
      case "UPDATE_COMBO":
        return "Modificación de Combo";
      case "DELETE_COMBO":
        return "Combo Archivado";
      default:
        return action;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-700" />
            Historial de Cambios en Productos & Combos
          </span>
          <p className="text-xs text-slate-500">
            Registro automático de modificaciones de precios, mano de obra y especificaciones (últimos 6 meses).
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAuditLogs}
          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Logs Table / List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 animate-pulse">
              <div className="h-4 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-2">
          <Package className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-xs">No hay modificaciones registradas en el catálogo aún.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            let oldData: any = null;
            let newData: any = null;
            try {
              if (log.oldDataJson) oldData = JSON.parse(log.oldDataJson);
              if (log.newDataJson) newData = JSON.parse(log.newDataJson);
            } catch {}

            return (
              <div key={log.id} className="transition">
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded font-semibold">
                          {log.entityType}
                        </span>
                      </div>
                      {log.details && <p className="text-xs text-slate-500 pt-0.5">{log.details}</p>}
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 shrink-0">
                    <span className="font-medium text-slate-700 block">{log.actorEmail}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Diff Viewer */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                      Valores Anteriores vs Nuevos:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 space-y-1">
                        <span className="text-[10px] font-bold text-red-700 uppercase block">Anterior:</span>
                        <pre className="text-[11px] text-red-900 whitespace-pre-wrap font-mono">
                          {oldData ? JSON.stringify(oldData, null, 2) : "Ninguno (Creación)"}
                        </pre>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block">Nuevo:</span>
                        <pre className="text-[11px] text-emerald-900 whitespace-pre-wrap font-mono">
                          {newData ? JSON.stringify(newData, null, 2) : "Ninguno (Eliminación)"}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
