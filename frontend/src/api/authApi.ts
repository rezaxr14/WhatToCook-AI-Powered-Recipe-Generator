import { apiClient } from './client';
import { User } from '../types/auth';
import { UserPantry } from '../types/pantry';

export interface AuthResponse {
  message?: string;
  user: User;
  pantry?: UserPantry;
}

export interface MeResponse {
  authenticated: boolean;
  user: User | null;
  pantry: UserPantry | null;
}

export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  signup: async (payload: { username: string; password: string; email?: string }): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/api/auth/signup/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  logout: async (): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/api/auth/logout/', {
      method: 'POST',
    });
  },

  getMe: async (): Promise<MeResponse> => {
    return apiClient<MeResponse>('/api/auth/me/');
  },

  demoLogin: async (): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/api/auth/demo/', {
      method: 'POST',
    });
  },
};
