"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AccionesCliente } from "./accionesClientes";

export default function TableCliente({ asistentes, permisos }: any) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      // Construimos la URL con los filtros actuales del navegador
      const url = `/api/clientes?${searchParams.toString()}`;
      
      try {
        const res = await fetch(url);
        const data = await res.json();
        setClientes(data);
      } catch (error) {
        console.error("Error fetching clientes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [searchParams]); // Se ejecuta cada vez que cambian los filtros

  if (loading) return <div className="p-20 text-center text-slate-500 italic">Cargando clientes...</div>;

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
        {clientes.length === 0 ? (
          <tr>
            <td colSpan={5} className="p-20 text-center text-slate-400">No se encontraron clientes.</td>
          </tr>
        ) : (
          clientes.map((cliente) => (
            <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
              <td className="p-6 text-slate-700 font-medium">{cliente.nombreCompleto}</td>
              <td className="p-6 text-slate-600">{cliente.email || "---"}</td>
              <td className="p-6 text-slate-600">{cliente.telefono || "---"}</td>
              <td className="p-6 text-slate-600 font-mono">{cliente.cuit || "---"}</td>
              <td className="p-6">
                <div className="flex justify-center">
                  <AccionesCliente 
                    cliente={cliente} 
                    asistentes={asistentes} 
                    permisos={permisos} 
                  />
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}