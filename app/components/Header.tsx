"use client"

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()

  const getTitle = () => {
    if (pathname.startsWith("/clientes")) return "Clientes"
    if (pathname.startsWith("/asistentes")) return "Equipo - Asistentes"
    if (pathname.startsWith("/vencimientos")) return "Vencimientos Impositivos"
    if (pathname.startsWith("/organizacion")) return "Organización"
    if (pathname.startsWith("/tareas-asignadas")) return "Tareas Asignadas"
    if (pathname.startsWith("/mis-tareas")) return "Mis Tareas"
    return "Tablero General"
  }

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b bg-[#EFEDE7]">
      
      <h1 className="text-2xl font-semibold text-[#494E5F]">
        {getTitle()}
      </h1>

      <div className="flex items-center gap-4">
        <OrganizationSwitcher hidePersonal />
        <UserButton afterSignOutUrl="/" />
      </div>
      
    </header>
  )
}