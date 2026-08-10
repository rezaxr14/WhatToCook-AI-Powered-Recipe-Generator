import { apiClient, getCsrfToken } from './client';
import { UserPantry } from '../types/pantry';
import { ScanFridgeResponse } from '../types/ingredient';

export interface PantryMutationResponse {
  message: string;
  pantry: UserPantry;
}

export const pantryApi = {
  getPantry: async (): Promise<UserPantry> => {
    return apiClient<UserPantry>('/api/pantry/');
  },

  addIngredient: async (payload: { ingredient_id?: number; name?: string; ingredient_ids?: number[] }): Promise<PantryMutationResponse> => {
    return apiClient<PantryMutationResponse>('/api/pantry/add/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  removeIngredient: async (ingredient_id: number): Promise<PantryMutationResponse> => {
    return apiClient<PantryMutationResponse>('/api/pantry/remove/', {
      method: 'POST',
      body: JSON.stringify({ ingredient_id }),
    });
  },

  clearPantry: async (): Promise<PantryMutationResponse> => {
    return apiClient<PantryMutationResponse>('/api/pantry/clear/', {
      method: 'POST',
    });
  },

  scanFridgeImage: async (
    image: File | string,
    autoAdd: boolean = false,
    provider: string = 'gemini'
  ): Promise<ScanFridgeResponse> => {
    if (typeof image === 'string') {
      // Base64 JSON payload
      return apiClient<ScanFridgeResponse>('/api/pantry/scan-image/', {
        method: 'POST',
        body: JSON.stringify({
          image_base64: image,
          auto_add: autoAdd,
          provider,
        }),
      });
    } else {
      // Multipart FormData payload
      const formData = new FormData();
      formData.append('image', image);
      formData.append('auto_add', autoAdd ? 'true' : 'false');
      formData.append('provider', provider);

      const csrfToken = getCsrfToken();
      const response = await fetch('/api/pantry/scan-image/', {
        method: 'POST',
        headers: {
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to analyze fridge image.');
      }
      return response.json();
    }
  },
};
