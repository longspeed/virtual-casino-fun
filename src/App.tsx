import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CasinoProvider } from "@/context/CasinoContext";
import Index from "./pages/Index";
import Slots from "./pages/Slots";
import Dice from "./pages/Dice";
import Roulette from "./pages/Roulette";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CasinoProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/slots" element={<Slots />} />
            <Route path="/dice" element={<Dice />} />
            <Route path="/roulette" element={<Roulette />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CasinoProvider>
  </QueryClientProvider>
);

export default App;
