import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getVencimientos } from '../../lib/data'
import VencimientoInputs from '../components/VencimientoInputs'

export default async function VencimientosPage() {
  const { orgRole, orgId } = await auth()

  if (orgRole !== 'org:admin' || !orgId) {
    redirect('/')
  }

  const vencimientos = await getVencimientos(orgId)

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Vencimientos</h1>
        <VencimientoInputs />
      </div>

      {vencimientos.length === 0 ? (
        <p className="text-foreground/60">No hay vencimientos cargados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Título</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tipo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Periodicidad</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Jurisdicción</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vencimientos.map((v) => (
                <tr key={v.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{v.titulo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{v.tipoVencimiento}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{v.periodicidad}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{v.jurisdiccion ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{v.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
