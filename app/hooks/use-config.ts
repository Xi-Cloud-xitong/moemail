"use client"

import { create } from "zustand"
import { Role, ROLES } from "@/lib/permissions"
import { EMAIL_CONFIG } from "@/config"
import { useEffect } from "react"

interface Config {
  defaultRole: Exclude<Role, typeof ROLES.EMPEROR>
  emailDomains: string
  emailDomainsArray: string[]
  topLevelDomains: string[]
  domainMap: Record<string, string[]>
  adminContact: string
  maxEmails: number
}

interface ConfigStore {
  config: Config | null
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  loading: false,
  error: null,
  fetch: async () => {
    try {
      set({ loading: true, error: null })
      const res = await fetch("/api/config")
      if (!res.ok) throw new Error("获取配置失败")
      const data = await res.json() as Config
      const domainsArray = data.emailDomains.split(',')

      // Build domain map: top-level domain -> [itself, subdomains...]
      const domainMap: Record<string, string[]> = {}
      for (const d of domainsArray) {
        const parts = d.split('.')
        // For domains like mail.xi-clouds.cn, the top-level is xi-clouds.cn (last 2 parts for .cn/.top, last 2 for .xyz)
        // Simple heuristic: if 3+ parts, first part is subdomain
        let topLevel: string
        if (parts.length >= 3) {
          topLevel = parts.slice(1).join('.')
        } else {
          topLevel = d
        }
        if (!domainMap[topLevel]) {
          domainMap[topLevel] = [topLevel]
        }
        if (d !== topLevel) {
          domainMap[topLevel].push(d)
        }
      }

      const topLevelDomains = Object.keys(domainMap).sort()

      set({
        config: {
          defaultRole: data.defaultRole || ROLES.CIVILIAN,
          emailDomains: data.emailDomains,
          emailDomainsArray: domainsArray,
          topLevelDomains,
          domainMap,
          adminContact: data.adminContact || "",
          maxEmails: Number(data.maxEmails) || EMAIL_CONFIG.MAX_ACTIVE_EMAILS
        },
        loading: false
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "获取配置失败",
        loading: false 
      })
    }
  }
}))

export function useConfig() {
  const store = useConfigStore()

  useEffect(() => {
    if (!store.config && !store.loading) {
      store.fetch()
    }
  }, [store.config, store.loading])

  return store
} 