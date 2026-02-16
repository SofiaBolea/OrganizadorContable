import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FormularioCrearCliente } from "./formularioCrearCliente";
import { AccionesCliente } from "./accionesClientes";
import { FiltrosClientes } from "./filtrosClientes";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId, orgId, has } = await auth();
  const params = await searchParams;

  if (!userId || !orgId) redirect("/");

  // 1. Permisos y datos locales
  const [orgLocal, usuarioActual] = await Promise.all([
    prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true, nombre: true }
    }),
    prisma.usuario.findFirst({
      where: { clerkId: userId, organizacionId: { not: "" } },
      select: { id: true, permisoClientes: true }
    })
  ]);

  if (!orgLocal || !usuarioActual) return <div>Sincronizando...</div>;

  const esAdmin = has({ role: "org:admin" });
  const veTodo = esAdmin || usuarioActual.permisoClientes;

  // 2. Construcción del Filtro Dinámico (CU-008)
  const nombre = typeof params.nombre === "string" ? params.nombre : undefined;
  const cuit = typeof params.cuit === "string" ? params.cuit : undefined;
  const asistenteId = typeof params.asistenteId === "string" ? params.asistenteId : undefined;

  const filtroWhere: any = {
    recurso: { organizacionId: orgLocal.id },
    estado: "ACTIVO",
  };

  if (nombre) filtroWhere.nombreCompleto = { contains: nombre, mode: 'insensitive' };
  if (cuit) filtroWhere.cuit = { contains: cuit };

  if (!veTodo) {
    filtroWhere.asignaciones = { some: { usuarioId: usuarioActual.id } };
  } else if (asistenteId) {
    filtroWhere.asignaciones = { some: { usuarioId: asistenteId } };
  }

  // 3. Consultas a la DB
  const [clientes, asistentes] = await Promise.all([
    prisma.cliente.findMany({
      where: filtroWhere,
      include: {
        recurso: true,
        asignaciones: { select: { usuarioId: true } }
      },
      orderBy: { nombreCompleto: "asc" },
    }),
    prisma.usuario.findMany({
      where: {
        organizacionId: orgLocal.id,
        roles: { none: { rol: { nombreRol: { in: ["org:admin", "admin"] } } } }
      },
      select: { id: true, nombreCompleto: true }
    })
  ]);

  const puedeCrear = veTodo && has({ permission: "org:clientes:crear_cliente" });
  const puedeEditar = veTodo && has({ permission: "org:clientes:modificar_cliente" });
  const puedeEliminar = veTodo && has({ permission: "org:clientes:eliminar_cliente" });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight italic">
            Lista de Clientes
          </h1>
          <p className="text-slate-500 mt-1">
            {veTodo ? `Estudio ${orgLocal.nombre}` : `Tus Clientes Asignados`}
          </p>
        </div>
        {puedeCrear && <FormularioCrearCliente asistentes={asistentes} />}
      </header>

      <FiltrosClientes asistentes={asistentes} esAdmin={veTodo} />

      {/* Tabla con las columnas de la imagen image_a5d3e3 */}
      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-slate-200">
            <tr className="text-sm font-bold text-slate-600">
              <th className="p-6">Nombre / Razon Social</th>
              <th className="p-6">Email</th>
              <th className="p-6">Teléfono</th>
              <th className="p-6">CUIT</th>
              {(puedeEditar || puedeEliminar) && <th className="p-6 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-20 text-center text-slate-400">
                  No se encontraron clientes.
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                  {/* Nombre / Razon Social */}
                  <td className="p-6 text-slate-700 font-medium">{cliente.nombreCompleto}</td>
                  
                  {/* Email */}
                  <td className="p-6 text-slate-600">{cliente.email || "---"}</td>
                  
                  {/* Teléfono */}
                  <td className="p-6 text-slate-600">{cliente.telefono || "---"}</td>
                  
                  {/* CUIT */}
                  <td className="p-6 text-slate-600 font-mono">{cliente.cuit || "---"}</td>

                  {/* Acciones */}
                  {(puedeEditar || puedeEliminar) && (
                    <td className="p-6">
                      <div className="flex justify-center">
                        <AccionesCliente 
                          cliente={cliente} 
                          asistentes={asistentes}
                          permisos={{ puedeEditar, puedeEliminar }}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <footer className="mt-6 flex justify-between items-center text-slate-400 text-xs px-4">
        <div>Mostrando {clientes.length} resultados</div>
        <div className="italic">Organizador Contable v1.0</div>
      </footer>
    </div>
  );
}