import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTareaDetalle } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos/permisos";
import TareaForm from "@/app/tareas-asignadas/components/TareaForm";
import RefColorSelector from "@/app/tareas-asignadas/components/RefColorSelector";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fechaOc?: string }>;
}

export default async function DetalleTareaAsignadaPage({ params, searchParams }: PageProps) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  const { id } = await params;
  const { fechaOc } = await searchParams;
  const esAdmin = await Permisos.esAdmin();

  const tarea = await getTareaDetalle(id);

  if (!tarea) {
    return (
      <main className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Tarea no encontrada</h2>
          <p className="text-text/50">La tarea que buscás no existe o fue eliminada.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-text mb-2">Tareas Asignadas</h1>
      <p className="text-text/50 mb-8">Detalle de la tarea asignada</p>

      <TareaForm
        mode="view"
        tipoTarea="ASIGNADA"
        basePath="/tareas-asignadas"
        initialData={{
          id: tarea.id,
          titulo: tarea.titulo,
          prioridad: tarea.prioridad,
          fechaVencimientoBase: tarea.fechaVencimientoBase?.toISOString() || null,
          descripcion: tarea.recurso?.descripcion || null,
          recurrencia: tarea.recurrencia
            ? {
                frecuencia: tarea.recurrencia.frecuencia,
                intervalo: tarea.recurrencia.intervalo,
                diaSemana: tarea.recurrencia.diaSemana,
                diaDelMes: tarea.recurrencia.diaDelMes,
                mesDelAnio: tarea.recurrencia.mesDelAnio,
                hastaFecha: tarea.recurrencia.hastaFecha?.toISOString() || null,
                conteoMaximo: tarea.recurrencia.conteoMaximo,
              }
            : null,
          asignadoIds: tarea.asignaciones.map((a) => a.asignadoId),
          refColorId: tarea.asignaciones[0]?.refColor?.id || null,
        }}
        esAdmin={esAdmin}
        ocurrenciaContext={fechaOc ? { tareaAsignacionId: "", fechaOcurrencia: fechaOc } : null}
      />

      {/* Sección de asignaciones con detalle */}
      
      {esAdmin && (
        <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-sm p-8 max-w-3xl mx-auto mt-6">
          <h3 className="text-lg font-bold text-text mb-4">Asignaciones de esta ocurrencia ({tarea.asignaciones.length})</h3>
          <div className="space-y-3">
            {tarea.asignaciones.map((asig) => (
              <div
                key={asig.id}
                className="flex items-center justify-between p-4 bg-[#e9e8e0] rounded-xl"
              >
                <div>
                  <p className="font-semibold text-text">{asig.asignado.nombreCompleto}</p>
                  <p className="text-xs text-text/50">{asig.asignado.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {asig.refColor && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: asig.refColor.codigoHexa + "30",
                        color: asig.refColor.codigoHexa,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: asig.refColor.codigoHexa }}
                      />
                      {asig.refColor.titulo}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      asig.estado === "COMPLETADA"
                        ? "bg-[#d4edda] text-[#155724]"
                        : asig.estado === "CANCELADA"
                          ? "bg-[#f8d7da] text-[#721c24]"
                          : asig.estado === "VENCIDA"
                            ? "bg-[#f5c6cb] text-[#721c24]"
                            : asig.estado === "FINALIZADA"
                              ? "bg-[#d1ecf1] text-[#0c5460]"
                              : asig.estado === "REVOCADA"
                                ? "bg-[#e2e3e5] text-[#383d41]"
                                : "bg-[#fff3cd] text-[#856404]"
                    }`}
                  >
                    {asig.estado.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
