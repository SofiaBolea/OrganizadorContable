"use client";
import { useState, useEffect } from "react";

export default function ReporteDashboard() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const periodos = ["semanal", "quincenal", "mensual"];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reportes?periodo=${periodos[selectedIndex]}`);
        const result = await res.json();
        setData(Array.isArray(result) ? result : []);
      } catch (e) {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedIndex]);

  const totales = data.reduce((acc, curr) => ({
    completadas: acc.completadas + curr.completadas,
    pendientes: acc.pendientes + curr.pendientes,
    vencidas: acc.vencidas + curr.vencidas,
    total: acc.total + curr.total
  }), { completadas: 0, pendientes: 0, vencidas: 0, total: 0 });

  return (
    <div className="space-y-8">
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reporte de Productividad</h2>
          <p className="text-gray-500">Resumen de tareas materializadas en la organización.</p>
        </div>
        
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {periodos.map((p, i) => (
            <button
              key={p}
              onClick={() => setSelectedIndex(i)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                selectedIndex === i 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Tareas" value={totales.total} color="bg-blue-50 text-blue-700 border-blue-100" />
        <MetricCard title="Completadas" value={totales.completadas} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
        <MetricCard title="Pendientes" value={totales.pendientes} color="bg-amber-50 text-amber-700 border-amber-100" />
        <MetricCard title="Vencidas" value={totales.vencidas} color="bg-rose-50 text-rose-700 border-rose-100" />
      </div>

      {/* Tabla Detallada */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Desglose por Asistente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Asistente</th>
                <th className="px-6 py-4 text-center">Completadas</th>
                <th className="px-6 py-4 text-center">Pendientes</th>
                <th className="px-6 py-4 text-center">Vencidas</th>
                <th className="px-6 py-4 text-right">Eficiencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Cargando datos...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No hay actividad registrada en este periodo.</td></tr>
              ) : (
                data.map((item) => {
                  const eficiencia = item.total > 0 ? Math.round((item.completadas / item.total) * 100) : 0;
                  return (
                    <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-center text-emerald-600 font-semibold">{item.completadas}</td>
                      <td className="px-6 py-4 text-center text-amber-600 font-semibold">{item.pendientes}</td>
                      <td className="px-6 py-4 text-center text-rose-600 font-semibold">{item.vencidas}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">{eficiencia}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className={`p-6 rounded-xl border ${color}`}>
      <p className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}