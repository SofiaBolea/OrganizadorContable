// app/clientes/page.tsx
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FormularioCrearCliente } from "./formularioCrearCliente";
import { FiltrosClientes } from "./filtrosClientes";
import TableCliente from "./tableClientes";
import { Permisos } from "@/lib/permisos";
import { listarClientes } from "@/lib/clientes";

export default async function ClientesPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams; 
  const { userId, orgId } = await auth();
  

  if (!userId || !orgId) redirect("/");

  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true, nombre: true }
  });

  if (!orgLocal) return <div className="p-8 italic text-slate-500">Sincronizando organización...</div>;

  const puedeCrear = await Permisos.puedeCrearCliente();
  const puedeVerTodosLosClientes = await Permisos.puedeVerTodosLosClientes();

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex justify-between items-end mb-10">
        {puedeCrear && <FormularioCrearCliente />}
      </header>

      <FiltrosClientes esAdmin={puedeVerTodosLosClientes} />

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
        <Suspense fallback={<div className="p-20 text-center text-slate-500 italic">Cargando clientes...</div>}>
          <ClientesTableContainer searchParams={searchParams} orgId={orgLocal.id} />
        </Suspense>
      </div>
    </div>
  );
}

async function ClientesTableContainer({ searchParams, orgId }: { searchParams: any, orgId: string }) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.append(key, value as string);
  });

  const mockRequest = { nextUrl: { searchParams: params } } as any;
  const clientes = await listarClientes(mockRequest);
  const puedeEditar = await Permisos.puedeEditarCliente();
  const puedeEliminar = await Permisos.puedeEliminarCliente();

  return (
    <TableCliente 
      initialClientes={clientes || []} 
      permisos={{ puedeEditar, puedeEliminar }} 
    />
  );
}