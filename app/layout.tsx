import { ClerkProvider, SignedIn } from '@clerk/nextjs'
import { Navbar } from './components/Navbar'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
    >
      <html lang="es">
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