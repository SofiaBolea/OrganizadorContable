"use client";

import { useClerk } from "@clerk/nextjs";
import { UserPlus } from "lucide-react";
import { Button } from "../components/Button";

export function InviteMemberButton() {
  const { openOrganizationProfile } = useClerk();

  const handleOpenMembers = () => {
    // Abrimos el perfil de la organización directamente en la pestaña de miembros
    openOrganizationProfile({
      appearance: {
        elements: {
          rootBox: "mx-auto",
          card: "bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-[2.5rem]",
        }
      }
    });
  };

  return (
    <Button variant="primario"
      onClick={handleOpenMembers}
      className="flex items-center gap-2  text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
    >
      <UserPlus className="w-4 h-4" />
      Gestionar Miembros
    </Button>
  );
}