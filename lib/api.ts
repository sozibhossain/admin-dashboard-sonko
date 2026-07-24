"use client"

import axios, { AxiosHeaders, type AxiosError, type AxiosRequestConfig } from "axios"
import { getSession } from "next-auth/react"
import { API_BASE_URL } from "@/lib/api-base"

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  statusCode?: number
}

export type UserAvatar = {
  public_id?: string
  url?: string
}

export type UserAddress = {
  street?: string
  city?: string
  state?: string
  zipCode?: string
}

export type UserVerificationInfo = {
  verified?: boolean
  token?: string
}

export type User = {
  _id: string
  name?: string
  username?: string
  email?: string
  phone?: string
  role?: string
  requestedRole?: string
  agentStatus?: "none" | "pending" | "approved" | "rejected"
  agentProfile?: {
    fullName?: string
    businessName?: string
    businessAddress?: string
    nationalId?: string
    country?: string
    city?: string
    rejectionReason?: string
    reviewedAt?: string
  }
  cash?: number
  receivingCountry?: string
  receivingCurrency?: string
  avatar?: UserAvatar
  address?: UserAddress
  verificationInfo?: UserVerificationInfo
  createdAt?: string
  updatedAt?: string
}

export type AuthLoginPayload = {
  email: string
  password: string
}

export type AuthLoginData = {
  accessToken: string
  refreshToken: string
  role: string
  _id: string
  user: User
}

