"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Users,
  UserPlus,
  Power,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

interface StaffProfile {
  id: string;
  email: string;
  role: "MASTER" | "STAFF";
  displayName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  permissionsJson?: string | null;
  createdAt: string;
}

export function StaffManagerTab() {
  const { lang } = useLanguage();
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newHasMasterPerms, setNewHasMasterPerms] = useState(false);
  const [creating, setCreating] = useState(false);

  const [resetStaff, setResetStaff] = useState<StaffProfile | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [resetting, setResetting] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sys/staff");
      const data = await res.json();
      if (res.ok && data.success) {
        setStaffList(data.staffMembers || []);
      }
    } catch (err) {
      console.error("Failed to fetch staff list:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || creating) return;

    setCreating(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/sys/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          displayName: newDisplayName || "Personal Técnico",
          role: "STAFF",
          hasMasterPermissions: newHasMasterPerms,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setNewEmail("");
        setNewDisplayName("");
        setNewPassword("");
        setNewHasMasterPerms(false);
        fetchStaff();
        setFeedback({
          type: "success",
          msg: `Perfil para ${data.staff.email} creado correctamente con ${
            newHasMasterPerms ? "PERMISOS DE MASTER" : "permisos estándar"
          }.`,
        });
      } else {
        setFeedback({ type: "error", msg: data.message || data.error || "Error al crear staff." });
      }
    } catch (err) {
      console.error("Create staff error:", err);
      setFeedback({ type: "error", msg: "Error al crear staff." });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (staff: StaffProfile) => {
    const newStatus = !staff.isActive;
    const confirmMsg = newStatus
      ? `¿Reactivar acceso para ${staff.email}?`
      : `¿Suspender acceso para ${staff.email}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/sys/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === staff.id ? { ...s, isActive: newStatus } : s))
        );
        setFeedback({
          type: "success",
          msg: `Acceso para ${staff.email} ${newStatus ? "ACTIVADO" : "SUSPENDIDO"}.`,
        });
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleToggleMasterPerms = async (staff: StaffProfile) => {
    let perms: any = {};
    try {
      if (staff.permissionsJson) perms = JSON.parse(staff.permissionsJson);
    } catch {}
    const currentlyHasMaster = Boolean(perms.hasMasterPermissions || perms.isMaster);
    const nextVal = !currentlyHasMaster;

    const confirmMsg = nextVal
      ? `¿Otorgar permisos de Master a ${staff.email}?\n(Tendrá acceso completo al backdoor excepto a la gestión de personal).`
      : `¿Revocar permisos de Master a ${staff.email}? Volverá a iniciar en el pipeline de pedidos.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/sys/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasMasterPermissions: nextVal }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStaffList((prev) =>
          prev.map((s) =>
            s.id === staff.id ? { ...s, permissionsJson: data.staff.permissionsJson } : s
          )
        );
        setFeedback({
          type: "success",
          msg: `Permisos de Master ${nextVal ? "OTORGADOS" : "REVOCADOS"} para ${staff.email}.`,
        });
      } else {
        alert(data.error || "Error al actualizar permisos");
      }
    } catch (err) {
      console.error("Toggle master perms error:", err);
      alert("Error de red al actualizar permisos");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStaff || !resetPasswordVal || resetting) return;

    setResetting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/sys/staff/${resetStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPasswordVal }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResetStaff(null);
        setResetPasswordVal("");
        setFeedback({
          type: "success",
          msg: `Contraseña actualizada para ${resetStaff.email}.`,
        });
      }
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-700" />
            Cuentas de Personal y Permisos de Master
          </span>
          <p className="text-xs text-slate-500">
            Administra credenciales y otorga permisos de Master a otros perfiles (acceso total excepto esta sección de Personal).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nuevo Usuario Staff</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
            <tr>
              <th className="p-3">Usuario / Nombre</th>
              <th className="p-3">Rol Base</th>
              <th className="p-3">Nivel de Acceso Master</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Último Acceso</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffList.map((member) => {
              const isRootMaster = member.role === "MASTER";
              let perms: any = {};
              try {
                if (member.permissionsJson) perms = JSON.parse(member.permissionsJson);
              } catch {}
              const hasMasterPerms = isRootMaster || Boolean(perms.hasMasterPermissions || perms.isMaster);

              return (
                <tr key={member.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{member.email}</span>
                    <span className="text-slate-500 text-[11px]">{member.displayName || "Personal"}</span>
                  </td>

                  <td className="p-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        isRootMaster
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>

                  {/* Master Permissions Column */}
                  <td className="p-3">
                    {isRootMaster ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
                        <ShieldAlert className="w-3 h-3 text-red-600" />
                        <span>Root Master (Total)</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleMasterPerms(member)}
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                          hasMasterPerms
                            ? "bg-[#FFF0EB] text-[#F05526] border-[#F05526]/30 hover:bg-[#FFE2D6]"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                        title={
                          hasMasterPerms
                            ? "Click para revocar permisos Master"
                            : "Click para otorgar permisos Master a este perfil"
                        }
                      >
                        {hasMasterPerms ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-[#F05526]" />
                            <span>✓ Permisos Master</span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-400">+</span>
                            <span>Estándar (Asignar Master)</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>

                  <td className="p-3">
                    <span
                      className={`text-[10px] font-semibold flex items-center gap-1 ${
                        member.isActive ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          member.isActive ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      {member.isActive ? "Activo" : "Suspendido"}
                    </span>
                  </td>

                  <td className="p-3 text-slate-500 text-[11px]">
                    {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : "Sin inicios de sesión"}
                  </td>

                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setResetStaff(member)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                        title="Cambiar contraseña"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      {!isRootMaster && (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(member)}
                          className={`p-1.5 rounded transition cursor-pointer ${
                            member.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={member.isActive ? "Suspender acceso" : "Activar acceso"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: New Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-sm font-bold text-slate-900">Crear Usuario Staff</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Correo de acceso:</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="tecnico@zxzmods.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Nombre completo:</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Nombre del técnico"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Contraseña (Mín. 8 caracteres):</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              {/* Master Permissions Checkbox */}
              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-xs">
                  <input
                    type="checkbox"
                    checked={newHasMasterPerms}
                    onChange={(e) => setNewHasMasterPerms(e.target.checked)}
                    className="w-4 h-4 text-[#F05526] rounded border-slate-300 focus:ring-[#F05526]"
                  />
                  <span>Otorgar Permisos de Master</span>
                </label>
                <p className="text-[10px] text-slate-600 pl-6 leading-relaxed">
                  Tendrá acceso a los paneles avanzados (finanzas, gráficas, catálogo, portadas) excepto la administración de personal.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Creando..." : "Crear Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-sm font-bold text-slate-900">
                Cambiar Contraseña: {resetStaff.email}
              </span>
              <button
                type="button"
                onClick={() => setResetStaff(null)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">Nueva Contraseña (Mín. 8 caracteres):</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetStaff(null)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
