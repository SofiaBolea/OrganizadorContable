// sofiabolea/organizadorcontable/OrganizadorContable-recRef/app/recursos-ref/page.tsx

import { listarRecursosPropios } from "@/lib/recursosRef";
import { Permisos } from "@/lib/permisos";
import { TablaRecursos } from "./tablaRecursos";

export default async function RecursosPage() {
  // Carga de datos y permisos en el servidor
  const recursos = await listarRecursosPropios();
  
  const permisos = {
    puedeCrearGlobal: await Permisos.puedeCrearRecursosRefGlobales(),
    puedeModificarGlobal: await Permisos.puedeModificarRecursosRefGlobales(),
    puedeEliminarGlobal: await Permisos.puedeEliminarRecursosRefGlobales(),
    puedeCrearPropio: await Permisos.puedeCrearRecursosReferencia(),
  };

  return (
    <div className="p-6 space-y-6">
      <TablaRecursos 
        initialRecursos={recursos} 
        permisos={permisos} 
      />
    </div>
  );
}