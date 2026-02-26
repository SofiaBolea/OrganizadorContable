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
    
      <TareaForm
        mode="create"
        tipoTarea="ASIGNADA"
        basePath="/tareas-asignadas"
        esAdmin={puedeCrear}
      />
    </main>
  );
}
