"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { api } from "@/lib/api"
import { Trash2, AlertTriangle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

export function AIMemoryManager({ sessionId }: { sessionId: string }) {
  const { getToken } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isBlacklistOpen, setIsBlacklistOpen] = useState(false)
  const [contacts, setContacts] = useState<string[]>([])
  const [blacklisted, setBlacklisted] = useState<string[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isSavingBlacklist, setIsSavingBlacklist] = useState(false)

  const clearMemory = async () => {
    setIsDeleting(true)
    try {
      const token = await getToken()
      await api.memory.clearMemory(sessionId, token || undefined)
      toast.success("Mémoire effacée avec succès")
      setIsConfirmOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'effacement de la mémoire")
    } finally {
      setIsDeleting(false)
    }
  }

  const fetchContactsAndBlacklist = async () => {
    setIsLoadingContacts(true)
    try {
      const token = await getToken()
      const [contactsRes, blacklistRes] = await Promise.all([
        api.memory.getContacts(sessionId, token || undefined),
        api.memory.getBlacklist(sessionId, token || undefined)
      ])

      if (contactsRes.data) {
        setContacts(contactsRes.data)
      }
      if (blacklistRes.data) {
        setBlacklisted(blacklistRes.data.map((b: any) => b.remote_jid))
      }
    } catch (err: any) {
      toast.error("Erreur lors du chargement des contacts : " + err.message)
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const saveBlacklist = async () => {
    setIsSavingBlacklist(true)
    try {
      const token = await getToken()
      await api.memory.updateBlacklist(sessionId, blacklisted, token || undefined)
      toast.success("Liste noire mise à jour")
      setIsBlacklistOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour de la liste noire")
    } finally {
      setIsSavingBlacklist(false)
    }
  }

  const toggleBlacklist = (jid: string) => {
    setBlacklisted(prev =>
      prev.includes(jid) ? prev.filter(id => id !== jid) : [...prev, jid]
    )
  }

  if (!isMounted) return null;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setIsBlacklistOpen(true)
            fetchContactsAndBlacklist()
          }}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Exclure des numéros
        </Button>

        <Button
          variant="destructive"
          onClick={() => setIsConfirmOpen(true)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Vider la mémoire de l'IA
        </Button>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmation de suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir vider toute la mémoire conversationnelle de l'IA pour cette session ?
              Cette action est irréversible et l'IA oubliera tout le contexte des conversations passées.
              (Note : Une purge automatique des messages de plus de 1 mois s'effectue automatiquement).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={clearMemory} disabled={isDeleting}>
              {isDeleting ? "Suppression..." : "Oui, vider la mémoire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBlacklistOpen} onOpenChange={setIsBlacklistOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Numéros exclus (Liste noire)</DialogTitle>
            <DialogDescription>
              Cochez les numéros pour lesquels l'IA <strong>ne doit pas</strong> répondre automatiquement.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[300px] w-full border rounded-md p-4">
            {isLoadingContacts ? (
              <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
                Chargement des numéros...
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
                Aucun contact trouvé dans l'historique récent.
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map(jid => (
                  <div key={jid} className="flex items-center space-x-2">
                    <Checkbox
                      id={jid}
                      checked={blacklisted.includes(jid)}
                      onCheckedChange={() => toggleBlacklist(jid)}
                    />
                    <Label htmlFor={jid} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {jid.replace('@s.whatsapp.net', '')}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlacklistOpen(false)}>Annuler</Button>
            <Button onClick={saveBlacklist} disabled={isSavingBlacklist || isLoadingContacts}>
              {isSavingBlacklist ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
