import { useState } from "react";
import { Mail, X, Loader2, Send, CheckCircle2, KeyRound } from "lucide-react";

// 🔥 FIREBASE
import { auth } from "../../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!email) {
      alert("Por favor, digite seu e-mail.");
      return;
    }

    setIsLoading(true);

    try {
      // 🔥 ENVIO DIRETO (SEM handleCodeInApp)
      await sendPasswordResetEmail(auth, email);

      console.log("Email de recuperação enviado com sucesso");
      setSent(true);
    } catch (error: any) {
      console.error("ERRO FIREBASE:", error);

      if (error.code === "auth/user-not-found") {
        alert("Este e-mail não está cadastrado.");
      } else if (error.code === "auth/invalid-email") {
        alert("E-mail inválido.");
      } else if (error.code === "auth/network-request-failed") {
        alert("Sem conexão com a internet.");
      } else {
        alert("Erro ao enviar o e-mail.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* OVERLAY */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[#0d0616]/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.15)] animate-in zoom-in-95 duration-300">
        
        {/* LUZES DE FUNDO */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[80px]" />

        {/* FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full text-purple-300/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={20} />
        </button>

        <div className="relative p-8">
          {!sent ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <KeyRound size={20} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  Recovery Core
                </h2>
              </div>

              <p className="text-purple-300/50 text-sm mb-8 font-medium">
                Esqueceu a chave? Digite seu e-mail para receber um link de restauração.
              </p>

              <div className="space-y-6">
                <div className="group space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/70 ml-1">
                    E-mail de Recuperação
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/40 group-focus-within:text-purple-400 transition-colors" size={18} />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>Transmitir Link <Send size={16} /></>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center animate-in zoom-in-90 duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                E-mail Enviado!
              </h2>
              <p className="text-purple-300/50 text-sm mb-8">
                Verifique sua caixa de entrada para redefinir sua senha.
              </p>
              <button 
                onClick={onClose}
                className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}