export type Country = {
  _id: string
  title: string
  alphaChar?: string
  countryCode?: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export type Service = {
  _id: string
  title: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export type Transaction = {
  _id: string
  amount: number
  currency?: string
  type?: string
  status?: string
  from?: string
  to?: string
  flag?: "received" | "delivered"
  createdAt?: string
  description?: string
  provider?: string
  user?: User
  userTo?: User
}

export type AdminSetting = {
  _id: string
  transactionType: string
  percentage: number
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}

export type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

export type AdminDashboardData = {
  summary: {
    totalUsers: number
    totalAgents: number
    totalAdmins: number
    pendingAgentApplications: number
    totalTransactions: number
    pendingKyc: number
  }
  transactionByStatus: Array<{ _id: string; count: number; amount: number }>
  transactionByType: Array<{ _id: string; count: number; amount: number }>
  latestTransactions: Transaction[]
  latestUsers: User[]
  gatewaySettings: PaymentGatewaySetting[]
}

export type AdminUsersData = {
  users: User[]
  pagination: Pagination
}

export type AdminTransactionsData = {
  transactions: Transaction[]
  pagination: Pagination
}

export type PaymentGatewayProvider = {
  _id: string
  code: string
  name: string
  type: "built_in" | "custom"
  enabled: boolean
  supportedModules: string[]
  publicConfig?: Record<string, unknown>
  credentials?: PaymentGatewayCredentials
  hasCredentials?: boolean
  notes?: string
}

export type PaymentGatewayCredentials = {
  apiKey?: string
  publicKey?: string
  privateKey?: string
  secretKey?: string
  encryptionKey?: string
  webhookSecret?: string
  merchantId?: string
  clientId?: string
  clientSecret?: string
  baseUrl?: string
  environment?: string
}

export type PaymentGatewaySetting = {
  _id: string
  module: string
  gateway: string
  enabled: boolean
  publicConfig?: Record<string, unknown>
  notes?: string
}

export type PaymentGatewaySettingsData = {
  modules: string[]
  gateways: string[]
  providers: PaymentGatewayProvider[]
  settings: PaymentGatewaySetting[]
}

export type KycPayload = {
  userId?: string
  documentType?: string
  documentNumber?: string
}

export type CardPayload = {
  cardNumber?: string
  expiry?: string
  cvv?: string
  nameOnCard?: string
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use(async (config) => {
  const session = await getSession()
  const accessToken = session?.accessToken
  if (accessToken) {
    config.headers = AxiosHeaders.from(config.headers)
    config.headers.set("Authorization", `Bearer ${accessToken}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      const session = await getSession()
      const accessToken = session?.accessToken
      if (accessToken) {
        original.headers = AxiosHeaders.from(original.headers)
        original.headers.set("Authorization", `Bearer ${accessToken}`)
        return api(original)
      }
    }
    return Promise.reject(error)
  }
)

export const authLogin = async (payload: AuthLoginPayload) => {
  const { data } = await api.post<ApiResponse<AuthLoginData>>("/auth/login", payload)
  return data
}

export const authVerifyEmail = async (payload: { email: string; otp: string }) => {
  const { data } = await api.post<ApiResponse<unknown>>("/auth/verify", payload)
  return data
}

export const authForgetPassword = async (payload: { email: string }) => {
  const { data } = await api.post<ApiResponse<unknown>>("/auth/forget", payload)
  return data
}

export const authVerifyOtp = async (payload: { email: string; otp: string }) => {
  const { data } = await api.post<ApiResponse<unknown>>("/auth/verify-otp", payload)
  return data
}

export const authResetPassword = async (payload: { email: string; otp: string; password: string }) => {
  const { data } = await api.post<ApiResponse<unknown>>("/auth/reset-password", payload)
  return data
}

export const authChangePassword = async (payload: { oldPassword: string; newPassword: string }) => {
  const { data } = await api.post<ApiResponse<unknown>>("/auth/change-password", payload)
  return data
}

export const authRefreshToken = async (payload: { refreshToken: string }) => {
  const { data } = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
    "/auth/refresh-token",
    payload
  )
  return data
}

export const authLogout = async () => {
  const { data } = await api.post<ApiResponse<unknown>>("/auth/logout")
  return data
}

export const getProfile = async () => {
  const { data } = await api.get<ApiResponse<User>>("/user/profile")
  return data
}

export const updateProfile = async (payload: FormData) => {
  const { data } = await api.patch<ApiResponse<User>>("/user/update-profile", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const userChangePassword = async (payload: { oldPassword: string; newPassword: string }) => {
  const { data } = await api.post<ApiResponse<unknown>>("/user/change-password", payload)
  return data
}

export const getTransactions = async () => {
  const { data } = await api.get<ApiResponse<Transaction[]>>("/transaction")
  return data
}

export const getAdminDashboard = async () => {
  const { data } = await api.get<ApiResponse<AdminDashboardData>>("/admin/dashboard")
  return data
}

export const getAdminUsers = async (params?: {
  page?: number
  limit?: number
  role?: string
  requestedRole?: string
  agentStatus?: string
  search?: string
}) => {
  const { data } = await api.get<ApiResponse<AdminUsersData>>("/admin/users", { params })
  return data
}

export const updateAdminUserRole = async (userId: string, payload: { role: "user" | "agent" | "admin" }) => {
  const { data } = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/role`, payload)
  return data
}

export const updateAgentApplicationStatus = async (
  userId: string,
  payload: { status: "approved" | "rejected"; rejectionReason?: string }
) => {
  const { data } = await api.patch<ApiResponse<User>>(`/admin/agent-applications/${userId}`, payload)
  return data
}

export const getAdminTransactions = async (params?: { page?: number; limit?: number; type?: string; status?: string }) => {
  const { data } = await api.get<ApiResponse<AdminTransactionsData>>("/admin/transactions", { params })
  return data
}

export const getAdminPaymentGateways = async () => {
  const { data } = await api.get<ApiResponse<PaymentGatewaySettingsData>>("/admin/payment-gateways")
  return data
}

export const updateAdminPaymentGateway = async (payload: {
  module: string
  gateway: string
  enabled: boolean
  publicConfig?: Record<string, unknown>
  notes?: string
}) => {
  const { data } = await api.put<ApiResponse<PaymentGatewaySetting>>("/admin/payment-gateways", payload)
  return data
}

export const createAdminPaymentGatewayProvider = async (payload: {
  code?: string
  name: string
  enabled: boolean
  supportedModules: string[]
  publicConfig?: Record<string, unknown>
  credentials?: PaymentGatewayCredentials
  notes?: string
}) => {
  const { data } = await api.post<ApiResponse<PaymentGatewayProvider>>("/admin/payment-gateways/providers", payload)
  return data
}

export const sendMoney = async (payload: { userTo: string; amount: number; password: string }) => {
  const { data } = await api.post<ApiResponse<Transaction>>("/transaction/send", payload)
  return data
}

export const cashOut = async (payload: { userTo: string; amount: number; password: string }) => {
  const { data } = await api.post<ApiResponse<Transaction>>("/transaction/cash-out", payload)
  return data
}

export const cardToCard = async (payload: { cardA: string; cardB: string; amount: number }) => {
  const { data } = await api.post<ApiResponse<unknown>>("/transaction/card-to-card", payload)
  return data
}

export const startKyc = async (payload: KycPayload) => {
  const { data } = await api.post<ApiResponse<unknown>>("/kyc/start", payload)
  return data
}

export const uploadKycDocument = async (payload: FormData) => {
  const { data } = await api.post<ApiResponse<unknown>>("/kyc/upload-document", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const uploadKycSelfie = async (payload: FormData) => {
  const { data } = await api.post<ApiResponse<unknown>>("/kyc/upload-selfie", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const submitKyc = async (payload: { userId?: string }) => {
  const { data } = await api.post<ApiResponse<unknown>>("/kyc/submit", payload)
  return data
}

export const updateKycStatus = async (payload: { kycId: string; status: string }) => {
  const { data } = await api.put<ApiResponse<unknown>>("/kyc/update-status", payload)
  return data
}

export const getCards = async () => {
  const { data } = await api.get<ApiResponse<unknown[]>>("/card")
  return data
}

export const createCard = async (payload: CardPayload) => {
  const { data } = await api.post<ApiResponse<unknown>>("/card", payload)
  return data
}

export const updateCard = async (id: string, payload: CardPayload) => {
  const { data } = await api.put<ApiResponse<unknown>>(`/card/${id}`, payload)
  return data
}

export const deleteCard = async (id: string) => {
  const { data } = await api.delete<ApiResponse<unknown>>(`/card/${id}`)
  return data
}

export const getCountries = async () => {
  const { data } = await api.get<ApiResponse<Country[]>>("/country")
  return data
}

export const createCountry = async (payload: FormData) => {
  const { data } = await api.post<ApiResponse<Country>>("/country", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const updateCountry = async (id: string, payload: FormData) => {
  const { data } = await api.put<ApiResponse<Country>>(`/country/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const deleteCountry = async (id: string) => {
  const { data } = await api.delete<ApiResponse<Country>>(`/country/${id}`)
  return data
}

export const getServices = async () => {
  const { data } = await api.get<ApiResponse<Service[]>>("/service")
  return data
}

export const createService = async (payload: FormData) => {
  const { data } = await api.post<ApiResponse<Service>>("/service", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const updateService = async (id: string, payload: FormData) => {
  const { data } = await api.put<ApiResponse<Service>>(`/service/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}

export const deleteService = async (id: string) => {
  const { data } = await api.delete<ApiResponse<Service>>(`/service/${id}`)
  return data
}

export const getAdminSettings = async () => {
  const { data } = await api.get<ApiResponse<AdminSetting[]>>("/admin-setting")
  return data
}

export const setAdminSetting = async (payload: { transactionType: string; percentage: number; updatedBy?: string }) => {
  const { data } = await api.post<ApiResponse<AdminSetting>>("/admin-setting/set", payload)
  return data
}
