"use client";

import { useEffect, useState, memo } from "react";
import { useSearchParams } from "next/navigation";
import { AccionesCliente } from "./accionesClientes";

function TableCliente({ asistentes, permisos }: any) {
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
    <>
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
      <div className="flex items-center gap-2 mt-4 mb-2 p-2 rounded-md text-sm font-medium justify-center" style={{ background: '#E7F4DE', color: '#90BF77' }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12A9 9 0 11 3 12a9 9 0 0118 0z" />
        </svg>
        Los asistentes con permiso activado tendrán la capacidad de cargar clientes y/o vencimientos impositivos libremente
      </div>
    </>
  );
}

export default memo(TableCliente);