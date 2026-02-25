"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Edit, Trash2, Search } from "lucide-react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { ModalError } from "./modalError";

interface VencimientoOcurrencia {
  id: string;
  vencimientoId: string;
  fechaVencimiento: string | Date;
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
}

export default function VencimientosTableClient({
  ocurrencias: initialOcurrencias,
  canModify,
  canDelete,
}: VencimientosTableClientProps) {
  const [ocurrencias, setOcurrencias] = useState(initialOcurrencias);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    ocurrencia: VencimientoOcurrencia | null;
  }>({ isOpen: false, ocurrencia: null });

  // --- Filtros ---
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroDespuesDe, setFiltroDespuesDe] = useState("");
  const [filtroAntesDe, setFiltroAntesDe] = useState("");


  const ocurrenciasFiltradas = useMemo(() => {
    return ocurrencias.filter((o) => {
      // Filtro por nombre (búsqueda parcial, case-insensitive)
      if (
        filtroNombre &&
        !o.vencimiento.titulo.toLowerCase().includes(filtroNombre.toLowerCase())
      ) {
        return false;
      }
      // Filtro por tipo
      if (filtroTipo && o.vencimiento.tipoVencimiento !== filtroTipo) {
        return false;
      }
      // Filtro vence después de
      if (filtroDespuesDe) {
        const raw = typeof o.fechaVencimiento === "string" ? o.fechaVencimiento : new Date(o.fechaVencimiento).toISOString();
        const fecha = raw.split("T")[0];
        if (fecha < filtroDespuesDe) return false;
      }
      // Filtro vence antes de
      if (filtroAntesDe) {
        const raw = typeof o.fechaVencimiento === "string" ? o.fechaVencimiento : new Date(o.fechaVencimiento).toISOString();
        const fecha = raw.split("T")[0];
        if (fecha > filtroAntesDe) return false;
      }
      return true;
    });
  }, [ocurrencias, filtroNombre, filtroTipo, filtroDespuesDe, filtroAntesDe]);

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroTipo("");
    setFiltroDespuesDe("");
    setFiltroAntesDe("");
  };

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
        setErrorMsg(data.error || "Error al eliminar");
        return;
      }

      // Eliminar del state
      setOcurrencias(
        ocurrencias.filter((o) => o.id !== deleteModal.ocurrencia!.id)
      );
      setDeleteModal({ isOpen: false, ocurrencia: null });
    } catch (error) {
      setErrorMsg("Error al conectar con el servidor");
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
        setErrorMsg(data.error || "Error al eliminar");
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
      setErrorMsg("Error al conectar con el servidor");
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

  const tieneAlgunFiltro = filtroNombre || filtroTipo || filtroDespuesDe || filtroAntesDe;

  return (
    <>
      {/* Card de Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Nombre impuesto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text/60 uppercase tracking-wide">
              Nombre del impuesto
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              className="input-base"
            />
          </div>

          {/* Tipo impuesto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text/60 uppercase tracking-wide">
              Tipo de impuesto
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="input-base"
            >
              <option value="">Todos</option>
              <option value="Nacional">Nacional</option>
              <option value="Provincial">Provincial</option>
              <option value="Municipal">Municipal</option>
            </select>
          </div>

          {/* Vence después de */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text/60 uppercase tracking-wide">
              Vence después de
            </label>
            <input
              type="date"
              value={filtroDespuesDe}
              onChange={(e) => setFiltroDespuesDe(e.target.value)}
              className="input-base"
            />
          </div>

          {/* Vence antes de */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text/60 uppercase tracking-wide">
              Vence antes de
            </label>
            <input
              type="date"
              value={filtroAntesDe}
              onChange={(e) => setFiltroAntesDe(e.target.value)}
              className="input-base"
            />
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {tieneAlgunFiltro && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={limpiarFiltros}
              className="text-sm text-text/50 hover:text-text/80 underline transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Card de Tabla */}
      <div className="table-card">

        {tieneAlgunFiltro && (
          <h2 className="text-lg font-bold text-text flex items-center gap-2 m-4">
            <span className="text-sm font-normal text-text/50">
              Vencimeintos encontrados ({ocurrenciasFiltradas.length} de {ocurrencias.length})
            </span>
          </h2>
        )}


        {ocurrenciasFiltradas.length === 0 ? (
          <p className="text-text/50 text-sm py-8 text-center">
            No se encontraron vencimientos con los filtros aplicados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Impuesto</th>
                  <th>Categoría</th>
                  <th>Vencimiento</th>
                  <th>Días Faltantes</th>
                  {(canModify || canDelete) && (
                    <th>Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {ocurrenciasFiltradas.map((o) => {
                  const str = typeof o.fechaVencimiento === "string" ? o.fechaVencimiento : new Date(o.fechaVencimiento).toISOString();
                  const [y, m, d] = str.split("T")[0].split("-");
                  const fechaFormateada = `${d} / ${m} / ${y}`;

                  // Calcular días faltantes
                  const hoy = new Date();
                  const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate(), 0, 0, 0, 0));
                  const fechaParts = str.split("T")[0].split("-");
                  const año = parseInt(fechaParts[0]);
                  const mes = parseInt(fechaParts[1]);
                  const día = parseInt(fechaParts[2]);
                  const fechaVenc = new Date(Date.UTC(año, mes - 1, día, 0, 0, 0, 0));
                  const diffMs = fechaVenc.getTime() - hoyUTC.getTime();
                  const diasFaltantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                  // Color badge para tipo
                  const tipoBadgeColor: Record<string, string> = {
                    Nacional: "bg-[#d4edda] text-[#155724]",
                    Provincial: "bg-[#fff3cd] text-[#856404]",
                    Municipal: "bg-[#fce4ec] text-[#b71c1c]",
                  };
                  const badgeClass = tipoBadgeColor[o.vencimiento.tipoVencimiento] || "bg-gray-100 text-gray-600";

                  return (
                    <tr key={o.id} className="table-row">
                      <td className="px-4 py-3 font-medium text-text">{o.vencimiento.titulo}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                          {o.vencimiento.tipoVencimiento}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-text">{fechaFormateada}</td>
                      <td className="px-4 py-3 text-center font-semibold text-text">
                        {diasFaltantes}
                      </td>
                      {(canModify || canDelete) && (
                        <td className="px-4 py-3 flex gap-3 items-center">
                          <Link
                            href={`/vencimientos/${o.vencimientoId}`}
                            className="text-text/50 hover:text-text text-sm underline transition-colors"
                            title="Ver detalle"
                          >
                            Ver detalle
                          </Link>
                          {canModify && (
                            <Link
                              href={`/vencimientos/${o.vencimientoId}/modificar`}
                              className="text-text/40 hover:text-primary-foreground transition-colors"
                              title="Modificar"
                            >
                              <Edit size={18} />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleOpenDelete(o)}
                              className="text-danger-foreground/60 hover:text-danger-foreground transition-colors"
                              title="Eliminar"
                              disabled={loading}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        fecha={
          deleteModal.ocurrencia
            ? typeof deleteModal.ocurrencia.fechaVencimiento === "string"
              ? deleteModal.ocurrencia.fechaVencimiento
              : new Date(deleteModal.ocurrencia.fechaVencimiento).toISOString()
            : ""
        }
        titulo={deleteModal.ocurrencia?.vencimiento.titulo}
        onClose={() => setDeleteModal({ isOpen: false, ocurrencia: null })}
        onDeleteOne={handleDeleteOne}
        onDeleteAndFollowing={handleDeleteAndFollowing}
        isLast={isLastOcurrence}
      />

      {errorMsg && (
        <ModalError
          mensaje={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}
    </>
  );
}
