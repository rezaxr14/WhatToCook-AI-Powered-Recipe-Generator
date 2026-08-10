import React from 'react';
import { ShoppingCart, Send } from 'lucide-react';
import { useShoppingList } from '../../context/ShoppingListContext';

export const QuickActionsWidget: React.FC = () => {
  const { items, openShoppingModal, openTelegramModal } = useShoppingList();
  const uncheckedCount = items.filter((i) => !i.checked).length;

  return (
    <aside aria-label="Quick Actions" className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5">
      {/* Quick Grocery List Trigger */}
      <button
        type="button"
        onClick={openShoppingModal}
        className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/95 hover:bg-white text-stone-800 border border-stone-200/90 shadow-lg hover:shadow-xl hover:border-brand-400 transition-all duration-300 backdrop-blur-md cursor-pointer hover:scale-105"
        title="Open Smart Grocery List"
      >
        <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
          <ShoppingCart className="w-4 h-4" />
        </div>
        <span className="text-xs font-extrabold text-stone-800 hidden sm:inline">
          Grocery List
        </span>
        {uncheckedCount > 0 && (
          <span className="bg-brand-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
            {uncheckedCount}
          </span>
        )}
      </button>

      {/* Quick Telegram Bot Trigger */}
      <button
        type="button"
        onClick={openTelegramModal}
        className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/40 transition-all duration-300 cursor-pointer hover:scale-105"
        title="Connect Telegram AI Chef Bot"
      >
        <Send className="w-4 h-4" />
        <span className="text-xs font-extrabold hidden sm:inline">
          Telegram Bot
        </span>
      </button>
    </aside>
  );
};
