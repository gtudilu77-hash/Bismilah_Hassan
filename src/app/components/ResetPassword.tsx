import { useState } from "react";
import { Lock, ShieldCheck, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
// Opcional: import { confirmPasswordReset } from "firebase/auth";
// Opcional: import { auth } from "../../firebase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!password || !confirm) return;

    if (password !== confirm) {
      alert("As senhas não coincidem, bro!");
      return;
    }

    setIsLoading(true);

    // Simulando o tempo de resposta do Firebase
    try {
      // Exemplo real:
      // const queryParameters = new URLSearchParams(window.location.search);
      // const oobCode = queryParameters.get('oobCode');
      // await confirmPasswordReset(auth, oobCode, password);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDone(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050208] relative overflow-hidden px-4">
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {!done ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white uppercase tracking-tighter">
                    Reset Password
                  </h1>
                  <p className="text-[10px] text-purple-300/40 uppercase tracking-widest font-bold">
                    Protocolo de Recuperação
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* NEW PASSWORD */}
                <div className="group space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-purple-400/70 ml-1">Nova Senha</label>
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

                {/* CONFIRM PASSWORD */}
                <div className="group space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-purple-400/70 ml-1">Confirmar Nova Senha</label>
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
                  onClick={handleReset}
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>Atualizar Credenciais <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                Senha Alterada!
              </h2>
              <p className="text-purple-300/50 text-sm mb-8">
                Seu acesso foi reestabelecido com sucesso.
              </p>
              <button 
                onClick={() => window.location.href = '/login'} // Ou seu hook de navegação
                className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                Ir para Login
              </button>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
          A.V.E.S Security Core v4.0
        </p>
      </div>
    </div>
  );
}