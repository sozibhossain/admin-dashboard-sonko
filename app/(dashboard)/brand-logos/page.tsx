"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCw, Save } from "lucide-react"
import { toast } from "sonner"
import { getAdminLogoSettings, updateAdminLogoSetting, type LogoSetting } from "@/lib/api"

const labelize = (value: string) =>
  value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase())

const flagUrl = (code: string) => `https://flagcdn.com/w80/${code.toLowerCase()}.png`

const defaultLogoSettings: LogoSetting[] = [
  { key: "country:gm", type: "country", code: "gm", countryCode: "GM", name: "Gambia", flagUrl: flagUrl("GM") },
  { key: "country:gh", type: "country", code: "gh", countryCode: "GH", name: "Ghana", flagUrl: flagUrl("GH") },
  { key: "country:ng", type: "country", code: "ng", countryCode: "NG", name: "Nigeria", flagUrl: flagUrl("NG") },
  { key: "country:sn", type: "country", code: "sn", countryCode: "SN", name: "Senegal", flagUrl: flagUrl("SN") },
  { key: "country:gb", type: "country", code: "gb", countryCode: "GB", name: "England", flagUrl: flagUrl("GB") },
  { key: "country:eu", type: "country", code: "eu", countryCode: "EU", name: "Europe", flagUrl: "https://flagcdn.com/w80/eu.png" },
  { key: "telecom:orange", type: "telecom", code: "orange", name: "Orange", defaultLogoUrl: "assets/logos/orange.png" },
  { key: "telecom:africell", type: "telecom", code: "africell", name: "Africell", defaultLogoUrl: "assets/logos/AfricellLogo.png" },
  { key: "telecom:qcell", type: "telecom", code: "qcell", name: "QCell", defaultLogoUrl: "assets/logos/qcall.png" },
  { key: "telecom:mtn", type: "telecom", code: "mtn", name: "MTN", defaultLogoUrl: "assets/logos/mtn.png" },
  { key: "telecom:9mobile", type: "telecom", code: "9mobile", name: "9mobile", defaultLogoUrl: "assets/icons/top_up.png" },
  { key: "bill:nawec", type: "bill", code: "nawec", name: "NAWEC", defaultLogoUrl: "assets/icons/bills.png" },
  { key: "bill:ecg", type: "bill", code: "ecg", name: "Electricity Company of Ghana", defaultLogoUrl: "assets/icons/bills.png" },
  { key: "bank:ecobank", type: "bank", code: "ecobank", name: "Ecobank", defaultLogoUrl: "assets/tuser/ecobank.png" },
  { key: "profile:default", type: "profile", code: "default", name: "Default profile avatar", defaultLogoUrl: "assets/tuser/james.png" },
  { key: "app:logo", type: "app", code: "logo", name: "App logo", defaultLogoUrl: "assets/logos/app_logo.png" },
]

const previewAssetMap: Record<string, string> = {
  "assets/logos/app_logo.png": "/logo.png",
  "assets/logos/orange.png": "/placeholder-logo.png",
  "assets/logos/AfricellLogo.png": "/placeholder-logo.png",
  "assets/logos/qcall.png": "/placeholder-logo.png",
  "assets/logos/mtn.png": "/placeholder-logo.png",
  "assets/icons/top_up.png": "/placeholder-logo.png",
  "assets/icons/bills.png": "/placeholder-logo.png",
  "assets/tuser/ecobank.png": "/placeholder-logo.png",
  "assets/tuser/james.png": "/placeholder-user.jpg",
}

const normalizeImageSrc = (value?: string) => {
  const src = value?.trim()
  if (!src) return "/placeholder-logo.png"
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:") || src.startsWith("blob:")) return src
  if (src.startsWith("/")) return src
  return previewAssetMap[src] ?? "/placeholder-logo.png"
}

const imageFor = (setting: LogoSetting) =>
  normalizeImageSrc(setting.logoUrl || setting.defaultLogoUrl || setting.flagUrl)

function LogoPreview({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className ?? "h-full w-full object-cover"}
      onError={(event) => {
        event.currentTarget.src = "/placeholder-logo.png"
      }}
    />
  )
}

