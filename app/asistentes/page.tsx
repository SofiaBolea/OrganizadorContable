import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Users, ShieldAlert, Lock, UserCheck, ChevronRight } from "lucide-react";
import { PermissionToggle } from "./permissionToggle";
import { BajaMiembroButton } from "./bajaMiembroButton";
import { InviteMemberModal } from "./inviteMemberModal";

export default async function AsistentesPage() {
  const { orgId, orgRole } = await auth();

  // Validación de Organización seleccionada
  if (!orgId) {
    return (
      <main className="flex min-h-[85vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Seleccioná Organización</h2>
          <p className="text-sm text-slate-500">
            Debés elegir un espacio de trabajo para gestionar los asistentes.
          </p>
        </div>
      </main>
    );
  }

  // Validación de Rol Administrativo
  if (orgRole !== "org:admin") {
    return (
      <main className="flex min-h-[85vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-red-500/[0.02] border border-red-500/10 p-12 rounded-[3rem] text-center max-w-md shadow-2xl">
          <Lock className="w-10 h-10 text-red-500/50 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-2">Acceso Denegado</h2>
          <p className="text-slate-500">
            Esta sección es exclusiva para administradores. Tu rol actual es <span className="text-red-400/70">{orgRole}</span>.
          </p>
        </div>
      </main>
    );
  }

  // Consulta de Miembros Activos en la Base de Datos Local
  const miembros = await prisma.usuario.findMany({
    where: {
      organizacion: { clerkOrganizationId: orgId },
      roles: { 
        some: { 
          rol: { nombreRol: "org:member" }, 
          fechaBaja: null 
        } 
      },
    },
    include: {
      roles: {
        where: { rol: { nombreRol: "org:member" }, fechaBaja: null },
        include: { rol: true },
      },
    },
    orderBy: { nombreCompleto: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-300 selection:bg-blue-500/30">
      <main className="p-10 max-w-7xl mx-auto">
        
        {/* Header con Título e Invitación */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <UserCheck className="w-3 h-3" />
              Gestión de Permisos
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white">Asistentes</h1>
            <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
              Panel administrativo para configurar accesos y gestionar el estado activo de los colaboradores.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-6">
            <InviteMemberModal />
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-6 py-4 rounded-[1.5rem] backdrop-blur-xl">
              <div className="text-right">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Miembros</span>
                <span className="text-4xl font-black text-white leading-none">{miembros.length}</span>
              </div>
              <div className="w-[1px] h-12 bg-white/10 mx-2" />
              <Users className="w-8 h-8 text-blue-500/30" />
            </div>
          </div>
        </header>

        {/* Listado Principal */}
        <section className="grid gap-6">
          {miembros.length > 0 ? (
            miembros.map((usuario) => (
              <div
                key={usuario.id}
                className="group relative flex flex-col lg:flex-row lg:items-center gap-10 p-8 rounded-[3rem] border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-500"
              >
                {/* Perfil */}
                <div className="flex items-center gap-8 flex-1">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-3xl font-black text-white shadow-2xl transition-transform duration-500 group-hover:scale-105">
                      {usuario.nombreCompleto[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-[5px] border-[#030712] rounded-full"></div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      {usuario.nombreCompleto}
                      <ChevronRight className="w-5 h-5 text-white/5 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-slate-500 font-medium">{usuario.email}</p>
                  </div>
                </div>

                {/* Toggles de Permisos Locales */}
                <div className="flex flex-col gap-4 min-w-[320px]">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Privilegios</span>
                  <div className="flex gap-4">
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
                </div>

                {/* Acciones de Rol y Baja */}
                <div className="flex items-center justify-between lg:justify-end gap-12 border-t lg:border-t-0 lg:border-l border-white/[0.05] pt-8 lg:pt-0 lg:pl-12">
                  <div className="text-right space-y-2">
                    <span className="block text-[10px] font-black text-blue-500 uppercase tracking-widest">Rol</span>
                    <span className="inline-block px-4 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[12px] font-black text-blue-400">
                      {usuario.roles[0]?.rol.nombreRol.replace("org:", "").toUpperCase()}
                    </span>
                  </div>
                  <BajaMiembroButton usuarioId={usuario.id} nombre={usuario.nombreCompleto} />
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-48 border-2 border-dashed border-white/[0.02] rounded-[4rem] bg-white/[0.01]">
              <Users className="w-16 h-16 text-white/5 mb-6" />
              <h3 className="text-2xl font-bold text-white/20 tracking-tight">Sin asistentes activos</h3>
              <p className="text-slate-600 font-medium">Invitá a nuevos miembros para que aparezcan en esta lista.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}