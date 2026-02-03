import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { VersionCheck } from "./components/VersionCheck";
import Login from "./pages/Login";
import Students from "./pages/Students";
import ShiftBooking from "./pages/ShiftBooking";
import ShiftStatus from "./pages/ShiftStatus";
import RegisterAttempt from "./pages/RegisterAttempt";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import AfterPlantao from "./pages/AfterPlantao";
import TentativasHistory from "./pages/TentativasHistory";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <VersionCheck />
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter basename="/admin-plantao-flexivel">
          <Routes>
            {/* Login público */}
            <Route path="/login" element={<Login />} />

            {/* Rotas protegidas */}
            {/* Rotas protegidas - ADMIN ONLY */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AppLayout><ShiftBooking /></AppLayout>} path="/booking" />
              <Route element={<AppLayout><RegisterAttempt /></AppLayout>} path="/register-attempt" />
              <Route element={<AppLayout><AfterPlantao /></AppLayout>} path="/after-plantao" />
            </Route>

            {/* Rotas protegidas - ADMIN + ANALISTA */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'analista']} />}>
              <Route element={<AppLayout><Students /></AppLayout>} path="/" />
              <Route element={<AppLayout><Students /></AppLayout>} path="/students" />
              <Route element={<AppLayout><ShiftStatus /></AppLayout>} path="/status" />
              <Route element={<AppLayout><Calendar /></AppLayout>} path="/calendar" />
              <Route element={<AppLayout><TentativasHistory /></AppLayout>} path="/tentativas" />
              <Route element={<AppLayout><Feedback /></AppLayout>} path="/feedback" />
              <Route element={<AppLayout><Analytics /></AppLayout>} path="/analytics" />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
