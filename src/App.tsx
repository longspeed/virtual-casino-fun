import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CasinoProvider } from "@/context/CasinoContext";
import { useEffect } from "react";
import Index from "./pages/Index";
import Slots from "./pages/Slots";
import Dice from "./pages/Dice";
import Roulette from "./pages/Roulette";
import Blackjack from "./pages/Blackjack";
import Admin from "./pages/Admin";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Page transition wrapper
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  useEffect(() => {
    // Add fade-in animation on route change
    document.body.classList.add('animate-fade-in');
    const timer = setTimeout(() => {
      document.body.classList.remove('animate-fade-in');
    }, 300);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  return <div className="animate-fade-in">{children}</div>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CasinoProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/slots" element={<Slots />} />
              <Route path="/dice" element={<Dice />} />
              <Route path="/roulette" element={<Roulette />} />
              <Route path="/blackjack" element={<Blackjack />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </BrowserRouter>
      </TooltipProvider>
    </CasinoProvider>
  </QueryClientProvider>
);

export default App;
