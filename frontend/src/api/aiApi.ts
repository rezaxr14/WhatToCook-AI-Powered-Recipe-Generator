import { apiClient } from './client';
import { AISuggestedDish, AIRecipeDetail, AIProvider, AIProvidersResponse, RecipeChatRequest, RecipeChatResponse, AIModelsResponse } from '../types/ai';

export interface AISuggestionsResponse {
  status: 'done' | 'processing';
  recipes?: AISuggestedDish[];
  task_id?: string;
  cached?: boolean;
  provider?: string;
  model?: string;
  model_used?: string;
  rate_limited_models?: string[];
}

export interface AIModelOption {
  id: string;
  displayName: string;
  description?: string;
}

export const aiApi = {
  getProviders: async (): Promise<AIProvidersResponse> => {
    return apiClient<AIProvidersResponse>('/api/ai/providers/');
  },

  getModels: async (): Promise<AIModelsResponse> => {
    return apiClient<AIModelsResponse>('/api/ai/models/');
  },

  getSuggestions: async (payload?: {
    ingredients?: string[];
    provider?: AIProvider;
    model?: string;
    force_refresh?: boolean;
  }): Promise<AISuggestionsResponse> => {
    return apiClient<AISuggestionsResponse>('/api/ai/suggestions/', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  pollTaskStatus: async (taskId: string): Promise<AISuggestionsResponse> => {
    return apiClient<AISuggestionsResponse>(`/api/ai/task-status/${taskId}/`);
  },

  getRecipeDetail: async (recipeName: string, provider?: AIProvider, model?: string): Promise<AIRecipeDetail & { model_used?: string; rate_limited_models?: string[] }> => {
    const params = new URLSearchParams();
    if (provider) params.append('provider', provider);
    if (model) params.append('model', model);
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `/api/ai/recipe/${encodeURIComponent(recipeName)}/${query}`;
    return apiClient<AIRecipeDetail & { model_used?: string; rate_limited_models?: string[] }>(url);
  },

  askRecipeChat: async (payload: RecipeChatRequest): Promise<RecipeChatResponse> => {
    return apiClient<RecipeChatResponse>('/api/ai/recipe-chat/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};


