'use client'

import {
  UserButton,
  OrganizationSwitcher,
  Protect,
} from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`text-sm px-3 py-2 rounded-md transition-colors ${
        isActive
          ? 'bg-white/10 font-semibold'
          : 'hover:bg-white/5 text-white/70 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-background">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Organizador Contable
        </Link>

        <OrganizationSwitcher
          hidePersonal
          afterCreateOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
          appearance={{
            elements: {
              rootBox: 'flex items-center',
              organizationSwitcherTrigger:
                'px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/5 transition-colors',
            },
          }}
        />

        <div className="flex items-center gap-1 ml-2">
          <NavLink href="/clientes">Clientes</NavLink>
          <Protect role="org:admin">
            <NavLink href="/vencimientos">Vencimientos</NavLink>
          </Protect>
          <NavLink href="/organizacion">Organización</NavLink>
        </div>
      </div>

      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: 'w-9 h-9',
          },
        }}
      />
    </nav>
  )
}
