import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import React from "react";

// Componentes Existentes
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { ChatInterface } from "./components/ChatInterface";
import { VisionAI } from "./components/VisionAi";
import About from "./components/About";
import { Contact } from "./components/Contact";
import { WatchDemo } from "./components/WatchDemo";

// Novos Componentes
import AdminDashboard from "./components/AdminDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";

import { useAuth } from "../hooks/useAuth";

// --- INTERFACES ---
interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

// --- PROTEÇÃO DE ROTAS ---
const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, role, loading } = useAuth() as any;

  if (loading) return null;

  // Se não estiver logado
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Se existir restrição de cargo
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// --- COMPONENTE WRAPPER PARA O CHAT ---
// Criamos este wrapper para extrair com segurança o state passado via navigate()
function ChatRouteWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role: authRole } = useAuth() as any;

  // Dá prioridade ao role passado no estado da navegação; se não houver, usa o do auth.
  const currentRole = (location.state as any)?.role || authRole;

  return (
    <ChatInterface 
      onBack={() => navigate("/")} 
      isTeacher={currentRole === "professor"} 
    />
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth() as any;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050208] flex items-center justify-center text-white p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-purple-400 font-bold tracking-widest uppercase text-xs">
            Sincronizando Ecossistema...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>

      {/* 🟢 ROTAS PÚBLICAS */}
      <Route
        path="/login"
        element={
          !user ? (
            <Login onLogin={() => navigate("/")} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* 🔵 HOME COM REDIRECIONAMENTO POR ROLE */}
      <Route
        path="/"
        element={
          <PrivateRoute>

            {/* ADMIN */}
            {role === "admin" && <AdminDashboard />}

            {/* PROFESSOR */}
            {role === "professor" && <TeacherDashboard />}

            {/* ALUNO */}
            {role === "aluno" && <StudentDashboard />}

            {/* FALLBACK */}
            {!role && (
              <Dashboard
                onLogout={() => navigate("/login")}
                onStartChat={() => navigate("/chat")}
                onWatchDemo={() => navigate("/demo")}
                onVisionAI={() => navigate("/vision")}
              />
            )}

          </PrivateRoute>
        }
      />

      {/* 🟡 FERRAMENTAS */}
      <Route
        path="/vision"
        element={
          <PrivateRoute>
            <VisionAI onBack={() => navigate("/")} />
          </PrivateRoute>
        }
      />

      {/* 🤖 CHAT DA IA DINÂMICO (MUTANTE E BLINDADO) */}
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <ChatRouteWrapper />
          </PrivateRoute>
        }
      />

      <Route
        path="/demo"
        element={
          <PrivateRoute>
            <WatchDemo onBack={() => navigate("/")} />
          </PrivateRoute>
        }
      />

      {/* 🟠 PROFESSOR / ADMIN */}
      <Route
        path="/upload"
        element={
          <PrivateRoute allowedRoles={["professor", "admin"]}>
            <TeacherDashboard />
          </PrivateRoute>
        }
      />

      {/* 🔴 ADMIN */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      {/* ❌ ROTA DESCONHECIDA */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}