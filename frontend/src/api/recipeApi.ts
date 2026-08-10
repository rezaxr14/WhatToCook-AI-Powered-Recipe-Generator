import { apiClient } from './client';
import { Recipe, CanCookResponse } from '../types/recipe';
import { Ingredient } from '../types/ingredient';

export const recipeApi = {
  getAllRecipes: async (): Promise<Recipe[]> => {
    return apiClient<Recipe[]>('/api/recipes/');
  },

  getRecipeById: async (id: number): Promise<Recipe> => {
    return apiClient<Recipe>(`/api/recipes/${id}/`);
  },

  getAllIngredients: async (): Promise<Ingredient[]> => {
    return apiClient<Ingredient[]>('/api/ingredients/');
  },

  getCanCookRecipes: async (): Promise<CanCookResponse> => {
    return apiClient<CanCookResponse>('/api/can-cook/');
  },
};
