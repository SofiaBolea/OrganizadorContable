import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getVencimientosParaTabla } from '../../lib/data'
import Link from 'next/link'
import { Button } from '../components/Button'

export default async function VencimientosPage() {
  const { orgRole, orgId } = await auth()

  if (orgRole !== 'org:admin' || !orgId) {
    redirect('/')
  }

  const ocurrencias = await getVencimientosParaTabla(orgId)

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Vencimientos Impositivos</h1>
        <Button variant="primario">
          <Link
            href="/vencimientos/nuevoVencimiento"
          >
            Nuevo Vencimiento
          </Link>
        </Button>
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