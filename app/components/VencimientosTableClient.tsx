"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

interface VencimientoOcurrencia {
  id: string;
  vencimientoId: string;
  fechaVencimiento: string;
  estado: string;
  vencimiento: {
    id: string;
    titulo: string;
    tipoVencimiento: string;
  };
}

interface VencimientosTableClientProps {
  ocurrencias: VencimientoOcurrencia[];
  canModify: boolean;
  canDelete: boolean;
  puedeTrabajar: boolean;
}

export default function VencimientosTableClient({
  ocurrencias: initialOcurrencias,
  canModify,
  canDelete,
  puedeTrabajar,
}: VencimientosTableClientProps) {
  const [ocurrencias, setOcurrencias] = useState(initialOcurrencias);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    ocurrencia: VencimientoOcurrencia | null;
  }>({ isOpen: false, ocurrencia: null });

  const handleOpenDelete = (ocurrencia: VencimientoOcurrencia) => {
    setDeleteModal({ isOpen: true, ocurrencia });
  };

  const handleDeleteOne = async () => {
    if (!deleteModal.ocurrencia) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/vencimientos/ocurrencias/${deleteModal.ocurrencia.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleteFollowing: false }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Error al eliminar");
        return;
      }

      // Eliminar del state
      setOcurrencias(
        ocurrencias.filter((o) => o.id !== deleteModal.ocurrencia!.id)
      );
      setDeleteModal({ isOpen: false, ocurrencia: null });
    } catch (error) {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAndFollowing = async () => {
    if (!deleteModal.ocurrencia) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/vencimientos/ocurrencias/${deleteModal.ocurrencia.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleteFollowing: true }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Error al eliminar");
        return;
      }

      // Eliminar del state: esta ocurrencia y todas las posteriores del mismo vencimiento
      const selectedVencimientoId = deleteModal.ocurrencia!.vencimientoId;
      const selectedFecha = deleteModal.ocurrencia!.fechaVencimiento;
      const filteredOcurrencias = ocurrencias.filter(
        (o) =>
          o.vencimientoId !== selectedVencimientoId ||
          o.fechaVencimiento < selectedFecha
      );
      setOcurrencias(filteredOcurrencias);
      setDeleteModal({ isOpen: false, ocurrencia: null });
    } catch (error) {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const isLastOcurrence = deleteModal.ocurrencia
    ? deleteModal.ocurrencia.id ===
      ocurrencias[ocurrencias.length - 1]?.id
    : false;

  if (ocurrencias.length === 0) {
    return <p className="text-gray-600">No hay vencimientos cargados.</p>;
  }

  return (
    <>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Título</th>
            <th className="px-4 py-2 text-left">Tipo</th>
            <th className="px-4 py-2 text-left">Fecha</th>
            <th className="px-4 py-2 text-left">Estado</th>
            {(canModify || canDelete) && (
              <th className="px-4 py-2 text-left">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {ocurrencias.map((o) => (
            <tr key={o.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{o.vencimiento.titulo}</td>
              <td className="px-4 py-2">{o.vencimiento.tipoVencimiento}</td>
              <td className="px-4 py-2">
                {(() => {
                  const str = typeof o.fechaVencimiento === "string" ? o.fechaVencimiento : new Date(o.fechaVencimiento).toISOString();
                  const [y, m, d] = str.split("T")[0].split("-");
                  return `${d}/${m}/${y}`;
                })()}
              </td>
              <td className="px-4 py-2">{o.estado}</td>
              {(canModify || canDelete) && (
                <td className="px-4 py-2 flex gap-2">
                  <Link
                    href={`/vencimientos/${o.vencimientoId}`}
                    className="text-gray-500 hover:text-gray-700 text-sm underline"
                    title="Ver detalle"
                  >
                    Ver Detalle
                  </Link>
                  {canModify && puedeTrabajar && (
                    <Link
                      href={`/vencimientos/${o.vencimientoId}/modificar`}
                      className="text-blue-500 hover:text-blue-700"
                      title="Modificar"
                    >
                      <Edit size={18} />
                    </Link>
                  )}
                  {canDelete && puedeTrabajar && (
                    <button
                      onClick={() => handleOpenDelete(o)}
                      className="text-red-500 hover:text-red-700"
                      title="Eliminar"
                      disabled={loading}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de confirmación */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        fecha={deleteModal.ocurrencia?.fechaVencimiento || ""}
        onClose={() => setDeleteModal({ isOpen: false, ocurrencia: null })}
        onDeleteOne={handleDeleteOne}
        onDeleteAndFollowing={handleDeleteAndFollowing}
        isLast={isLastOcurrence}
      />
    </>
  );
}
