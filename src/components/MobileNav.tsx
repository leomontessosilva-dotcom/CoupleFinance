import { LayoutDashboard, ArrowLeftRight, Receipt, PiggyBank, Users } from 'lucide-react';
import { useStore } from '../store/useStore';

const items = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { id: 'transactions', label: 'Gastos', icon: ArrowLeftRight },
  { id: 'fixed', label: 'Fixos', icon: Receipt },
  { id: 'jars', label: 'Cofrinhos', icon: PiggyBank },
  { id: 'profiles', label: 'Perfis', icon: Users },
];

export default function MobileNav() {
  const { activePage, setActivePage } = useStore();
  return (
    <nav className="mobile-nav">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`mobile-nav-item ${activePage === id ? 'active' : ''}`}
          onClick={() => setActivePage(id)}
        >
          <Icon size={20} strokeWidth={activePage === id ? 2.2 : 1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
