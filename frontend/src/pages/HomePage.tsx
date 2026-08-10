import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Utensils, ChefHat, ArrowRight, ShoppingBag, Camera, CheckCircle2, Flame, Bot, Send, Zap, Clock, ShieldCheck, Smartphone } from 'lucide-react';
import { Recipe } from '../types/recipe';
import { recipeApi } from '../api/recipeApi';
import { useAuth } from '../context/AuthContext';
import { usePantry } from '../context/PantryContext';
import { useShoppingList } from '../context/ShoppingListContext';
import { RecipeGrid } from '../components/recipe/RecipeGrid';
import { RecipeFilter } from '../components/recipe/RecipeFilter';
import { StyledButton } from '../components/common/StyledButton';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, demoLogin } = useAuth();
  const { pantryIngredients } = usePantry();
  const { items: shoppingItems } = useShoppingList();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxCookTime, setMaxCookTime] = useState(90);

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      try {
        const data = await recipeApi.getAllRecipes();
        setRecipes(data);
      } catch (err) {
        console.error('Error fetching recipes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const term = searchTerm.toLowerCase();
      const matchesName = recipe.name.toLowerCase().includes(term);
      const matchesDesc = recipe.description?.toLowerCase().includes(term);
      const matchesIng = recipe.ingredients?.some((i) => i.name.toLowerCase().includes(term));
      const matchesSearch = !searchTerm || matchesName || matchesDesc || matchesIng;

      const matchesTime = maxCookTime >= 90 || (recipe.cooking_time ? recipe.cooking_time <= maxCookTime : true);

      let matchesCat = true;
      if (selectedCategory === 'Quick (< 20m)') {
        matchesCat = (recipe.cooking_time || 0) <= 20;
      } else if (selectedCategory === 'Protein Rich') {
        matchesCat = recipe.ingredients?.some((i) =>
          ['Chicken', 'Beef', 'Egg', 'Fish', 'Pork', 'Salmon'].some((p) =>
            i.name.toLowerCase().includes(p.toLowerCase())
          )
        );
      } else if (selectedCategory === 'Vegetarian') {
        matchesCat = !recipe.ingredients?.some((i) =>
          ['Chicken', 'Beef', 'Pork', 'Fish', 'Salmon', 'Meat'].some((p) =>
            i.name.toLowerCase().includes(p.toLowerCase())
          )
        );
      } else if (selectedCategory === 'Sweet & Desserts') {
        matchesCat =
          recipe.name.toLowerCase().includes('cake') ||
          recipe.name.toLowerCase().includes('pancake') ||
          recipe.name.toLowerCase().includes('sweet') ||
          recipe.name.toLowerCase().includes('dessert');
      } else if (selectedCategory !== 'All') {
        matchesCat =
          recipe.description?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          recipe.name.toLowerCase().includes(selectedCategory.toLowerCase());
      }

      return matchesSearch && matchesTime && matchesCat;
    });
  }, [recipes, searchTerm, selectedCategory, maxCookTime]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setMaxCookTime(90);
  };

  const pantryCount = pantryIngredients.length;
  const shoppingCount = shoppingItems.filter((i) => !i.checked).length;

  return (
    <div className="space-y-12 pb-16">
      {/* Dynamic Hero based on Auth Status */}
      {!isAuthenticated ? (
        /* GUEST / LANDING HERO */
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-stone-800">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-brand-500/20 text-brand-300 border border-brand-500/30 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                AI-Powered Zero-Waste Cooking
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-stone-300 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Free & Open Source
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
              Turn leftover ingredients into{' '}
              <span className="bg-gradient-to-r from-brand-400 via-orange-300 to-amber-300 bg-clip-text text-transparent">
                gourmet meals.
              </span>
            </h1>

            <p className="text-stone-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              Stop throwing food away. Input what's in your fridge or scan a photo. Our AI matches delicious chef-tested recipes and generates bespoke recipes in seconds.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <StyledButton
                $variant="primary"
                $size="lg"
                onClick={() => demoLogin()}
                className="shadow-lg shadow-brand-500/25"
              >
                <Zap className="w-5 h-5" />
                <span>Try Instant Demo</span>
                <ArrowRight className="w-4 h-4" />
              </StyledButton>

              <Link to="/ai-chef">
                <StyledButton $variant="sage" $size="lg">
                  <Sparkles className="w-5 h-5" />
                  <span>AI Chef Studio</span>
                </StyledButton>
              </Link>

              <Link to="/auth">
                <StyledButton $variant="outline" $size="lg" className="text-white border-white/20 hover:bg-white/10">
                  <span>Sign In / Register</span>
                </StyledButton>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* AUTHENTICATED USER KITCHEN COMMAND CENTER */
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-8 sm:p-10 shadow-2xl border border-stone-800">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Kitchen Dashboard</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Welcome back, Chef {user?.username}! 👨‍🍳
                </h1>
                <p className="text-stone-300 text-sm sm:text-base mt-1">
                  Your smart culinary workspace is ready. Let's make something incredible today.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/ai-chef">
                  <StyledButton $variant="primary" $size="md" className="shadow-md shadow-brand-500/20">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Chef Studio</span>
                  </StyledButton>
                </Link>
                <Link to="/pantry">
                  <StyledButton $variant="secondary" $size="md">
                    <Camera className="w-4 h-4 text-brand-500" />
                    <span>Scan Fridge</span>
                  </StyledButton>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <Link
                to="/pantry"
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <ShoppingBag className="w-5 h-5 text-brand-400" />
                  <span className="text-xs font-bold text-stone-400 group-hover:text-white transition-colors">Manage →</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">{pantryCount}</div>
                  <div className="text-xs text-stone-300 font-medium">Pantry Ingredients</div>
                </div>
              </Link>

              <Link
                to="/can-cook"
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <ChefHat className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-stone-400 group-hover:text-white transition-colors">Cook →</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    {pantryCount > 0 ? 'Ready' : '0'}
                  </div>
                  <div className="text-xs text-stone-300 font-medium">Zero-Waste Matches</div>
                </div>
              </Link>

              <Link
                to="/ai-chef"
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-stone-400 group-hover:text-white transition-colors">Create →</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">Live</div>
                  <div className="text-xs text-stone-300 font-medium">Real-Time AI Generator</div>
                </div>
              </Link>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <Clock className="w-5 h-5 text-sky-400" />
                  <span className="text-xs font-bold text-stone-400">{recipes.length} Total</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">100%</div>
                  <div className="text-xs text-stone-300 font-medium">Offline Ready PWA</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3-Step How It Works (For Guest View) */}
      {!isAuthenticated && (
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Cook Smart in 3 Simple Steps
            </h2>
            <p className="text-stone-500 text-sm">
              Say goodbye to food waste and last-minute grocery panic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-brand-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-stone-900">Stock Your Virtual Pantry</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Add ingredients with 1 click or snap a quick photo of your fridge for instant vision detection.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-brand-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-stone-900">Discover What You Can Cook</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Our smart matching engine instantly identifies 100% complete dishes and calculates missing items.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-brand-300 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-stone-900">Cook or Generate with AI</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Follow step-by-step guides with dynamic portion scaling, or let our AI chef invent custom recipes.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main Recipe Explorer Catalog */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Explore Recipe Catalog
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              Browse our curated collection of wholesome, mouthwatering meals.
            </p>
          </div>
          <div className="text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            Showing <strong className="text-stone-800">{filteredRecipes.length}</strong> of{' '}
            <strong>{recipes.length}</strong> recipes
          </div>
        </div>

        {/* Filters */}
        <RecipeFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          maxCookTime={maxCookTime}
          onMaxCookTimeChange={setMaxCookTime}
          categories={['All', 'Quick (< 20m)', 'Protein Rich', 'Vegetarian', 'Sweet & Desserts']}
        />

        {/* Recipe Grid */}
        <RecipeGrid
          recipes={filteredRecipes}
          isLoading={isLoading}
          onResetFilters={handleResetFilters}
        />
      </section>
    </div>
  );
};
