import { api } from './api';
import type { AuthUser } from '../types/auth';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'tecnico' | 'logistica' | 'saude';
}

export interface UserResponse {
  message: string;
  data: AuthUser;
}

export interface UsersListResponse {
  message: string;
  data: AuthUser[];
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<AuthUser> {
  const res = await api.post<UserResponse>('/admin/users', payload);
  return res.data.data;
}

export async function listUsers(): Promise<AuthUser[]> {
  const res = await api.get<UsersListResponse>('/admin/users');
  return res.data.data;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}

export async function updateUser(userId: number, payload: Partial<CreateUserPayload>): Promise<AuthUser> {
  const res = await api.patch<UserResponse>(`/admin/users/${userId}`, payload)
  return res.data.data
}

export interface UpdateMyProfilePayload {
  name?: string
  email?: string
  phone?: string | null
  current_password?: string
  password?: string
  password_confirmation?: string
}

export async function updateMyProfile(payload: UpdateMyProfilePayload): Promise<AuthUser> {
  const res = await api.patch<{ data: { user: AuthUser } }>('/me', payload)
  return res.data.data.user
}
