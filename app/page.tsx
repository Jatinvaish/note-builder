import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Consultation Note Templates</h1>
          <p className="text-lg text-muted-foreground">Create and manage medical consultation note templates</p>
        </div>
        <Link href="/templates">
          <Button size="lg">Get Started</Button>
        </Link>
      </div>
    </main>
  )
}
