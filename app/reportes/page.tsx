import { redirect } from "next/navigation";
import { Permisos } from "@/lib/permisos";
import ReporteDashboard from "./reporteDashboard";

export default async function Page() {
  const isAdmin = await Permisos.esAdmin();
  
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <main className="container mx-auto py-10">
      <ReporteDashboard />
    </main>
  );
}