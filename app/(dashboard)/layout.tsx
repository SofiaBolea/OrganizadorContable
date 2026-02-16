import { SignedIn } from "@clerk/nextjs"
import Sidebar from "../components/Sidebar"
import Header from "../components/Header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SignedIn>
      <div className="flex h-screen bg-[#EFEDE7]">

        <Sidebar />

        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>

      </div>
    </SignedIn>
  )
}
