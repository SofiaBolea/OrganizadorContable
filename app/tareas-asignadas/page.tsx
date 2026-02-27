import { auth } from "@clerk/nextjs/server";
import { ShieldAlert, Lock, Plus } from "lucide-react";
import { getTareasAsignadasAdmin, getTareasAsignadasAsistente } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";
import Link from "next/link";
import { Button } from "../components/Button";
import TareasTableClient from "./components/TareasTableClient";
import RefColorSelector from "./components/RefColorSelector";
import RefColorTable from "./components/RefColorTable";

export default async function TareasAsignadasPage() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    return (
      <main>
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Organización Requerida</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Seleccioná un espacio de trabajo para gestionar las tareas.
          </p>
        </div>
      </main>
    );
  }
  const [esAdmin, canView, canCreate, canModify, canDelete, canRevertEstado] = await Promise.all([  
    Permisos.esAdmin(),
    Permisos.puedeVerTareaAsignada(),
    Permisos.puedeCrearTareaAsignada(),
    Permisos.puedeModificarTareaAsignada(),
    Permisos.puedeEliminarTareaAsignada(),
    Permisos.puedeCambiarEstadoTareaAsignada(),
  ]);

  
  if (!canView) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">
          <Lock className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            No tienes permisos para ver las tareas asignadas.
          </p>
        </div>
      </main>
    );
  }

  const tareas = esAdmin
    ? await getTareasAsignadasAdmin(orgId, userId)
    : await getTareasAsignadasAsistente(orgId, userId);

  return (
    <main>
      <div className="flex w-full justify-end mb-8">
        {esAdmin && canCreate && (
          <Button variant="primario">
            <Plus className="w-4 h-4 mr-2" />
            <Link href="/tareas-asignadas/nueva">
              Nueva Tarea
            </Link>
          </Button>
        )}
      </div>

      <TareasTableClient
        tareas={tareas}
        esAdmin={esAdmin}
        modo="asignadas"
        mostrarColumnaAsistente={esAdmin}
        canModify={canModify}
        canDelete={canDelete}
        canRevertEstado={canRevertEstado}
        basePath="/tareas-asignadas"
      />

      {!esAdmin && <RefColorTable />}
    </main>
  );
}
