"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface VencimientoInputsProps {
  mode?: "create" | "edit" | "view";
  initialData?: {
    id: string;
    titulo: string;
    tipoVencimiento: string;
    periodicidad: string;
    jurisdiccion: string | null;
  };
  ocurrencias?: Array<{ id?: string; fecha: string }>;
}

// Helpers para calcular rangos según periodicidad
function getRangos(periodicidad: string) {
  switch (periodicidad) {
    case "Mensual":
      return Array.from({ length: 12 }, (_, i) => {
        const mes = i + 1;
        const mStr = String(mes).padStart(2, "0");
        const ultimoDia = new Date(2026, mes, 0).getDate();
        return { num: mes, rango: `01/${mStr}  -  ${ultimoDia}/${mStr}` };
      });
    case "Quincenal":
      return Array.from({ length: 24 }, (_, i) => {
        const mes = Math.floor(i / 2) + 1;
        const mStr = String(mes).padStart(2, "0");
        const ultimoDia = new Date(2026, mes, 0).getDate();
        const esSegunda = i % 2 === 1;
        return {
          num: i + 1,
          rango: esSegunda
            ? `16/${mStr}  -  ${ultimoDia}/${mStr}`
            : `01/${mStr}  -  15/${mStr}`,
        };
      });
    case "Decenal":
      return Array.from({ length: 36 }, (_, i) => {
        const mes = Math.floor(i / 3) + 1;
        const mStr = String(mes).padStart(2, "0");
        const ultimoDia = new Date(2026, mes, 0).getDate();
        const tercio = i % 3;
        const rangos = [
          `01/${mStr}  -  10/${mStr}`,
          `11/${mStr}  -  20/${mStr}`,
          `21/${mStr}  -  ${ultimoDia}/${mStr}`,
        ];
        return { num: i + 1, rango: rangos[tercio] };
      });
    default: // Anual
      return [{ num: 1, rango: "01/01  -  31/12" }];
  }
}

function getLabelPeriodo(periodicidad: string) {
  switch (periodicidad) {
    case "Quincenal": return "N° Quincena";
    case "Decenal": return "N° Decena";
    case "Mensual": return "N° Mes";
    default: return "N° Período";
  }
}
  
