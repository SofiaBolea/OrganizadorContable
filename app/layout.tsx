import { ClerkProvider, SignedIn } from '@clerk/nextjs'
import { Navbar } from './components/Navbar'
import { Montserrat } from "next/font/google"
import './globals.css'

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

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
}