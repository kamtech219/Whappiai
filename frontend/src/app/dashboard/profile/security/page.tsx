"use client"

import * as React from "react"
import {
  User,
  Shield,
  LogOut,
  ExternalLink,
  Lock,
  KeyRound,
  History
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useUser, useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { ensureString } from "@/lib/utils"
import { useI18n } from "@/i18n/i18n-provider"

export default function SecurityPage() {
  const { user, isLoaded } = useUser()
  const { t } = useI18n()

  if (!isLoaded) return null

  return (
    <>
            <Card className="border-none shadow-none bg-muted/20">
               <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                     <Shield className="h-5 w-5 text-primary" />
                     <CardTitle className="text-sm font-semibold tracking-tight">{t("dashboard.profile.security.title")}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">{t("dashboard.profile.security.desc")}</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4 pt-0">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-4">
                     <div className="flex items-start justify-between">
                         <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-xs font-semibold">{t("dashboard.profile.security.password_auth")}</h3>
                             </div>
                             <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm">
                               {t("dashboard.profile.security.clerk_manage")}
                             </p>
                         </div>
                         <Button size="sm" asChild>
                             <a href="https://accounts.clerk.dev" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                                {t("dashboard.profile.security.manage_on_clerk")} <ExternalLink className="h-3 w-3" />
                             </a>
                         </Button>
                     </div>
                  </div>

                  <div className="p-4 rounded-lg bg-background/50 border border-border/50 flex flex-col gap-4">
                     <div className="flex items-start justify-between">
                         <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <KeyRound className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-xs font-semibold">{t("dashboard.profile.security.api_tokens")}</h3>
                             </div>
                             <p className="text-[10px] text-muted-foreground leading-relaxed max-w-sm">
                               {t("dashboard.profile.security.api_tokens_desc")}
                             </p>
                         </div>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-muted/20">
               <CardHeader className="pb-4">
                   <div className="flex items-center gap-2">
                     <History className="h-5 w-5 text-primary" />
                     <CardTitle className="text-sm font-semibold tracking-tight">{t("dashboard.profile.security.login_history")}</CardTitle>
                  </div>
               </CardHeader>
               <CardContent className="space-y-4 pt-0">
                  <div className="p-4 rounded bg-background/50 border border-border/50">
                     <div className="flex justify-between items-center">
                         <div>
                             <p className="text-[11px] font-semibold">{t("dashboard.profile.security.current_session")}</p>
                             <p className="text-[10px] text-muted-foreground mt-0.5">{t("dashboard.profile.security.last_activity")} {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : t("dashboard.profile.security.now")}</p>
                         </div>
                         <Badge variant="secondary" className="text-[9px]">{t("dashboard.profile.security.active")}</Badge>
                     </div>
                  </div>
               </CardContent>
            </Card>
    </>
  )
}
