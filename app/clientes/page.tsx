import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FormularioCrearCliente } from "./formularioCrearCliente";

export default async function ClientesPage() {
  // 1. Obtener datos de sesión y permisos de Clerk
  const { userId, orgId, has } = await auth();

  // Si no hay sesión o no hay organización seleccionada, redirigir
  if (!userId || !orgId) {
    redirect("/");
  }

  // 2. Validar Permiso de Vista (según tu requerimiento)
  const puedeVerClientes = has({ permission: "org:clientes:ver_clientes" });

  if (!puedeVerClientes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Acceso Restringido</h1>
        <p className="text-slate-500 max-w-md">
          No tienes el permiso <code className="text-red-500 font-mono">org:clientes:ver_clientes</code> necesario para ver la cartera de clientes.
        </p>
      </div>
    );
  }

  // 3. Obtener el ID interno de la Organización
  // Esto es necesario porque en tu DB los usuarios y clientes usan el CUID, no el "org_..." de Clerk
  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true, nombre: true }
  });

  if (!orgLocal) {
    return (
      <div className="p-8 text-amber-600 bg-amber-50 rounded-lg">
        La organización aún no ha sido sincronizada en la base de datos local. Por favor, intenta recargar en unos segundos.
      </div>
    );
  }

  // 4. Cargar Clientes (Estructura TPT: Cliente vinculado a Recurso)
  const clientes = await prisma.cliente.findMany({
    where: {
      recurso: {
        organizacionId: orgLocal.id,
      },
    },
    include: {
      recurso: true,
    },
    orderBy: {
      nombreCompleto: "asc",
    },
  });
  
  const asistentes = await prisma.usuario.findMany({
    where: {
      organizacionId: orgLocal.id,
      // Filtramos para que NO traiga a los que tienen el rol de admin
      roles: {
        none: {
          rol: {
            nombreRol: {
              // Excluimos tanto el formato de Clerk como el genérico por seguridad
              in: ["org:admin", "admin"]
            }
          }
        }
      }
    },
    select: {
      id: true,
      nombreCompleto: true,
      email: true
    },
    orderBy: {
      nombreCompleto: "asc"
    }
  });

  // 6. Verificar permiso de creación para mostrar el botón
  const puedeCrear = has({ permission: "org:clientes:crear_cliente" });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Clientes
          </h1>
          <p className="text-slate-500 mt-1">
            Gestionando clientes para <span className="font-semibold text-indigo-600">{orgLocal.nombre}</span>
          </p>
        </div>

        {/* Botón y Formulario de Creación */}
        {puedeCrear ? (
          <FormularioCrearCliente asistentes={asistentes} />
        ) : (
          <div className="text-xs text-slate-400 italic">
            No tienes permisos para registrar nuevos clientes.
          </div>
        )}
      </header>

      {/* Tabla de Resultados */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CUIT</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-16 text-center">
                  <p className="text-slate-400 text-lg">No hay clientes registrados en esta organización.</p>
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{cliente.nombreCompleto}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{cliente.id}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm text-slate-600">
                    {cliente.cuit || "---"}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col text-sm">
                      <span className="text-slate-600">{cliente.email || "Sin email"}</span>
                      <span className="text-slate-400 text-xs">{cliente.telefono || ""}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cliente.estado === 'ACTIVO'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                      {cliente.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-6 text-slate-400 text-sm">
        Total: {clientes.length} cliente(s) encontrado(s).
      </footer>
    </div>
  );
}