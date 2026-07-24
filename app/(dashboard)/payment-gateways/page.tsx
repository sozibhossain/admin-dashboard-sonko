"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard, Plus, Save } from "lucide-react"
import { toast } from "sonner"
import {
  createAdminPaymentGatewayProvider,
  getAdminPaymentGateways,
  updateAdminPaymentGateway,
  type PaymentGatewayProvider,
  type PaymentGatewayCredentials,
} from "@/lib/api"

const labelize = (value: string) =>
  value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase())

const emptyCredentials: PaymentGatewayCredentials = {
  apiKey: "",
  publicKey: "",
  privateKey: "",
  secretKey: "",
  encryptionKey: "",
  webhookSecret: "",
  merchantId: "",
  clientId: "",
  clientSecret: "",
  baseUrl: "",
  environment: "",
}

const credentialFields: Array<{
  key: keyof PaymentGatewayCredentials
  label: string
  placeholder: string
  secret?: boolean
}> = [
  { key: "apiKey", label: "API key", placeholder: "Generic API key", secret: true },
  { key: "publicKey", label: "Public key", placeholder: "Public/client key" },
  { key: "privateKey", label: "Private key", placeholder: "Private key", secret: true },
  { key: "secretKey", label: "Secret key", placeholder: "Secret key", secret: true },
  { key: "encryptionKey", label: "Encryption key", placeholder: "Encryption key", secret: true },
  { key: "webhookSecret", label: "Webhook secret", placeholder: "Webhook verification secret", secret: true },
  { key: "merchantId", label: "Merchant ID", placeholder: "Merchant ID" },
  { key: "clientId", label: "Client ID", placeholder: "Client ID" },
  { key: "clientSecret", label: "Client secret", placeholder: "Client secret", secret: true },
  { key: "baseUrl", label: "Base URL", placeholder: "https://api.gateway.com" },
  { key: "environment", label: "Environment", placeholder: "sandbox or production" },
]

