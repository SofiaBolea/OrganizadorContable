import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Users, ShieldAlert, Lock, UserCheck, ChevronRight } from "lucide-react";
import { getVencimientosParaTabla } from '../../lib/data'
import Link from 'next/link'
import { Button } from '../components/Button'

export default async function VencimientosPage() {
  const { orgRole, orgId, has } = await auth()

    if (!orgId) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Organización Requerida</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Seleccioná un espacio de trabajo para gestionar los vencimientos.
          </p>
        </div>
      </main>
    );
  }

  const canView = has({ permission: "org:vencimientos:ver_vencimientos" }); 
  const canCreate = has({ permission: "org:vencimientos:crear_vencimientos" });  

  if (!canView) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-red-500/[0.02] border border-red-500/10 p-12 rounded-[3rem] text-center max-w-md shadow-2xl">
          <Lock className="w-10 h-10 text-red-500/50 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-2">Acceso Denegado</h2>
          <p className="text-slate-500 italic">
            No tenés el permiso "Ver Vencimientos" asignado en tu rol.
          </p>
        </div>
      </main>
    );
  }

  const ocurrencias = await getVencimientosParaTabla(orgId)

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Vencimientos Impositivos</h1>
          {canCreate && (<Button variant="primario">
            <Link
              href="/vencimientos/nuevoVencimiento"
            >
              Nuevo Vencimiento
            </Link>
          </Button>)}
          
      </div>

      {ocurrencias.length === 0 ? (
        <p>No hay vencimientos cargados.</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ocurrencias.map((o) => (
              <tr key={o.id}>
                <td>{o.vencimiento.titulo}</td>
                <td>{o.vencimiento.tipoVencimiento}</td>
                <td>
                  {new Date(o.fechaVencimiento).toLocaleDateString()}
                </td>
                <td>{o.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}