export default function BrandLogosPage() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<LogoSetting | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState("")
  const [flagUrlValue, setFlagUrlValue] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-logo-settings"],
    queryFn: getAdminLogoSettings,
  })

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl("")
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setFilePreviewUrl(nextPreviewUrl)

    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [file])

  const apiSettings = data?.data ?? []
  const settings = apiSettings.length > 0 ? apiSettings : defaultLogoSettings
  const grouped = useMemo(() => {
    return settings.reduce<Record<string, LogoSetting[]>>((acc, item) => {
      acc[item.type] = acc[item.type] || []
      acc[item.type].push(item)
      return acc
    }, {})
  }, [settings])

  const mutation = useMutation({
    mutationFn: updateAdminLogoSetting,
    onSuccess: () => {
      toast.success("Logo setting saved")
      setFile(null)
      setSelected(null)
      setFlagUrlValue("")
      setLogoUrl("")
      queryClient.invalidateQueries({ queryKey: ["admin-logo-settings"] })
    },
    onError: () => toast.error("Unable to save logo setting"),
  })

  const openEditor = (setting: LogoSetting) => {
    setSelected(setting)
    setFile(null)
    setFlagUrlValue(setting.flagUrl ?? "")
    setLogoUrl(setting.logoUrl ?? "")
  }

  const save = () => {
    if (!selected) return
    if (!file && !logoUrl.trim()) {
      toast.error("Upload an image or enter a logo URL")
      return
    }

    const form = new FormData()
    form.append("key", selected.key)
    form.append("type", selected.type)
    form.append("name", selected.name)
    form.append("code", selected.code ?? selected.key.split(":")[1] ?? "")
    form.append("countryCode", selected.countryCode ?? "")
    form.append("defaultLogoUrl", selected.defaultLogoUrl ?? "")
    form.append("flagUrl", flagUrlValue)
    form.append("logoUrl", logoUrl)
    form.append("enabled", String(selected.enabled !== false))
    if (file) form.append("image", file)
    mutation.mutate(form)
  }

  const selectedPreview = filePreviewUrl || (selected ? imageFor({ ...selected, logoUrl: logoUrl || selected.logoUrl, flagUrl: flagUrlValue || selected.flagUrl }) : "/placeholder-logo.png")

  return (
    <div className="min-h-screen bg-[#f5f6f8] p-8 text-[#2c2c2c]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Brand Logos</h1>
          <p className="text-sm text-[#7a7a7a]">
            Upload replacement logos for countries, telecoms, bill providers, banks, profile fallback, and app logo. Defaults remain active when no upload is set.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d7d7d7] bg-white px-3 text-sm font-semibold"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isError ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Could not load saved logo settings from the backend. Default logo items are shown so you can still select an item and save an upload.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <div className="space-y-5">
          {isLoading ? <div className="rounded-xl border bg-white p-6 text-sm text-[#7a7a7a]">Loading logo settings...</div> : null}
          {Object.entries(grouped).map(([type, items]) => (
            <section key={type} className="rounded-xl border border-[#d7d7d7] bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold">{labelize(type)}</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {items.map((setting) => (
                  <button
                    key={setting.key}
                    type="button"
                    onClick={() => openEditor(setting)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left hover:border-[#4d9bff] ${selected?.key === setting.key ? "border-[#4d9bff] bg-[#eef6ff]" : "border-[#d7d7d7]"}`}
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#e5e7eb] bg-[#f5f6f8]">
                      <LogoPreview src={imageFor(setting)} alt={setting.name} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{setting.name}</div>
                      <div className="truncate text-xs text-[#7a7a7a]">{setting.key}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="h-fit rounded-xl border border-[#d7d7d7] bg-white p-5">
          <h2 className="text-lg font-semibold">Change Logo</h2>
          {selected ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-full border bg-[#f5f6f8]">
                  <LogoPreview src={selectedPreview} alt={selected.name} />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{selected.name}</div>
                  <div className="truncate text-xs text-[#7a7a7a]">{selected.key}</div>
                </div>
              </div>

              <label className="block text-sm font-medium">Upload square logo</label>
              <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="w-full rounded-md border p-2 text-sm" />
              <p className="text-xs text-[#7a7a7a]">Uploads are cropped and resized to a centered square on the backend.</p>

              <label className="block text-sm font-medium">Logo URL</label>
              <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="Optional direct logo URL" className="h-10 w-full rounded-md border px-3 text-sm" />

              {selected.type === "country" ? (
                <>
                  <label className="block text-sm font-medium">Flag URL</label>
                  <input value={flagUrlValue} onChange={(event) => setFlagUrlValue(event.target.value)} className="h-10 w-full rounded-md border px-3 text-sm" />
                </>
              ) : null}

              <button type="button" onClick={save} disabled={mutation.isPending} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#4d9bff] text-sm font-semibold text-white disabled:opacity-50">
                <Save className="h-4 w-4" />
                Save Logo
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-[#f5f6f8] p-4 text-sm text-[#7a7a7a]">Select a logo item to edit.</div>
          )}
        </aside>
      </div>
    </div>
  )
}