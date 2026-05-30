import { useState } from "react";
import { Mail, Lock, X, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

// 🔥 FIREBASE
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SignUpModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    
    if (password !== confirm) {
      alert("As senhas não coincidem!");
      return;
    }

    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setDone(true);
      
      // Fecha o modal automaticamente após o sucesso para fluidez
      setTimeout(() => {
        onClose();
        setDone(false);
      }, 3000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* OVERLAY COM BLUR E ANIMAÇÃO */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[#0d0616]/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.15)] animate-in zoom-in-95 duration-300">
        
        {/* LUZES DE FUNDO DECORATIVAS */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-600/10 rounded-full blur-[80px]" />

        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full text-purple-300/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={20} />
        </button>

        <div className="relative p-8">
          {!done ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  New Identity
                </h2>
              </div>

              <p className="text-purple-300/50 text-sm mb-8 font-medium">
                Crie sua conta A.V.E.S para acessar o núcleo da inteligência.
              </p>

              <div className="space-y-4">
                {/* CAMPO: EMAIL */}
                <div className="group space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/70 ml-1">Endereço de E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/40 group-focus-within:text-purple-400 transition-colors" size={18} />
                    <input
                      type="email"
                      placeholder="nome@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
                    />
                  </div>
                </div>

                {/* CAMPO: SENHA */}
                <div className="group space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/70 ml-1">Senha Segura</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/40 group-focus-within:text-purple-400 transition-colors" size={18} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
                    />
                  </div>
                </div>

                {/* CAMPO: CONFIRMAR SENHA */}
                <div className="group space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/70 ml-1">Confirmar Identidade</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/40 group-focus-within:text-purple-400 transition-colors" size={18} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSignUp}
                  disabled={isLoading}
                  className="w-full mt-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Processando...
                    </>
                  ) : (
                    "Inicializar Protocolo"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center animate-in zoom-in-90 duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                Acesso Concedido!
              </h2>
              <p className="text-purple-300/50 text-sm mb-8">
                Sua conta foi criada com sucesso no sistema A.V.E.S.
              </p>
              <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">
                Redirecionando...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}