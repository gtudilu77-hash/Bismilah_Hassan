import { AnimatedChickenMascot } from './AnimatedChickenMascot';
import avesLogo from "../../assets/aves.jpeg";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket, Target, Cpu, Users, Sparkles } from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050208] text-white flex flex-col relative overflow-x-hidden font-sans">
      
      {/* 🌌 BACKGROUND FX - Fundo Galáctico */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a0b2e_0%,#050208_100%)]" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* 🔥 HEADER - Vidro Superior */}
      <header className="relative z-30 flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 bg-black/20 backdrop-blur-3xl sticky top-0">
        <div className="flex items-center gap-2 sm:gap-4 group cursor-default min-w-0">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-purple-500/40 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <img src={avesLogo} className="relative w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-xl border border-white/10 shadow-2xl" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-fuchsia-200 whitespace-nowrap">
              A.V.E.S
            </span>
            <span className="hidden sm:block text-[9px] font-black uppercase tracking-[0.3em] text-purple-400/60">Neural Network</span>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="group flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 shadow-xl shrink-0"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Voltar</span>
        </button>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* 🔥 HERO SECTION HORIZONTAL - Otimização de Espaço */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-16 pb-12">
          <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-10 md:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-12 shadow-3xl">
            
            {/* Coluna de Texto (Esquerda) */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-[0.3em]">
                <Sparkles size={12} className="animate-spin-slow" /> Inovação Tecnológica
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter mb-6 leading-[0.95] sm:leading-[0.9]">
                Sobre o <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-violet-500">
                  Projeto A.V.E.S
                </span>
              </h1>

              <p className="text-white/40 text-base sm:text-lg md:text-xl leading-relaxed font-medium max-w-xl mx-auto md:mx-0">
                Um sistema de inteligência artificial criado para simular interação humana, aprender com o utilizador e transformar a forma como interagimos com tecnologia.
              </p>

              <div className="mt-10 flex gap-4 justify-center md:justify-start">
                 <div className="px-5 sm:px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60 whitespace-nowrap">Status: Operacional</span>
                 </div>
              </div>
            </div>

            {/* Coluna da Mascote (Direita) */}
            <div className="relative group shrink-0 w-full max-w-[220px] sm:max-w-[280px] md:w-auto md:max-w-none mx-auto md:mx-0">
              <div className="absolute inset-0 bg-purple-600/20 blur-[80px] rounded-full group-hover:bg-purple-600/30 transition-all duration-700" />
              <div className="relative flex items-center justify-center p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3rem] bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2">
                <AnimatedChickenMascot size="large" isGesturing />
              </div>
            </div>

          </div>
        </section>

        {/* 🔥 GRID DE INFORMAÇÕES - Cards Compactos */}
        <section className="px-4 sm:px-6 md:px-8 py-12 max-w-7xl mx-auto">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Missão", icon: Target, desc: "Tornar a IA acessível e intuitiva para estudantes." },
                { title: "Visão", icon: Rocket, desc: "Ser referência global em projetos educacionais de IA." },
                { title: "Tecnologia", icon: Cpu, desc: "Processamento neural de última geração com React." }
              ].map((item, idx) => (
                <div key={idx} className="p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all group shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                    <item.icon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
                  <p className="text-white/40 text-sm font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>
        </section>

        {/* 🔥 EQUIPA - Layout Moderno */}
        <section className="px-4 sm:px-6 md:px-8 py-12 max-w-7xl mx-auto">
          <div className="p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[3.5rem] bg-gradient-to-br from-purple-900/10 to-transparent border border-white/5">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-8 sm:mb-10 flex items-center gap-3 sm:gap-4">
              <Users className="text-purple-500 shrink-0" /> Core Team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Tudilu Manuel", role: "Frontend & IA", emoji: "🔥" },
                { name: "Elijah Gomes", role: "Backend", emoji: "⚙️" },
                { name: "Kiami De Almeida", role: "Design & UX", emoji: "🎨" }
              ].map((member, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition-all group min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-all shrink-0">
                    {member.emoji}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-black text-sm truncate">{member.name}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 🔥 STATS & FOOTER */}
        <section className="px-4 sm:px-6 md:px-8 pb-20 pt-12">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-6 sm:gap-8 text-center border-t border-white/5 pt-12 sm:pt-16">
            {[
              { val: "100%", label: "Student Dev" },
              { val: "V2.0", label: "Build" },
              { val: "∞", label: "Future" }
            ].map((stat, i) => (
              <div key={i} className="min-w-[100px] sm:min-w-[120px]">
                <h3 className="text-2xl sm:text-3xl font-black text-white">{stat.val}</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] md:tracking-[0.5em] text-white/10 mt-12 sm:mt-16 break-words px-4">
            ©️ 2026 A.V.E.S — Protocolo Final de Curso
          </p>
        </section>
      </main>
    </div>
  );
}