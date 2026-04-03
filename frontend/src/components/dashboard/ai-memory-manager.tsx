"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"
import { api } from "@/lib/api"
import { Trash2, AlertTriangle, Users, RefreshCw, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  const [newContacts, setNewContacts] = useState<string[]>([])
  const [blacklisted, setBlacklisted] = useState<string[]>([])
  const [whitelisted, setWhitelisted] = useState<string[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isSavingBlacklist, setIsSavingBlacklist] = useState(false)
  const [activeTab, setActiveTab] = useState("blacklist")

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

  const fetchContactsAndBlacklist = async (isRefresh = false) => {
    setIsLoadingContacts(true)
    try {
      const token = await getToken()
      const [contactsRes, blacklistRes, whitelistRes] = await Promise.all([
        api.memory.getContacts(sessionId, token || undefined),
        api.memory.getBlacklist(sessionId, token || undefined),
        api.memory.getWhitelist(sessionId, token || undefined)
      ])

      if (blacklistRes.data) {
        // Only override blacklist if it's the first load, to avoid unchecking items the user just checked before saving
        if (!isRefresh && blacklisted.length === 0) {
           setBlacklisted(blacklistRes.data.map((b: any) => b.remote_jid))
        }
      }

      if (whitelistRes.data) {
        if (!isRefresh && whitelisted.length === 0) {
           setWhitelisted(whitelistRes.data.map((b: any) => b.remote_jid))
        }
      }

      if (contactsRes.data) {
        const fetchedContacts = contactsRes.data as string[];

        if (isRefresh) {
          // Identify new contacts that weren't in the state previously
          const newOnes = fetchedContacts.filter(jid => !contacts.includes(jid));
          if (newOnes.length > 0) {
            setNewContacts(prev => [...new Set([...prev, ...newOnes])]);
            toast.success(`${newOnes.length} nouveau(x) numéro(s) trouvé(s) !`);
          } else {
            toast.info("Aucun nouveau numéro trouvé.");
          }
        }

        setContacts(fetchedContacts)
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
      await Promise.all([
        api.memory.updateBlacklist(sessionId, blacklisted, token || undefined),
        api.memory.updateWhitelist(sessionId, whitelisted, token || undefined)
      ])
      toast.success("Listes mises à jour")
      setIsBlacklistOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour des listes")
    } finally {
      setIsSavingBlacklist(false)
    }
  }

  const toggleBlacklist = (jid: string) => {
    setBlacklisted(prev =>
      prev.includes(jid) ? prev.filter(id => id !== jid) : [...prev, jid]
    )
    // If we add to blacklist, ensure it's not in whitelist
    if (!blacklisted.includes(jid) && whitelisted.includes(jid)) {
      setWhitelisted(prev => prev.filter(id => id !== jid))
    }
  }

  const toggleWhitelist = (jid: string) => {
    setWhitelisted(prev =>
      prev.includes(jid) ? prev.filter(id => id !== jid) : [...prev, jid]
    )
    // If we add to whitelist, ensure it's not in blacklist
    if (!whitelisted.includes(jid) && blacklisted.includes(jid)) {
      setBlacklisted(prev => prev.filter(id => id !== jid))
    }
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
          Listes Blanches/Noires
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
            <div className="flex justify-between items-start">
               <div>
                  <DialogTitle>Gérer les listes IA</DialogTitle>
                  <DialogDescription>
                    Configurez le comportement de l'IA pour chaque contact.
                  </DialogDescription>
               </div>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => fetchContactsAndBlacklist(true)}
                 disabled={isLoadingContacts}
                 className="gap-2"
               >
                 <RefreshCw className={`h-4 w-4 ${isLoadingContacts ? 'animate-spin' : ''}`} />
                 Synchroniser
               </Button>
            </div>
          </DialogHeader>

          <div className="w-full mt-4">
            <div className="grid w-full grid-cols-2 rounded-md bg-muted p-1 text-muted-foreground mb-4">
              <button
                onClick={() => setActiveTab("blacklist")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 ${activeTab === 'blacklist' ? 'bg-background text-foreground shadow-sm' : ''}`}
              >
                 <AlertTriangle className={`h-4 w-4 ${activeTab === 'blacklist' ? 'text-destructive' : ''}`} />
                 Liste Noire
              </button>
              <button
                onClick={() => setActiveTab("whitelist")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 ${activeTab === 'whitelist' ? 'bg-background text-foreground shadow-sm' : ''}`}
              >
                 <UserCheck className={`h-4 w-4 ${activeTab === 'whitelist' ? 'text-primary' : ''}`} />
                 Liste Blanche
              </button>
            </div>

            {activeTab === "blacklist" && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Cochez les numéros pour lesquels l'IA <strong>ne doit pas</strong> répondre.
                </p>
                <ScrollArea className="h-[250px] w-full border rounded-md p-4 bg-muted/20">
                  {isLoadingContacts ? (
                    <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
                      Chargement des numéros...
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
                      Aucun contact trouvé dans l'historique.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contacts.map(jid => {
                        const isNew = newContacts.includes(jid);
                        return (
                          <div key={`bl-${jid}`} className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${isNew ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}>
                            <Checkbox
                              id={`bl-${jid}`}
                              checked={blacklisted.includes(jid)}
                              onCheckedChange={() => toggleBlacklist(jid)}
                            />
                            <Label htmlFor={`bl-${jid}`} className="text-sm font-medium leading-none flex-1 flex items-center gap-2 cursor-pointer">
                              {jid.replace('@s.whatsapp.net', '')}
                              {isNew && <Badge variant="default" className="text-[10px] px-1.5 py-0">Nouveau</Badge>}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {activeTab === "whitelist" && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Cochez les numéros pour lesquels l'IA <strong>doit répondre</strong> même si désactivée globalement.
                </p>
                <ScrollArea className="h-[250px] w-full border rounded-md p-4 bg-muted/20">
                  {isLoadingContacts ? (
                    <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
                      Chargement des numéros...
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
                      Aucun contact trouvé dans l'historique.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contacts.map(jid => {
                        const isNew = newContacts.includes(jid);
                        return (
                          <div key={`wl-${jid}`} className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${isNew ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}>
                            <Checkbox
                              id={`wl-${jid}`}
                              checked={whitelisted.includes(jid)}
                              onCheckedChange={() => toggleWhitelist(jid)}
                            />
                            <Label htmlFor={`wl-${jid}`} className="text-sm font-medium leading-none flex-1 flex items-center gap-2 cursor-pointer">
                              {jid.replace('@s.whatsapp.net', '')}
                              {isNew && <Badge variant="default" className="text-[10px] px-1.5 py-0">Nouveau</Badge>}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
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
