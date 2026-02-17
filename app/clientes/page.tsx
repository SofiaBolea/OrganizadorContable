import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FormularioCrearCliente } from "./formularioCrearCliente";
import { AccionesCliente } from "./accionesClientes";
import { FiltrosClientes } from "./filtrosClientes";
import TableCliente from "./tableClientes";
import { Permisos } from "@/lib/permisos";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId, orgId, has } = await auth();
  const params = await searchParams;

  if (!userId || !orgId) redirect("/");

// 1. Buscamos primero la organización
  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true, nombre: true }
  });

  if (!orgLocal) return <div className="p-10 text-amber-600">Sincronizando organización...</div>;

  // 2. Buscamos al usuario usando el ID de la organización encontrada
  const usuarioActual = await prisma.usuario.findFirst({
    where: { 
      clerkId: userId, 
      organizacionId: orgLocal.id // Nos aseguramos que pertenezca a esta org
    },
    select: { id: true, permisoClientes: true, organizacionId: true }
  });

  if (!orgLocal || !usuarioActual) return <div>Sincronizando...</div>;

  // Centralizar permisos usando Permisos.ts
  const esAdmin = has({ role: "org:admin" });
  const veTodo = esAdmin || usuarioActual.permisoClientes;
  // Permisos de acciones
  const puedeCrear = await Permisos.puedeCrearCliente();
  const puedeEditar = await Permisos.puedeEditarCliente();
  const puedeEliminar = await Permisos.puedeEliminarCliente();

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
        <TableCliente permisos={{ puedeEditar, puedeEliminar }} asistentes={asistentes} usuarioActual={usuarioActual} />
      </div>
      
      <footer className="mt-6 flex justify-between items-center text-slate-400 text-xs px-4">
        <div>Mostrando {clientes.length} resultados</div>
        <div className="italic">Organizador Contable v1.0</div>
      </footer>
    </div>
  );
}