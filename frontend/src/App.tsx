import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { HomePage } from './pages/HomePage';
import { PantryPage } from './pages/PantryPage';
import { CanCookPage } from './pages/CanCookPage';
import { AIChefPage } from './pages/AIChefPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { AIRecipeDetailPage } from './pages/AIRecipeDetailPage';
import { AuthPage } from './pages/AuthPage';

import { ShoppingListModal } from './components/shopping/ShoppingListModal';
import { TelegramConnectModal } from './components/settings/TelegramConnectModal';
import { FridgeScannerModal } from './components/pantry/FridgeScannerModal';
import { useShoppingList } from './context/ShoppingListContext';
import { usePantry } from './context/PantryContext';

const AppContent: React.FC = () => {
  const { isShoppingModalOpen, closeShoppingModal, isTelegramModalOpen, closeTelegramModal } = useShoppingList();
  const { isScannerOpen, closeScanner } = usePantry();
  const isAnyModalOpen = isShoppingModalOpen || isTelegramModalOpen || isScannerOpen;

  return (
    <Router>
      <div className={`min-h-screen flex flex-col bg-[#fafaf9] text-stone-900 selection:bg-brand-500 selection:text-white transition-all duration-300 ${
        isAnyModalOpen ? 'blur-[3px] brightness-90 transition-all duration-300' : ''
      }`}>
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/can-cook" element={<CanCookPage />} />
            <Route path="/pantry" element={<PantryPage />} />
            <Route path="/ai-chef" element={<AIChefPage />} />
            <Route path="/aichef" element={<AIChefPage />} />
            <Route path="/ai" element={<AIChefPage />} />
            <Route path="/recipes" element={<HomePage />} />
            <Route path="/recipe/:id" element={<RecipeDetailPage />} />
            <Route path="/ai-recipe/:name" element={<AIRecipeDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<HomePage />} />
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
              <AppContent />
            </ShoppingListProvider>
          </PantryProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};
