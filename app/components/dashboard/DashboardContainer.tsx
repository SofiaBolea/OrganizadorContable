import {
  obtenerVencimientosProximos,
  obtenerTareasPropiasSemanales,
  obtenerTareasAsignadasSemanales,
  esAsistente,
} from "@/lib/dashboard";
import VencimientosCard from "./VencimientosCard";
import TareasSemanalesCard from "./TareasSemanalesCard";
import TareasAsignadasCard from "./TareasAsignadasCard";

interface DashboardContainerProps {
  orgId: string;
  userId: string;
}

export default async function DashboardContainer({
  orgId,
  userId,
}: DashboardContainerProps) {
  const [vencimientos, tareasPropias, tareasAsignadas, tieneAsistente] =
    await Promise.all([
      obtenerVencimientosProximos(orgId, userId),
      obtenerTareasPropiasSemanales(orgId, userId),
      obtenerTareasAsignadasSemanales(orgId, userId),
      esAsistente(orgId, userId),
    ]);

  return (
    <main className="dashboard-container h-full flex flex-col gap-6">
      {/* Card de Tareas Asignadas (solo si es asistente) */}
      {tieneAsistente && (
        <div className="dashboard-grid-full">
          <TareasAsignadasCard tareasAsignacion={tareasAsignadas} />
        </div>
      )}

      {/* Cards de Vencimientos y Tareas Propias */}
      <div className="dashboard-grid-two">
        <VencimientosCard vencimientos={vencimientos} />
        <TareasSemanalesCard tareasAsignacion={tareasPropias} />
      </div>
    </main>
  );
}
