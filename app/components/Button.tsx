type ButtonProps = {
  children: React.ReactNode
  variant?: "primario" | "peligro"
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
      "bg-danger text-danger-foreground border-danger-foreground hover:opacity-90"
  }

  return (
    <button
      className={`${base} ${variantes[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
