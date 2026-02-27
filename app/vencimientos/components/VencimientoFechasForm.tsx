"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

interface VencimientoFechasFormProps {
  vencimiento: any;
  onComplete: () => void;
}

export default function VencimientoFechasForm({
  vencimiento,
  onComplete,
}: VencimientoFechasFormProps) {
  const [fechas, setFechas] = useState<string[]>([]);
  const [fechaTemporal, setFechaTemporal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const handleAgregarFecha = () => {
    if (!fechaTemporal) {
      setError("Selecciona una fecha");
      return;
    }

    if (fechas.includes(fechaTemporal)) {
      setError("Esta fecha ya fue agregada");
      return;
    }

    setFechas([...fechas, fechaTemporal]);
    setFechaTemporal("");
    setError("");
    setShowCalendar(false);
  };

  const handleEliminarFecha = (fecha: string) => {
    setFechas(fechas.filter((f) => f !== fecha));
  };

  const handleGuardarFechas = async () => {
    if (fechas.length === 0) {
      setError("Debes agregar al menos una fecha");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/vencimientos/ocurrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vencimientoId: vencimiento.id,
          fechas: fechas,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al guardar fechas");
        return;
      }

      // Éxito
      onComplete();
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 p-4 border border-green-300 rounded-lg bg-green-50">
      <h3 className="text-lg font-bold mb-4 text-gray-900">
        ✓ Vencimiento creado: {vencimiento.nombre}
      </h3>
      <p className="text-sm text-gray-700 mb-6">
        Ahora agrega las fechas de vencimiento para {vencimiento.vencimiento?.periodicidad}
      </p>

      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Selector de fechas */}
      <div className="mb-6 p-4 bg-white border border-gray-300 rounded">
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
                setError("");
              }}
              className="w-full p-2 border border-gray-300 rounded text-gray-900"
            />
          </div>
          <button
            type="button"
            onClick={handleAgregarFecha}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Lista de fechas agregadas */}
      {fechas.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded">
          <h4 className="font-semibold mb-3 text-gray-900">
            Fechas agregadas ({fechas.length})
          </h4>
          <div className="space-y-2">
            {[...fechas].sort().map((fecha) => (
              <div
                key={fecha}
                className="flex items-center justify-between p-2 bg-white border border-blue-200 rounded"
              >
                <span className="text-gray-900">
                  {new Date(fecha).toLocaleDateString("es-AR")}
                </span>
                <button
                  type="button"
                  onClick={() => handleEliminarFecha(fecha)}
                  className="text-red-600 hover:text-red-800 font-semibold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGuardarFechas}
          disabled={loading || fechas.length === 0}
          className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Guardando..." : `Guardar ${fechas.length} Fecha(s)`}
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-300 rounded text-gray-900 hover:bg-gray-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
