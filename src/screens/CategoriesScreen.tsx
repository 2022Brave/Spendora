import React, { useState } from 'react';
import { Category, CategoryType, Transaction } from '../types';
import * as Icons from 'lucide-react';

interface CategoriesScreenProps {
  categories: Category[];
  transactions: Transaction[];
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  categories,
  transactions,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [activeType, setActiveType] = useState<CategoryType>('EXPENSE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Modal form
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3b82f6');

  // Count transactions per category
  const txCountMap = new Map<string, number>();
  for (const t of transactions) {
    txCountMap.set(t.categoryId, (txCountMap.get(t.categoryId) || 0) + 1);
  }

  const filteredCategories = categories.filter(c => c.type === activeType);

  const AVAILABLE_ICONS = [
    'ShoppingCart', 'Utensils', 'Home', 'Zap', 'Car', 'Film', 'ShoppingBag',
    'HeartPulse', 'RefreshCw', 'Plane', 'Wallet', 'Briefcase', 'TrendingUp',
    'Coffee', 'Gift', 'BookOpen', 'Dumbbell', 'Tag'
  ];

  const AVAILABLE_COLORS = [
    '#10b981', '#f59e0b', '#6366f1', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#ec4899', '#ef4444', '#14b8a6', '#f97316', '#64748b'
  ];

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setIcon('Tag');
    setColor('#3b82f6');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setIcon(c.icon);
    setColor(c.color);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cat: Category = {
      id: editingCategory?.id || `cat_${Date.now()}`,
      name: name.trim(),
      type: activeType,
      icon,
      color,
      isSystem: editingCategory?.isSystem || false,
    };

    onSaveCategory(cat);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Categories
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize transactions and configure budget tracking classifications.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          <Icons.Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex items-center gap-2 p-1 bg-purple-50/70 dark:bg-[#181524] rounded-xl max-w-sm border border-purple-100 dark:border-[#272138]">
        {(['EXPENSE', 'INCOME', 'TRANSFER'] as CategoryType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeType === t
                ? 'bg-white dark:bg-[#13111C] text-purple-700 dark:text-purple-300 shadow-2xs'
                : 'text-[#6B647B] hover:text-purple-900 dark:hover:text-white'
            }`}
          >
            {t === 'EXPENSE' ? 'Expenses' : t === 'INCOME' ? 'Income' : 'Transfers'}
          </button>
        ))}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredCategories.map((c) => {
          const iconName = (c.icon || 'Tag') as keyof typeof Icons;
          const IconComponent = (Icons[iconName] as React.ElementType) || Icons.Tag;
          const txCount = txCountMap.get(c.id) || 0;

          return (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                  style={{
                    backgroundColor: `${c.color}20`,
                    color: c.color,
                  }}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {c.name}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {txCount} transaction{txCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Edit Category"
                >
                  <Icons.Edit2 className="w-3.5 h-3.5" />
                </button>
                {!c.isSystem && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete category "${c.name}"?`)) {
                        onDeleteCategory(c.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                    title="Delete Category"
                  >
                    <Icons.Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#13111C] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#EDE9FE] dark:border-[#272138] animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-[#1E1B2E] dark:text-white mb-4 flex items-center gap-2">
              <Icons.Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4458] dark:text-purple-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coffee & Snacks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8FD] dark:bg-[#181524] border border-[#EDE9FE] dark:border-[#2E2844] rounded-xl text-xs text-[#1E1B2E] dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4458] dark:text-purple-300 mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1 bg-[#FAF8FD] dark:bg-[#181524] rounded-xl border border-[#EDE9FE] dark:border-[#2E2844]">
                  {AVAILABLE_ICONS.map((ic) => {
                    const IcComp = (Icons[ic as keyof typeof Icons] as React.ElementType) || Icons.Tag;
                    return (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`p-2 rounded-lg flex items-center justify-center ${
                          icon === ic ? 'bg-purple-600 text-white shadow-xs' : 'text-[#6B647B] dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-[#272138]'
                        }`}
                      >
                        <IcComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4458] dark:text-purple-300 mb-1">
                  Color Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-purple-500' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B647B] hover:bg-purple-50 dark:hover:bg-[#181524] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
