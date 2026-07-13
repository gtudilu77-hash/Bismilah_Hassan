import { Navigate } from "react-router-dom";
import { JSX, useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, ShieldAlert } from "lucide-react";

interface AdminRouteProps {
  children: JSX.Element;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 🛡️ O listener onAuthStateChanged garante que o Firebase 
    // termine de carregar o usuário antes de verificarmos o banco
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Busca o perfil do usuário no Firestore para validar o cargo
          const docRef = doc(db, "users", user.uid);
          const snap = await getDoc(docRef);

          // ✅ Admin completo e mini-admin têm ambos acesso ao painel —
          // as restrições de permissão (o que cada um pode criar/apagar)
          // são aplicadas dentro do próprio AdminDashboard e nas
          // firestore.rules, não aqui na entrada da rota.
          const role = snap.exists() ? snap.data().role : null;
          if (role === "admin" || role === "miniadmin") {
            setIsAdmin(true);
          } else {
            console.warn("Acesso negado: Usuário não possui privilégios de Admin.");
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Erro na verificação de privilégios:", error);
          setIsAdmin(false);
        }
      } else {
        // Sem usuário logado
        setIsAdmin(false);
      }
      // Finaliza o estado de carregamento independente do resultado
      setLoading(false);
    });

    // Cleanup do listener ao desmontar o componente
    return () => unsubscribe();
  }, []);

  // Tela de transição enquanto verifica a identidade
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050208] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          {/* Efeito de brilho atrás do loader */}
          <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full animate-pulse" />
          <Loader2 className="animate-spin text-purple-500 relative z-10" size={48} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-purple-400 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">
            Verificando Credenciais
          </p>
          <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest">
            A.V.E.S. Security Protocol v4.0
          </p>
        </div>
      </div>
    );
  }

  // Redirecionamento de segurança se não for admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Se tudo estiver OK, renderiza o Dashboard
  return children;
}