"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Edit, Trash2, Eye } from "lucide-react";
import ConfirmDeleteTareaModal from "./ConfirmDeleteTareaModal";
import ConfirmEstadoModal from "./ConfirmEstadoModal";
import type {
  TareaAsignacionRow,
  TareaDisplayRow,
} from "@/lib/tareas-shared";
import { expandirTareasADisplayRows } from "@/lib/tareas-shared";
import { get } from "http";
import { getTareasAsignadasAdmin, getTareasAsignadasAsistente } from "@/lib/tareas";
import { auth } from "@clerk/nextjs/server";

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

const FILAS_POR_PAGINA = 20;

const PRIORIDAD_CLASS: Record<string, string> = {
  ALTA: "badge-prioridad-alta",
  MEDIA: "badge-prioridad-media",
  BAJA: "badge-prioridad-baja",
};

const ESTADO_CLASS: Record<string, string> = {
  PENDIENTE: "badge-estado-pendiente",
  COMPLETADA: "badge-estado-completada",
  VENCIDA: "badge-estado-vencida",
  CANCELADA: "badge-estado-cancelada",
};

function formatFecha(fechaStr: string | null) {
  if (!fechaStr) return "Sin fecha";
  const parts = fechaStr.split("T")[0].split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getDiasFaltantes(fechaStr: string | null) {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr.split("T")[0] + "T00:00:00");
  const diffMs = fecha.getTime() - hoy.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// ═══════════════════════════════════════
// PROPS
// ═══════════════════════════════════════

interface TareasTableClientProps {
  tareas: TareaAsignacionRow[];
  esAdmin: boolean;
  modo: "asignadas" | "tareas-propias";
  mostrarColumnaAsistente?: boolean;
  canModify: boolean;
  canDelete: boolean;
  canRevertEstado: boolean;
  basePath: string;
}

// ═══════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════

export default function TareasTableClient({
  tareas: initialTareas,
  esAdmin,
  modo,
  mostrarColumnaAsistente = false,
  canModify,
  canDelete,
  canRevertEstado,
  basePath,
}: TareasTableClientProps) {
  const [tareasBase, setTareasBase] = useState(initialTareas);
  const [loading, setLoading] = useState(false);
  const [filasVisibles, setFilasVisibles] = useState(FILAS_POR_PAGINA);

  // Filtros
  const [filtroTitulo, setFiltroTitulo] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroAsistente, setFiltroAsistente] = useState("");
  const [filtroDespuesDe, setFiltroDespuesDe] = useState("");
  const [filtroAntesDe, setFiltroAntesDe] = useState("");

  // Modales
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    row: TareaDisplayRow | null;
  }>({ isOpen: false, row: null });

  const [estadoModal, setEstadoModal] = useState<{
    isOpen: boolean;
    row: TareaDisplayRow | null;
    nuevoEstado: string;
  }>({ isOpen: false, row: null, nuevoEstado: "" });
  // ─── Recargar tareas sin recargar toda la página ───
  
  /*
  const recargarTareas = async () => {


    try {
      const { orgId, userId } = await auth();
      if (!orgId || !userId) throw new Error("UNAUTHENTICATED: No autenticado.");

      const tareas = esAdmin
        ? await getTareasAsignadasAdmin(orgId, userId)
        : await getTareasAsignadasAsistente(orgId, userId);

      setTareasBase(tareas);
    } catch (err) {
      console.error("Error recargando tareas:", err);
    }
  };
  */

  // ─── Expandir tareas a filas de display ───
  const todasLasFilas = useMemo(
    () => expandirTareasADisplayRows(tareasBase),
    [tareasBase]
  );

  console.log("TareasTableClient - tareasBase:", todasLasFilas);

  // ─── Asistentes únicos para filtro ───
  const asistentesUnicos = useMemo(() => {
    const map = new Map<string, string>();
    todasLasFilas.forEach((t) => map.set(t.asignadoId, t.asignadoNombre));
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [todasLasFilas]);

  // ─── Filtrado ───
  const filasFiltradas = useMemo(() => {
    return todasLasFilas.filter((t) => {
      if (filtroTitulo && !t.titulo.toLowerCase().includes(filtroTitulo.toLowerCase())) return false;
      if (filtroPrioridad && t.prioridad !== filtroPrioridad) return false;
      if (filtroEstado && t.estado !== filtroEstado) return false;
      if (filtroAsistente && t.asignadoId !== filtroAsistente) return false;
      if (filtroDespuesDe && t.fechaOcurrencia) {
        if (t.fechaOcurrencia < filtroDespuesDe) return false;
      }
      if (filtroAntesDe && t.fechaOcurrencia) {
        if (t.fechaOcurrencia > filtroAntesDe) return false;
      }
      return true;
    });
  }, [todasLasFilas, filtroTitulo, filtroPrioridad, filtroEstado, filtroAsistente, filtroDespuesDe, filtroAntesDe]);

  // ─── Paginación ───
  const filasPaginadas = useMemo(
    () => filasFiltradas.slice(0, filasVisibles),
    [filasFiltradas, filasVisibles]
  );
  const hayMas = filasFiltradas.length > filasVisibles;

  const handleVerMas = () => {
    setFilasVisibles((prev) => prev + FILAS_POR_PAGINA);
  };

  const limpiarFiltros = () => {
    setFiltroTitulo("");
    setFiltroPrioridad("");
    setFiltroEstado("");
    setFiltroAsistente("");
    setFiltroDespuesDe("");
    setFiltroAntesDe("");
    setFilasVisibles(FILAS_POR_PAGINA);
  };

  const tieneAlgunFiltro =
    filtroTitulo || filtroPrioridad || filtroEstado || filtroAsistente || filtroDespuesDe || filtroAntesDe;

  // ─── Opciones de estado para una fila ───
  const getOpcionesEstado = (row: TareaDisplayRow) => {
    // Solo se puede alternar entre PENDIENTE y COMPLETADA
    // VENCIDA y CANCELADA son estados finales, no editables
    if (row.estado === "VENCIDA" || row.estado === "CANCELADA") return [];
    if (row.estado === "PENDIENTE") return ["COMPLETADA"];
    // Si está COMPLETADA, solo mostrar PENDIENTE si tiene permiso para revertir
    if (row.estado === "COMPLETADA") {
      return canRevertEstado ? ["PENDIENTE"] : [];
    }
    return [];
  };

  // ═══════════════════════════════════════
  // ACCIONES – CAMBIAR ESTADO
  // ═══════════════════════════════════════

  const handleCambiarEstado = async (row: TareaDisplayRow, nuevoEstado: string) => {
    if (modo === "asignadas" && !esAdmin && nuevoEstado === "COMPLETADA") {
      setEstadoModal({ isOpen: true, row, nuevoEstado });
      return;
    }
    await realizarCambioEstado(row, nuevoEstado);
  };

  const realizarCambioEstado = useCallback(
    async (row: TareaDisplayRow, nuevoEstado: string) => {
      setLoading(true);
      try {
        // Siempre materializar ocurrencia (tanto recurrentes como únicas)
        // Usar fechaOriginalOcurrencia para buscar la ocurrencia correcta por su fecha original
        const fechaOriginal = row.fechaOriginalOcurrencia || row.fechaOcurrencia || new Date().toISOString().split("T")[0];
        const res = await fetch("/api/tareas/ocurrencias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tareaAsignacionId: row.tareaAsignacionId,
            fechaOriginal,
            estado: nuevoEstado,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Error al cambiar estado");
          return;
        }
        const { data: ocurrencia } = await res.json();

        setTareasBase((prev) =>
          prev.map((t) => {
            if (t.tareaAsignacionId !== row.tareaAsignacionId) return t;
            const fechaKey = fechaOriginal.split("T")[0];
            const yaExiste = t.ocurrenciasMaterializadas.some(
              (o) => o.fechaOriginal.split("T")[0] === fechaKey
            );
            return {
              ...t,
              ocurrenciasMaterializadas: yaExiste
                ? t.ocurrenciasMaterializadas.map((o) =>
                  o.fechaOriginal.split("T")[0] === fechaKey
                    ? {
                      id: ocurrencia.id,
                      fechaOriginal: ocurrencia.fechaOriginal,
                      estado: ocurrencia.estado,
                      tituloOverride: ocurrencia.tituloOverride,
                      fechaOverride: ocurrencia.fechaOverride,
                      colorOverride: ocurrencia.colorOverride,
                      prioridadOverride: ocurrencia.prioridadOverride,
                      descripcionOverride: ocurrencia.descripcionOverride,
                    }
                    : o
                )
                : [
                  ...t.ocurrenciasMaterializadas,
                  {
                    id: ocurrencia.id,
                    fechaOriginal: ocurrencia.fechaOriginal,
                    estado: ocurrencia.estado,
                    tituloOverride: ocurrencia.tituloOverride,
                    fechaOverride: ocurrencia.fechaOverride,
                    colorOverride: ocurrencia.colorOverride,
                    prioridadOverride: ocurrencia.prioridadOverride,
                    descripcionOverride: ocurrencia.descripcionOverride,
                  },
                ],
            };
          })
        );
      } catch {
        alert("Error al conectar con el servidor");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleConfirmEstado = async () => {
    if (!estadoModal.row) return;
    await realizarCambioEstado(estadoModal.row, estadoModal.nuevoEstado);
    setEstadoModal({ isOpen: false, row: null, nuevoEstado: "" });
  };

  // ═══════════════════════════════════════
  // ACCIONES – ELIMINAR
  // ═══════════════════════════════════════

  const handleDeleteOne = async () => {
    if (!deleteModal.row) return;
    const row = deleteModal.row;
    setLoading(true);
    try {
      // Cancelar la ocurrencia (materializar con CANCELADA) en vez de eliminar la asignación
      if (row.ocurrenciaId) {
        // Ocurrencia ya materializada: marcarla CANCELADA
        const res = await fetch(`/api/tareas/ocurrencias/${row.ocurrenciaId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Error al cancelar");
          return;
        }
      } else {
        // Ocurrencia virtual: materializar con estado CANCELADA
        const fechaOriginal = row.fechaOcurrencia || new Date().toISOString().split("T")[0];
        const res = await fetch("/api/tareas/ocurrencias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tareaAsignacionId: row.tareaAsignacionId,
            fechaOriginal,
            estado: "CANCELADA",
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Error al cancelar");
          return;
        }
      }

      // Actualizar en memoria: agregar/actualizar ocurrencia con CANCELADA
      // expandirTareasADisplayRows filtrará las CANCELADA automáticamente
      const fechaKey = (row.fechaOcurrencia || new Date().toISOString()).split("T")[0];
      setTareasBase((prev) =>
        prev.map((t) => {
          if (t.tareaAsignacionId !== row.tareaAsignacionId) return t;
          const yaExiste = t.ocurrenciasMaterializadas.some(
            (o) => o.fechaOriginal.split("T")[0] === fechaKey
          );
          return {
            ...t,
            ocurrenciasMaterializadas: yaExiste
              ? t.ocurrenciasMaterializadas.map((o) =>
                o.fechaOriginal.split("T")[0] === fechaKey
                  ? { ...o, estado: "CANCELADA" }
                  : o
              )
              : [
                ...t.ocurrenciasMaterializadas,
                {
                  id: "temp",
                  fechaOriginal: fechaKey,
                  estado: "CANCELADA",
                  tituloOverride: null,
                  fechaOverride: null,
                  colorOverride: null,
                  prioridadOverride: null,
                  descripcionOverride: null,
                },
              ],
          };
        })
      );
      setDeleteModal({ isOpen: false, row: null });
      // Recargar solo la tabla
      //await recargarTareas();
      window.location.reload(); // Recargar toda la página para evitar inconsistencias en tareas recurrentes, se puede optimizar luego para solo recargar la tabla sin recargar toda la página
    } catch {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // Cancelar esta ocurrencia y todas las futuras
  const handleDeleteAll = async () => {
    if (!deleteModal.row) return;
    const row = deleteModal.row;
    setLoading(true);
    try {
      const fechaDesde = row.fechaOcurrencia || new Date().toISOString().split("T")[0];

      if (row.tieneRecurrencia) {
        // Tarea recurrente → cortar recurrencia y cancelar futuras
        const res = await fetch("/api/tareas/ocurrencias", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tareaAsignacionId: row.tareaAsignacionId,
            fechaDesde,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Error al cancelar");
          return;
        }

        // Actualizar en memoria: setear hastaFecha y marcar ocurrencias futuras como CANCELADA
        // No actualiza en la BD solo en lo que se muestra, el endpoint se encarga de actualizar correctamente la recurrencia y las ocurrencias futuras
        const fechaCorteStr = fechaDesde.split("T")[0];
        setTareasBase((prev) =>
          prev.map((t) => {
            if (t.tareaAsignacionId !== row.tareaAsignacionId) return t;
            // Actualizar hastaFecha en recurrencia (día anterior)
            const diaAnterior = new Date(fechaCorteStr + "T12:00:00");
            diaAnterior.setDate(diaAnterior.getDate() - 1);
            return {
              ...t,
              recurrencia: t.recurrencia
                ? { ...t.recurrencia, hastaFecha: diaAnterior.toISOString() }
                : null,
              ocurrenciasMaterializadas: t.ocurrenciasMaterializadas.map((o) =>
                o.fechaOriginal.split("T")[0] >= fechaCorteStr && o.estado === "PENDIENTE"
                  ? { ...o, estado: "CANCELADA" }
                  : o
              ),
            };
          })
        );
      } else {
        // Tarea no recurrente → cancelar la única ocurrencia
        if (row.ocurrenciaId) {
          const res = await fetch(`/api/tareas/ocurrencias/${row.ocurrenciaId}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Error al cancelar");
            return;
          }
        } else {
          const res = await fetch("/api/tareas/ocurrencias", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tareaAsignacionId: row.tareaAsignacionId,
              fechaOriginal: fechaDesde,
              estado: "CANCELADA",
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Error al cancelar");
            return;
          }
        }

        // Actualizar en memoria
        const fechaKey = fechaDesde.split("T")[0];
        setTareasBase((prev) =>
          prev.map((t) => {
            if (t.tareaAsignacionId !== row.tareaAsignacionId) return t;
            const yaExiste = t.ocurrenciasMaterializadas.some(
              (o) => o.fechaOriginal.split("T")[0] === fechaKey
            );
            return {
              ...t,
              ocurrenciasMaterializadas: yaExiste
                ? t.ocurrenciasMaterializadas.map((o) =>
                  o.fechaOriginal.split("T")[0] === fechaKey
                    ? { ...o, estado: "CANCELADA" }
                    : o
                )
                : [
                  ...t.ocurrenciasMaterializadas,
                  {
                    id: "temp",
                    fechaOriginal: fechaKey,
                    estado: "CANCELADA",
                    tituloOverride: null,
                    fechaOverride: null,
                    colorOverride: null,
                    prioridadOverride: null,
                    descripcionOverride: null,
                  },
                ],
            };
          })
        );
      }

      setDeleteModal({ isOpen: false, row: null });
      // Recargar solo la tabla
      window.location.reload(); // Recargar toda la página para evitar inconsistencias en tareas recurrentes, se puede optimizar luego para solo recargar la tabla sin recargar toda la página
    } catch {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════

  return (
    <>
      {/* Filtros */}
      <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-text mb-4">Filtros de Búsqueda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {mostrarColumnaAsistente && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text/60 uppercase tracking-wide">
                Asistente
              </label>
              <select
                value={filtroAsistente}
                onChange={(e) => {
                  setFiltroAsistente(e.target.value);
                  setFilasVisibles(FILAS_POR_PAGINA);
                }}
                className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-slate-700 focus:ring-2 focus:ring-[#98c18c] appearance-none cursor-pointer transition-all"
              >
                <option value="">Todos</option>
                {asistentesUnicos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text/60 uppercase tracking-wide">
              Título
            </label>
            <input
              type="text"
              placeholder="Buscar por título..."
              value={filtroTitulo}
              onChange={(e) => {
                setFiltroTitulo(e.target.value);
                setFilasVisibles(FILAS_POR_PAGINA);
              }}
              className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-[#98c18c] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text/60 uppercase tracking-wide">
              Prioridad
            </label>
            <select
              value={filtroPrioridad}
              onChange={(e) => {
                setFiltroPrioridad(e.target.value);
                setFilasVisibles(FILAS_POR_PAGINA);
              }}
              className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-slate-700 focus:ring-2 focus:ring-[#98c18c] appearance-none cursor-pointer transition-all"
            >
              <option value="">Todas</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text/60 uppercase tracking-wide">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setFilasVisibles(FILAS_POR_PAGINA);
              }}
              className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-slate-700 focus:ring-2 focus:ring-[#98c18c] appearance-none cursor-pointer transition-all"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="COMPLETADA">Completada</option>
              <option value="VENCIDA">Vencida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text/60 uppercase tracking-wide">
              Vence después de
            </label>
            <input
              type="date"
              value={filtroDespuesDe}
              onChange={(e) => {
                setFiltroDespuesDe(e.target.value);
                setFilasVisibles(FILAS_POR_PAGINA);
              }}
              className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-slate-700 focus:ring-2 focus:ring-[#98c18c] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text/60 uppercase tracking-wide">
              Vence antes de
            </label>
            <input
              type="date"
              value={filtroAntesDe}
              onChange={(e) => {
                setFiltroAntesDe(e.target.value);
                setFilasVisibles(FILAS_POR_PAGINA);
              }}
              className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-slate-700 focus:ring-2 focus:ring-[#98c18c] transition-all"
            />
          </div>
        </div>

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

      {/* Tabla */}
      <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-sm p-6">
        <h2 className="text-lg font-bold text-text mb-4">
          Lista de Tareas
          {tieneAlgunFiltro && (
            <span className="ml-2 text-sm font-normal text-text/50">
              ({filasFiltradas.length} de {todasLasFilas.length})
            </span>
          )}
        </h2>

        {filasFiltradas.length === 0 ? (
          <p className="text-text/50 text-sm py-8 text-center">
            {todasLasFilas.length === 0
              ? "No hay tareas cargadas."
              : "No se encontraron tareas con los filtros aplicados."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide">
                      Título
                    </th>
                    {mostrarColumnaAsistente && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide">
                        Asistente
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide">
                      Prioridad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide">
                      Días
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filasPaginadas.map((row) => {
                    const opcionesEstado = getOpcionesEstado(row);
                    const diasFaltantes = getDiasFaltantes(row.fechaOcurrencia);

                    return (
                      <tr
                        key={row.key}
                        className="border-b border-black/5 hover:bg-black/[0.02] transition-colors"
                        style={
                          row.refColorHexa
                            ? { borderLeft: `4px solid ${row.refColorHexa}` }
                            : undefined
                        }
                      >
                        {/* Título + badges */}
                        <td className="px-4 py-3 font-medium text-text">
                          <div className="flex items-center gap-2">
                            {row.titulo}
                            {row.tieneRecurrencia && (
                              <span className="badge-recurrencia">{row.frecuencia}</span>
                            )}
                            {row.esVirtual && (
                              <span className="badge-virtual">Virtual</span>
                            )}
                          </div>
                        </td>

                        {/* Asistente */}
                        {mostrarColumnaAsistente && (
                          <td className="px-4 py-3 text-text/70">{row.asignadoNombre}</td>
                        )}

                        {/* Prioridad */}
                        <td className="px-4 py-3">
                          <span className={`badge-prioridad ${PRIORIDAD_CLASS[row.prioridad] || "badge-prioridad-default"}`}>
                            {row.prioridad}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-3">
                          {opcionesEstado.length > 0 ? (
                            <select
                              value={row.estado}
                              onChange={(e) => handleCambiarEstado(row, e.target.value)}
                              disabled={loading}
                              className={`badge-estado border-0 outline-none cursor-pointer ${ESTADO_CLASS[row.estado] || "badge-estado-default"}`}
                            >
                              <option value={row.estado}>{row.estado.replace("_", " ")}</option>
                              {opcionesEstado.map((e) => (
                                <option key={e} value={e}>{e.replace("_", " ")}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`badge-estado inline-block ${ESTADO_CLASS[row.estado] || "badge-estado-default"}`}>
                              {row.estado.replace("_", " ")}
                            </span>
                          )}
                        </td>

                        {/* Fecha */}
                        <td className="px-4 py-3 font-medium text-text">
                          {formatFecha(row.fechaOcurrencia)}
                        </td>

                        {/* Días */}
                        <td className="px-4 py-3 text-center font-semibold text-text">
                          {diasFaltantes !== null ? diasFaltantes : "—"}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 flex gap-3 items-center">
                          <Link
                            href={`${basePath}/${row.tareaId}?taId=${row.tareaAsignacionId}&fechaOc=${row.fechaOriginalOcurrencia || row.fechaOcurrencia || ""}`}
                            className="text-text/50 hover:text-text transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </Link>

                          {canModify && (
                            <Link
                              href={`${basePath}/${row.tareaId}/modificar?taId=${row.tareaAsignacionId}&fechaOc=${row.fechaOriginalOcurrencia || row.fechaOcurrencia || ""}`}
                              className="text-text/40 hover:text-primary-foreground transition-colors"
                              title="Modificar"
                            >
                              <Edit size={18} />
                            </Link>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, row })}
                              className="text-danger-foreground/60 hover:text-danger-foreground transition-colors"
                              title="Eliminar"
                              disabled={loading}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ver más */}
            {hayMas && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleVerMas}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#e9e8e0] text-text/70 hover:bg-[#dddcd4] hover:text-text transition-all"
                >
                  Ver más ({filasFiltradas.length - filasVisibles} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Eliminar */}
      <ConfirmDeleteTareaModal
        isOpen={deleteModal.isOpen}
        titulo={deleteModal.row?.titulo || ""}
        esRecurrente={deleteModal.row?.tieneRecurrencia || false}
        onClose={() => setDeleteModal({ isOpen: false, row: null })}
        onDeleteOne={handleDeleteOne}
        onDeleteAll={handleDeleteAll}
      />

      {/* Modal Confirmar Estado (Asistente) */}
      <ConfirmEstadoModal
        isOpen={estadoModal.isOpen}
        titulo={estadoModal.row?.titulo || ""}
        nuevoEstado={estadoModal.nuevoEstado}
        onClose={() => setEstadoModal({ isOpen: false, row: null, nuevoEstado: "" })}
        onConfirm={handleConfirmEstado}
      />

      {/* Modal Cambiar Prioridad */}


    </>
  );
}
