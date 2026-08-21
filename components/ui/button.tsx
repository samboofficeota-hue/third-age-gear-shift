import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * 色は必ずトークン（primary / accent / border）で書く。`text-neon` のような
 * リテラル色を直書きすると、白地の管理画面（.admin-theme）で読めなくなる。
 * ダークテーマでは --primary 自体がネオングリーンなので見た目は変わらない。
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* プライマリ = ネオン。文字は必ず暗色(primary-foreground)。外周グロー付き。 */
        default:
          "bg-primary text-primary-foreground shadow-neon-glow hover:bg-primary/90 hover:shadow-neon-strong hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border-2 border-border bg-transparent text-primary hover:border-primary hover:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:border-primary/40 hover:text-primary",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2 text-[0.9375rem]",
        sm: "h-9 rounded-md px-4 text-sm",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
