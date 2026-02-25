import { auth } from "@clerk/nextjs/server";
import { ShieldAlert, Lock } from "lucide-react";
import { getTareasPropias } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";
import Link from "next/link";
import { Button } from "../components/Button";
import TareasTableClient from "@/app/tareas-asignadas/components/TareasTableClient";
import RefColorTable from "@/app/tareas-asignadas/components/RefColorTable";
import BotonScroll from "../components/botonScroll";

export default async function TareasPropiasPage() {
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

  const [esAdmin, canView, canCreate, canModify, canDelete, canRevertEstado] = await Promise.all([  
    Permisos.esAdmin(),
    Permisos.puedeVerTarea(),
    Permisos.puedeCrearTarea(),
    Permisos.puedeModificarTarea(),
    Permisos.puedeEliminarTarea(),
    Permisos.puedeCambiarEstadoTarea(),
  ]);
  

  if (!canView) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">
          <Lock className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            No tienes permisos para ver las tareas propias.
          </p>
        </div>
      </main>
    );
  }
  
  const tareas = await getTareasPropias(orgId, userId); 

  return (
    <main className="p-8">
      <div className="flex flex-row justify-between items-center mb-2">

        <h1 className="text-3xl font-bold text-text">Mis Tareas</h1>
        <div className="flex flex-row gap-4">
          {canCreate && (
          <Button variant="primario">
            <Link href="/tareas-propias/nueva">
              Nueva Tarea
            </Link>
          </Button>
        )}

        <BotonScroll targetId="refColor-section" label="Referencias de color" />
        </div>
        
      </div>
      <p className="text-text/50 mb-8">Gestionar tus tareas personales</p>

      <TareasTableClient
        tareas={tareas}
        esAdmin={esAdmin}
        modo="tareas-propias"
        mostrarColumnaAsistente={false}
        canModify={canModify}
        canDelete={canDelete}
        canRevertEstado={canRevertEstado}
        basePath="/tareas-propias"
      />

      <section id="refColor-section" className="mt-16">
        <RefColorTable />
      </section>

    </main>
  );
}
