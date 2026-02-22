import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FormularioCrearCliente } from "./formularioCrearCliente";
import { FiltrosClientes } from "./filtrosClientes";
import TableCliente from "./tableClientes";
import { Permisos } from "@/lib/permisos";

export default async function ClientesPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/");

  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true, nombre: true }
  });

  if (!orgLocal) return <div>Sincronizando...</div>;

  // Obtenemos asistentes para el formulario y filtros
  const asistentes = await prisma.usuario.findMany({
    where: {
      organizacionId: orgLocal.id,
      roles: { none: { rol: { nombreRol: { in: ["org:admin", "admin"] } } } }
    },
    select: { id: true, nombreCompleto: true }
  });

  // Permisos para la UI
  const puedeCrear = await Permisos.puedeCrearCliente();
  const puedeEditar = await Permisos.puedeEditarCliente();
  const puedeEliminar = await Permisos.puedeEliminarCliente();
 const puedeVerTodosLosClientes = await Permisos.puedeVerTodosLosClientes();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight italic">Lista de Clientes</h1>
          <p className="text-slate-500 mt-1 italic">Estudio {orgLocal.nombre}</p>
        </div>
        {puedeCrear && <FormularioCrearCliente  />}
      </header>

      <FiltrosClientes  esAdmin={puedeVerTodosLosClientes} />

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
        <TableCliente 
          permisos={{ puedeEditar, puedeEliminar }} 
        />
      </div>
    </div>
  );
}