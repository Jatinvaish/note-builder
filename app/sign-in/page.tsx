"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetcher } from "@/lib/services/fetcher"
import { getFingerprint } from "@/lib/services/fingerprint"
import { useToast } from "@/hooks/use-toast"
import { FileText, Eye, EyeOff, Loader2 } from "lucide-react"

const signInSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

type SignInForm = z.infer<typeof signInSchema>

export default function SignInPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: "", password: "", rememberMe: false },
  })

  const onSubmit = async (data: SignInForm) => {
    setError("")
    const json = {
      username: data.identifier,
      password: data.password,
      fp: getFingerprint(),
    }
    try {
      const result = await fetcher({ path: "/auth/sign-in" }, { json })

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.token) {
        window.localStorage.setItem("-__-", result.token)
        setTimeout(() => {
          router.push("/notes")
        }, 1000)
        return
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to UniDoc EMR</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or Username</Label>
            <Input id="identifier" type="text" placeholder="admin@unidoc.com" disabled={isSubmitting} {...register("identifier")} />
            {errors.identifier && <p className="text-sm font-medium text-destructive">{errors.identifier.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" disabled={isSubmitting} {...register("password")} className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isSubmitting} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50">
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
              </button>
            </div>
            {errors.password && <p className="text-sm font-medium text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="rememberMe" {...register("rememberMe")} disabled={isSubmitting} />
              <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Remember me</Label>
            </div>
            <a href="/forgot-password" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Forgot password?</a>
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign in"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">Protected by AES-256 encryption</p>
          <p className="text-sm text-muted-foreground">Don't have an account? <a href="/register" className="font-medium text-primary hover:underline">Sign up</a></p>
        </div>
      </div>
    </div>
  )
}
