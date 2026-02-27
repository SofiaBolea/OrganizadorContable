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
      <TareaForm
        mode="create"
        tipoTarea="PROPIA"
        basePath="/tareas-propias"
      />
    </main>
  );
}
