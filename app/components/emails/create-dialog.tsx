"use client"

import { useEffect, useReducer, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Copy, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { nanoid } from "nanoid"
import { EXPIRY_OPTIONS } from "@/types/email"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCopy } from "@/hooks/use-copy"
import { useConfig, useConfigStore } from "@/hooks/use-config"

interface CreateDialogProps {
  onEmailCreated: () => void
}

const RANDOM_KEY = "__random__"

export function CreateDialog({ onEmailCreated }: CreateDialogProps) {
  const { config } = useConfig()
  const t = useTranslations("emails.create")
  const tList = useTranslations("emails.list")
  const tCommon = useTranslations("common.actions")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailName, setEmailName] = useState("")
  const [expiryTime] = useState(EXPIRY_OPTIONS[0].value.toString())
  const { toast } = useToast()
  const { copyToClipboard } = useCopy()
  const domains = config?.topLevelDomains ?? []

  const pick = (key: string) => {
    const state = useConfigStore.getState()
    const toplevels = state.config?.topLevelDomains ?? []
    const map = state.config?.domainMap ?? {}
    if (key === RANDOM_KEY) {
      const top = toplevels[Math.floor(Math.random() * toplevels.length)]
      const subs = map[top] ?? [top]
      return subs[Math.floor(Math.random() * subs.length)]
    }
    const subs = map[key] ?? [key]
    return subs[Math.floor(Math.random() * subs.length)]
  }

  const sRef = useRef({ selectedKey: RANDOM_KEY, actualDomain: "" })
  const [, tick] = useReducer(x => x + 1, 0)

  const refresh = (key: string) => {
    sRef.current.selectedKey = key
    sRef.current.actualDomain = pick(key)
    tick()
  }

  useEffect(() => {
    if (!domains.length) return
    refresh(RANDOM_KEY)
  }, [config])

  const generateRandomName = () => setEmailName(nanoid(8))

  const copyEmailAddress = () => {
    copyToClipboard(`${emailName}@${sRef.current.actualDomain}`)
  }

  const handleDomainChange = (key: string) => {
    refresh(key)
  }

  const createEmail = async () => {
    if (!emailName.trim()) {
      toast({
        title: tList("error"),
        description: t("namePlaceholder"),
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/emails/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: emailName,
          domain: sRef.current.actualDomain,
          expiryTime: parseInt(expiryTime)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        toast({
          title: tList("error"),
          description: (data as { error: string }).error,
          variant: "destructive"
        })
        return
      }

      toast({
        title: tList("success"),
        description: t("success")
      })
      onEmailCreated()
      setOpen(false)
      setEmailName("")
    } catch {
      toast({
        title: tList("error"),
        description: t("failed"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              value={emailName}
              onChange={(e) => setEmailName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="flex-1"
            />
            {domains.length > 0 && (
              <Select value={sRef.current.selectedKey} onValueChange={handleDomainChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RANDOM_KEY}>@随机</SelectItem>
                  {domains.map(d => (
                    <SelectItem key={d} value={d}>@{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={generateRandomName}
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="shrink-0">{t("expiryTime")}:</span>
            <span>30分钟</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="shrink-0">{t("domain")}:</span>
            {emailName ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{`${emailName}@${sRef.current.actualDomain}`}</span>
                <div
                  className="shrink-0 cursor-pointer hover:text-primary transition-colors"
                  onClick={copyEmailAddress}
                  title="复制"
                >
                  <Copy className="size-4" />
                </div>
                <div
                  className="shrink-0 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => refresh(sRef.current.selectedKey)}
                  title="换一个二级域名"
                >
                  <RefreshCw className="size-4" />
                </div>
              </div>
            ) : (
              <span className="text-gray-400">...</span>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={createEmail} disabled={loading}>
            {loading ? t("creating") : t("create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
