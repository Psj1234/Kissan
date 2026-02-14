import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import FarmerDashboard from "./pages/FarmerDashboard";
import CropPrices from "./pages/CropPrices";
import ProfitCalculator from "./pages/ProfitCalculator";
import SmartSell from "./pages/SmartSell";
import PriceTrends from "./pages/PriceTrends";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPriceControl from "./pages/AdminPriceControl";
import AdminAlerts from "./pages/AdminAlerts";
import NotFound from "./pages/NotFound";
import KisanChatbot from "./components/KisanChatbot";

const queryClient = new QueryClient();

/** KISAN AI chatbot is for farmers only; hidden on admin routes (no add/edit for farmers). */
function FarmersOnlyChatbot() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  if (isAdmin) return null;
  return <KisanChatbot />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<FarmerDashboard />} />
          <Route path="/prices" element={<CropPrices />} />
          <Route path="/calculator" element={<ProfitCalculator />} />
          <Route path="/smart-sell" element={<SmartSell />} />
          <Route path="/trends" element={<PriceTrends />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/prices" element={<AdminPriceControl />} />
          <Route path="/admin/alerts" element={<AdminAlerts />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FarmersOnlyChatbot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
