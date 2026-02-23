import { redirect } from "next/navigation";
import { Permisos } from "@/lib/permisos";
import ReporteDashboard from "./reporteDashboard";

export default async function Page() {
  const isAdmin = await Permisos.esAdmin();
  
  if (!isAdmin) {
    redirect("/"); 
  }

  return (
    <main className="max-w-7xl mx-auto py-10 px-6">
      <ReporteDashboard />
    </main>
  );
}