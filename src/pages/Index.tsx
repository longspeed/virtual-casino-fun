import { useCasino } from '@/context/CasinoContext';
import { LoginScreen } from '@/components/LoginScreen';
import Home from '@/pages/Home';

const Index = () => {
  const { state } = useCasino();

  if (!state.user) {
    return <LoginScreen />;
  }

  return <Home />;
};

export default Index;
