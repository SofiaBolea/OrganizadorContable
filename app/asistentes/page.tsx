import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs/server'
import { Users } from 'lucide-react'

export default async function AsistentesPage() {
  const { orgId } = await auth()

  if (!orgId) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <p className="text-white/60">Seleccioná una organización para ver los asistentes.</p>
      </main>
    )
  }

  const client = await clerkClient()
  const members = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
  })

  // Filtrar solo los miembros con rol "org:member"
  const miembros = members.data.filter((member) => member.role === 'org:member')

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-6 h-6 text-white/70" />
        <h1 className="text-2xl font-bold">Asistentes</h1>
        <span className="text-sm text-white/50 ml-2">
          {miembros.length} miembro{miembros.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid gap-3">
        {miembros.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
          >
            {member.publicUserData?.imageUrl ? (
              <img
                src={member.publicUserData.imageUrl}
                alt={member.publicUserData.firstName ?? ''}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium">
                {(member.publicUserData?.firstName?.[0] ?? '?').toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {member.publicUserData?.firstName} {member.publicUserData?.lastName}
              </p>
              <p className="text-sm text-white/50 truncate">
                {member.publicUserData?.identifier}
              </p>
            </div>

            <span className="text-xs px-2 py-1 rounded-full border border-white/10 text-white/60 capitalize">
              {member.role?.replace('org:', '')}
            </span>
          </div>
        ))}
      </div>
    </main>
  )
}
