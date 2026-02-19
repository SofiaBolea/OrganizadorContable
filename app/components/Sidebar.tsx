"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Protect } from "@clerk/nextjs"

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`
        px-4 py-2 rounded-md text-sm transition-colors
        ${
          isActive
            ? "bg-white text-[#2C2C2C] font-semibold"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }
      `}
    >
      {children}
    </Link>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#2C2C2C] text-white p-6 flex flex-col">

      <h2 className="text-lg font-semibold mb-8">
        Organizador Contable
      </h2>

      <nav className="flex flex-col gap-2">

        <NavLink href="/clientes">Clientes</NavLink>

        <NavLink href="/asistentes">Asistentes</NavLink>

        <NavLink href="/organizacion">Organización</NavLink>

        <NavLink href="/vencimientos">Vencimientos</NavLink>

        <NavLink href="/tareas-asignadas">Tareas Asignadas</NavLink>

        <NavLink href="/tareas-propias">Mis Tareas</NavLink>

      </nav>

    </aside>
  )
}