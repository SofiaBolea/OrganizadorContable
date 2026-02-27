"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import {
  LayoutGrid,
  Users,
  UserCog,
  Building2,
  Calendar,
  ClipboardList,
  CheckSquare,
  BookOpen
} from "lucide-react"
import { LucideIcon } from "lucide-react"
import Image from "next/image"



type NavItemProps = {
  href: string
  icon: LucideIcon
  label: string
}

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname()

  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200
        ${isActive
          ? "bg-white text-[#2C2C2C] font-semibold shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
        }
      `}
    >
      <Icon
        size={18}
        className={`transition-colors ${isActive ? "text-[#2C2C2C]" : "text-white/60 group-hover:text-white"
          }`}
      />
      {label}
    </Link>
  )
}

export default function Sidebar() {
  const { has, isLoaded } = useAuth();
  const esAdmin = isLoaded && has?.({ role: "org:admin" });
  return (
    <aside className="w-64 bg-[#2C2C2C] text-white flex flex-col px-6 py-8 h-screen sticky top-0 ">

      {/* Logo */}
      <div className="mb-10">
        <div className="flex flex-col items-center mb-4">
          <Image
            src="/logoOrg.png"
            alt="Estudio Contable"
            width={100}
            height={40}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-m text-center font-light tracking-wide text-white/80">
          Organizador Contable
        </h1>
      </div>

      {/* Navegación */}
      <nav className="side-bar-scroll">
        <NavItem
          href="/"
          icon={LayoutGrid}
          label="Tablero General"
        />

        <NavItem
          href="/clientes"
          icon={Users}
          label="Clientes"
        />

        <NavItem
          href="/asistentes"
          icon={UserCog}
          label="Asistentes"
        />

        <NavItem
          href="/organizacion"
          icon={Building2}
          label="Organización"
        />

        <NavItem
          href="/vencimientos"
          icon={Calendar}
          label="Vencimientos"
        />

        <NavItem
          href="/tareas-asignadas"
          icon={ClipboardList}
          label="Tareas Asignadas"
        />


        <NavItem
          href="/recursos-ref"
          icon={BookOpen}
          label="Recursos de Referencia"
        />

        <NavItem
          href="/tareas-propias"
          icon={CheckSquare}
          label="Mis Tareas"
        />

        {esAdmin && (
          <NavItem
            href="/reportes"
            icon={LayoutGrid} // Puedes cambiar el icono si prefieres uno específico para reportes
            label="Reportes"
          />
        )}

      </nav>


      <div className="mt-auto pt-8 text-xs text-white/40">
        © {new Date().getFullYear()} BianculliBolea
      </div>

    </aside>
  )
}