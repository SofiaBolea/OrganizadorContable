// app/clientes/tableClientes.tsx
"use client";
import { memo } from "react";
import { AccionesCliente } from "./accionesClientes";
import { EmptyState } from "../components/emptyState";
import { Users } from "lucide-react";

function TableCliente({ initialClientes, asistentes, permisos }: any) {
  if (!initialClientes || initialClientes.length === 0) {
    return (
      <EmptyState 
        icon={Users}
        title="No se encontraron clientes"
        description="Ajusta los filtros o crea un nuevo cliente para empezar."
      />
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead className="border-b border-slate-200 bg-slate-50">
        <tr className="text-sm font-bold text-slate-600">
          <th className="p-6">Nombre / Razon Social</th>
          <th className="p-6">Email</th>
          <th className="p-6">Teléfono</th>
          <th className="p-6">CUIT</th>
          {(permisos.puedeEditar || permisos.puedeEliminar) && <th className="p-6 text-center">Acciones</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {initialClientes.map((cliente: any) => (
          <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
            <td className="p-6 text-slate-700 font-medium">{cliente.nombreCompleto}</td>
            <td className="p-6 text-slate-600">{cliente.email || "---"}</td>
            <td className="p-6 text-slate-600">{cliente.telefono || "---"}</td>
            <td className="p-6 text-slate-600 font-mono">{cliente.cuit || "---"}</td>
            <td className="p-6">
              <div className="flex justify-center">
                <AccionesCliente cliente={cliente} asistentes={asistentes} permisos={permisos} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export default memo(TableCliente);