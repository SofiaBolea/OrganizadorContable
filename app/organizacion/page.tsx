import { OrganizationProfile } from '@clerk/nextjs'

export default function OrganizacionPage() {
  return (
    <div className="flex justify-center py-10">
      <OrganizationProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-3xl',
            cardBox: 'w-full',
          },
        }}
      />
    </div>
  )
}
