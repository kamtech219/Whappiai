"use client"

import * as React from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import { ShieldAlert, Activity, RefreshCw, Smartphone, ServerCrash, Clock } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { api } from "@/lib/api"

export default function DiagnosticPage() {
  const { isLoaded, user } = useUser()
  const { getToken } = useAuth()

  const [sessions, setSessions] = React.useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null)
  const [diagnostics, setDiagnostics] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const fetchSessions = React.useCallback(async () => {
    try {
      const token = await getToken()
      const data = await api.sessions.list(token || undefined)
      const sessionsList = Array.isArray(data) ? data : []
      setSessions(sessionsList)

      if (sessionsList.length > 0 && !selectedSessionId) {
        setSelectedSessionId(String(sessionsList[0].sessionId))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [getToken, selectedSessionId])

  const fetchDiagnostics = React.useCallback(async () => {
    if (!selectedSessionId) return
    setRefreshing(true)
    try {
      const token = await getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/sessions/${selectedSessionId}/diagnostics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await response.json()
      if (result.status === 'success') {
        setDiagnostics(result.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setRefreshing(false)
    }
  }, [selectedSessionId, getToken])

  React.useEffect(() => {
    if (isLoaded && user) {
      fetchSessions()
    }
  }, [isLoaded, user?.id, fetchSessions])

  React.useEffect(() => {
    if (selectedSessionId) {
      fetchDiagnostics()
    }
  }, [selectedSessionId, fetchDiagnostics])

  if (!isLoaded || loading) return <div className="p-12 text-center text-muted-foreground">Chargement...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diagnostics Système</h1>
        <p className="text-muted-foreground mt-2">
          Analysez l'état de santé de vos sessions WhatsApp et résolvez les problèmes de connexion.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedSessionId || ""} onValueChange={setSelectedSessionId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Sélectionner une session" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s.sessionId} value={String(s.sessionId)}>
                {s.sessionId} {s.isConnected ? "(Connectée)" : "(Déconnectée)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={fetchDiagnostics}
          disabled={refreshing || !selectedSessionId}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {diagnostics && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                État de la connexion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Statut Socket</span>
                <span className="font-medium">{diagnostics.status}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Actif</span>
                <span className="font-medium">{diagnostics.isActive ? "Oui" : "Non"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">En cours de connexion</span>
                <span className="font-medium">{diagnostics.isConnecting ? "Oui" : "Non"}</span>
              </div>
              {diagnostics.isConnecting && diagnostics.connectingTimeMs && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4"/> Temps d'attente</span>
                  <span className="font-medium">{Math.floor(diagnostics.connectingTimeMs / 1000)}s</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ServerCrash className="h-5 w-5 text-red-500" />
                Erreurs & Retentatives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Compteur de retentatives</span>
                <span className="font-medium text-orange-500">{diagnostics.retryCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Suppression en cours</span>
                <span className="font-medium">{diagnostics.deleting ? "Oui" : "Non"}</span>
              </div>
            </CardContent>
          </Card>

          {diagnostics.retryCount > 10 && (
             <Alert variant="destructive" className="md:col-span-2">
               <ShieldAlert className="h-4 w-4" />
               <AlertTitle>Problème de connexion détecté</AlertTitle>
               <AlertDescription>
                 Votre session semble bloquée dans une boucle de reconnexion (plus de 10 tentatives).
                 Cela peut être dû à un blocage par WhatsApp ou une désynchronisation persistante.
                 Nous recommandons de supprimer la session depuis le tableau de bord et de la recréer en scannant un nouveau QR code.
               </AlertDescription>
             </Alert>
          )}

          {diagnostics.status === "DISCONNECTED" && diagnostics.retryCount === 0 && !diagnostics.deleting && (
             <Alert className="md:col-span-2">
               <Smartphone className="h-4 w-4" />
               <AlertTitle>Session inactive</AlertTitle>
               <AlertDescription>
                 La session est actuellement déconnectée et aucune reconnexion automatique n'est en cours.
                 Veuillez vérifier votre téléphone ou relancer la session.
               </AlertDescription>
             </Alert>
          )}
        </div>
      )}
    </div>
  )
}