export default function VencimientoInputs(props: VencimientoInputsProps) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(props.initialData?.titulo || "");
  const [tipoVencimiento, setTipoVencimiento] = useState(props.initialData?.tipoVencimiento || "Nacional");
  const [periodicidad, setPeriodicidad] = useState(props.initialData?.periodicidad || "Mensual");
  const [jurisdiccion, setJurisdiccion] = useState(props.initialData?.jurisdiccion || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Rangos calculados
  const rangos = useMemo(() => getRangos(periodicidad), [periodicidad]);

  // Ocurrencias indexadas por posición en rangos
  const [fechasPorRango, setFechasPorRango] = useState<Record<number, string>>(() => {
    if (!props.ocurrencias) return {};
    const m: Record<number, string> = {};
    props.ocurrencias.forEach((o, i) => {
      m[i] = o.fecha.split("T")[0];
    });
    return m;
  });
  
  // Determinar modo
  const isCreateMode = props.mode === "create" || !props.mode;
  const isViewMode = props.mode === "view";

  const tiposVencimiento = ["Nacional", "Provincial", "Municipal"];
  const periodicidades = ["Anual", "Mensual", "Quincenal", "Decenal"];

  // Construir ocurrencias desde fechasPorRango
  function buildOcurrencias() {
    const result: Array<{ id?: string; fecha: string }> = [];
    Object.entries(fechasPorRango).forEach(([idx, fecha]) => {
      if (fecha) {
        const original = props.ocurrencias?.[Number(idx)];
        result.push({ id: original?.id, fecha });
      }
    });
    return result;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo) {
      setError("El título es requerido");
      return;
    }

    const ocurrenciasFinales = buildOcurrencias();
    
    if (isCreateMode && ocurrenciasFinales.length === 0) {
      setError("Debes agregar al menos una fecha");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = isCreateMode
          ? "/api/vencimientos"
          : `/api/vencimientos/${props.initialData?.id}`;

      const method = isCreateMode ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          tipoVencimiento,
          periodicidad,
          jurisdiccion: jurisdiccion || null,
          ...(isCreateMode 
            ? { fechas: ocurrenciasFinales.map(o => o.fecha) }
            : { ocurrencias: ocurrenciasFinales }
          ),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al guardar");
        return;
      }

      window.location.href = "/vencimientos";
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  const handleFechaChange = (index: number, value: string) => {
    setFechasPorRango((prev) => ({ ...prev, [index]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-sm p-8 max-w-3xl mx-auto">

        {/* Título del card */}
        <h2 className="text-xl font-bold text-text mb-6">
          {isViewMode
            ? "Detalle de Vencimiento"
            : isCreateMode
              ? "Cargar Vencimiento Impositivo"
              : "Modificar Vencimiento"}
        </h2>

        {error && (
          <div className="mb-6 p-3 bg-danger/20 border border-danger text-danger-foreground rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* ── Tipo de Impuesto ── */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-text mb-3">Tipo de Impuesto</label>
          <div className="flex bg-[#e9e8e0] rounded-full p-1">
            {tiposVencimiento.map((tipo) => (
              <button
                key={tipo}
                type="button"
                disabled={isViewMode}
                onClick={() => setTipoVencimiento(tipo)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all
                  ${tipoVencimiento === tipo
                    ? "bg-card text-text shadow-sm"
                    : "text-text/50 hover:text-text/70"
                  } ${isViewMode ? "cursor-default" : "cursor-pointer"}`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {/* ── Título del vencimiento ── */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Título del vencimiento"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-text placeholder:text-text/40 focus:ring-2 focus:ring-primary transition-all"
            required
            disabled={isViewMode}
          />
        </div>

        {/* ── Subtítulo / Jurisdicción ── */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Jurisdicción (Opcional)"
            value={jurisdiccion}
            onChange={(e) => setJurisdiccion(e.target.value)}
            className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-text placeholder:text-text/40 focus:ring-2 focus:ring-primary transition-all"
            disabled={isViewMode}
          />
        </div>

        {/* ── Periodicidad ── */}
        <div className="mb-6">
          <div className="flex bg-[#e9e8e0] rounded-full p-1">
            {periodicidades.map((p) => (
              <button
                key={p}
                type="button"
                disabled={isViewMode}
                onClick={() => {
                  setPeriodicidad(p);
                  setFechasPorRango({});
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all
                  ${periodicidad === p
                    ? "bg-card text-text shadow-sm"
                    : "text-text/50 hover:text-text/70"
                  } ${isViewMode ? "cursor-default" : "cursor-pointer"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabla de Fechas ── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide w-24">
                  {getLabelPeriodo(periodicidad)}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide">
                  Rango
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text/60 uppercase tracking-wide">
                  Fecha Vencimiento
                </th>
              </tr>
            </thead>
            <tbody>
              {rangos.map((r, idx) => {
                const fechaValue = fechasPorRango[idx] || "";
                const tieneFecha = !!fechaValue;
                return (
                  <tr key={idx} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                    <td className="px-4 py-3 text-center text-text font-medium">{r.num}</td>
                    <td className="px-4 py-3 text-text/70 font-medium">{r.rango}</td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={fechaValue}
                        onChange={(e) => handleFechaChange(idx, e.target.value)}
                        disabled={isViewMode}
                        className={`px-4 py-2 rounded-full outline-none text-sm font-medium transition-all
                          ${tieneFecha
                            ? "bg-primary/30 text-text border border-primary/50 focus:ring-2 focus:ring-primary"
                            : "bg-[#e9e8e0] text-text/50 border border-transparent focus:ring-2 focus:ring-primary"
                          } ${isViewMode ? "cursor-default" : "cursor-pointer"}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Botones ── */}
        <div className="flex justify-between items-center mt-8 pt-6">
          <button
            type="button"
            onClick={() => router.push("/vencimientos")}
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
