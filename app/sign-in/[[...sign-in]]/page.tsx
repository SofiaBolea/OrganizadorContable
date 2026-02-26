import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F8F6] p-4">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#6C8A51",
              colorDanger: "#E08A76",
              colorText: "#3F4A5A",
              colorBackground: "#FFFFFF",
              fontFamily: "montserrat, sans-serif",
            },
            elements: {
              card: {
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
              },
            },

          }}
        />
      </div>
    </div>
  )
}

