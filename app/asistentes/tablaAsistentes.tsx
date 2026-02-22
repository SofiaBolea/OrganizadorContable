// app/asistentes/tablaAsistentes.tsx
"use client";
import { Users, Mail, Phone, UserCheck, UserPlus } from "lucide-react";
import { PermissionToggle } from "./permissionToggle";
import { InviteMemberButton } from "./inviteMemberButton";
import { FiltrosAsistentes } from "./filtrosAsistentes";
import { EmptyState } from "../components/emptyState";

export function TablaAsistentes({ initialAsistentes, canInvite }: { initialAsistentes: any[], canInvite: boolean }) {
    return (
        <>
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-[10px] font-black uppercase tracking-widest">
                        <UserCheck className="w-3 h-3" /> Gestión de Staff
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-text">Asistentes Contables</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-card border border-black/5 px-6 py-3 rounded-xl shadow-sm">
                        <div className="text-right">
                            <span className="block text-[10px] font-bold text-text/40 uppercase tracking-widest">Total</span>
                            <span className="text-2xl font-black text-text leading-none">{initialAsistentes.length}</span>
                        </div>
                        <Users className="w-6 h-6 text-primary/40" />
                    </div>
                    {canInvite && <InviteMemberButton />}
                </div>
            </header>
            
            <FiltrosAsistentes />

            <div className="overflow-hidden rounded-xl border border-black/5 bg-card shadow-sm">
                {initialAsistentes.length === 0 ? (
                    <EmptyState 
                        icon={UserPlus}
                        title="No hay asistentes"
                        description="Invita a tu equipo para empezar a delegar tareas."
                    />
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 bg-black/[0.02]">
                                <th className="px-8 py-5 text-[10px] font-black text-text/40 uppercase tracking-[0.2em]">Asistente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-text/40 uppercase tracking-[0.2em]">Contacto</th>
                                <th className="px-8 py-5 text-[10px] font-black text-text/40 uppercase tracking-[0.2em]">Permisos</th>
                                <th className="px-8 py-5 text-[10px] font-black text-text/40 uppercase tracking-[0.2em] text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.03]">
                            {initialAsistentes.map((usuario) => (
                                <tr key={usuario.id} className="group hover:bg-black/[0.01] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-sidebar flex items-center justify-center font-bold text-white shrink-0">
                                                {(usuario.nombreCompleto?.[0] || usuario.email[0]).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-text font-bold text-lg truncate">{usuario.nombreCompleto || "Sin nombre"}</p>
                                                <p className="text-xs text-text/40 font-medium italic">ID: {usuario.id.slice(-8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-text/70"><Mail className="w-3 h-3" />{usuario.email}</div>
                                            <div className="flex items-center gap-2 text-sm text-text/70"><Phone className="w-3 h-3" />{usuario.telefono || "N/A"}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-6">
                                            <PermissionToggle usuarioId={usuario.id} label="Clientes" campo="permisoClientes" valor={usuario.permisoClientes} />
                                            <PermissionToggle usuarioId={usuario.id} label="Vencimientos" campo="permisoVencimiento" valor={usuario.permisoVencimiento} />
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black text-primary-foreground uppercase tracking-tight">Asistente Activo</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}