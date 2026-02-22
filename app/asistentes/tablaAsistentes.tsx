"use client";
import { Users, Mail, Phone, UserCheck } from "lucide-react";
import { PermissionToggle } from "./permissionToggle";
import { InviteMemberButton } from "./inviteMemberButton";
import { FiltrosAsistentes } from "./filtrosAsistentes";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function TablaAsistentes({ canInvite }: { canInvite: boolean }) {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [asistentes, setAsistentes] = useState<any[]>([]);

    useEffect(() => {
        const fetchAsistentes = async () => {
            setLoading(true);

            const query = searchParams.toString();
            const res = await fetch(`/api/asistentes?${query}`);
            const data = await res.json();
            setAsistentes(data);

            setLoading(false);
        };

        fetchAsistentes();
    }, [searchParams]);

    return (
        <>
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-[10px] font-black uppercase tracking-widest">
                        <UserCheck className="w-3 h-3" />
                        Gestión de Staff
                    </div>
                    
                    <h1 className="text-5xl font-black tracking-tighter text-text">Asistentes Contables</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-card border border-black/5 px-6 py-3 rounded-xl shadow-sm">
                        <div className="text-right">
                            <span className="block text-[10px] font-bold text-text/40 uppercase tracking-widest">Total</span>
                            <span className="text-2xl font-black text-text leading-none">{asistentes.length}</span>
                        </div>
                        <Users className="w-6 h-6 text-primary/40" />
                    </div>
                    {canInvite && <InviteMemberButton />}
                </div>
            </header>
            <FiltrosAsistentes />
            <div className="overflow-hidden rounded-xl border border-black/5 bg-card shadow-sm">
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
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-8 text-slate-400">Cargando asistentes...</td></tr>
                        ) : asistentes.map((usuario) => (
                            <tr key={usuario.id} className="group hover:bg-black/[0.01] transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-sidebar flex items-center justify-center font-bold text-white shrink-0">
                                            {(usuario.nombreCompleto?.[0] || usuario.email[0]).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-text font-bold text-lg truncate flex items-center gap-2">
                                                {usuario.nombreCompleto || "Sin nombre"}
                                            </p>
                                            <p className="text-xs text-text/40 font-medium italic">ID: {usuario.id.slice(-8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-text/70">
                                            <Mail className="w-3 h-3 text-text/30" />
                                            {usuario.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-text/70">
                                            <Phone className="w-3 h-3 text-text/30" />
                                            {usuario.telefono || "N/A"}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-6">
                                        <PermissionToggle
                                            usuarioId={usuario.id}
                                            label="Clientes"
                                            campo="permisoClientes"
                                            valor={usuario.permisoClientes}
                                        />
                                        <PermissionToggle
                                            usuarioId={usuario.id}
                                            label="Vencimientos"
                                            campo="permisoVencimiento"
                                            valor={usuario.permisoVencimiento}
                                        />
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black text-primary-foreground uppercase tracking-tight">
                                        Asistente Activo
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {/* Mensaje de advertencia como fila extra */}
                        <tr>
                            <td colSpan={6} className="py-6 text-center">
                                <div className="flex items-center justify-center gap-2 w-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#90BF77" className="w-6 h-6">
                                        <circle cx="12" cy="12" r="10" stroke="#90BF77" strokeWidth="1.5" fill="none" />
                                        <path strokeLinecap="round" strokeLinejoin="round" stroke="#90BF77" strokeWidth="1.5" d="M12 8v4m0 4h.01" />
                                    </svg>
                                    <span className="text-[#90BF77] text-base" style={{fontWeight: 400}}>
                                        Los asistentes con permiso activado tendrán la capacidad de cargar clientes y/o vencimientos impositivos libremente
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}
