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
  data: {
    user: AuthUser;
  };
}

export interface UsersListResponse {
  message: string;
  data: {
    users: AuthUser[];
    total: number;
  };
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<AuthUser> {
  const res = await api.post<UserResponse>('/users', payload);
  return res.data.data.user;
}

export async function listUsers(): Promise<AuthUser[]> {
  const res = await api.get<UsersListResponse>('/users');
  return res.data.data.users;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`);
}

export async function updateUser(
  userId: number,
  payload: Partial<CreateUserPayload>,
): Promise<AuthUser> {
  const res = await api.put<UserResponse>(`/users/${userId}`, payload);
  return res.data.data.user;
}
