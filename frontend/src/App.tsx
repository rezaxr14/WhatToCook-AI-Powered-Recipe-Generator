import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { PantryProvider } from './context/PantryContext';
import { ShoppingListProvider } from './context/ShoppingListContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { QuickActionsWidget } from './components/common/QuickActionsWidget';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RecipesPage } from './pages/RecipesPage';
import { PantryPage } from './pages/PantryPage';
import { CanCookPage } from './pages/CanCookPage';
import { AIChefPage } from './pages/AIChefPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { AIRecipeDetailPage } from './pages/AIRecipeDetailPage';
import { AuthPage } from './pages/AuthPage';

import { ShoppingListModal } from './components/shopping/ShoppingListModal';
import { TelegramConnectModal } from './components/settings/TelegramConnectModal';
import { FridgeScannerModal } from './components/pantry/FridgeScannerModal';
import { LanguageProvider } from './components/common/LanguageModal';
import { useShoppingList } from './context/ShoppingListContext';
import { usePantry } from './context/PantryContext';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const { isShoppingModalOpen, closeShoppingModal, isTelegramModalOpen, closeTelegramModal } = useShoppingList();
  const { isScannerOpen, closeScanner } = usePantry();
  const isAnyModalOpen = isShoppingModalOpen || isTelegramModalOpen || isScannerOpen;

  return (
    <>
      <div className={`min-h-screen flex flex-col bg-[#fafaf9] text-stone-900 selection:bg-brand-500 selection:text-white transition-all duration-300 ${
        isAnyModalOpen ? 'blur-[3px] brightness-90 transition-all duration-300' : ''
      }`}>
      <Navbar />
      {/* The landing journey is a full-bleed cinematic experience — no page gutter (nav & footer stay for app-wide actions/language). */}
      <main className={isLanding ? 'flex-1 w-full' : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8'}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/can-cook" element={<CanCookPage />} />
          <Route path="/pantry" element={<PantryPage />} />
          <Route path="/ai-chef" element={<AIChefPage />} />
          <Route path="/aichef" element={<AIChefPage />} />
          <Route path="/ai" element={<AIChefPage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
          <Route path="/ai-recipe/:name" element={<AIRecipeDetailPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <PWAInstallBanner />
      <QuickActionsWidget />
    </div>

    {/* Centered Modal Overlays */}
    <ShoppingListModal
      isOpen={isShoppingModalOpen}
      onClose={closeShoppingModal}
    />
    <TelegramConnectModal
      isOpen={isTelegramModalOpen}
      onClose={closeTelegramModal}
    />
    <FridgeScannerModal
      isOpen={isScannerOpen}
      onClose={closeScanner}
    />
    </>
  );
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <PantryProvider>
            <ShoppingListProvider>
              <LanguageProvider>
                <AppContent />
              </LanguageProvider>
            </ShoppingListProvider>
          </PantryProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};
