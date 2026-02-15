import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Users, ShieldAlert, Lock, UserCheck, ChevronRight } from "lucide-react";
import { PermissionToggle } from "./permissionToggle";
import { BajaMiembroButton } from "./bajaMiembroButton";
import { InviteMemberModal } from "./inviteMemberModal";

export default async function AsistentesPage() {
  // 1. Verificación de permisos granulares de Clerk
  const { orgId, has } = await auth();

  if (!orgId) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Organización Requerida</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Seleccioná un espacio de trabajo para gestionar los permisos de tus asistentes.
          </p>
        </div>
      </main>
    );
  }


  const canView = has({ permission: "org:asistentes:ver_asistentes" }); 
  const canInvite = has({ permission: "org:asistentes:crear_asistente" });

  if (!canView) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-red-500/[0.02] border border-red-500/10 p-12 rounded-[3rem] text-center max-w-md shadow-2xl">
          <Lock className="w-10 h-10 text-red-500/50 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-2">Acceso Denegado</h2>
          <p className="text-slate-500 italic">
            No tenés el permiso "Ver Asistentes" asignado en tu rol.
          </p>
        </div>
      </main>
    );
  }

  // 2. Consulta a Prisma: Usuarios activos vinculados a esta Org 
  const miembros = await prisma.usuario.findMany({
    where: {
      organizacion: { clerkOrganizationId: orgId },
      roles: { 
        some: { 
          rol: { nombreRol: "org:member" }, 
          fechaBaja: null // Solo usuarios sin fecha de baja 
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
      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        
        {/* Header Responsivo y Profesional */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 md:mb-24">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <UserCheck className="w-3 h-3" />
              Acceso Granular
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
              Asistentes
            </h1>
            <p className="text-slate-500 text-base md:text-xl max-w-2xl font-medium leading-relaxed">
              Gestioná los permisos de <span className="text-white">Clientes y Vencimientos</span> para los colaboradores de tu estudio.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
            {canInvite && <InviteMemberModal />}
            
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-6 py-4 rounded-[1.5rem] backdrop-blur-xl w-full md:w-auto justify-center">
              <div className="text-right">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Activos</span>
                <span className="text-4xl font-black text-white leading-none">{miembros.length}</span>
              </div>
              <div className="w-[1px] h-12 bg-white/10 mx-2" />
              <Users className="w-8 h-8 text-blue-500/20" />
            </div>
          </div>
        </header>

        {/* Listado de Miembros Estilo Card */}
        <section className="grid gap-6">
          {miembros.length > 0 ? (
            miembros.map((usuario) => (
              <div
                key={usuario.id}
                className="group relative flex flex-col lg:flex-row lg:items-center gap-8 md:gap-12 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-500"
              >
                {/* Perfil y Datos Básicos */}
                <div className="flex items-center gap-6 md:gap-8 flex-1">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-2xl md:text-4xl font-black text-white shadow-2xl transition-transform duration-500 group-hover:scale-105">
                      {usuario.nombreCompleto[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-7 md:h-7 bg-emerald-500 border-[4px] md:border-[6px] border-[#030712] rounded-full shadow-lg"></div>
                  </div>
                  
                  <div className="space-y-1 md:space-y-2 min-w-0">
                    <h3 className="text-xl md:text-3xl font-bold text-white flex items-center gap-3 truncate">
                      {usuario.nombreCompleto}
                      <ChevronRight className="w-5 h-5 text-white/5 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
                    </h3>
                    <p className="text-sm md:text-lg text-slate-500 font-medium truncate italic">{usuario.email}</p>
                  </div>
                </div>

                {/* Toggles de Permisos Basados en el Esquema  */}
                <div className="flex flex-col gap-4 min-w-0 lg:min-w-[340px] border-t lg:border-t-0 border-white/5 pt-6 lg:pt-0">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-1">Módulos de Acceso</span>
                  <div className="flex flex-wrap gap-4">
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

                {/* Rol Local y Acción de Baja  */}
                <div className="flex items-center justify-between lg:justify-end gap-8 md:gap-12 border-t lg:border-t-0 lg:border-l border-white/[0.05] pt-6 lg:pt-0 lg:pl-12">
                  <div className="text-left lg:text-right space-y-1 md:space-y-2">
                    <span className="block text-[10px] font-black text-blue-500/50 uppercase tracking-widest">Rol Local</span>
                    <span className="inline-block px-4 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[11px] md:text-[13px] font-black text-blue-400 uppercase tracking-tighter">
                      {usuario.roles[0]?.rol.nombreRol.replace("org:", "")}
                    </span>
                  </div>
                  <BajaMiembroButton usuarioId={usuario.id} nombre={usuario.nombreCompleto} />
                </div>

              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-40 md:py-60 border-2 border-dashed border-white/[0.02] rounded-[4rem] bg-white/[0.01]">
              <Users className="w-16 h-16 md:w-24 md:h-24 text-white/5 mb-8" />
              <h3 className="text-2xl md:text-3xl font-bold text-white/20 tracking-tight">No hay asistentes</h3>
              <p className="text-slate-600 font-medium mt-2">Invitá a colaboradores para que aparezcan aquí.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}