export default function PaymentGatewaysPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedModules, setSelectedModules] = useState<string[]>(["default"])
  const [credentials, setCredentials] = useState<PaymentGatewayCredentials>(emptyCredentials)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-gateways"],
    queryFn: getAdminPaymentGateways,
  })

  const payload = data?.data
  const modules = payload?.modules ?? []
  const providers = payload?.providers ?? []
  const settings = payload?.settings ?? []
  const providersByModule = useMemo(() => {
    const map = new Map<string, PaymentGatewayProvider[]>()
    for (const module of modules) {
      map.set(
        module,
        providers.filter(
          (provider) =>
            provider.enabled &&
            (!provider.supportedModules?.length || provider.supportedModules.includes(module))
        )
      )
    }
    return map
  }, [modules, providers])

  const updateMutation = useMutation({
    mutationFn: updateAdminPaymentGateway,
    onSuccess: () => {
      toast.success("Payment gateway updated")
      queryClient.invalidateQueries({ queryKey: ["admin-payment-gateways"] })
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
    },
    onError: () => toast.error("Unable to update payment gateway"),
  })

  const createMutation = useMutation({
    mutationFn: createAdminPaymentGatewayProvider,
    onSuccess: () => {
      toast.success("Gateway provider saved")
      setName("")
      setCode("")
      setNotes("")
      setSelectedModules(["default"])
      setCredentials(emptyCredentials)
      queryClient.invalidateQueries({ queryKey: ["admin-payment-gateways"] })
    },
    onError: () => toast.error("Unable to save gateway provider"),
  })

  const toggleModule = (module: string) => {
    setSelectedModules((current) =>
      current.includes(module)
        ? current.filter((item) => item !== module)
        : [...current, module]
    )
  }

  const updateCredential = (key: keyof PaymentGatewayCredentials, value: string) => {
    setCredentials((current) => ({ ...current, [key]: value }))
  }

  const updateCode = (value: string) => {
    setCode(value)
    const existingProvider = providers.find((provider) => provider.code === value.trim().toLowerCase())
    if (existingProvider) {
      setName(existingProvider.name)
      setSelectedModules(existingProvider.supportedModules?.length ? existingProvider.supportedModules : ["default"])
    }
  }

  const loadProviderIntoForm = (provider: PaymentGatewayProvider) => {
    setName(provider.name)
    setCode(provider.code)
    setNotes(provider.notes ?? "")
    setSelectedModules(provider.supportedModules?.length ? provider.supportedModules : ["default"])
    setCredentials(emptyCredentials)
  }

  return (
    <div className="p-8 bg-[#f5f6f8] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#2c2c2c]">Payment Gateways</h1>
        <p className="text-sm text-[#7a7a7a]">
          Select active gateway per payment module and save provider credentials without editing server env files.
        </p>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-5">
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-xl border border-[#bdbdbd] bg-white p-6 text-sm text-[#7a7a7a]">
              Loading payment gateway settings...
            </div>
          ) : (
            settings.map((setting) => {
              const options = providersByModule.get(setting.module) ?? []
              return (
                <div key={setting.module} className="rounded-xl border border-[#bdbdbd] bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-lg font-semibold text-[#2c2c2c]">
                        <CreditCard className="h-5 w-5 text-[#4d9bff]" />
                        {labelize(setting.module)}
                      </div>
                      <div className="mt-1 text-xs text-[#7a7a7a]">Current gateway: {setting.gateway}</div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={setting.enabled}
                        onChange={(event) =>
                          updateMutation.mutate({
                            module: setting.module,
                            gateway: setting.gateway,
                            enabled: event.target.checked,
                          })
                        }
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <select
                      className="h-10 min-w-72 rounded-md border border-[#bdbdbd] bg-white px-3 text-sm"
                      value={setting.gateway}
                      onChange={(event) =>
                        updateMutation.mutate({
                          module: setting.module,
                          gateway: event.target.value,
                          enabled: setting.enabled,
                        })
                      }
                    >
                      {options.map((provider) => (
                        <option key={provider.code} value={provider.code}>
                          {provider.name} ({provider.code})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-[#4d9bff] px-4 text-sm font-semibold text-white disabled:opacity-50"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          module: setting.module,
                          gateway: setting.gateway,
                          enabled: setting.enabled,
                        })
                      }
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="rounded-xl border border-[#bdbdbd] bg-white p-5 h-fit">
          <div className="flex items-center gap-2 text-lg font-semibold text-[#2c2c2c]">
            <Plus className="h-5 w-5 text-[#4d9bff]" />
            Gateway Provider
          </div>
          <p className="mt-1 text-xs text-[#7a7a7a]">
            Use an existing code like flutterwave or braintree to update its keys, or enter a new code for a custom
            provider.
          </p>
          <div className="mt-4 space-y-3">
            <input
              className="h-10 w-full rounded-md border border-[#bdbdbd] px-3 text-sm"
              placeholder="Gateway name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className="h-10 w-full rounded-md border border-[#bdbdbd] px-3 text-sm"
              placeholder="Gateway code, e.g. my_gateway"
              value={code}
              onChange={(event) => updateCode(event.target.value)}
            />
            <textarea
              className="min-h-24 w-full rounded-md border border-[#bdbdbd] px-3 py-2 text-sm"
              placeholder="Public notes or setup details"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />

            <div className="rounded-lg border border-[#e5e7eb] p-3">
              <div className="mb-2 text-sm font-semibold text-[#2c2c2c]">Gateway credentials</div>
              <div className="grid grid-cols-1 gap-2">
                {credentialFields.map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1 block text-xs font-medium text-[#6b7280]">{field.label}</span>
                    <input
                      className="h-9 w-full rounded-md border border-[#d1d5db] px-3 text-xs"
                      type={field.secret ? "password" : "text"}
                      placeholder={field.placeholder}
                      value={credentials[field.key] ?? ""}
                      onChange={(event) => updateCredential(field.key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[#7a7a7a]">
                Blank fields keep the previous saved value when updating an existing provider.
              </p>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-[#2c2c2c]">Supported modules</div>
              <div className="grid grid-cols-2 gap-2">
                {modules.map((module) => (
                  <label key={module} className="flex items-center gap-2 text-xs text-[#2c2c2c]">
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module)}
                      onChange={() => toggleModule(module)}
                    />
                    {labelize(module)}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="h-10 w-full rounded-md bg-[#4d9bff] text-sm font-semibold text-white disabled:opacity-50"
              disabled={(!name.trim() && !code.trim()) || selectedModules.length === 0 || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  name,
                  code,
                  enabled: true,
                  supportedModules: selectedModules,
                  credentials,
                  notes,
                })
              }
            >
              Save Provider / Keys
            </button>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-[#2c2c2c]">Available gateways</div>
            <div className="mt-2 space-y-2">
              {providers.map((provider) => (
                <div key={provider.code} className="rounded-md border border-[#e5e7eb] p-3 text-xs">
                  <div className="font-semibold text-[#2c2c2c]">{provider.name}</div>
                  <button
                    type="button"
                    className="mt-2 rounded border border-[#d1d5db] px-2 py-1 text-[11px] font-semibold text-[#4d9bff]"
                    onClick={() => loadProviderIntoForm(provider)}
                  >
                    Edit keys
                  </button>
                  <div className="mt-1 text-[#7a7a7a]">
                    {provider.hasCredentials ? "Credentials saved" : "No credentials saved"}
                  </div>
                  {provider.credentials?.publicKey ? (
                    <div className="mt-1 truncate text-[#7a7a7a]">Public key: {provider.credentials.publicKey}</div>
                  ) : null}
                  {provider.credentials?.baseUrl ? (
                    <div className="mt-1 truncate text-[#7a7a7a]">Base URL: {provider.credentials.baseUrl}</div>
                  ) : null}
                  <div className="text-[#7a7a7a]">{provider.code} · {provider.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
