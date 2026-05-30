import { AnimatedChickenMascot } from './AnimatedChickenMascot';
import { LogOut, Eye, MessageSquare, Play, Sparkles, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import avesLogo from "../../assets/aves.jpeg";
import { auth } from '../../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

interface DashboardProps {
  onLogout: () => void;
  onStartChat: () => void;
  onWatchDemo: () => void;
  onVisionAI: () => void;
}

// ─── Nuvens CSS (mesmo estilo do ChatInterface) ───────────────────────────────
function Clouds() {
  const clouds = [
    { w: 260, h: 80,  top: '8%',  dur: '38s', delay: '0s',   op: 0.55 },
    { w: 180, h: 58,  top: '22%', dur: '52s', delay: '-18s', op: 0.35 },
    { w: 320, h: 95,  top: '42%', dur: '44s', delay: '-9s',  op: 0.28 },
    { w: 210, h: 66,  top: '63%', dur: '34s', delay: '-26s', op: 0.38 },
    { w: 150, h: 48,  top: '80%', dur: '28s', delay: '-14s', op: 0.25 },
    { w: 280, h: 88,  top: '92%', dur: '48s', delay: '-33s', op: 0.32 },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {clouds.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', top: c.top, left: '-18%',
          width: c.w, height: c.h, opacity: c.op,
          animation: `cloudDrift ${c.dur} linear ${c.delay} infinite`,
        }}>
          <svg viewBox="0 0 220 80" fill="rgba(139,92,246,0.18)" style={{ width: '100%', height: '100%', filter: 'blur(4px)' }}>
            <ellipse cx="110" cy="58" rx="100" ry="24" />
            <ellipse cx="75"  cy="44" rx="52"  ry="30" />
            <ellipse cx="145" cy="46" rx="46"  ry="26" />
            <ellipse cx="110" cy="34" rx="38"  ry="24" />
          </svg>
        </div>
      ))}
      <style>{`@keyframes cloudDrift { from{transform:translateX(0)} to{transform:translateX(118vw)} }`}</style>
    </div>
  );
}

