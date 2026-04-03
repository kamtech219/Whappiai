"use client"

import * as React from "react"
import { useAuth } from "@clerk/clerk-react"
import { Send, Bot, User as UserIcon, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { cn, ensureString } from "@/lib/utils"

interface Message {
  role: 'user' | 'ai'
  content: string
}

export function ChatSimulator({ sessionId, config }: { sessionId: string, config: any }) {
  const { getToken } = useAuth()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput) return
    if (isLoading) return

    // Add user message to UI immediately
    const newMessages = [...messages, { role: 'user' as const, content: trimmedInput }]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/sessions/${sessionId}/ai/simulate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: trimmedInput,
          config: config // Send current (potentially unsaved) config
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Erreur de simulation')
      }

      setMessages(prev => [...prev, { role: 'ai', content: data.data.response }])
    } catch (err: any) {
      console.error("Simulation error:", err)
      toast.error(err.message || "Impossible de simuler la réponse")
      // Remove the user message if it failed or add an error message
      setMessages(prev => [...prev, { role: 'ai', content: "⚠️ Erreur: " + err.message }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border shadow-none h-[400px] flex flex-col">
      <CardHeader className="p-3 border-b bg-muted/5">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Simulateur de Conversation
        </CardTitle>
        <CardDescription className="text-xs">
          Testez le comportement de l&apos;IA avec la configuration actuelle (sans sauvegarder).
        </CardDescription>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-xs italic py-8">
              Envoyez un message pour commencer la simulation.
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "flex gap-2 max-w-[80%]",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {msg.role === 'user' ? <UserIcon className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                </div>
                <div className={cn(
                  "px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none border border-border/50"
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="flex gap-2 max-w-[80%] flex-row">
                <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="px-3 py-2 rounded-lg text-sm bg-muted text-foreground rounded-tl-none border border-border/50 flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  <span className="text-xs opacity-70">L&apos;IA r&eacute;fl&eacute;chit...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-muted/5 mt-auto">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            placeholder="Tapez un message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="text-sm bg-background"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}
