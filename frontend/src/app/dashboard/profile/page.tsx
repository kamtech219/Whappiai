"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser, useAuth } from "@clerk/nextjs"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Save, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const [dbUser, setDbUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState(false)

  const fetchDbUser = React.useCallback(async () => {
     try {
        const token = await getToken()
        const data = await api.auth.check(token || undefined)
        const rawUserObj = data?.user || data

        if (rawUserObj) {
           const userObj = { ...rawUserObj }
           if (!userObj.timezone || userObj.timezone === 'UTC') {
              userObj.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
           }
           setDbUser(userObj)
        }
     } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [getToken])

  React.useEffect(() => {
     fetchDbUser()
  }, [fetchDbUser])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = await getToken()
      await api.users.updateProfile({
        organization_name: dbUser.organization_name,
        timezone: dbUser.timezone
      }, token || undefined)
      toast.success("Profil mis à jour")
    } catch (e) {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "SUPPRIMER") return
    setIsDeleting(true)
    try {
      const token = await getToken()
      await api.users.deleteProfile(token || undefined)
      toast.success("Compte supprimé avec succès")
      await signOut()
    } catch (e) {
      toast.error("Erreur lors de la suppression du compte")
      setIsDeleting(false)
    }
  }

  if (!isLoaded) return null

  const userEmail = user?.primaryEmailAddress?.emailAddress

  return (
    <div className="space-y-6">
            <Card className="border-none shadow-none bg-muted/20">
               <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold tracking-tight">Informations de Compte</CardTitle>
                  <CardDescription className="text-xs">Vos données personnelles synchronisées via Clerk.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground">Nom Prénom</Label>
                        <Input value={user?.fullName || ""} readOnly className="h-9 bg-background/50 border-none text-xs" />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground">Email Principal</Label>
                        <Input value={userEmail || ""} readOnly className="h-9 bg-background/50 border-none text-xs" />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground">Organisation</Label>
                        <Input
                           value={dbUser?.organization_name || ""}
                           onChange={(e) => setDbUser(prev => prev ? { ...prev, organization_name: e.target.value } : prev)}
                           className="h-9 text-xs"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground">Fuseau Horaire</Label>
                        <Input
                           value={dbUser?.timezone || ""}
                           onChange={(e) => setDbUser(prev => prev ? { ...prev, timezone: e.target.value } : prev)}
                           className="h-9 text-xs"
                        />
                     </div>
                  </div>
                  <div className="flex justify-end mt-4">
                     <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Enregistrer
                     </Button>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-muted/20">
               <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold tracking-tight">Activité & Usage</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-4 rounded bg-background/50 border border-border/50">
                        <p className="text-[9px] font-semibold text-muted-foreground tracking-widest mb-1">Dernière Connexion</p>
                        <p className="text-xs font-semibold">{user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Maintenant'}</p>
                     </div>
                     <div className="p-4 rounded bg-background/50 border border-border/50">
                        <p className="text-[9px] font-semibold text-muted-foreground tracking-widest mb-1">Ancienneté</p>
                        <p className="text-xs font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <div className="pt-6 border-t border-dashed">
               <h4 className="text-[10px] font-semibold text-destructive  mb-3">Zone de Danger</h4>
               <p className="text-xs text-muted-foreground mb-4">La suppression de votre compte est irréversible et effacera toutes vos sessions WhatsApp ainsi que vos historiques IA.</p>
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button variant="outline" className="text-xs text-destructive hover:bg-destructive hover:text-white transition-all rounded-full px-6">Supprimer mon compte définitivement</Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                     <AlertDialogDescription>
                       Cette action est irréversible. Cela supprimera définitivement votre compte et effacera toutes vos sessions WhatsApp, données et historiques de nos serveurs.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <div className="my-4">
                     <Label className="text-xs font-semibold mb-2 block">Tapez "SUPPRIMER" pour confirmer :</Label>
                     <Input
                       value={deleteConfirmation}
                       onChange={(e) => setDeleteConfirmation(e.target.value)}
                       placeholder="SUPPRIMER"
                       className="border-destructive/50 focus-visible:ring-destructive"
                     />
                   </div>
                   <AlertDialogFooter>
                     <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Annuler</AlertDialogCancel>
                     <AlertDialogAction
                       onClick={handleDeleteAccount}
                       disabled={deleteConfirmation !== "SUPPRIMER" || isDeleting}
                       className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                     >
                       {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                       Supprimer définitivement
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
            </div>
    </div>
  )
}
