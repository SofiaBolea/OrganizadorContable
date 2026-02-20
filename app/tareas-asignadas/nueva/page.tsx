import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Permisos } from "@/lib/permisos";
import TareaForm from "@/app/tareas-asignadas/components/TareaForm";

export default async function NuevaTareaAsignadaPage() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  const puedeCrear = await Permisos.puedeCrearTareaAsignada();
  if (!puedeCrear) {
    redirect("/tareas-asignadas");
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-text mb-2">Tareas Asignadas</h1>
      <p className="text-text/50 mb-8">Asignar una nueva tarea a tus asistentes</p>

      <TareaForm
        mode="create"
        tipoTarea="ASIGNADA"
        basePath="/tareas-asignadas"
        esAdmin={puedeCrear}
      />
    </main>
  );
}
