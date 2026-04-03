"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { HelpCircle, PlayCircle, BookOpen, ExternalLink } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function KnowledgeBasePanel() {
  const faqs = [
    {
      question: "Qu'est-ce qu'une Session WhatsApp ?",
      answer: "Une session est simplement une connexion entre Whappi et l'un de vos numéros WhatsApp. Comme WhatsApp Web, vous scannez un QR code pour la connecter. Chaque session peut avoir sa propre IA et ses propres règles."
    },
    {
      question: "Comment fonctionne l'Assistant IA ?",
      answer: "L'assistant IA lit les messages que vous recevez et y répond automatiquement selon les instructions que vous lui donnez (le Prompt). Il peut lire votre agenda (Cal.com) et même proposer des créneaux pour des rendez-vous."
    },
    {
      question: "C'est quoi un 'Répondeur par mots-clés' ?",
      answer: "Si vous ne voulez pas utiliser une IA complexe, vous pouvez utiliser le mode 'Mots-clés'. L'assistant ne répondra que si le message contient des mots précis (comme 'tarif' ou 'adresse') que vous avez configurés."
    },
    {
      question: "Mes contacts personnels verront-ils l'IA ?",
      answer: "Pas si vous activez l'option 'Répondre uniquement aux inconnus' dans les réglages de l'IA (Cohabitation Pro/Perso). Ainsi, vos amis et votre famille ne recevront jamais de messages automatiques."
    }
  ]

  const videos = [
    {
      title: "1. Connecter mon premier numéro",
      duration: "2 min"
    },
    {
      title: "2. Créer un assistant pour mes ventes",
      duration: "4 min"
    },
    {
      title: "3. Sécuriser mon groupe WhatsApp",
      duration: "3 min"
    }
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground relative" aria-label="Aide et Ressources">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-lg">Centre d'Aide</SheetTitle>
              <SheetDescription className="text-xs">
                Guides, vidéos et réponses à vos questions.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">

            {/* Vidéos */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-muted-foreground" />
                Vidéos Explicatives
              </h3>
              <div className="grid gap-3">
                {videos.map((video, i) => (
                  <button
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-12 bg-muted rounded flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <PlayCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <span className="text-sm font-medium">{video.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{video.duration}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                Questions Fréquentes
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-sm text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Lien Doc Complète */}
            <Button variant="outline" className="w-full" asChild>
              <a href="/guides" target="_blank">
                Voir tous les tutoriels <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
