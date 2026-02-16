"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"

const links = [
  { name: "Tablero", href: "/" },
  { name: "Equipo", href: "/equipo" },
  { name: "Clientes", href: "/clientes" },
  { name: "Vencimientos", href: "/vencimientos" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full w-64
          bg-[#2C2C2C] text-white p-6
          transform transition-transform duration-300 z-50
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="mb-10">
          <h2 className="text-lg font-semibold">Estudio Contable</h2>
        </div>

        <nav className="space-y-4">
          {links.map(link => {
            const isActive = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`
                  block px-4 py-2 rounded-lg transition
                  ${isActive
                    ? "bg-white text-[#2C2C2C] font-semibold"
                    : "hover:bg-gray-700"
                  }
                `}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Botón hamburguesa SOLO mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-5 left-5 z-50 md:hidden"
      >
        <Menu size={28} />
      </button>
    </>
  )
}