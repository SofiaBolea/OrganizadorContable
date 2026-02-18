"use client"

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { Perfil } from "../components/perfilDeUsuario/userProfile"

const DotIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
    </svg>
  )
}


export default function Header() {
  const pathname = usePathname()

  const getTitle = () => {
    if (pathname.startsWith("/clientes")) return "Clientes"
    if (pathname.startsWith("/asistentes")) return "Equipo - Asistentes"
    if (pathname.startsWith("/vencimientos")) return "Vencimientos Impositivos"
    if (pathname.startsWith("/organizacion")) return "Organización"
    return "Tablero General"
  }

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b bg-[#EFEDE7]">

      <h1 className="text-2xl font-semibold text-[#494E5F]">
        {getTitle()}
      </h1>

      <div className="flex items-center gap-4">
        <OrganizationSwitcher hidePersonal />
        <UserButton>
          <UserButton.UserProfilePage label="Editar Datos Extras" url="custom" labelIcon={<DotIcon />}>
            <Perfil />
          </UserButton.UserProfilePage>
        </UserButton>
      </div>

    </header>
  )
}