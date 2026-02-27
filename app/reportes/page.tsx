import { redirect } from "next/navigation";
import { Permisos } from "@/lib/permisos";
import ReporteDashboard from "./reporteDashboard";

export default async function Page() {
  const isAdmin = await Permisos.esAdmin();
  
  if (!isAdmin) {
    redirect("/"); 
  }

  return (
    <main className="flex-1 pr-12 pl-12 pt-4 overflow-auto justify-center">
      <ReporteDashboard />
    </main> 
  );
}