export type UserRole = 'admin' | 'tecnico' | 'logistica' | 'saude'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  is_active: boolean
  phone: string | null
  documento: string | null
  created_at: string | null
}

export interface LoginPayload {
  email: string
  password: string
  device_name?: string
}

export interface LoginSuccessResponse {
  message: string
  data: {
    token: string
    token_type: 'Bearer'
    user: AuthUser
  }
}

export interface MeResponse {
  message: string
  data: {
    user: AuthUser
  }
}
