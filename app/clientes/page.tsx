import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ClientesPage() {
  const { userId, orgId } = await auth();

  // 1. Protección de ruta básica
  if (!userId || !orgId) {
    redirect("/");
  }

  // 2. Verificar permiso granular en tu tabla 'Usuario'
  // Usamos la llave compuesta @@unique([clerkId, organizacionId])
  const usuarioLocal = await prisma.usuario.findUnique({
    where: {
      clerkId_organizacionId: {
        clerkId: userId,
        organizacionId: orgId,
      },
    },
  });

  if (!usuarioLocal?.permisoClientes) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-red-500 font-bold text-xl">Acceso Denegado</h1>
        <p>No tienes permisos para gestionar la cartera de clientes.</p>
      </div>
    );
  }

  // 3. Consultar Clientes
  // Como Cliente hereda de Recurso, filtramos por recurso.organizacionId
  const clientes = await prisma.cliente.findMany({
    where: {
      recurso: {
        organizacionId: orgId,
      },
    },
    include: {
      recurso: true, // Para obtener el nombre y descripción base si los necesitas
    },
    orderBy: {
      nombreCompleto: "asc",
    },
  });

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cartera de Clientes</h1>
          <p className="text-slate-500">Gestión de recursos de tipo Cliente</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Nuevo Cliente
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Nombre Completo</th>
              <th className="p-4 font-semibold text-slate-700">Email</th>
              <th className="p-4 font-semibold text-slate-700">Teléfono</th>
              <th className="p-4 font-semibold text-slate-700">Estado</th>
              <th className="p-4 font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400">
                  No hay clientes registrados en esta organización.
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-900 font-medium">
                    {cliente.nombreCompleto}
                  </td>
                  <td className="p-4 text-slate-600">{cliente.email || "-"}</td>
                  <td className="p-4 text-slate-600">{cliente.telefono || "-"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cliente.estado === 'ACTIVO' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cliente.estado}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}