import { Ingredient } from './ingredient';
import { User } from './auth';

export interface UserPantry {
  id: number;
  user: User;
  ingredients: Ingredient[];
  total_ingredients: number;
}
