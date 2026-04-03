"use client"

import * as React from "react"
import { CreditCard, Zap, ShieldCheck, Sparkles, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BillingPlans } from "@/components/dashboard/billing-plans"
import { api } from "@/lib/api"
import { useAuth } from "@clerk/clerk-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

export default function BillingPage() {
  const { getToken } = useAuth()
  const [credits, setCredits] = React.useState<any>(null)
  const [activeSessions, setActiveSessions] = React.useState<number>(0)
  const [paymentHistory, setPaymentHistory] = React.useState<any[]>([])

  React.useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const token = await getToken()

        // Fetch credits and plan data
        const creditsData = await api.credits.get(token || undefined)
        setCredits(creditsData?.data || creditsData)

        // Fetch sessions to count active ones
        const sessionsData = await api.sessions.list(token || undefined)
        const sessionsList = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.data || [])
        const connectedCount = sessionsList.filter((s: any) => s.status === 'CONNECTED').length
        setActiveSessions(connectedCount)

        // Fetch payment history
        const historyData = await api.payments.history(token || undefined)
        setPaymentHistory(historyData?.data || [])
      } catch (error) {
        console.error("Erreur lors de la récupération des données de facturation", error)
      }
    }

    fetchBillingData()
  }, [getToken])

  const planName = credits?.plan === 'free' ? 'ESSAI GRATUIT' : (credits?.plan?.toUpperCase() || 'ESSAI GRATUIT')
  const renewalDate = credits?.expiry ? new Date(credits.expiry).toLocaleDateString() : 'N/A'

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Abonnement & Plans
          </h1>
          <p className="text-sm text-muted-foreground">Gérez vos limites et boostez votre automatisation.</p>
        </div>

        <div className="flex items-center gap-3">
          {credits?.plan && credits.plan !== 'free' && (
            <p className="text-xs text-muted-foreground">
              Renouvellement: <span className="font-semibold text-foreground">{renewalDate}</span>
            </p>
          )}
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 px-4 py-1.5 h-auto text-[10px] font-semibold tracking-widest rounded-full">
             Plan Actuel : {planName}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         {[
           { label: "Sessions actives", val: `${activeSessions}`, icon: Zap },
           { label: "Messages ce mois", val: `${credits?.used || 0} / ${credits?.balance || 0}`, icon: Sparkles },
           { label: "Niveau de support", val: "Standard", icon: ShieldCheck }
         ].map((stat, i) => (
           <Card key={i} className="border-none bg-muted/20 shadow-sm border-border/50">
             <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.val}</p>
                </div>
                <stat.icon className="h-5 w-5 text-muted-foreground/30" />
             </CardContent>
           </Card>
         ))}
      </div>

      <div className="space-y-6">
        <div className="text-center space-y-2 mb-10">
           <h2 className="text-2xl font-bold tracking-tight">Choisissez votre puissance</h2>
           <p className="text-muted-foreground text-sm max-w-sm mx-auto">Activez plus de sessions et d&apos;intelligence IA dès maintenant.</p>
        </div>

        <BillingPlans currentPlan={credits?.plan} />
      </div>

      <div className="space-y-6 mt-12">
        <h2 className="text-xl font-bold tracking-tight">Historique des paiements</h2>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                      Aucun historique de paiement disponible.
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentHistory.map((payment, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-xs">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {payment.description}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs">
                        {payment.amount}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 mt-12">
        <h2 className="text-xl font-bold tracking-tight">Portail Client</h2>
        <Card className="border-border/50">
           <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                 <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1 text-center md:text-left">
                 <h3 className="text-sm font-bold">Gestion des moyens de paiement</h3>
                 <p className="text-xs text-muted-foreground">Pour mettre à jour vos cartes ou annuler un abonnement, veuillez contacter l&apos;équipe support.</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">Contacter le Support</Button>
           </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-2 bg-transparent mt-12">
         <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <Info className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left">
               <h3 className="text-sm font-bold">Besoin d&apos;une solution sur-mesure ?</h3>
               <p className="text-xs text-muted-foreground">Pour les agences ou les volumes massifs (+10k messages/jour), contactez notre équipe support pour un plan Enterprise.</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full">Contacter le Support</Button>
         </CardContent>
      </Card>
    </div>
  )
}
