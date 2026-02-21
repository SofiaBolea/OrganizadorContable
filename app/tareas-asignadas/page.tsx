import { auth } from "@clerk/nextjs/server";
import { ShieldAlert, Lock } from "lucide-react";
import { getTareasAsignadasAdmin, getTareasAsignadasAsistente } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos/permisos";
import Link from "next/link";
import { Button } from "../components/Button";
import TareasTableClient from "./components/TareasTableClient";
import RefColorSelector from "./components/RefColorSelector";
import RefColorTable from "./components/RefColorTable";

export default async function TareasAsignadasPage() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
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

  const esAdmin = await Permisos.esAdmin();
  const canModify = esAdmin;
  const canDelete = esAdmin;

  const tareas = esAdmin
    ? await getTareasAsignadasAdmin(orgId, userId)
    : await getTareasAsignadasAsistente(orgId, userId);

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-text">Tareas Asignadas</h1>
        {esAdmin && (
          <Button variant="primario">
            <Link href="/tareas-asignadas/nueva">
              Nueva Tarea
            </Link>
          </Button>
        )}
      </div>
      <p className="text-text/50 mb-8">
        {esAdmin
          ? "Gestionar tareas asignadas a tus asistentes"
          : "Tareas asignadas por tu administrador"
        }
      </p>

      <TareasTableClient
        tareas={tareas}
        esAdmin={esAdmin}
        modo="asignadas"
        mostrarColumnaAsistente={esAdmin}
        canModify={canModify}
        canDelete={canDelete}
        basePath="/tareas-asignadas"
      />

      {!esAdmin && <RefColorTable />}
    </main>
  );
}
