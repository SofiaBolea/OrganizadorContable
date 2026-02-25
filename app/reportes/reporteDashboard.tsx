"use client";
import { useState, useEffect } from "react";

export default function ReporteDashboard() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [rango, setRango] = useState<{ inicio: string, fin: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const periodos = ["semanal", "quincenal", "mensual"];

  const formatFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split("-");
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reportes?periodo=${periodos[selectedIndex]}`);
        const result = await res.json();
        if (result && result.stats) {
          setData(result.stats);
          setRango(result.rango);
        } else {
          setData([]);
          setRango(null);
        }
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
    alta: acc.alta + (curr.alta || 0),
    media: acc.media + (curr.media || 0),
    baja: acc.baja + (curr.baja || 0)
  }), { completadas: 0, pendientes: 0, vencidas: 0, alta: 0, media: 0, baja: 0 });

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de Periodo (Opcional, mantenido para funcionalidad) */}
      <div className=" inline-flex justify-end rounded-lg  ">
        {periodos.map((p, i) => (
          <button key={p} onClick={() => setSelectedIndex(i)} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${selectedIndex === i ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>
            {p.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="card p-10">
        {/* Header */}
        <div className="mb-8 border-0">
          <h2 className="text-2xl font-bold">Reporte Semanal</h2>

          {rango && (
            <p className="text-gray-400 text-sm">
              Desde el {formatFecha(rango.inicio)} hasta el {formatFecha(rango.fin)}
            </p>
          )}
        </div>



        {/* Tarjetas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <BigMetricCard title="Tareas Realizadas" value={totales.completadas} color="text-slate-700" />
          <BigMetricCard title="Tareas Pendientes" value={totales.pendientes} color="text-gray-400" />
          <BigMetricCard title="Tareas Vencidas" value={totales.vencidas} color="text-orange-400" />
        </div>

        {/* Resumen de Prioridades */}
        <div className="flex gap-4 mb-12 justify-center">
          <PriorityPill label="Prioridad Alta" count={totales.alta} color="bg-[#e9b6a5]" />
          <PriorityPill label="Prioridad Media" count={totales.media} color="bg-[#f3d990]" />
          <PriorityPill label="Prioridad Baja" count={totales.baja} color="bg-[#94c084]" />
        </div>

        {/* Tabla Detallada */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[11px] uppercase tracking-wider border-b">
                <th className="pb-4 font-semibold">Asistente</th>
                <th className="pb-4 text-center font-semibold">Tareas Realizadas <br /><span className="normal-case text-[9px] text-gray-300">(Detalle de Prioridad)</span></th>
                <th className="pb-4 text-center font-semibold">Tareas <br /> Pendientes</th>
                <th className="pb-4 text-center font-semibold">Tareas <br /> Vencidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, idx) => (
                <tr key={idx} className="table-row">
                  <td className="py-5 font-bold">{item.name}</td>
                  <td className="py-5">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-lg font-bold mr-2">{item.completadas}</span>
                      <Badge label="Alta" count={item.alta} color="bg-[#e9b6a5]" />
                      <Badge label="Media" count={item.media} color="bg-[#f3d990]" />
                      <Badge label="Baja" count={item.baja} color="bg-[#94c084]" />
                    </div>
                  </td>
                  <td className="py-5 text-center font-bold text-slate-600">{item.pendientes}</td>
                  <td className="py-5 text-center font-bold text-orange-400">{item.vencidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  );
}

{/* Componentes de apoyo para mantener el código limpio */ }

function BigMetricCard({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className="border-[3px] border-slate-700 rounded-[30px] p-8 text-center bg-white shadow-sm">
      <p className="text-gray-500 font-semibold text-sm mb-2">{title}</p>
      <p className={`text-6xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function PriorityPill({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className={`${color} px-6 py-2 rounded-full flex items-center gap-4 min-w-[180px]`}>
      <span className="text-slate-700 font-bold text-sm flex-1">{label}</span>
      <span className="text-slate-800 font-bold text-lg">{count}</span>
    </div>
  );
}

function Badge({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className={`${color} px-2 py-0.5 rounded flex items-center gap-1.5`}>
      <span className="text-[10px] font-bold text-white uppercase">{count} {label}</span>
    </div>
  );
}