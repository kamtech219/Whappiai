"use client"

import * as React from "react"
import {
  User,
  Bell,
  LogOut,
  Mail,
  Smartphone,
  Volume2,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useUser, useClerk, useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { ensureString } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function NotificationsPage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { signOut } = useClerk()
  const [dbUser, setDbUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchDbUser = React.useCallback(async () => {
     try {
        const token = await getToken()
        const data = await api.auth.check(token || undefined)
        const rawUserObj = data?.user || data

        if (rawUserObj) {
           setDbUser(rawUserObj)
        }
     } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [getToken])

  React.useEffect(() => {
     if (isLoaded) fetchDbUser()
  }, [isLoaded, fetchDbUser])

  if (!isLoaded || loading) return (
     <div className="flex justify-center p-8">
         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
     </div>
  )

  const userEmail = user?.primaryEmailAddress?.emailAddress
  const isAdmin = userEmail === "maruise237@gmail.com" || user?.publicMetadata?.role === "admin"
  const userRole = isAdmin ? "Administrateur" : ((user?.publicMetadata?.role as string) || "Utilisateur")

  const handleUpdatePreference = async (field: string, val: boolean) => {
     try {
        const token = await getToken();
        await api.users.updateProfile({ [field]: val ? 1 : 0 }, token || undefined);
        setDbUser((prev: any) => ({ ...prev, [field]: val ? 1 : 0 }));
        toast.success("Préférences de notification mises à jour");
     } catch (e) {
        toast.error("Erreur lors de la mise à jour des préférences");
     }
  }

  return (
    <>
            <Card className="border-none shadow-none bg-muted/20">
               <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                     <Bell className="h-5 w-5 text-primary" />
                     <CardTitle className="text-sm font-semibold tracking-tight">Préférences de notifications</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Choisissez comment vous souhaitez être informé des activités sur votre compte.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4 pt-0">
                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                     <div className="flex items-center gap-3">
                         <Volume2 className="h-4 w-4 text-muted-foreground" />
                         <div className="space-y-0.5">
                            <p className="text-xs font-semibold">Notifications Sonores</p>
                            <p className="text-[10px] text-muted-foreground">Jouer un son lors d&apos;un nouvel événement dans le tableau de bord.</p>
                         </div>
                     </div>
                     <Switch
                        checked={!!dbUser?.sound_notifications}
                        onCheckedChange={(val) => handleUpdatePreference('sound_notifications', val)}
                     />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                     <div className="flex items-center gap-3">
                         <Mail className="h-4 w-4 text-muted-foreground" />
                         <div className="space-y-0.5">
                            <p className="text-xs font-semibold">Notifications par Email</p>
                            <p className="text-[10px] text-muted-foreground">Recevoir des rapports d&apos;activité et des alertes importantes par email.</p>
                         </div>
                     </div>
                     <Switch
                        checked={!!dbUser?.email_notifications}
                        onCheckedChange={(val) => handleUpdatePreference('email_notifications', val)}
                     />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                     <div className="flex items-center gap-3">
                         <Smartphone className="h-4 w-4 text-muted-foreground" />
                         <div className="space-y-0.5">
                            <p className="text-xs font-semibold">Notifications Push</p>
                            <p className="text-[10px] text-muted-foreground">Recevoir des notifications push sur vos appareils mobiles et bureau.</p>
                         </div>
                     </div>
                     <Switch
                        checked={!!dbUser?.push_notifications}
                        onCheckedChange={(val) => handleUpdatePreference('push_notifications', val)}
                     />
                  </div>
               </CardContent>
            </Card>
    </>
  )
}
