"use client"

import * as React from "react"
import { useAuth } from "@clerk/clerk-react"
import { Plus, Trash2, Edit2, Check, X, Info } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ensureString } from "@/lib/utils"

interface KeywordRule {
  id: string
  session_id: string
  keyword: string
  match_type: 'exact' | 'contains' | 'regex'
  response_type: 'text' | 'image' | 'audio' | 'document' | 'video'
  response_content: string
  file_name?: string
  is_active: number
  created_at?: string
  updated_at?: string
}

export function KeywordBuilder({ sessionId }: { sessionId: string }) {
  const { getToken } = useAuth()
  const [rules, setRules] = React.useState<KeywordRule[]>([])
  const [loading, setLoading] = React.useState(true)

  const [isAdding, setIsAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState<Partial<KeywordRule>>({
    keyword: '',
    match_type: 'contains',
    response_type: 'text',
    response_content: '',
    is_active: 1
  })

  const loadRules = React.useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      // Fallback direct fetch if api.ts doesn't have it
      const res = await fetch(`/api/v1/sessions/${sessionId}/keywords`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to load keywords')
      const data = await res.json()
      setRules(data.data || [])
    } catch (err) {
      console.error("Error loading keywords:", err)
      toast.error("Erreur lors du chargement des mots-clés")
    } finally {
      setLoading(false)
    }
  }, [sessionId, getToken])

  React.useEffect(() => {
    if (sessionId) {
      loadRules()
    }
  }, [sessionId, loadRules])

  const handleSave = async () => {
    if (!formData.keyword || !formData.response_content) {
      toast.error("Le mot-clé et la réponse sont obligatoires.")
      return
    }

    try {
      const token = await getToken()
      const url = editingId
        ? `/api/v1/sessions/${sessionId}/keywords/${editingId}`
        : `/api/v1/sessions/${sessionId}/keywords`

      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success(editingId ? "Règle mise à jour" : "Règle ajoutée")
      setIsAdding(false)
      setEditingId(null)
      setFormData({
        keyword: '',
        match_type: 'contains',
        response_type: 'text',
        response_content: '',
        is_active: 1
      })
      loadRules()
    } catch (err) {
      console.error("Error saving keyword:", err)
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette règle ?")) return

    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/sessions/${sessionId}/keywords/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success("Règle supprimée")
      loadRules()
    } catch (err) {
      console.error("Error deleting keyword:", err)
      toast.error("Erreur lors de la suppression")
    }
  }

  const toggleActive = async (rule: KeywordRule, newStatus: boolean) => {
     try {
      const token = await getToken()
      const res = await fetch(`/api/v1/sessions/${sessionId}/keywords/${rule.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...rule, is_active: newStatus ? 1 : 0 })
      })

      if (!res.ok) throw new Error('Failed to update status')
      loadRules()
    } catch (err) {
      console.error("Error updating status:", err)
      toast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const startEditing = (rule: KeywordRule) => {
    setFormData(rule)
    setEditingId(rule.id)
    setIsAdding(true)
  }

  const cancelEdit = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      keyword: '',
      match_type: 'contains',
      response_type: 'text',
      response_content: '',
      is_active: 1
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Répondeurs par mots-clés</h3>
          <p className="text-xs text-muted-foreground">Déclenche des réponses automatiques basées sur des mots précis.</p>
        </div>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Règle
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-primary/50 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm">{editingId ? 'Modifier la règle' : 'Ajouter une règle'}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Mot-clé déclencheur</Label>
                <Input
                  placeholder="ex: prix, bonjour, /start"
                  value={formData.keyword || ''}
                  onChange={e => setFormData({...formData, keyword: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1" title="Comment le mot-clé doit être détecté dans le message">
                  Type de correspondance <Info className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Select
                  value={formData.match_type || 'contains'}
                  onValueChange={(v: 'exact' | 'contains' | 'regex') => setFormData({...formData, match_type: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Exact (Message = Mot-clé)</SelectItem>
                    <SelectItem value="contains">Contient (Mot-clé dans le message)</SelectItem>
                    <SelectItem value="regex">Expression régulière (Avancé)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs">Réponse</Label>
                <Textarea
                  placeholder="La réponse qui sera envoyée..."
                  className="min-h-[100px]"
                  value={formData.response_content || ''}
                  onChange={e => setFormData({...formData, response_content: e.target.value})}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>Annuler</Button>
              <Button size="sm" onClick={handleSave}>
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {loading && !isAdding && <div className="text-sm text-muted-foreground text-center py-4">Chargement...</div>}

        {!loading && rules.length === 0 && !isAdding && (
          <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
            <p className="text-xs text-muted-foreground">Aucune règle configurée.</p>
          </div>
        )}

        {!loading && rules.map(rule => (
          <Card key={rule.id} className={`shadow-none border ${rule.is_active ? 'border-border' : 'border-dashed opacity-70'}`}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs font-bold bg-muted/50">{rule.keyword}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{
                    rule.match_type === 'exact' ? 'Exact' :
                    rule.match_type === 'contains' ? 'Contient' : 'Regex'
                  }</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate" title={rule.response_content}>
                  {rule.response_content}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={rule.is_active === 1}
                  onCheckedChange={(checked) => toggleActive(rule, checked)}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(rule)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(rule.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
