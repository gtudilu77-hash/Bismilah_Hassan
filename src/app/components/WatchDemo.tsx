import { useState, useRef, useEffect } from 'react';
import { AnimatedChickenMascot } from './AnimatedChickenMascot';
import { Send, ArrowLeft, Mic, Paperclip, Play, RotateCcw, Monitor, Cpu } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface WatchDemoProps {
  onBack: () => void;
}

export function WatchDemo({ onBack }: WatchDemoProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const demoScript = [
    { sender: 'ai' as const, text: 'Olá! Bem-vindo ao A.V.E.S. Mal posso esperar para te mostrar tudo que posso fazer!' },
    { sender: 'user' as const, text: 'Oi! Você pode me falar sobre suas capacidades?' },
    { sender: 'ai' as const, text: 'Claro! Posso responder perguntas, ajudar com informações, criar coisas, analisar dados… basicamente, seu assistente digital para quase tudo!' },
    { sender: 'user' as const, text: 'Isso é incrível! Quão rápido você processa informações?' },
    { sender: 'ai' as const, text: 'Super rápido! Pisque e você vai perder. Eu analiso números e ideias em milissegundos.' },
    { sender: 'user' as const, text: 'E quanto à segurança dos dados?' },
    { sender: 'ai' as const, text: 'Tudo seguro! Seus segredos estão trancados mais forte que o cofre de Fort Knox.' },
    { sender: 'user' as const, text: 'Impressionante! Você aprende com nossas conversas?' },
    { sender: 'ai' as const, text: 'Totalmente! Eu aprendo seu estilo e preferências enquanto conversamos. Quanto mais falamos, melhor posso te ajudar.' },
    { sender: 'user' as const, text: 'Isso é exatamente o que eu preciso! Como começo?' },
    { sender: 'ai' as const, text: 'Basta clicar em "Iniciar Teste Gratuito" e mergulhar. Você vai adorar!' },
    { sender: 'user' as const, text: 'Quem te criou?' },
    { sender: 'ai' as const, text: 'Fui criado por Tudilu Manuel, Kiami De Almeida e Elijah Gomes. Sim, essa é minha equipe incrível! 😎' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isPlaying && currentStep < demoScript.length) {
      const timer = setTimeout(() => {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: demoScript[currentStep].text,
          sender: demoScript[currentStep].sender,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setCurrentStep((prev) => prev + 1);
      }, 2000);

      return () => clearTimeout(timer);
    } else if (currentStep >= demoScript.length) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep]);

  const startDemo = () => {
    setMessages([]);
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const resetDemo = () => {
    setMessages([]);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-[#050208] text-white flex relative overflow-hidden font-sans">
      
      {/* 🌌 BACKGROUND SYSTEM - Consistência Visual */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a0b2e_0%,#050208_100%)]" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* 📂 SIDEBAR DE CONTROLE (Terminal Style) */}
      <aside className="relative z-20 w-80 h-screen bg-[#0d0616]/40 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-2xl">
        
        <div className="p-6">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-white/40 hover:text-purple-400 transition-all mb-8 group text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar
          </button>

          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-2xl shadow-inner">
               <div className="relative group">
                 <div className={`absolute -inset-4 bg-purple-500/20 blur-xl rounded-full transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
                 <AnimatedChickenMascot size="medium" isGesturing={isPlaying} />
               </div>
               <div className="mt-6 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isPlaying ? 'animate-ping' : ''}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Live Demo</span>
               </div>
            </div>

            <div className="space-y-3">
               {!isPlaying && messages.length === 0 ? (
                 <button
                   onClick={startDemo}
                   className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(147,51,234,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                 >
                   <Play size={16} fill="currentColor" /> Iniciar Sequência
                 </button>
               ) : (
                 <button
                   onClick={resetDemo}
                   className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                 >
                   <RotateCcw size={16} /> Reiniciar
                 </button>
               )}
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
               <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/20">
                  <span>Progresso</span>
                  <span>{Math.round((currentStep / demoScript.length) * 100)}%</span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                    style={{ width: `${(currentStep / demoScript.length) * 100}%` }}
                  />
               </div>
               <p className="text-center text-[9px] text-white/20 uppercase tracking-tighter">Status: Executando Script Beta</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 💬 MAIN CHAT AREA (The Movie) */}
      <main className="relative z-10 flex-1 flex flex-col h-screen">
        
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/20 backdrop-blur-md">
           <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                 <Monitor size={20} />
              </div>
              <div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-white">Playback de Demonstração</h2>
                 <p className="text-[10px] text-white/30 font-medium">Visualizando fluxo cognitivo em tempo real</p>
              </div>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
              <Cpu size={14} /> Neural-Core v4.0
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
               <div className="text-center space-y-6 animate-in fade-in zoom-in duration-700">
                  <div className="w-24 h-24 mx-auto rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-[0_20px_50px_rgba(147,51,234,0.3)]">
                     <Play size={40} fill="white" className="ml-2" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tighter uppercase">Pronto para a Transmissão?</h3>
                    <p className="text-white/40 text-sm max-w-xs mx-auto">Clique no botão lateral para iniciar a simulação interativa das capacidades do A.V.E.S.</p>
                  </div>
               </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-5 duration-500`}
            >
              <div className={`max-w-[60%] space-y-2 ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`
                  relative px-7 py-5 rounded-[2.5rem] text-sm leading-relaxed shadow-2xl
                  ${message.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none shadow-purple-900/20'
                    : 'bg-white/5 backdrop-blur-3xl border border-white/10 text-purple-100 rounded-tl-none shadow-black/40'}
                `}>
                  {message.sender === 'ai' && (
                    <div className="flex items-center gap-2 mb-2 text-purple-400">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">A.V.E.S Neural Response</span>
                    </div>
                  )}
                  {message.text}
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 px-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isPlaying && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-6 py-4 flex gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-[0_0_8px_#a855f7]" />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-[0_0_8px_#a855f7]" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce shadow-[0_0_8px_#a855f7]" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Fake Input Dock (Visual Only) */}
        <div className="p-10 pt-0 opacity-40">
           <div className="max-w-4xl mx-auto bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-3 rounded-[2.5rem] flex items-center gap-4">
              <div className="flex gap-2 pl-2 border-r border-white/5 pr-4">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Paperclip size={18}/></div>
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Mic size={18}/></div>
              </div>
              <div className="flex-1 text-xs font-bold uppercase tracking-widest text-white/20">Modo Demo Ativo — Teclado Bloqueado</div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><Send size={20}/></div>
           </div>
        </div>

      </main>
    </div>
  );
}