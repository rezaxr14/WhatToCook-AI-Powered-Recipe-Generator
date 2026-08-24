import { apiClient } from './client';

export interface PlatformStats {
  total_recipes: number;
  total_ingredients: number;
  total_users: number;
}

export const statsApi = {
  getPlatformStats: async (): Promise<PlatformStats> => {
    return apiClient<PlatformStats>('/api/stats/');
  },
};
