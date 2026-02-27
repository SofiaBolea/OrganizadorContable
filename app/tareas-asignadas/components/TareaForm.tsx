"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import RefColorSelector from "./RefColorSelector";
import { ModalError } from "./modalError";

interface Asistente {
  id: string;
  nombreCompleto: string;
  email: string;
}

/** Contexto de la ocurrencia desde la que se llegó a modificar */
interface OcurrenciaContext {
  tareaAsignacionId: string;
  fechaOcurrencia: string;
}

interface TareaFormProps {
  mode: "create" | "edit" | "view";
  tipoTarea: "PROPIA" | "ASIGNADA";
  basePath: string; // "/tareas-asignadas" o "/tareas-propias"
  /** Si se llegó desde una ocurrencia específica en la tabla */
  ocurrenciaContext?: OcurrenciaContext | null;
  esAdmin?: boolean;
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
    refColorHexa?: string | null;
  };
}

export default function TareaForm({ mode, tipoTarea, basePath, initialData, ocurrenciaContext, esAdmin }: TareaFormProps) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(initialData?.titulo || "");
  const [prioridad, setPrioridad] = useState(initialData?.prioridad || "MEDIA");
  // Fecha de la ocurrencia específica desde la que se llegó
  const fechaOcurrenciaInicial = ocurrenciaContext?.fechaOcurrencia?.split("T")[0] || "";
  // Fecha base de la tarea (editable)
  const [fechaBaseOriginal, setFechaBaseOriginal] = useState(
    initialData?.fechaVencimientoBase?.split("T")[0] || ""
  );
  // Fecha de la ocurrencia que se está editando (para override en guardarSoloEsta)
  const [fechaVencimiento, setFechaVencimiento] = useState(
    fechaOcurrenciaInicial || initialData?.fechaVencimientoBase?.split("T")[0] || ""
  );
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || "");
  const [refColorId, setRefColorId] = useState<string | null>(initialData?.refColorId || null);
  const [refColorIdBase, setRefColorIdBase] = useState<string | null>(initialData?.refColorId || null);
  const [refColorHexa, setRefColorHexa] = useState<string | null>(initialData?.refColorHexa || null);
  const [refColorTitulo, setRefColorTitulo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Recurrencia
  const [esRecurrente, setEsRecurrente] = useState(!!initialData?.recurrencia);

  // Modal de alcance (aparece al guardar si hay ocurrenciaContext)
  const [showAlcanceModal, setShowAlcanceModal] = useState(false);
  const [alcanceModal, setAlcanceModal] = useState<"todas" | "esta">("todas");
  const [camposModificados, setCamposModificados] = useState<Set<string>>(new Set());

  // Rastrear valores originales de overrides cuando se cargan desde DB
  const [tituloOverrideOriginal, setTituloOverrideOriginal] = useState<string | null>(null);
  const [descripcionOverrideOriginal, setDescripcionOverrideOriginal] = useState<string | null>(null);
  const [prioridadOverrideOriginal, setPrioridadOverrideOriginal] = useState<string | null>(null);
  const [fechaOverrideOriginal, setFechaOverrideOriginal] = useState<string | null>(null);
  const [colorOverrideOriginal, setColorOverrideOriginal] = useState<string | null>(null);

  // Rastrear si hay override cargado (para diferenciar entre "no hay override" y "aún no cargó datos")
  const [ocurrenciaDataLoaded, setOcurrenciaDataLoaded] = useState(false);

  // Calcular la fecha de hoy en formato YYYY-MM-DD
  const hoyISO = new Date().toISOString().split("T")[0];

  // Cuando se activa recurrencia y no hay fecha, poner hoy como default
  const handleToggleRecurrente = (checked: boolean) => {
    setEsRecurrente(checked);
    if (checked && !fechaBaseOriginal) {
      setFechaBaseOriginal(hoyISO);
    }
    setCamposModificados(prev => new Set([...prev, "recurrencia"]));
  };
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

  // Finaliza tipo (para recurrencia)
  const [finalizaTipo, setFinalizaTipo] = useState<"nunca" | "fecha" | "ocurrencias">(
    initialData?.recurrencia?.hastaFecha ? "fecha" :
      initialData?.recurrencia?.conteoMaximo ? "ocurrencias" : "nunca"
  );

  // Cargar datos de override cuando se abre el formulario para editar una ocurrencia específica
  useEffect(() => {
    if (ocurrenciaContext && (mode === "edit" || mode === "view")) {
      const loadOcurrenciaData = async () => {
        try {
          const params = new URLSearchParams({
            tareaAsignacionId: ocurrenciaContext.tareaAsignacionId,
            fechaOcurrencia: ocurrenciaContext.fechaOcurrencia,
          });
          const res = await fetch(`/api/tareas/ocurrencias?${params}`);
          if (res.ok) {
            const data = await res.json();
            // Cargar overrides si existen, usar valores base si no
            setTitulo(data.tituloOverride || (initialData?.titulo || ""));
            setTituloOverrideOriginal(data.tituloOverride || null);

            setDescripcion(data.descripcionOverride || (initialData?.descripcion || ""));
            setDescripcionOverrideOriginal(data.descripcionOverride || null);

            setPrioridad(data.prioridadOverride || (initialData?.prioridad || "MEDIA"));
            setPrioridadOverrideOriginal(data.prioridadOverride || null);

            // Para la fecha: mostrar fechaOverride si existe, sino mostrar fechaOcurrencia (que puede ser la original o el base)
            const fechaAMostrar = data.fechaOverride
              ? data.fechaOverride.split("T")[0]
              : (data.fechaOcurrencia?.split("T")[0] || fechaOcurrenciaInicial);
            setFechaVencimiento(fechaAMostrar);
            setFechaOverrideOriginal(data.fechaOverride ? data.fechaOverride.split("T")[0] : null);

            // Para el color: si hay override, usar ID ficticio para que RefColorSelector muestre el fallback con el hex correcto
            if (data.colorOverride || data.refColorId) {
              // ID ficticio para que no matchee con ningún color de la lista
              // Así RefColorSelector usará fallbackColor con el hex del override
              setRefColorId(data.refColorId || null); 
              setRefColorHexa(data.refColorHexa);
              setRefColorTitulo(data.refColorTitulo || null);
              setColorOverrideOriginal(data.colorOverride);
            } else {
              // Sin override, usar el color base normal
              setRefColorId(initialData?.refColorId || null);
              setRefColorHexa(data.refColorHexa || initialData?.refColorHexa || null);
              setRefColorTitulo(null);
              setColorOverrideOriginal(null);
            }

            setOcurrenciaDataLoaded(true);
          }
        } catch (err) {
          setErrorMsg("Error loading ocurrencia data: " + (err as Error).message);
          setOcurrenciaDataLoaded(true);
        }
      };
      loadOcurrenciaData();
    } else {
      setOcurrenciaDataLoaded(true);
    }
  }, [ocurrenciaContext, mode, initialData]);


  // Búsqueda de asistentes
  const [busquedaAsistente, setBusquedaAsistente] = useState("");
  const [showBusqueda, setShowBusqueda] = useState(false);

  // Helpers para días de la semana (toggle buttons)
  const diasSemanaOpciones = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
  const diasSeleccionados = diaSemana ? diaSemana.split(",").map((d) => d.trim()).filter(Boolean) : [];
  const toggleDiaSemana = (dia: string) => {
    if (isViewMode) return;
    const actual = diaSemana ? diaSemana.split(",").map((d) => d.trim()).filter(Boolean) : [];
    if (actual.includes(dia)) {
      setDiaSemana(actual.filter((d) => d !== dia).join(","));
    } else {
      setDiaSemana([...actual, dia].join(","));
    }
  };

  // Frecuencia opciones para dropdown
  const frecuenciaOpciones = [
    { value: "DIARIA", label: "Día" },
    { value: "SEMANAL", label: "Semana" },
    { value: "MENSUAL", label: "Mes" },
    { value: "ANUAL", label: "Año" },
  ];

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
        .then((data) => setAsistentes(Array.isArray(data) ? data : []))
        .catch((err) => setErrorMsg("Error cargando asistentes: " + (err as Error).message))
        .finally(() => setLoadingAsistentes(false));
    }
  }, [tipoTarea]);

  const toggleAsignado = (id: string) => {
    setAsignadoIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleAsignarTodos = () => {
    if (asignadoIds.length === asistentes.length) {
      setAsignadoIds([]);
    } else {
      setAsignadoIds(asistentes.map((a) => a.id));
    }
  };

  const asistentesFiltrados = asistentes.filter(
    (a) =>
      a.nombreCompleto.toLowerCase().includes(busquedaAsistente.toLowerCase()) ||
      a.email.toLowerCase().includes(busquedaAsistente.toLowerCase())
  );

  const prioridades = ["ALTA", "MEDIA", "BAJA"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim()) {
      setError("El título es requerido");
      return;
    }

    if (!esRecurrente && !fechaBaseOriginal) {
      setError("La fecha límite es obligatoria para tareas no recurrentes");
      return;
    }

    if (tipoTarea === "ASIGNADA" && asignadoIds.length === 0) {
      setError("Debe seleccionar al menos un asistente");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Si estamos editando y hay contexto de ocurrencia → preguntar alcance
      if (!isCreateMode && ocurrenciaContext) {
        // Detectar qué campos fueron modificados
        const tituloModificado = titulo !== (initialData?.titulo || "");
        const descripcionModificada = descripcion !== (initialData?.descripcion || "");
        const prioridadModificada = prioridad !== (initialData?.prioridad || "MEDIA");
        const colorModificado = refColorId !== (initialData?.refColorId || null);
        const fechaBaseModificada = fechaBaseOriginal !== (initialData?.fechaVencimientoBase?.split("T")[0] || "");
        const fechaOcurrenciaModificada = fechaVencimiento !== fechaOcurrenciaInicial;
        const recurrenciaModificada = camposModificados.has("recurrencia");

        // Determinar qué opciones mostrar en el modal
        let soloEstOpcion = false;
        let soloTodasOpcion = false;

        // Si la tarea NO tiene recurrencia: solo mostrar "esta ocurrencia"
        if (!esRecurrente) {
          soloEstOpcion = true;
          soloTodasOpcion = false;
        } else {
          // Si solo se modificó fecha de esta ocurrencia: solo "esta"
          // Si se modificó fecha base o recurrencia: solo "todas"
          // En otros casos: ambas opciones
          soloEstOpcion = fechaOcurrenciaModificada && !fechaBaseModificada && !recurrenciaModificada;
          soloTodasOpcion = fechaBaseModificada || recurrenciaModificada;
        }

        // Guardar información sobre las opciones disponibles
        (window as any).__alcanceModalOptions = { soloEstOpcion, soloTodasOpcion };

        setLoading(false);
        setShowAlcanceModal(true);
        return;
      }

      // ─── Guardar la tarea completa (crear o editar todas) ───
      // Usar siempre refColorId (el nuevo color que el usuario seleccionó)
      const refColorIdBody = refColorId;
      
      const body: any = {
        titulo,
        prioridad,
        tipoTarea,
        fechaVencimientoBase: fechaBaseOriginal || null,
        descripcion: descripcion || null,
        refColorId: tipoTarea === "PROPIA" ? refColorIdBody : null,
      };

      if (esRecurrente) {
        body.recurrencia = {
          frecuencia,
          intervalo,
          diaSemana: frecuencia === "SEMANAL" ? (diaSemana || null) : null,
          diaDelMes: frecuencia === "MENSUAL" ? (diaDelMes || null) : null,
          hastaFecha: finalizaTipo === "fecha" ? (hastaFecha || null) : null,
          conteoMaximo: finalizaTipo === "ocurrencias" ? (conteoMaximo || null) : null,
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

    } finally {
      setLoading(false);
    }
  }

  /** Guardar override solo para esta ocurrencia */
  async function guardarSoloEsta() {
    if (!ocurrenciaContext) return;
    setShowAlcanceModal(false);
    setLoading(true);
    setError("");

    try {
      const fechaOriginal = ocurrenciaContext.fechaOcurrencia;

      // Comparar contra donde vino: override si existe, base si no
      const tituloOriginal = tituloOverrideOriginal !== null ? tituloOverrideOriginal : (initialData?.titulo || "");
      const descripcionOriginal = descripcionOverrideOriginal !== null ? descripcionOverrideOriginal : (initialData?.descripcion || "");
      const prioridadOriginal = prioridadOverrideOriginal !== null ? prioridadOverrideOriginal : (initialData?.prioridad || "MEDIA");
      const fechaOriginalOverride = fechaOverrideOriginal !== null ? fechaOverrideOriginal : fechaOcurrenciaInicial;
      const colorIdOriginal = colorOverrideOriginal !== null ? colorOverrideOriginal : (initialData?.refColorId || null);

      const res = await fetch("/api/tareas/ocurrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tareaAsignacionId: ocurrenciaContext.tareaAsignacionId,
          fechaOriginal,
          // undefined se omite de JSON → el server sabe que no cambió
          refColorId: refColorId,
          tituloOverride: titulo !== tituloOriginal ? titulo : undefined,
          descripcionOverride: descripcion !== descripcionOriginal ? descripcion : undefined,
          prioridadOverride: prioridad !== prioridadOriginal ? prioridad : undefined,
          fechaOverride: fechaVencimiento !== fechaOriginalOverride ? fechaVencimiento : undefined,
          colorOverride: undefined, // Solo usar si es un color manual fuera del catálogo
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar override");
        return;
      }
      window.location.href = basePath;
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  /** Guardar cambios en la tarea base (todas las ocurrencias) */
  async function guardarTodas() {
    setShowAlcanceModal(false);
    setLoading(true);
    setError("");

    try {
      // Cuando guardamos para TODAS las ocurrencias, usamos el color nuevo (refColorId)
      // El refColorIdBase solo se usa para proteger en guardarSoloEsta
      const refColorIdParaGuardar = refColorId;

      const body: any = {
        titulo,
        prioridad,
        tipoTarea,
        fechaVencimientoBase: fechaBaseOriginal || null,
        descripcion: descripcion || null,
        refColorId: tipoTarea === "PROPIA" ? refColorIdParaGuardar : null,
      };

      if (esRecurrente) {
        body.recurrencia = {
          frecuencia,
          intervalo,
          diaSemana: frecuencia === "SEMANAL" ? (diaSemana || null) : null,
          diaDelMes: frecuencia === "MENSUAL" ? (diaDelMes || null) : null,
          hastaFecha: finalizaTipo === "fecha" ? (hastaFecha || null) : null,
          conteoMaximo: finalizaTipo === "ocurrencias" ? (conteoMaximo || null) : null,
        };
      } else {
        body.recurrencia = null;
      }

      if (tipoTarea === "ASIGNADA") {
        body.asignadoIds = asignadoIds;
      }

      const res = await fetch(`/api/tareas/${initialData?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
        return;
      }

      // ─── Limpiar overrides en ocurrencias que correspondan a campos modificados ───
      // Detectar qué campos fueron modificados
      const camposParaLimpiar: { [key: string]: boolean } = {};
      
      if (titulo !== (initialData?.titulo || "")) {
        camposParaLimpiar.tituloOverride = true;
      }
      if (descripcion !== (initialData?.descripcion || "")) {
        camposParaLimpiar.descripcionOverride = true;
      }
      if (prioridad !== (initialData?.prioridad || "MEDIA")) {
        camposParaLimpiar.prioridadOverride = true;
      }
      // Cambiar refColorId en ocurrencias cuando el color base cambia
      // Comparar contra el valor original (initialData)
      if (refColorIdParaGuardar !== (initialData?.refColorId || null)) {
        camposParaLimpiar.refColorId = true;
      }

      // Si hay campos modificados, limpiar sus overrides
      if (Object.keys(camposParaLimpiar).length > 0) {
        try {
          await fetch(`/api/tareas/${initialData?.id}/limpiar-overrides`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ camposParaLimpiar }),
          });
        } catch (err) {
          setErrorMsg("Error limpiando overrides: " + (err as Error).message);
          // No lanzar error, continuar igual
        }
      }

      window.location.href = basePath;
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-sm p-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-text mb-6 flex items-center gap-3">
            <span>
              {isViewMode
                ? "Detalle de Tarea"
                : isCreateMode
                  ? tipoTarea === "ASIGNADA" ? "Asignar Nueva Tarea" : "Nueva Tarea"
                  : "Modificar Tarea"}
            </span>
            {ocurrenciaContext?.fechaOcurrencia && (() => {
              const raw = fechaVencimiento;
              const dateOnly = raw.includes("T") ? raw.split("T")[0] : raw;
              const d = new Date(dateOnly + "T00:00:00");
              if (isNaN(d.getTime())) return null;
              return (
                <span className="text-base font-normal text-muted-foreground">
                  — {d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
              );
            })()}
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
              placeholder="Titulo de Tarea"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                setCamposModificados(prev => new Set([...prev, "titulo"]));
              }}
              disabled={isViewMode}
              className="input-base"
              required
            />
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <textarea
              placeholder="Descripción de la tarea"
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                setCamposModificados(prev => new Set([...prev, "descripcion"]));
              }}
              disabled={isViewMode}
              rows={3}
              className="w-full bg-[#e9e8e0] p-3 px-5 rounded-2xl outline-none text-text placeholder:text-text/40 focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* Asignación de Asistentes (solo ASIGNADA) */}
          {tipoTarea === "ASIGNADA" && esAdmin && (
            <div className="mb-6 border border-text/10 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-text/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text">Asistentes asignados</span>
                  <button
                    type="button"
                    onClick={() => setShowBusqueda(!showBusqueda)}
                    className="text-text/40 hover:text-text/70 transition-colors"
                  >
                    <Search size={16} />
                  </button>
                </div>
                {!isViewMode && asistentes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text/60">Asignar a todos</span>
                    <button
                      type="button"
                      onClick={toggleAsignarTodos}
                      className={`relative w-11 h-6 rounded-full transition-colors ${asignadoIds.length === asistentes.length && asistentes.length > 0
                          ? "bg-primary-foreground"
                          : "bg-text/20"
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${asignadoIds.length === asistentes.length && asistentes.length > 0
                            ? "translate-x-5"
                            : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Búsqueda */}
              {showBusqueda && (
                <div className="px-5 py-2 border-b border-text/10">
                  <input
                    type="text"
                    placeholder="Buscar asistente..."
                    value={busquedaAsistente}
                    onChange={(e) => setBusquedaAsistente(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm text-text placeholder:text-text/40"
                    autoFocus
                  />
                </div>
              )}

              {/* Lista */}
              {loadingAsistentes ? (
                <p className="text-text/50 text-sm p-5">Cargando asistentes...</p>
              ) : asistentes.length === 0 ? (
                <p className="text-text/50 text-sm p-5">
                  No hay asistentes disponibles. Invitá colaboradores desde la sección Equipo.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {asistentesFiltrados.map((a, i) => (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between px-5 py-3 transition-colors hover:bg-black/[0.02] ${i < asistentesFiltrados.length - 1 ? "border-b border-text/5" : ""
                        } ${isViewMode ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div>
                        <span className="text-sm font-medium text-text">{a.nombreCompleto}</span>
                        <span className="text-xs text-text/50 ml-2">{a.email}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={asignadoIds.includes(a.id)}
                        onChange={() => !isViewMode && toggleAsignado(a.id)}
                        disabled={isViewMode}
                        className="w-5 h-5 accent-primary-foreground rounded"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-row mb-6 mt-4 items-center">
            <label className="text-xs font-semibold text-text/60 uppercase tracking-wide">
              Informacion general de la tarea
            </label>

          </div>

          {/* Fecha + Prioridad en fila */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-row gap-3 items-baseline">
                <label className="text-xs font-semibold text-text/60 uppercase tracking-wide">
                  {esRecurrente ? "Fecha Base" : "Fecha"}
                </label>
                {esRecurrente && (
                  <p className="text-[11px] text-text/40 -mt-1">
                    A partir de la cual se generan las ocurrencias
                  </p>
                )}
              </div>

              <input
                type="date"
                value={fechaBaseOriginal || ""}
                onChange={(e) => {
                  setFechaBaseOriginal(e.target.value);
                  setCamposModificados(prev => new Set([...prev, "fechaBase"]));
                }}
                disabled={!isCreateMode}
                required={!esRecurrente}
                className="input-base"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text/60 uppercase tracking-wide">
                Prioridad
              </label>
              <select
                value={prioridad}
                onChange={(e) => {
                  setPrioridad(e.target.value);
                  setCamposModificados(prev => new Set([...prev, "prioridad"]));
                }}
                disabled={isViewMode}
                className="input-base"
              >
                {prioridades.map((p) => (
                  <option key={p} value={p}>{p === "ALTA" ? "Prioridad Alta" : p === "MEDIA" ? "Prioridad Media" : "Prioridad Baja"}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurrencia */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={esRecurrente}
                onChange={(e) => handleToggleRecurrente(e.target.checked)}
                disabled={!isCreateMode}
                className="w-4 h-4 accent-primary-foreground"
              />
              <span className="text-sm font-bold text-text">Tarea Recurrente</span>
            </label>

            {esRecurrente && (
              <div className="bg-[#e9e8e0] rounded-2xl p-6 mt-4 space-y-5">
                <h3 className="text-lg font-semibold text-text">Recurrencia Personalizada</h3>

                {/* Repetir - Botones de días (solo SEMANAL) */}
                {frecuencia === "SEMANAL" && (
                  <div>
                    <h4 className="text-sm font-bold text-primary-foreground mb-3">Repetir</h4>
                    <div className="flex gap-2 flex-wrap">
                      {diasSemanaOpciones.map((dia) => {
                        const sel = diasSeleccionados.includes(dia);
                        return (
                          <button
                            key={dia}
                            type="button"
                            disabled={!isCreateMode}
                            onClick={() => toggleDiaSemana(dia)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${sel
                                ? "bg-primary-foreground text-white"
                                : "bg-white text-text/60 hover:bg-white/80"
                              } ${!isCreateMode ? "cursor-default opacity-50" : "cursor-pointer"}`}
                          >
                            {dia}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Día del mes (solo MENSUAL) */}
                {frecuencia === "MENSUAL" && (
                  <div>
                    <h4 className="text-sm font-bold text-primary-foreground mb-3">Día del mes</h4>
                    <input
                      type="text"
                      placeholder="1,15..."
                      value={diaDelMes}
                      onChange={(e) => setDiaDelMes(e.target.value)}
                      disabled={!isCreateMode}
                      className="w-32 bg-white p-2 px-4 rounded-full outline-none text-sm text-text placeholder:text-text/40"
                    />
                  </div>
                )}

                {/* Cada N [frecuencia] */}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm font-medium text-text">Cada</span>
                  <input
                    type="number"
                    min={1}
                    value={intervalo}
                    onChange={(e) => setIntervalo(Number(e.target.value) || 1)}
                    disabled={!isCreateMode}
                    className="w-16 bg-white p-2 px-3 rounded-full outline-none text-sm text-text text-center"
                  />
                  <select
                    value={frecuencia}
                    onChange={(e) => setFrecuencia(e.target.value)}
                    disabled={!isCreateMode}
                    className="bg-white p-2 px-4 rounded-full outline-none text-sm text-text appearance-none cursor-pointer pr-8"
                  >
                    {frecuenciaOpciones.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Finaliza */}
                <div>
                  <h4 className="text-sm font-bold text-text mb-3">Finaliza</h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="finalizaTipo"
                        checked={finalizaTipo === "nunca"}
                        onChange={() => setFinalizaTipo("nunca")}
                        disabled={!isCreateMode}
                        className="w-4 h-4 accent-primary-foreground"
                      />
                      <span className="text-sm text-text">Nunca</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="finalizaTipo"
                        checked={finalizaTipo === "fecha"}
                        onChange={() => setFinalizaTipo("fecha")}
                        disabled={!isCreateMode}
                        className="w-4 h-4 accent-primary-foreground"
                      />
                      <span className="text-sm text-text">El</span>
                      <input
                        type="date"
                        value={hastaFecha}
                        onChange={(e) => {
                          setHastaFecha(e.target.value);
                          setFinalizaTipo("fecha");
                        }}
                        disabled={!isCreateMode || finalizaTipo !== "fecha"}
                        className="bg-white p-2 px-4 rounded-full outline-none text-sm text-text disabled:opacity-50"
                      />
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="finalizaTipo"
                        checked={finalizaTipo === "ocurrencias"}
                        onChange={() => setFinalizaTipo("ocurrencias")}
                        disabled={!isCreateMode}
                        className="w-4 h-4 accent-primary-foreground"
                      />
                      <span className="text-sm text-text">Despues de</span>
                      <input
                        type="number"
                        min={1}
                        value={conteoMaximo}
                        onChange={(e) => {
                          setConteoMaximo(e.target.value ? Number(e.target.value) : "");
                          setFinalizaTipo("ocurrencias");
                        }}
                        disabled={!isCreateMode || finalizaTipo !== "ocurrencias"}
                        placeholder="1"
                        className="w-16 bg-white p-2 px-3 rounded-full outline-none text-sm text-text text-center disabled:opacity-50"
                      />
                      <span className="text-sm text-text">ocurrencias</span>
                    </label>
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
                selectedHexa={refColorHexa}
                refColorTitulo={refColorTitulo}
                onChange={(id, hexa) => {
                  setRefColorId(id);
                  setRefColorHexa(hexa);
                  setRefColorTitulo(null);
                  setCamposModificados(prev => new Set([...prev, "refColor"]));
                }}
                disabled={isViewMode}
              />
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

      {/* Modal de alcance */}
      {showAlcanceModal && (() => {
        const options = (window as any).__alcanceModalOptions || { soloEstOpcion: false, soloTodasOpcion: false };
        const mostrarEstOpcion = !options.soloTodasOpcion;
        const mostrarTodasOpcion = !options.soloEstOpcion;

        // Si solo hay una opción, seleccionarla automáticamente
        const tieneUnaOpcion = (mostrarEstOpcion && !mostrarTodasOpcion) || (!mostrarEstOpcion && mostrarTodasOpcion);
        if (tieneUnaOpcion && alcanceModal !== (mostrarEstOpcion ? "esta" : "todas")) {
          setAlcanceModal(mostrarEstOpcion ? "esta" : "todas");
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-card rounded-2xl border border-white shadow-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-text mb-2">¿Aplicar cambios a…?</h3>
              <p className="text-sm text-text/60 mb-6">
                Elegí si querés modificar solo esta ocurrencia o todas las ocurrencias de la tarea.
              </p>

              <div className="space-y-3">
                {mostrarTodasOpcion && (
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2
                  ${alcanceModal === 'todas' ? 'bg-primary/10 border-primary/40' : 'bg-[#e9e8e0] border-transparent hover:border-text/10'}`}>
                    <input
                      type="radio"
                      name="alcanceModal"
                      checked={alcanceModal === "todas"}
                      onChange={() => setAlcanceModal("todas")}
                      className="w-4 h-4 accent-primary-foreground"
                    />
                    <div>
                      <span className="text-sm font-semibold text-text">Todas las ocurrencias</span>
                      <p className="text-xs text-text/50">
                        Se modifica la tarea base (título, fecha, prioridad, recurrencia, etc.)
                      </p>
                    </div>
                  </label>
                )}

                {mostrarEstOpcion && (
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2
                  ${alcanceModal === 'esta' ? 'bg-primary/10 border-primary/40' : 'bg-[#e9e8e0] border-transparent hover:border-text/10'}`}>
                    <input
                      type="radio"
                      name="alcanceModal"
                      checked={alcanceModal === "esta"}
                      onChange={() => setAlcanceModal("esta")}
                      className="w-4 h-4 accent-primary-foreground"
                    />
                    <div>
                      <span className="text-sm font-semibold text-text">Solo esta ocurrencia</span>
                      <p className="text-xs text-text/50">
                        Se guardan cambios de título y fecha solo para esta fecha particular
                      </p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAlcanceModal(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity border-[3px] bg-danger text-danger-foreground border-danger-foreground hover:opacity-90"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => alcanceModal === "esta" ? guardarSoloEsta() : guardarTodas()}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity border-[3px] bg-primary text-primary-foreground border-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Aceptar"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      
      
      {errorMsg && (
        <ModalError mensaje={errorMsg} onClose={() => setErrorMsg(null)} />
      )}
    </>
  );
}