export function Dashboard({ onLogout, onStartChat, onWatchDemo, onVisionAI }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => { unsubscribe(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); onLogout(); } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-[#050208] text-white relative overflow-x-hidden font-sans">

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a0b2e_0%,#050208_100%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px]" />
      </div>
      <Clouds />

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'py-2' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`flex items-center justify-between px-4 sm:px-6 py-3 rounded-2xl border transition-all duration-500 ${
            scrolled ? 'bg-black/50 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'bg-transparent border-transparent'
          }`}>

            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-md opacity-40 group-hover:opacity-80 transition-opacity rounded-xl" />
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-white/20">
                  <img src={avesLogo} alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                A.V.E.S
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {['#features|Recursos', '/about|Sobre', '/contact|Contactos'].map(item => {
                const [href, label] = item.split('|');
                return href.startsWith('/') ? (
                  <button key={label} onClick={() => navigate(href)} className="text-sm font-medium text-purple-100/70 hover:text-white transition-colors relative group">
                    {label}<span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-purple-500 transition-all group-hover:w-full" />
                  </button>
                ) : (
                  <a key={label} href={href} className="text-sm font-medium text-purple-100/70 hover:text-white transition-colors relative group">
                    {label}<span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-purple-500 transition-all group-hover:w-full" />
                  </a>
                );
              })}
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Online</p>
                    <p className="text-xs text-white/60 truncate max-w-[90px]">{user.email?.split('@')[0]}</p>
                  </div>
                  <button onClick={handleLogout} className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all group" title="Sair">
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300 group-hover:text-red-400" />
                  </button>
                </div>
              )}
              {/* Mobile hamburger */}
              <button onClick={() => setMenuOpen(o => !o)} className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-5 flex flex-col gap-1">
                  <span className={`h-0.5 bg-white/70 transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                  <span className={`h-0.5 bg-white/70 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                  <span className={`h-0.5 bg-white/70 transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden mt-2 mx-2 p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 flex flex-col gap-3">
              <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm text-purple-100/70 hover:text-white py-2 border-b border-white/5">Recursos</a>
              <button onClick={() => { navigate('/about'); setMenuOpen(false); }} className="text-sm text-purple-100/70 hover:text-white py-2 border-b border-white/5 text-left">Sobre</button>
              <button onClick={() => { navigate('/contact'); setMenuOpen(false); }} className="text-sm text-purple-100/70 hover:text-white py-2 text-left">Contactos</button>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-32 sm:pt-40 md:pt-44 pb-20 sm:pb-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3 h-3" /> Nova Era da Inteligência
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight">
              O Futuro é <br />
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent">
                Senciente.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-purple-100/60 max-w-lg leading-relaxed mx-auto lg:mx-0">
              O A.V.E.S não é apenas um chatbot. É um ecossistema cognitivo que evolui com a sua presença e aprende contigo.
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <button onClick={onStartChat} className="group relative px-6 sm:px-8 py-3.5 sm:py-4 bg-purple-600 rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(147,51,234,0.3)] font-bold flex items-center gap-3">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3"><MessageSquare className="w-5 h-5" /> Testar IA</div>
              </button>

              <button onClick={onVisionAI} className="group relative px-6 sm:px-8 py-3.5 sm:py-4 bg-cyan-600/20 border border-cyan-500/30 rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 hover:bg-cyan-600 shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:shadow-[0_20px_50px_rgba(34,211,238,0.3)] font-bold flex items-center gap-3 text-cyan-400 group-hover:text-white">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3 group-hover:text-white"><Eye className="w-5 h-5" /> Visão IA</div>
              </button>

              <button onClick={onWatchDemo} className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors px-2">
                <Play className="w-4 h-4 fill-current" /> Ver Demo
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end mt-4 lg:mt-0">
            <div className="absolute inset-0 bg-purple-600/30 blur-[100px] rounded-full animate-pulse" />
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-700 scale-75 sm:scale-90 lg:scale-100">
              <AnimatedChickenMascot size="large" isGesturing={false} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
                Recursos <span className="text-purple-500">Inteligentes</span>
              </h2>
              <p className="text-base sm:text-lg text-white/40">Tecnologia moderna com performance e inteligência em tempo real.</p>
            </div>
            <div className="h-[1px] flex-grow bg-gradient-to-r from-purple-500/50 to-transparent hidden md:block mb-6 ml-10" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {[
              { icon: "🧠", title: "IA Conversacional", desc: "Interações naturais com processamento de contexto profundo." },
              { icon: "👁️", title: "Visão Computacional", desc: "Reconhecimento visual e análise de padrões em milissegundos." },
              { icon: "⚡", title: "Performance", desc: "Resposta instantânea otimizada para mínima latência." },
              { icon: "🔐", title: "Segurança", desc: "Proteção avançada de dados e privacidade total." },
              { icon: "🎯", title: "Aprendizagem", desc: "Evolução contínua baseada em feedbacks e interações." },
              { icon: "🌐", title: "Global", desc: "Acesso total de qualquer lugar com escalabilidade ilimitada." },
            ].map((f, i) => (
              <div key={i} className="group relative p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 cursor-default">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className="text-3xl sm:text-4xl mb-5 sm:mb-6 bg-white/5 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl border border-white/10 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                  {f.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-purple-300 transition-colors">{f.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{f.desc}</p>
                <ChevronRight className="absolute bottom-6 sm:bottom-8 right-6 sm:right-8 w-5 h-5 text-white/20 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 pt-16 sm:pt-20 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-10 border-t border-purple-500/40 bg-[#080310]/80 backdrop-blur-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">

          <div className="col-span-2 md:col-span-2 lg:col-span-1 space-y-5 sm:space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-white/10">
                <img src={avesLogo} alt="AVES Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tighter bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">A.V.E.S</span>
            </div>
            <p className="text-purple-100/50 text-sm leading-relaxed">Projeto académico de conclusão de curso focado em inteligência artificial. Desenvolvido por estudantes.</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Status: Online
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm uppercase tracking-widest">Produto</h4>
            <ul className="space-y-3 text-white/40 text-sm">
              {['Recursos','Demonstração','Atualizações'].map(l => <li key={l}><button className="hover:text-purple-400 hover:translate-x-1 transition-all inline-block">{l}</button></li>)}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm uppercase tracking-widest">Equipe</h4>
            <ul className="space-y-3 text-sm">
              {[['Tudilu Manuel','Lead Developer'],['Elijah Gomes','AI Specialist'],['Kiami De Almeida','UI Designer']].map(([n,r]) => (
                <li key={n} className="group">
                  <span className="block text-white/60 group-hover:text-purple-300 text-sm">{n}</span>
                  <span className="text-[10px] text-white/20 uppercase tracking-tighter">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm uppercase tracking-widest">Legal</h4>
            <ul className="space-y-3 text-white/40 text-sm">
              {['Privacidade','Termos','Segurança'].map(l => (
                <li key={l}><button className="hover:text-purple-400 transition-colors flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-500/50" />{l}</button></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-white/20 text-[11px] font-medium tracking-wider">
          <div className="uppercase">©️ 2026 A.V.E.S — Projeto académico</div>
          <div className="flex gap-6 sm:gap-8 uppercase">
            <span>Todos os direitos reservados</span>
            <span className="text-purple-500/50">Angola</span>
          </div>
        </div>
      </footer>
    </div>
  );
}