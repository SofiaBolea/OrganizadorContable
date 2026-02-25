"use client"

import { UserButton, OrganizationProfile, useOrganization, OrganizationSwitcher } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { Perfil } from "../components/perfilDeUsuario/userProfile"
import { InformacionOrganizacion } from "../organizacion/vistaInformaciónOrganizacion"
import { InfoIcon } from "lucide-react"
import { InformacionExtraPage } from "../organizacion/informacionExtra"
import { useEffect, useState } from "react"

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
    if (pathname.startsWith("/tareas-asignadas")) return "Tareas Asignadas"
    if (pathname.startsWith("/tareas-propias")) return "Mis Tareas"
    if (pathname.startsWith("/recursos-ref")) return "Recursos de Referencia"
    return "Tablero General"
  }

  const getSubTitle = () => {
  if (pathname.startsWith("/clientes")) return "Gestionar clientes, proveedores y otros contactos"
  if (pathname.startsWith("/asistentes")) return "Gestionar tu equipo de asistentes virtuales, asignar tareas y supervisar su desempeño"
  if (pathname.startsWith("/vencimientos")) return "Visualizar y gestionar los vencimientos de impuestos nacionales, provinciales y municipales"
  if (pathname.startsWith("/organizacion")) return "Configurar y administrar los detalles de tu organización"
  if (pathname.startsWith("/tareas-asignadas")) return "Visualizar y gestionar las tareas asignadas"
  if (pathname.startsWith("/tareas-propias")) return "Visualizar y gestionar las tareas que tienes asignadas como usuario"
  if (pathname.startsWith("/recursos-ref")) return "Acceder a recursos adicionales"
  return "Tablero General"
  }

  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const { organization } = useOrganization();

  useEffect(() => {
    async function checkAdmin() {
      setLoadingPerms(true);
      try {
        const res = await fetch("/api/administrador");
        const data = await res.json();
        setIsAdmin(!!data.esAdmin);
      } catch (err) {
        console.error("Error al verificar permisos:", err);
        setIsAdmin(false);
      } finally {
        setLoadingPerms(false);
      }
    }

    // Solo hacemos fetch si hay una org seleccionada
    if (organization?.id) {
      checkAdmin();
    }
  }, [organization?.id]);

  return (
    <header className="h-25 flex items-center mt-4 justify-between px-15 ">

      <div className="flex flex-col items-baseline md:items-start gap-2">
        <h1 className="text-3xl font-bold text-text">
          {getTitle()}
        </h1>
        <p className="text-text/50">{getSubTitle()}</p>
      </div>


      <div className="flex items-center gap-4">
        <OrganizationSwitcher>
          {/* Siempre visible */}
          <OrganizationProfile.Page
            label="Ver Información"
            url="ver-info"
            labelIcon={<InfoIcon />}
          >
            <InformacionOrganizacion />
          </OrganizationProfile.Page>

          {isAdmin && (
            <OrganizationProfile.Page
              label="Editar Información Extra"
              url="info-extra"
              labelIcon={<InfoIcon />}
            >
              <InformacionExtraPage />
            </OrganizationProfile.Page>
          )}
        </OrganizationSwitcher>
        <UserButton>
          <UserButton.UserProfilePage label="Editar Datos Extras" url="custom" labelIcon={<DotIcon />}>
            <Perfil />
          </UserButton.UserProfilePage>
        </UserButton>
      </div>

    </header>
  )
}