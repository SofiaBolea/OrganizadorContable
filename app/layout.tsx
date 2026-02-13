import { ClerkProvider, SignedIn } from '@clerk/nextjs'
import { Header } from './components/Header'
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
            <Header />
          </SignedIn>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}