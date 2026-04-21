import { useStore } from '../store/useStore';
import {
  LayoutDashboard, User, ArrowLeftRight, Receipt, TrendingUp,
  PiggyBank, BarChart3, Heart
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profiles', label: 'Perfis', icon: User },
  { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
  { id: 'fixed', label: 'Gastos Fixos', icon: Receipt },
  { id: 'investments', label: 'Investimentos', icon: TrendingUp },
  { id: 'jars', label: 'Cofrinhos', icon: PiggyBank },
  { id: 'projections', label: 'Projeções', icon: BarChart3 },
];

export default function Sidebar() {
  const { activePage, setActivePage } = useStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-700 to-pink-500 flex items-center justify-center shadow-purple">
            <Heart className="w-4.5 h-4.5 text-white" fill="white" size={18} />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-gray-800 leading-none">CoupleFinance</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Leo & Serena</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="label px-4 py-2">Menu</p>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className={`nav-item w-full text-left ${activePage === id ? 'nav-active' : 'nav-inactive'}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom card */}
      <div className="p-4">
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white">L</div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white">S</div>
            </div>
            <span className="text-xs font-semibold text-purple-700">Juntos</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">Construindo o futuro financeiro <span className="font-semibold text-pink-500">juntos</span> 💜</p>
        </div>
      </div>
    </aside>
  );
}
