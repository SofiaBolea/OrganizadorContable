"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RefColorSelector from "./RefColorSelector";

interface Asistente {
  id: string;
  nombreCompleto: string;
  email: string;
}

interface TareaFormProps {
  mode: "create" | "edit" | "view";
  tipoTarea: "PROPIA" | "ASIGNADA";
  basePath: string; // "/tareas-asignadas" o "/mis-tareas"
  initialData?: {
    id: string;
    titulo: string;
    prioridad: string;
    fechaVencimientoBase: string | null;
    descripcion: string | null;
    recurrencia: {
      frecuencia: string;
      intervalo: number;
      diaSemana: string | null;
      diaDelMes: string | null;
      mesDelAnio: string | null;
      hastaFecha: string | null;
      conteoMaximo: number | null;
    } | null;
    asignadoIds: string[];
    refColorId: string | null;
  };
}

export default function TareaForm({ mode, tipoTarea, basePath, initialData }: TareaFormProps) {
  const router = useRouter();

  const [titulo, setTitulo] = useState(initialData?.titulo || "");
  const [prioridad, setPrioridad] = useState(initialData?.prioridad || "MEDIA");
  const [fechaVencimiento, setFechaVencimiento] = useState(
    initialData?.fechaVencimientoBase?.split("T")[0] || ""
  );
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || "");
  const [refColorId, setRefColorId] = useState<string | null>(initialData?.refColorId || null);

  // Recurrencia
  const [esRecurrente, setEsRecurrente] = useState(!!initialData?.recurrencia);
  const [frecuencia, setFrecuencia] = useState(initialData?.recurrencia?.frecuencia || "SEMANAL");
  const [intervalo, setIntervalo] = useState(initialData?.recurrencia?.intervalo || 1);
  const [diaSemana, setDiaSemana] = useState(initialData?.recurrencia?.diaSemana || "");
  const [diaDelMes, setDiaDelMes] = useState(initialData?.recurrencia?.diaDelMes || "");
  const [hastaFecha, setHastaFecha] = useState(
    initialData?.recurrencia?.hastaFecha?.split("T")[0] || ""
  );
  const [conteoMaximo, setConteoMaximo] = useState<number | "">(
    initialData?.recurrencia?.conteoMaximo || ""
  );

  // Asignación (solo para ASIGNADA)
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [asignadoIds, setAsignadoIds] = useState<string[]>(initialData?.asignadoIds || []);
  const [loadingAsistentes, setLoadingAsistentes] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  // Cargar asistentes si es tarea ASIGNADA
  useEffect(() => {
    if (tipoTarea === "ASIGNADA") {
      setLoadingAsistentes(true);
      fetch("/api/tareas/asistentes")
        .then((res) => res.json())
        .then((data) => setAsistentes(data))
        .catch(() => console.error("Error cargando asistentes"))
        .finally(() => setLoadingAsistentes(false));
    }
  }, [tipoTarea]);

  const toggleAsignado = (id: string) => {
    setAsignadoIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const prioridades = ["ALTA", "MEDIA", "BAJA"];
  const frecuencias = ["DIARIA", "SEMANAL", "MENSUAL", "ANUAL"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim()) {
      setError("El título es requerido");
      return;
    }

    if (tipoTarea === "ASIGNADA" && asignadoIds.length === 0) {
      setError("Debe seleccionar al menos un asistente");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body: any = {
        titulo,
        prioridad,
        tipoTarea,
        fechaVencimientoBase: fechaVencimiento || null,
        descripcion: descripcion || null,
        refColorId: tipoTarea === "PROPIA" ? refColorId : null,
      };

      if (esRecurrente) {
        body.recurrencia = {
          frecuencia,
          intervalo,
          diaSemana: diaSemana || null,
          diaDelMes: diaDelMes || null,
          hastaFecha: hastaFecha || null,
          conteoMaximo: conteoMaximo || null,
        };
      } else {
        body.recurrencia = null;
      }

      if (tipoTarea === "ASIGNADA") {
        body.asignadoIds = asignadoIds;
      }

      const endpoint = isCreateMode ? "/api/tareas" : `/api/tareas/${initialData?.id}`;
      const method = isCreateMode ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
        return;
      }

      window.location.href = basePath;
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-sm p-8 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-text mb-6">
          {isViewMode
            ? "Detalle de Tarea"
            : isCreateMode
              ? "Nueva Tarea"
              : "Modificar Tarea"}
        </h2>

        {error && (
          <div className="mb-6 p-3 bg-danger/20 border border-danger text-danger-foreground rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Título */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Título de la tarea"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={isViewMode}
            className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-text placeholder:text-text/40 focus:ring-2 focus:ring-primary transition-all"
            required
          />
        </div>

        {/* Descripción */}
        <div className="mb-6">
          <textarea
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={isViewMode}
            rows={3}
            className="w-full bg-[#e9e8e0] p-3 px-5 rounded-2xl outline-none text-text placeholder:text-text/40 focus:ring-2 focus:ring-primary transition-all resize-none"
          />
        </div>

        {/* Prioridad */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-text mb-3">Prioridad</label>
          <div className="flex bg-[#e9e8e0] rounded-full p-1">
            {prioridades.map((p) => (
              <button
                key={p}
                type="button"
                disabled={isViewMode}
                onClick={() => setPrioridad(p)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all
                  ${prioridad === p
                    ? "bg-card text-text shadow-sm"
                    : "text-text/50 hover:text-text/70"
                  } ${isViewMode ? "cursor-default" : "cursor-pointer"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Fecha Vencimiento */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-text mb-3">Fecha Límite</label>
          <input
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            disabled={isViewMode}
            className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-text focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Recurrencia */}
        <div className="mb-6">
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={esRecurrente}
              onChange={(e) => setEsRecurrente(e.target.checked)}
              disabled={isViewMode}
              className="w-4 h-4 accent-primary-foreground"
            />
            <span className="text-sm font-bold text-text">Tarea Recurrente</span>
          </label>

          {esRecurrente && (
            <div className="bg-[#e9e8e0] rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text/60 uppercase tracking-wide mb-2">
                  Frecuencia
                </label>
                <div className="flex bg-white rounded-full p-1">
                  {frecuencias.map((f) => (
                    <button
                      key={f}
                      type="button"
                      disabled={isViewMode}
                      onClick={() => setFrecuencia(f)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all
                        ${frecuencia === f
                          ? "bg-primary/30 text-text shadow-sm"
                          : "text-text/50 hover:text-text/70"
                        } ${isViewMode ? "cursor-default" : "cursor-pointer"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text/60 uppercase tracking-wide mb-2">
                    Cada (intervalo)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={intervalo}
                    onChange={(e) => setIntervalo(Number(e.target.value) || 1)}
                    disabled={isViewMode}
                    className="w-full bg-white p-2 px-4 rounded-full outline-none text-sm text-text"
                  />
                </div>

                {frecuencia === "SEMANAL" && (
                  <div>
                    <label className="block text-xs font-semibold text-text/60 uppercase tracking-wide mb-2">
                      Días de la semana
                    </label>
                    <input
                      type="text"
                      placeholder="LU,MA,MI..."
                      value={diaSemana}
                      onChange={(e) => setDiaSemana(e.target.value)}
                      disabled={isViewMode}
                      className="w-full bg-white p-2 px-4 rounded-full outline-none text-sm text-text placeholder:text-text/40"
                    />
                  </div>
                )}

                {frecuencia === "MENSUAL" && (
                  <div>
                    <label className="block text-xs font-semibold text-text/60 uppercase tracking-wide mb-2">
                      Día del mes
                    </label>
                    <input
                      type="text"
                      placeholder="1,15..."
                      value={diaDelMes}
                      onChange={(e) => setDiaDelMes(e.target.value)}
                      disabled={isViewMode}
                      className="w-full bg-white p-2 px-4 rounded-full outline-none text-sm text-text placeholder:text-text/40"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text/60 uppercase tracking-wide mb-2">
                    Hasta fecha (opcional)
                  </label>
                  <input
                    type="date"
                    value={hastaFecha}
                    onChange={(e) => setHastaFecha(e.target.value)}
                    disabled={isViewMode}
                    className="w-full bg-white p-2 px-4 rounded-full outline-none text-sm text-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text/60 uppercase tracking-wide mb-2">
                    Máx. repeticiones (opcional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={conteoMaximo}
                    onChange={(e) => setConteoMaximo(e.target.value ? Number(e.target.value) : "")}
                    disabled={isViewMode}
                    placeholder="Sin límite"
                    className="w-full bg-white p-2 px-4 rounded-full outline-none text-sm text-text placeholder:text-text/40"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Color de Referencia (solo tareas propias) */}
        {tipoTarea === "PROPIA" && (
          <div className="mb-6">
            <RefColorSelector
              selectedId={refColorId}
              onChange={setRefColorId}
              disabled={isViewMode}
            />
          </div>
        )}

        {/* Asignación de Asistentes (solo ASIGNADA) */}
        {tipoTarea === "ASIGNADA" && (
          <div className="mb-6">
            <label className="block text-sm font-bold text-text mb-3">
              Asignar a Asistentes
            </label>

            {loadingAsistentes ? (
              <p className="text-text/50 text-sm">Cargando asistentes...</p>
            ) : asistentes.length === 0 ? (
              <p className="text-text/50 text-sm">
                No hay asistentes disponibles. Invitá colaboradores desde la sección Asistentes.
              </p>
            ) : (
              <div className="bg-[#e9e8e0] rounded-2xl p-4 space-y-2 max-h-60 overflow-y-auto">
                {asistentes.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      asignadoIds.includes(a.id)
                        ? "bg-primary/20 border border-primary/40"
                        : "bg-white/50 border border-transparent hover:bg-white"
                    } ${isViewMode ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      checked={asignadoIds.includes(a.id)}
                      onChange={() => !isViewMode && toggleAsignado(a.id)}
                      disabled={isViewMode}
                      className="w-4 h-4 accent-primary-foreground"
                    />
                    <div>
                      <span className="text-sm font-semibold text-text">{a.nombreCompleto}</span>
                      <span className="text-xs text-text/50 ml-2">{a.email}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-between items-center mt-8 pt-6">
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="px-8 py-3 rounded-xl text-base font-medium transition-opacity border-[3px] bg-danger text-danger-foreground border-danger-foreground hover:opacity-90"
          >
            {isViewMode ? "Volver" : "Cancelar"}
          </button>

          {!isViewMode && (
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl text-base font-medium transition-opacity border-[3px] bg-primary text-primary-foreground border-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Procesando..." : "Guardar"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
