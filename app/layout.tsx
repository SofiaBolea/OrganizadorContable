"use client"
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs'
import { Navbar } from './components/Navbar'
import { Montserrat } from "next/font/google"
import './globals.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { esES } from "@clerk/localizations";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})


/*
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
    >
      <html lang="es" className={montserrat.className}>
        <body>
          <SignedIn>
            <Navbar />
          </SignedIn>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}*/

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/" localization={esES}>
      <html lang="es">
        <body>
          <SignedIn>
            <div className="flex h-screen bg-[#EFEDE7]">
              <Sidebar />
              <div className="flex flex-col flex-1">
                <Header />
                <main className="flex-1 p-6 overflow-auto">
                  {children}
                </main>
              </div>
            </div>
          </SignedIn>

          <SignedOut>
            {children}
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}