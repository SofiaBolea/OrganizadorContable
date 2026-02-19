import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Users, ShieldAlert, Lock, UserCheck, Mail, Phone, ChevronRight } from "lucide-react";
import { PermissionToggle } from "./permissionToggle";
import { InviteMemberButton } from "./inviteMemberButton";

export default async function AsistentesPage() {
  const { orgId, has } = await auth();

  if (!orgId) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-app">
        <div className="bg-card border border-black/5 p-12 rounded-xl text-center max-w-sm shadow-sm">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-xl font-bold text-text mb-2">Organización Requerida</h2>
          <p className="text-sm text-text/60 leading-relaxed">Seleccioná un espacio de trabajo.</p>
        </div>
      </main>
    );
  }

  const canView = has({ permission: "org:asistentes:ver_asistentes" }); 
  const canInvite = has({ permission: "org:asistentes:crear_asistente" });

  if (!canView) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-app">
        <div className="bg-danger/10 border border-danger/20 p-12 rounded-xl text-center max-w-md">
          <Lock className="w-10 h-10 text-danger-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-black text-text mb-2">Acceso Denegado</h2>
          <p className="text-text/60 italic">No tenés permisos para gestionar asistentes.</p>
        </div>
      </main>
    );
  }

  const asistentes = await prisma.usuario.findMany({
    where: {
      organizacion: { clerkOrganizationId: orgId },
      roles: {
        some: { rol: { nombreRol: "org:member" }, fechaBaja: null },
        none: { rol: { nombreRol: "org:admin" } }
      },
    },
    orderBy: { nombreCompleto: "asc" },
  });

  return (
    <div className="min-h-screen bg-app text-text font-medium">
      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-[10px] font-black uppercase tracking-widest">
              <UserCheck className="w-3 h-3" />
              Gestión de Staff
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-text">Asistentes</h1>
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
              {asistentes.map((usuario) => (
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
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}