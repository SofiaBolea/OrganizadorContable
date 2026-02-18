"use client";
import { useEffect, useState } from "react";
import { OrganizationProfile, useOrganization } from "@clerk/nextjs";
import { InformacionExtraPage } from "../informacionExtra";
import { InformacionOrganizacion } from "../vistaInformaciónOrganizacion";

// Ícono simple
const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 16h-1v-4h-1m1-4h.01M12 20c4.418 0 8-3.582..."
    />
  </svg>
);

export default function OrganizationProfilePage() {
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

  // Opcional: podés mostrar un loader mientras carga permisos
  if (loadingPerms) return null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F8F6] p-4">
      <div className="w-full max-w-4xl">
        <OrganizationProfile
          routing="path"
          path="/organizacion"
          appearance={{
            variables: {
              colorPrimary: "#6C8A51",
              colorDanger: "#E08A76",
              colorText: "#3F4A5A",
              colorBackground: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
            },
            elements: {
              card: {
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
              },
              rootBox: {
                width: "100%",
              },
            },
          }}
        >
          {/* Siempre visible */}
          <OrganizationProfile.Page
            label="Ver Información"
            url="ver-info"
            labelIcon={<InfoIcon />}
          >
            <InformacionOrganizacion />
          </OrganizationProfile.Page>

          {/* Solo para administradores */}
          {isAdmin && (
            <OrganizationProfile.Page
              label="Editar Información Extra"
              url="info-extra"
              labelIcon={<InfoIcon />}
            >
              <InformacionExtraPage />
            </OrganizationProfile.Page>
          )}
        </OrganizationProfile>
      </div>
    </div>
  );
}
