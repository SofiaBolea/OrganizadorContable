"use client";

import { useState } from "react";

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
  
export default function VencimientoInputs(props: VencimientoInputsProps) {
  const [titulo, setTitulo] = useState(props.initialData?.titulo || "");
  const [tipoVencimiento, setTipoVencimiento] = useState(props.initialData?.tipoVencimiento || "Nacional");
  const [periodicidad, setPeriodicidad] = useState(props.initialData?.periodicidad || "Mensual");
  const [jurisdiccion, setJurisdiccion] = useState(props.initialData?.jurisdiccion || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Estados para las fechas/ocurrencias
  const [ocurrencias, setOcurrencias] = useState<Array<{ id?: string; fecha: string }>>(
    props.ocurrencias || []
  );
  const [fechaTemporal, setFechaTemporal] = useState("");
  
  // Determinar modo
  const isCreateMode = props.mode === "create" || !props.mode;
  const isViewMode = props.mode === "view";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo) {
      setError("El título es requerido");
      return;
    }
    
    if (isCreateMode && ocurrencias.length === 0) {
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
          // En create: enviar array de fechas (strings)
          // En edit: enviar array de ocurrencias con id + fecha
          ...(isCreateMode 
            ? { fechas: ocurrencias.map(o => o.fecha) }
            : { ocurrencias: ocurrencias }
          ),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al guardar");
        return;
      }

      // Limpiar formulario
      setTitulo("");
      setTipoVencimiento("Nacional");
      setPeriodicidad("Mensual");
      setJurisdiccion("");
      setOcurrencias([]);
      setFechaTemporal("");
      setError("");
      
      // Redirigir o recargar según el modo
      if (isCreateMode) {
        // En modo crear: ir a la página de listado
        setTimeout(() => window.location.href = "/vencimientos", 500);
      } else {
        // En modo editar: ir a la página de listado
        setTimeout(() => window.location.href = "/vencimientos", 500);
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  const handleAgregarFecha = () => {
    if (!fechaTemporal) {
      setError("Selecciona una fecha");
      return;
    }

    if (ocurrencias.some(o => o.fecha === fechaTemporal)) {
      setError("Esta fecha ya fue agregada");
      return;
    }

    setOcurrencias([...ocurrencias, { fecha: fechaTemporal }]);
    setFechaTemporal("");
  };

  const handleEliminarFecha = (fecha: string) => {
    setOcurrencias(ocurrencias.filter((o) => o.fecha !== fecha));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-4 border border-zinc-300 rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4 text-gray-900">
        {isViewMode
          ? "Detalle del Vencimiento"
          : isCreateMode
            ? "Nuevo Vencimiento"
            : "Modificar Vencimiento"}
      </h2>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Sección: Información General */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Información General</h3>
        
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-900">Título *</label>
          <input
            type="text"
            placeholder="Ej: IVA, Cargas Sociales, etc."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full p-2 border border-zinc-300 rounded text-gray-900"
            required
            disabled={isViewMode}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-900">Tipo de Vencimiento *</label>
            <select
              value={tipoVencimiento}
              onChange={(e) => setTipoVencimiento(e.target.value)}
              className="w-full p-2 border border-zinc-300 rounded text-gray-900"
              disabled={isViewMode}
            >
              <option value="Nacional">Nacional</option>
              <option value="Provincial">Provincial</option>
              <option value="Municipal">Municipal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-900">Periodicidad *</label>
            <select
              value={periodicidad}
              onChange={(e) => setPeriodicidad(e.target.value)}
              className="w-full p-2 border border-zinc-300 rounded text-gray-900"
              disabled={isViewMode}
            >
              <option value="Mensual">Mensual</option>
              <option value="Quincenal">Quincenal</option>
              <option value="Decenal">Decenal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-900">Jurisdicción</label>
          <input
            type="text"
            placeholder="Ej: AFIP, DGI, Municipalidad, etc."
            value={jurisdiccion}
            onChange={(e) => setJurisdiccion(e.target.value)}
            className="w-full p-2 border border-zinc-300 rounded text-gray-900"
            disabled={isViewMode}
          />
        </div>
      </div>

      {/* Sección: Fechas de Vencimiento */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Fechas de Vencimiento {isCreateMode ? "*" : ""}
        </h3>
          
          {!isViewMode && (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded">
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                Selecciona una fecha
              </label>

              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <input
                    type="date"
                    value={fechaTemporal}
                    onChange={(e) => {
                      setFechaTemporal(e.target.value);
                      if (error.includes("fecha")) setError("");
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-gray-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAgregarFecha}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                >
                  + Agregar
                </button>
              </div>
            </div>
          )}

          {/* Lista de fechas agregadas */}
          {ocurrencias.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-300 rounded">
              <h4 className="font-semibold mb-3 text-gray-900">
                Fechas agregadas ({ocurrencias.length})
              </h4>
              <div className="space-y-2">
                {[...ocurrencias].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((o) => (
                  <div
                    key={o.fecha}
                    className="flex items-center justify-between p-2 bg-white border border-green-200 rounded"
                  >
                    <span className="text-gray-900">
                      {(() => {
                        const [y, m, d] = o.fecha.split("T")[0].split("-");
                        return `${d}/${m}/${y}`;
                      })()}
                    </span>
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={() => handleEliminarFecha(o.fecha)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* Botón de envío */}
      {!isViewMode && (
        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 border border-zinc-300 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
        >
          {loading 
            ? "Procesando..." 
            : isCreateMode
              ? `Crear Vencimiento${ocurrencias.length > 0 ? ` (${ocurrencias.length} fecha${ocurrencias.length !== 1 ? 's' : ''})` : ''}`
              : "Guardar Cambios"}
        </button>
      )}

      {isViewMode && (
        <button
          type="button"
          onClick={() => window.location.href = "/vencimientos"}
          className="w-full p-2 border border-zinc-300 rounded bg-gray-600 text-white hover:bg-gray-700 font-semibold"
        >
          Volver al listado
        </button>
      )}
    </form>
  );
}
