import { useState } from "react";
import { AnimatedChickenMascot } from "./AnimatedChickenMascot";
import avesLogo from "../../assets/aves.jpeg";
import { useNavigate } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, ArrowLeft, Mail, Phone, MapPin, Globe, Send } from "lucide-react";
import { db } from "../../firebase"; // ajusta ao teu path real
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const navigate = useNavigate();
  const handleSubmit = async () => {
  if (!form.name || !form.email || !form.message) {
    alert("Preenche todos os campos obrigatórios!");
    return;
  }

  try {
    await addDoc(collection(db, "contacts"), {
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      createdAt: serverTimestamp(),
    });

    alert("Mensagem enviada com sucesso!");

    setForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    alert("Erro ao enviar mensagem.");
  }
};

  return (
    <div className="min-h-screen bg-[#050208] text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* 🌌 BACKGROUND FX - Consistência Visual A.V.E.S */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a0b2e_0%,#050208_100%)]" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* 🔥 HEADER - Glassmorphism */}
      <header className="relative z-30 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/20 backdrop-blur-3xl sticky top-0">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="relative">
            <div className="absolute -inset-1 bg-purple-500/40 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <img src={avesLogo} className="relative w-12 h-12 object-cover rounded-xl border border-white/10 shadow-2xl" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-fuchsia-200">
              A.V.E.S
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400/60 text-left">Neural Link</span>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 shadow-xl"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar
        </button>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* 🔥 HERO SECTION */}
        <section className="text-center pt-16 pb-8 px-6">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none">
            Entre em <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-violet-500">Contato</span>
          </h1>
          <p className="text-white/40 mt-4 max-w-xl mx-auto font-medium">
            Estamos aqui para ajudar! Envie sua mensagem e nossa rede neural responderá rapidamente.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
            ⚡ Resposta em até 24 horas
          </div>
        </section>

        {/* 🔥 MASCOTE - Floating Style */}
        <div className="relative z-10 flex justify-center py-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-purple-600/20 blur-[60px] rounded-full group-hover:bg-purple-600/30 transition-all duration-700" />
            <div className="relative p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl transition-transform duration-500 group-hover:scale-105">
              <AnimatedChickenMascot size="medium" isGesturing />
            </div>
          </div>
        </div>

        {/* 🔥 MAIN CONTENT GRID */}
        <section className="max-w-7xl mx-auto px-8 py-12 grid md:grid-cols-2 gap-10 items-start">

          {/* LEFT SIDE - Info Cards */}
          <div className="space-y-6">
            {[
              { title: "Email", icon: Mail, content: ["contato@aves.ai", "suporte@aves.ai"], color: "blue" },
              { title: "Telefone", icon: Phone, content: ["+244 923 456 789", "Seg - Sex: 8h - 18h"], color: "purple" },
              { title: "Localização", icon: MapPin, content: ["Luanda, Angola", "Centro Tecnológico"], color: "fuchsia" },
            ].map((item, i) => (
              <div key={i} className="group p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl hover:border-purple-500/30 hover:bg-white/[0.04] transition-all duration-500 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all">
                      <item.icon size={22} />
                   </div>
                   <div>
                      <h3 className="text-white font-black uppercase tracking-widest text-xs mb-1 opacity-40 group-hover:opacity-100 transition-opacity">{item.title}</h3>
                      {item.content.map((text, j) => (
                        <p key={j} className="text-white font-medium text-sm leading-relaxed">{text}</p>
                      ))}
                   </div>
                </div>
              </div>
            ))}

            {/* Redes Sociais Card */}
            <div className="p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-purple-900/10 to-transparent backdrop-blur-2xl">
              <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
                <Globe size={14} className="text-purple-500" /> Canais Oficiais
              </h3>
              <div className="flex gap-4">
                {[
                  { icon: <Facebook size={18} />, name: "Facebook" },
                  { icon: <Twitter size={18} />, name: "Twitter" },
                  { icon: <Instagram size={18} />, name: "Instagram" },
                  { icon: <Linkedin size={18} />, name: "LinkedIn" },
                ].map((item, i) => (
                  <button
                    key={i}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-purple-600 hover:border-purple-400 hover:scale-110 hover:rotate-3 transition-all duration-300 shadow-lg"
                    title={item.name}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - FORM (Acabamento Pro) */}
          <div className="p-10 rounded-[3rem] border border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-3xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                <Send size={150} />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-6 tracking-tighter">
              Envie sua <span className="text-purple-400">Mensagem</span>
            </h2>

            <div className="space-y-4 relative">
              {[
                { id: "name", placeholder: "Nome completo", type: "text" },
                { id: "email", placeholder: "Seu melhor e-mail", type: "email" },
                { id: "subject", placeholder: "Assunto do Protocolo", type: "text" },
              ].map((field) => (
                <input
                  key={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.id as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium text-sm"
                />
              ))}

              <textarea
                placeholder="Como podemos ajudar?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/5 text-white placeholder:text-white/10 h-40 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium text-sm resize-none"
              />

             <button
  type="button"
  onClick={handleSubmit}
  className="w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.3em] bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600"
>
  Transmitir Mensagem
</button>
            </div>
          </div>
        </section>

        {/* 🔥 STATS STRIP */}
        <section className="max-w-7xl mx-auto px-8 pb-16 pt-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "24h", label: "Response Time" },
                { value: "100%", label: "Satisfaction" },
                { value: "24/7", label: "Live Support" },
                { value: "∞", label: "Neural Flow" },
              ].map((item, i) => (
                <div key={i} className="p-6 text-center rounded-3xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all group">
                   <h3 className="text-3xl font-black text-white group-hover:scale-110 transition-transform">{item.value}</h3>
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/20 group-hover:text-purple-400 transition-colors">{item.label}</p>
                </div>
              ))}
           </div>
        </section>

        {/* 🔥 FOOTER */}
        <footer className="text-center py-12 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">
            ©️ 2026 A.V.E.S — Sistema de Inteligência Artificial // Luanda, Angola
          </p>
        </footer>
      </main>
    </div>
  );
}