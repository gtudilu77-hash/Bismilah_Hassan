import { useState } from 'react';
import { ChickenMascot } from './ChickenMascot';
import { Sparkles, Lock, Mail, Eye, EyeOff, Chrome, Github, ChevronRight, ArrowRight } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { SignUpModal } from './SignUpModal';

// 🔥 FIREBASE
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth';

// 🔥 FIRESTORE
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // MODALS
  const [openForgot, setOpenForgot] = useState(false);
  const [openSignUp, setOpenSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.email?.split("@")[0],
          photo: "",
          createdAt: new Date()
        });
      }
      setEmail('');
      setPassword('');
      onLogin();
    } catch (error: any) {
      alert(error.message);
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photo: user.photoURL,
          createdAt: new Date()
        });
      }
      onLogin();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // @ts-ignore - reloadUserInfo pode não estar tipado estritamente, mas contém o username do github
        const githubUsername = user.reloadUserInfo?.screenName;

        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || `${githubUsername}@github.com`, // Fallback caso o e-mail do GitHub seja privado
          name: user.displayName || githubUsername || "Usuário GitHub",
          photo: user.photoURL,
          createdAt: new Date()
        });
      }
      onLogin();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050208] text-white relative flex items-center justify-center px-4 overflow-hidden font-sans">
      
      {/* 🌌 BACKGROUND IDENTICO AO DASHBOARD */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a0b2e_0%,#050208_100%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* 🐔 ESQUERDA: MASCOTE & TEXTO HERO */}
          <div className="hidden lg:flex flex-col justify-center items-center text-center space-y-8">
            <div className="relative transform hover:scale-105 transition-transform duration-700">
                <div className="absolute inset-0 bg-purple-500/20 blur-[80px] rounded-full" />
                <ChickenMascot />
            </div>
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold tracking-widest uppercase">
                <Sparkles className="w-3 h-3" /> Inteligência de Próxima Geração
              </div>
              <h2 className="text-5xl font-black tracking-tighter leading-tight bg-gradient-to-b from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
                Bem-vindo ao <br /> Ecossistema A.V.E.S
              </h2>
              <p className="text-purple-100/40 text-lg max-w-sm mx-auto leading-relaxed">
                Entre para interagir com o seu parceiro digital em uma experiência única de IA.
              </p>
            </div>
          </div>

          {/* 🔒 DIREITA: CARD DE LOGIN */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="relative group">
              {/* Glow externo animado */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
              
              <div className="relative bg-[#0d0616]/80 backdrop-blur-3xl rounded-[2rem] p-8 sm:p-12 border border-white/10 shadow-2xl">
                
                {/* HEADER MOBILE & TITULO */}
                <div className="mb-10">
                   <div className="flex items-center gap-3 mb-6 lg:hidden">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-2xl font-black tracking-tighter">A.V.E.S</span>
                   </div>
                   <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Entrar</h1>
                   <p className="text-white/40 text-sm">Acesse seu painel de controle IA</p>
                </div>

                {/* FORMULÁRIO */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-purple-300 uppercase tracking-widest ml-1">E-mail</label>
                    <div className="relative group/input">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/input:text-purple-400 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@exemplo.com"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-bold text-purple-300 uppercase tracking-widest">Senha</label>
                      <button 
                        type="button" 
                        onClick={() => setOpenForgot(true)}
                        className="text-[11px] font-bold text-purple-400/60 hover:text-purple-400 transition-colors"
                      >
                        Esqueceu?
                      </button>
                    </div>
                    <div className="relative group/input">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/input:text-purple-400 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full py-4 bg-purple-600 rounded-2xl font-bold text-white overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-[0_10px_30px_rgba(147,51,234,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? "Processando..." : "Acessar Sistema"} 
                      {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </span>
                  </button>
                </form>

                {/* DIVIDER */}
                <div className="relative my-8 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <span className="relative px-4 bg-[#0d0616] text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Ou continuar com</span>
                </div>

                {/* SOCIAL BUTTONS */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-3 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white/70 font-medium hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <Chrome size={18} className="text-purple-400" />
                    <span className="text-sm">Google</span>
                  </button>

                  <button 
                    onClick={handleGithubLogin}
                    className="flex items-center justify-center gap-3 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white/70 font-medium hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <Github size={18} className="text-purple-400" />
                    <span className="text-sm">GitHub</span>
                  </button>
                </div>

                {/* FOOTER DO CARD */}
                <div className="mt-10 text-center">
                   <p className="text-sm text-white/40">
                    Ainda não tem acesso?{" "}
                    <button
                      type="button"
                      onClick={() => setOpenSignUp(true)}
                      className="text-purple-400 font-bold hover:text-purple-300 transition-colors"
                    >
                      Criar conta gratuita
                    </button>
                  </p>
                </div>

              </div>
            </div>

            {/* STATUS SYSTEM */}
            <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest text-purple-400/40">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              Sistemas Operacionais — Luanda, AO
            </div>
          </div>

        </div>
      </div>

      {/* MODALS */}
      <ForgotPasswordModal
        isOpen={openForgot}
        onClose={() => setOpenForgot(false)}
      />

      <SignUpModal
        isOpen={openSignUp}
        onClose={() => setOpenSignUp(false)}
      />

    </div>
  );
}