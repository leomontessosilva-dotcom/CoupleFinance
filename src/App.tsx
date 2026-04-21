import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';
import Transactions from './pages/Transactions';
import FixedExpenses from './pages/FixedExpenses';
import Investments from './pages/Investments';
import Cofrinhos from './pages/Cofrinhos';
import Projections from './pages/Projections';
import { useStore } from './store/useStore';

export default function App() {
  const { activePage } = useStore();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'profiles': return <Profiles />;
      case 'transactions': return <Transactions />;
      case 'fixed': return <FixedExpenses />;
      case 'investments': return <Investments />;
      case 'jars': return <Cofrinhos />;
      case 'projections': return <Projections />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}
