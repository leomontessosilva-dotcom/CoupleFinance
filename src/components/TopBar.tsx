import { Bell, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatMonth, prevMonth, nextMonth } from '../utils/format';

const pageNames: Record<string, string> = {
  dashboard: 'Dashboard',
  profiles: 'Perfis Individuais',
  transactions: 'Transações',
  fixed: 'Gastos Fixos',
  investments: 'Investimentos',
  jars: 'Cofrinhos',
  projections: 'Projeções',
};

export default function TopBar() {
  const { activePage, currentMonth, setCurrentMonth } = useStore();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-30">
      {/* Page title */}
      <h1 className="font-display text-xl font-semibold text-gray-800">
        {pageNames[activePage] || 'CoupleFinance'}
      </h1>

      {/* Center: month selector */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
        <button
          onClick={() => setCurrentMonth(prevMonth(currentMonth))}
          className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center transition-all"
        >
          <ChevronLeft size={14} className="text-gray-500" />
        </button>
        <div className="flex items-center gap-2 px-1">
          <Calendar size={13} className="text-purple-500" />
          <span className="text-sm font-semibold text-gray-700 capitalize w-36 text-center">
            {formatMonth(currentMonth)}
          </span>
        </div>
        <button
          onClick={() => setCurrentMonth(nextMonth(currentMonth))}
          className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center transition-all"
        >
          <ChevronRight size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Right: avatars + bell */}
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-all">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
              L
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
              S
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-700 leading-none">Leo & Serena</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Família Silva</p>
          </div>
        </div>
      </div>
    </header>
  );
}
