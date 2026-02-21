
import { auth } from "@clerk/nextjs/server";
import { TablaAsistentes } from "./tablaAsistentes";
import { Permisos } from "@/lib/permisos";


export default async function AsistentesPage({ searchParams }: { searchParams: Record<string, string> }) {
  const { orgId, has } = await auth();


  if (!orgId) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-app">
        <div className="bg-card border border-black/5 p-12 rounded-xl text-center max-w-sm shadow-sm">
          <h2 className="text-xl font-bold text-text mb-2">Organización Requerida</h2>
          <p className="text-sm text-text/60 leading-relaxed">Seleccioná un espacio de trabajo.</p>
        </div>
      </main>
    );
  }


  const canView = await Permisos.puedeVerAsistentes();
  const canInvite = has({ permission: "org:asistentes:crear_asistente" });


  if (!canView) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-app">
        <div className="bg-danger/10 border border-danger/20 p-12 rounded-xl text-center max-w-md">
          <h2 className="text-2xl font-black text-text mb-2">Acceso Denegado</h2>
          <p className="text-text/60 italic">No tenés permisos para gestionar asistentes.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-app text-text font-medium">
      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        <TablaAsistentes canInvite={canInvite} />
      </main>
    </div>
  );
}