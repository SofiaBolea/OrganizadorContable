import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTareaDetalle } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";
import TareaForm from "@/app/tareas-asignadas/components/TareaForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModificarTareaAsignadaPage({ params }: PageProps) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  const puedeModificar = await Permisos.puedeModificarTareaAsignada();
  if (!puedeModificar) {
    redirect("/tareas-asignadas");
  }

  const { id } = await params;
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
      <p className="text-text/50 mb-8">Modificar tarea asignada</p>

      <TareaForm
        mode="edit"
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
          refColorId: null,
        }}
      />
    </main>
  );
}
