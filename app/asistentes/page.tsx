import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Users, ShieldAlert } from "lucide-react";
import { PermissionToggle } from "./permissionToggle";

export default async function AsistentesPage() {
  // 1. Obtener la organización activa de la sesión de Clerk
  const { orgId } = await auth();

  // Si no hay organización seleccionada, mostramos un aviso
  if (!orgId) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <ShieldAlert className="w-12 h-12 text-yellow-500/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
          <p className="text-white/60 max-w-xs">
            Por favor, seleccioná una organización en el menú superior para gestionar a los asistentes.
          </p>
        </div>
      </main>
    );
  }

  // 2. Consulta a PostgreSQL: Traemos usuarios vinculados a esta Org con rol de asistente
  const miembros = await prisma.usuario.findMany({
    where: {
      organizacion: {
        clerkOrganizationId: orgId,
      },
      roles: {
        some: {
          rol: {
            nombreRol: "org:member",
          },
          fechaBaja: null, // Solo mostramos los que no han sido dados de baja
        },
      },
    },
    include: {
      roles: {
        where: {
          rol: { nombreRol: "org:member" },
          fechaBaja: null,
        },
        include: {
          rol: true,
        },
      },
    },
    orderBy: {
      nombreCompleto: "asc",
    },
  });

  return (
    <main className="p-8 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Asistentes</h1>
            <p className="text-sm text-white/50">
              Gestioná los permisos de acceso para los miembros de tu equipo.
            </p>
          </div>
        </div>
        
        <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-white/70">
          <span className="font-mono font-bold text-blue-400">{miembros.length}</span> Miembros activos
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="grid gap-4">
        {miembros.length > 0 ? (
          miembros.map((usuario) => (
            <div
              key={usuario.id}
              className="group flex flex-col lg:flex-row lg:items-center gap-6 p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
            >
              {/* Información del Perfil */}
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg font-bold text-white border border-white/10">
                    {(usuario.nombreCompleto?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0a0a0a] rounded-full"></div>
                </div>
                
                <div className="min-w-0">
                  <p className="font-semibold text-white text-lg truncate leading-tight">
                    {usuario.nombreCompleto}
                  </p>
                  <p className="text-sm text-white/40 truncate">
                    {usuario.email}
                  </p>
                </div>
              </div>

              {/* Panel de Permisos (Client Components) */}
              <div className="flex flex-wrap items-center gap-3 py-4 lg:py-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6">
                <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold w-full lg:w-auto mb-2 lg:mb-0 mr-2">
                  Permisos:
                </p>
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

              {/* Etiqueta de Rol */}
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-white/50 uppercase tracking-widest">
                  {usuario.roles[0]?.rol.nombreRol.replace("org:", "")}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
            <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 font-medium">No se encontraron asistentes registrados.</p>
            <p className="text-xs text-white/20 mt-1">Invitá a nuevos miembros desde el panel de Clerk.</p>
          </div>
        )}
      </div>
    </main>
  );
}