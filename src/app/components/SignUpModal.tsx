import { useState } from "react";
import { Mail, Lock, X, Loader2, Sparkles, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

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

  // ── Termos e Condições ──────────────────────────────────────────────────
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail(""); setPassword(""); setConfirm("");
    setAcceptedTerms(false); setShowTerms(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirm) {
      alert("As senhas não coincidem!");
      return;
    }

    if (!acceptedTerms) {
      alert("Tens de ler e aceitar os Termos e Condições para criar a tua conta.");
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
        resetForm();
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

      <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-[#0d0616]/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.15)] animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        
        {/* LUZES DE FUNDO DECORATIVAS */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-600/10 rounded-full blur-[80px] pointer-events-none" />

        {/* BOTÃO FECHAR */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full text-purple-300/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={20} />
        </button>

        <div className="relative p-8 overflow-y-auto">
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

                {/* TERMOS E CONDIÇÕES */}
                <div className="pt-1">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-purple-500 shrink-0 cursor-pointer"
                    />
                    <span className="text-xs text-purple-300/60 leading-relaxed">
                      Li e aceito os{" "}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setShowTerms(v => !v); }}
                        className="text-purple-400 font-bold underline underline-offset-2 hover:text-purple-300 transition-colors"
                      >
                        Termos e Condições
                      </button>
                      {" "}do A.V.E.S.
                    </span>
                    {showTerms ? <ChevronUp size={14} className="text-purple-400/50 mt-0.5 shrink-0" /> : <ChevronDown size={14} className="text-purple-400/50 mt-0.5 shrink-0" />}
                  </label>

                  {showTerms && (
                    <div className="mt-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 max-h-48 overflow-y-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck size={14} className="text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Termos e Condições — A.V.E.S</span>
                      </div>
                      <div className="space-y-3 text-[11px] text-purple-100/50 leading-relaxed">
                        <p><strong className="text-purple-200/70">1. Aceitação.</strong> Ao criar uma conta, aceitas estes termos e a nossa forma de tratar os teus dados, descrita abaixo.</p>
                        <p><strong className="text-purple-200/70">2. Natureza do serviço.</strong> O A.V.E.S é uma plataforma educacional que usa inteligência artificial para apoiar o ensino e a aprendizagem. As respostas geradas pela IA podem conter imprecisões e não substituem o julgamento de um professor.</p>
                        <p><strong className="text-purple-200/70">3. Dados recolhidos.</strong> Guardamos o teu nome, email, histórico de conversas com a IA e resultados de quizzes, para o funcionamento do serviço (ex: acompanhar o teu progresso). Se usares o módulo de Visão IA, podes fornecer fotografias para reconhecimento facial, guardadas apenas com o teu consentimento explícito.</p>
                        <p><strong className="text-purple-200/70">4. Uso dos dados.</strong> Os teus dados não são vendidos nem partilhados com terceiros para fins publicitários. São usados apenas para o funcionamento da plataforma (ex: a tua conversa é enviada a um fornecedor de IA para gerar a resposta).</p>
                        <p><strong className="text-purple-200/70">5. Responsabilidades do utilizador.</strong> Compromete-te a não partilhar a tua conta, não introduzir conteúdo ilegal ou ofensivo, e a usar a plataforma para fins educativos.</p>
                        <p><strong className="text-purple-200/70">6. Eliminação de conta.</strong> Podes pedir a eliminação da tua conta e dos teus dados a qualquer momento, contactando a equipa através da página de Contacto.</p>
                        <p><strong className="text-purple-200/70">7. Alterações.</strong> Estes termos podem ser actualizados; alterações relevantes serão comunicadas na plataforma.</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSignUp}
                  disabled={isLoading || !acceptedTerms}
                  className="w-full mt-2 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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