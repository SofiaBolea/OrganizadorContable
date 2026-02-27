// app/clientes/tableClientes.tsx
"use client";
import { memo } from "react";
import { AccionesCliente } from "./accionesClientes";
import { EmptyState } from "../components/emptyState";
import { Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function TableCliente({ initialClientes, permisos }: any) {
  if (!initialClientes || initialClientes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No se encontraron clientes"
        description="Ajusta los filtros o crea un nuevo cliente para empezar."
      />
    );
  }

  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [asistentes, setAsistentes] = useState<any[]>([]);

  useEffect(() => {
    const fetchAsistentes = async () => {
      setLoading(true);
      try {
        // Construimos la query string a partir de los parámetros actuales de la URL
        const query = searchParams.toString();
        const res = await fetch(`/api/asistentes?${query}`);
        const data = await res.json();
        setAsistentes(data);
      } catch (error) {
        console.error("Error cargando asistentes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAsistentes();
  }, [searchParams]); // Se ejecuta cada vez que los filtros cambian la URL

  return (
  <div className="table-card">
    <table className="table-base">
      <thead>
        <tr>
          <th>Nombre / Razon Social</th>
          <th>Email</th>
          <th>Teléfono</th>
          <th>CUIT</th>
          {(permisos.puedeEditar || permisos.puedeEliminar) && (
            <th className="table-actions">Acciones</th>
          )}
        </tr>
      </thead>

      <tbody>
        {initialClientes.map((cliente: any) => (
          <tr key={cliente.id} className="table-row">
            <td>{cliente.nombreCompleto}</td>
            <td>{cliente.email || "---"}</td>
            <td>{cliente.telefono || "---"}</td>
            <td className="font-mono">{cliente.cuit || "---"}</td>
            <td className="table-actions">
              <div className="flex justify-center">
                <AccionesCliente
                  cliente={cliente}
                  asistentes={asistentes}
                  permisos={permisos}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
}
export default memo(TableCliente);