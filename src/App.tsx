import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./components/AppLayout.tsx";
import AppOverview from "./pages/app/AppOverview.tsx";
import VaultsPage from "./pages/app/VaultsPage.tsx";
import VaultDetailPage from "./pages/app/VaultDetailPage.tsx";
import AgentsPage from "./pages/app/AgentsPage.tsx";
import AgentDetailPage from "./pages/app/AgentDetailPage.tsx";
import ArenaPage from "./pages/app/ArenaPage.tsx";
import LeaderboardPage from "./pages/app/LeaderboardPage.tsx";
import ActivityPage from "./pages/app/ActivityPage.tsx";
import PortfolioPage from "./pages/app/PortfolioPage.tsx";
import SettingsPage from "./pages/app/SettingsPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppOverview />} />
            <Route path="overview" element={<AppOverview />} />
            <Route path="vaults" element={<VaultsPage />} />
            <Route path="vaults/:id" element={<VaultDetailPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="agents/:id" element={<AgentDetailPage />} />
            <Route path="arena" element={<ArenaPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
