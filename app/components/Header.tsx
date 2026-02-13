'use client'
import { UserButton, OrganizationSwitcher, Protect } from '@clerk/nextjs'
import Link from 'next/link'

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-background">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-bold">
          Organizador Contable
        </Link>
        
        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
        />
      </div>

      <nav className="flex items-center gap-6">
        <Link href="/clientes" className="text-sm hover:underline">
          Clientes
        </Link>
        <Protect role="org:admin">
          <Link href="/vencimientos" className="text-sm hover:underline">
            Vencimientos
          </Link>
        </Protect>
        <Link href="/organizacion" className="text-sm hover:underline">
          Organización
        </Link>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-9 h-9',
            },
          }}
        />
      </nav>
    </header>
  )
}
