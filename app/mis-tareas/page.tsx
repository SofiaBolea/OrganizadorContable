import { auth } from "@clerk/nextjs/server";
import { ShieldAlert } from "lucide-react";
import { getMisTareas } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";
import Link from "next/link";
import { Button } from "../components/Button";
import TareasTableClient from "@/app/tareas-asignadas/components/TareasTableClient";

export default async function MisTareasPage() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Organización Requerida</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Seleccioná un espacio de trabajo para gestionar tus tareas.
          </p>
        </div>
      </main>
    );
  }

  const esAdmin = await Permisos.esAdmin();
  const tareas = await getMisTareas(orgId, userId);

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-text">Mis Tareas</h1>
        <Button variant="primario">
          <Link href="/mis-tareas/nueva">
            Nueva Tarea
          </Link>
        </Button>
      </div>
      <p className="text-text/50 mb-8">Gestionar tus tareas personales</p>

      <TareasTableClient
        tareas={tareas}
        esAdmin={esAdmin}
        modo="mis-tareas"
        mostrarColumnaAsistente={false}
        canModify={true}
        canDelete={true}
        basePath="/mis-tareas"
      />
    </main>
  );
}
