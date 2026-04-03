"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { Sparkles, BookOpen, MessageSquare, PlayCircle } from "lucide-react"

export function WelcomeModal() {
  const { user, isLoaded } = useUser()
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (isLoaded && user) {
      const hasSeenWelcome = localStorage.getItem('whappi_welcome_seen')
      if (!hasSeenWelcome) {
        setIsOpen(true)
      }
    }
  }, [isLoaded, user])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('whappi_welcome_seen', 'true')
  }

  const startTour = () => {
    handleClose()
    if (typeof window !== 'undefined' && (window as any).startWhappiTour) {
      (window as any).startWhappiTour()
    }
  }

  if (!isLoaded || !user) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Bienvenue sur Whappi !</DialogTitle>
          <DialogDescription className="text-center">
            Nous sommes ravis de vous compter parmi nous, {user.firstName || '!'}. Whappi va vous aider à automatiser WhatsApp facilement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-center text-muted-foreground">
            Par quoi souhaitez-vous commencer ?
          </p>

          <div className="grid gap-3">
            <Button variant="outline" className="justify-start" onClick={startTour}>
              <PlayCircle className="w-4 h-4 mr-3" />
              Lancer la visite guidée (Recommandé)
            </Button>

            <Button variant="outline" className="justify-start" asChild>
              <a href="#" onClick={(e) => { e.preventDefault(); handleClose(); document.querySelector('[aria-label="Aide et Ressources"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); }}>
                <MessageSquare className="w-4 h-4 mr-3" />
                Ouvrir le Centre d'Aide / FAQ
              </a>
            </Button>

            <Button variant="outline" className="justify-start" asChild>
              <a href="/guides" target="_blank" onClick={handleClose}>
                <BookOpen className="w-4 h-4 mr-3" />
                Lire les tutoriels détaillés
              </a>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="w-full" onClick={handleClose}>
            Je vais explorer par moi-même
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
