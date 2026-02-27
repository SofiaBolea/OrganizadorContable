type ButtonProps = {
  children: React.ReactNode
  variant?: "primario" | "peligro" | "general"
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  children,
  variant = "primario",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "px-6 py-3 rounded-xl text-base font-medium transition-opacity border-[3px]"

  const variantes = {
    primario:
      "bg-primary text-primary-foreground border-primary-foreground hover:opacity-90",
    peligro:
      "bg-danger text-danger-foreground border-danger-foreground hover:opacity-90",
    general:
      "bg-white text-text border-text/80 hover:bg-app hover:border-text/50",
  }

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 ${base} ${variantes[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
