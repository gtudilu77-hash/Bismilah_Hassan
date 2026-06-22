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

// ─── Nuvens CSS ───────────────────────────────────────────────────────────────
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

  // Fecha menu mobile ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px]" />
      </div>
      <Clouds />

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'py-1.5 sm:py-2' : 'py-3 sm:py-5'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className={`flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border transition-all duration-500 ${
            scrolled ? 'bg-black/50 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'bg-transparent border-transparent'
          }`}>

            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-md opacity-40 group-hover:opacity-80 transition-opacity rounded-lg sm:rounded-xl" />
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl overflow-hidden border border-white/20">
                  <img src={avesLogo} alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                A.V.E.S
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
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

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user && (
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-white/10">
                  {/* Nome do user — apenas sm+ */}
                  <div className="hidden sm:block text-right">
                    <p className="text-[9px] sm:text-[10px] text-purple-400 font-bold uppercase tracking-widest">Online</p>
                    <p className="text-[11px] sm:text-xs text-white/60 truncate max-w-[70px] sm:max-w-[90px]">{user.email?.split('@')[0]}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all group"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-300 group-hover:text-red-400" />
                  </button>
                </div>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="md:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 touch-manipulation"
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                <div className="w-4 sm:w-5 flex flex-col gap-[4px] sm:gap-[5px]">
                  <span className={`h-0.5 bg-white/70 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[9px]' : ''}`} />
                  <span className={`h-0.5 bg-white/70 transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                  <span className={`h-0.5 bg-white/70 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="mx-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 flex flex-col gap-1">
              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-purple-100/70 hover:text-white hover:bg-white/5 py-2.5 px-3 rounded-lg transition-all"
              >
                Recursos
              </a>
              <button
                onClick={() => { navigate('/about'); setMenuOpen(false); }}
                className="text-sm text-purple-100/70 hover:text-white hover:bg-white/5 py-2.5 px-3 rounded-lg transition-all text-left"
              >
                Sobre
              </button>
              <button
                onClick={() => { navigate('/contact'); setMenuOpen(false); }}
                className="text-sm text-purple-100/70 hover:text-white hover:bg-white/5 py-2.5 px-3 rounded-lg transition-all text-left"
              >
                Contactos
              </button>
              {user && (
                <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between px-3">
                  <span className="text-xs text-white/50 truncate">{user.email}</span>
                  <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                    <LogOut className="w-3.5 h-3.5" /> Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-24 xs:pt-28 sm:pt-36 md:pt-44 pb-16 sm:pb-24 md:pb-28 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center">

          {/* Texto */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3 h-3 flex-shrink-0" /> Nova Era da Inteligência
            </div>

            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-black leading-[0.88] tracking-tight">
              O Futuro é <br />
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent">
                Senciente.
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-purple-100/60 max-w-sm sm:max-w-lg leading-relaxed mx-auto lg:mx-0">
              O A.V.E.S não é apenas um chatbot. É um ecossistema cognitivo que evolui com a sua presença e aprende contigo.
            </p>

            {/* Botões CTA */}
            <div className="flex flex-col xs:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start items-center xs:items-start">
              <button
                onClick={onStartChat}
                className="group relative w-full xs:w-auto px-6 sm:px-8 py-3 sm:py-3.5 md:py-4 bg-purple-600 rounded-xl sm:rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(147,51,234,0.3)] font-bold flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-2 sm:gap-3">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" /> Testar IA
                </div>
              </button>

              <button
                onClick={onVisionAI}
                className="group relative w-full xs:w-auto px-6 sm:px-8 py-3 sm:py-3.5 md:py-4 bg-cyan-600/20 border border-cyan-500/30 rounded-xl sm:rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 hover:bg-cyan-600 shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:shadow-[0_20px_50px_rgba(34,211,238,0.3)] font-bold flex items-center justify-center gap-2 sm:gap-3 text-cyan-400 text-sm sm:text-base"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-2 sm:gap-3 group-hover:text-white">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> Visão IA
                </div>
              </button>

              <button
                onClick={onWatchDemo}
                className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors px-2 py-1 touch-manipulation"
              >
                <Play className="w-4 h-4 fill-current" /> Ver Demo
              </button>
            </div>
          </div>

          {/* Mascote */}
          <div className="relative flex justify-center lg:justify-end order-1 lg:order-2">
            <div className="absolute inset-0 bg-purple-600/30 blur-[80px] sm:blur-[100px] rounded-full animate-pulse" />
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-700
              scale-[0.6] xs:scale-[0.7] sm:scale-[0.85] md:scale-90 lg:scale-100
              -my-4 sm:-my-6 md:-my-8 lg:my-0">
              <AnimatedChickenMascot size="large" isGesturing={false} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 px-3 sm:px-6 py-16 sm:py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-10 sm:mb-16 md:mb-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 md:mb-6">
                Recursos <span className="text-purple-500">Inteligentes</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-white/40">Tecnologia moderna com performance e inteligência em tempo real.</p>
            </div>
            <div className="h-[1px] flex-grow bg-gradient-to-r from-purple-500/50 to-transparent hidden md:block mb-6 ml-10" />
          </div>

          {/* Grid de features — 1 col mobile, 2 tablet, 3 desktop */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-8">
            {[
              { icon: "🧠", title: "IA Conversacional", desc: "Interações naturais com processamento de contexto profundo." },
              { icon: "👁️", title: "Visão Computacional", desc: "Reconhecimento visual e análise de padrões em milissegundos." },
              { icon: "⚡", title: "Performance", desc: "Resposta instantânea otimizada para mínima latência." },
              { icon: "🔐", title: "Segurança", desc: "Proteção avançada de dados e privacidade total." },
              { icon: "🎯", title: "Aprendizagem", desc: "Evolução contínua baseada em feedbacks e interações." },
              { icon: "🌐", title: "Global", desc: "Acesso total de qualquer lugar com escalabilidade ilimitada." },
            ].map((f, i) => (
              <div key={i} className="group relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 cursor-default">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl" />
                <div className="text-2xl sm:text-3xl md:text-4xl mb-4 sm:mb-5 md:mb-6 bg-white/5 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center rounded-xl sm:rounded-2xl border border-white/10 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                  {f.icon}
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 group-hover:text-purple-300 transition-colors">{f.title}</h3>
                <p className="text-white/50 leading-relaxed text-xs sm:text-sm pr-6 sm:pr-8">{f.desc}</p>
                <ChevronRight className="absolute bottom-5 sm:bottom-6 md:bottom-8 right-5 sm:right-6 md:right-8 w-4 h-4 sm:w-5 sm:h-5 text-white/20 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 pt-12 sm:pt-16 md:pt-20 pb-6 sm:pb-8 md:pb-10 px-3 sm:px-6 lg:px-10 border-t border-purple-500/40 bg-[#080310]/80 backdrop-blur-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        {/* Grid do footer — 2 colunas mobile, 4 desktop */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 lg:gap-12 mb-10 sm:mb-12 md:mb-16">

          {/* Bloco da marca — ocupa 2 colunas em mobile e tablet */}
          <div className="col-span-2 lg:col-span-1 space-y-4 sm:space-y-5 md:space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                <img src={avesLogo} alt="AVES Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tighter bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">A.V.E.S</span>
            </div>
            <p className="text-purple-100/50 text-xs sm:text-sm leading-relaxed max-w-xs">
              Projeto académico de conclusão de curso focado em inteligência artificial. Desenvolvido por estudantes.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" /> Status: Online
            </div>
          </div>

          {/* Produto */}
          <div>
            <h4 className="text-white font-bold mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm uppercase tracking-widest">Produto</h4>
            <ul className="space-y-2 sm:space-y-3 text-white/40 text-xs sm:text-sm">
              {['Recursos', 'Demonstração', 'Atualizações'].map(l => (
                <li key={l}>
                  <button className="hover:text-purple-400 hover:translate-x-1 transition-all inline-block py-0.5">{l}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Equipe */}
          <div>
            <h4 className="text-white font-bold mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm uppercase tracking-widest">Equipe</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
              {[
                ['Tudilu Manuel', 'Lead Developer'],
                ['Elijah Gomes', 'AI Specialist'],
                ['Kiami De Almeida', 'UI Designer'],
              ].map(([n, r]) => (
                <li key={n} className="group">
                  <span className="block text-white/60 group-hover:text-purple-300 text-xs sm:text-sm">{n}</span>
                  <span className="text-[9px] sm:text-[10px] text-white/20 uppercase tracking-tighter">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-3 sm:mb-4 md:mb-6 text-xs sm:text-sm uppercase tracking-widest">Legal</h4>
            <ul className="space-y-2 sm:space-y-3 text-white/40 text-xs sm:text-sm">
              {['Privacidade', 'Termos', 'Segurança'].map(l => (
                <li key={l}>
                  <button className="hover:text-purple-400 transition-colors flex items-center gap-2 py-0.5">
                    <div className="w-1 h-1 rounded-full bg-purple-500/50 flex-shrink-0" />{l}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-4 sm:pt-6 md:pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 text-white/20 text-[10px] sm:text-[11px] font-medium tracking-wider">
          <div className="uppercase text-center sm:text-left">©️ 2026 A.V.E.S — Projeto académico</div>
          <div className="flex gap-4 sm:gap-6 md:gap-8 uppercase">
            <span>Todos os direitos reservados</span>
            <span className="text-purple-500/50">Angola</span>
          </div>
        </div>
      </footer>
    </div>
  );
}