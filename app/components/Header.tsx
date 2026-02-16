"use client"

import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"

export default function Header() {
  const pathname = usePathname()

  const getTitle = () => {
    if (pathname === "/") return "Tablero"
    if (pathname === "/equipo") return "Equipo - Asistentes"
    if (pathname === "/clientes") return "Clientes"
    if (pathname === "/vencimientos") return "Vencimientos"
    return ""
  }

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b bg-[#EFEDE7]">

      <h1 className="text-2xl font-semibold text-[#494E5F]">
        {getTitle()}
      </h1>

      <UserButton />

    </header>
  )
}
