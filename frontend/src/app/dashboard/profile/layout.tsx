"use client"

import * as React from "react"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useUser, useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ensureString } from "@/lib/utils"

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const pathname = usePathname()

  if (!isLoaded) return null

  const userEmail = user?.primaryEmailAddress?.emailAddress
  const isAdmin = userEmail === "maruise237@gmail.com" || user?.publicMetadata?.role === "admin"
  const userRole = isAdmin ? "Administrateur" : ((user?.publicMetadata?.role as string) || "Utilisateur")

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
        <div className="h-20 w-20 rounded-full border-2 border-primary/20 p-1 bg-background shadow-sm shrink-0">
           <div className="h-full w-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground/30" />
              )}
           </div>
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{user?.fullName || ensureString(userEmail)?.split('@')[0]}</h1>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground tracking-widest">{userRole}</Badge>
            <span className="text-xs text-muted-foreground truncate w-full sm:w-auto">{userEmail}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
         <nav className="flex flex-row md:flex-col gap-1 sticky top-14 md:top-24 bg-background/95 backdrop-blur z-10 py-2 md:py-0 overflow-x-auto no-scrollbar border-b md:border-none h-fit">
            <Button variant="ghost" asChild className={`flex-none justify-start text-xs font-semibold tracking-wider h-10 px-4 whitespace-nowrap ${pathname === '/dashboard/profile' ? 'bg-muted/50 border-b-2 md:border-b-0 md:border-r-2 border-primary rounded-none' : 'text-muted-foreground hover:bg-muted/30'}`}>
                <Link href="/dashboard/profile">Mon Profil</Link>
            </Button>
            <Button variant="ghost" asChild className={`flex-none justify-start text-xs font-semibold tracking-wider h-10 px-4 whitespace-nowrap ${pathname === '/dashboard/profile/security' ? 'bg-muted/50 border-b-2 md:border-b-0 md:border-r-2 border-primary rounded-none' : 'text-muted-foreground hover:bg-muted/30'}`}>
                <Link href="/dashboard/profile/security">Sécurité</Link>
            </Button>
            <Button variant="ghost" asChild className={`flex-none justify-start text-xs font-semibold tracking-wider h-10 px-4 whitespace-nowrap ${pathname === '/dashboard/profile/notifications' ? 'bg-muted/50 border-b-2 md:border-b-0 md:border-r-2 border-primary rounded-none' : 'text-muted-foreground hover:bg-muted/30'}`}>
                <Link href="/dashboard/profile/notifications">Notifications</Link>
            </Button>
            <Separator className="hidden md:block my-2" />
            <Button variant="ghost" onClick={() => signOut()} className="flex-none justify-start text-xs font-semibold tracking-wider h-10 text-destructive hover:bg-destructive/5 hover:text-destructive px-4 whitespace-nowrap">
               <LogOut className="h-3.5 w-3.5 mr-2" /> Déconnexion
            </Button>
         </nav>

         <div className="space-y-6">
            {children}
         </div>
      </div>
    </div>
  )
}