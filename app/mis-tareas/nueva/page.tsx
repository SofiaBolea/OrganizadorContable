import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import TareaForm from "@/app/tareas-asignadas/components/TareaForm";

export default async function NuevaMiTareaPage() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-text mb-2">Mis Tareas</h1>
      <p className="text-text/50 mb-8">Crear una nueva tarea personal</p>

      <TareaForm
        mode="create"
        tipoTarea="PROPIA"
        basePath="/mis-tareas"
      />
    </main>
  );
}
