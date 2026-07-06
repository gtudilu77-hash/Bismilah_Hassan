import { AnimatedChickenMascot } from './AnimatedChickenMascot';
import {
  LogOut, Eye, MessageSquare, Sparkles, Upload,
  BookOpen, Trash2, Calendar, X, FileText, CheckCircle2,
  Loader2, Lightbulb, ChevronDown, ChevronUp, Brain,
  RefreshCw, Copy, Check, Mail, Phone, MapPin, Globe,
  Send, Facebook, Twitter, Instagram, Linkedin,
  Target, Rocket, Cpu, Users, ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import avesLogo from "../../assets/aves.jpeg";
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection, onSnapshot, orderBy, query,
  deleteDoc, doc, addDoc, serverTimestamp
} from 'firebase/firestore';

interface Materia {
  id: string; titulo: string; descricao: string; dataCriacao: any; autor: string;
  arquivoUrl?: string; tipo?: string;
}

// ── Tema verde ─────────────────────────────────────────────────────────────
const T = {
  accent:  '#10b981',
  accentB: '#14b8a6',
  glow:    'rgba(16,185,129,0.35)',
  dim:     'rgba(16,185,129,0.08)',
  border:  'rgba(16,185,129,0.2)',
  grad:    'from-emerald-400 to-teal-400',
  gradCss: 'linear-gradient(135deg,#059669,#0d9488)',
  cloud:   'rgba(16,185,129,0.22)',
};

// ── API URL ────────────────────────────────────────────────────────────────
const API_URL = 'https://bismilah-hassan-1.onrender.com';

// ── Nuvens ─────────────────────────────────────────────────────────────────
function Clouds() {
  const clouds = [
    {w:250,h:78,  top:'6%',  dur:'40s',delay:'0s',   op:0.4 },
    {w:180,h:56,  top:'28%', dur:'54s',delay:'-22s', op:0.25},
    {w:310,h:92,  top:'52%', dur:'36s',delay:'-12s', op:0.20},
    {w:195,h:60,  top:'72%', dur:'30s',delay:'-30s', op:0.28},
    {w:270,h:82,  top:'90%', dur:'46s',delay:'-18s', op:0.22},
  ];
  return (
    <div style={{position:'fixed',inset:0,zIndex:0,overflow:'hidden',pointerEvents:'none'}}>
      {clouds.map((c,i)=>(
        <div key={i} style={{position:'absolute',top:c.top,left:'-18%',width:c.w,height:c.h,opacity:c.op,animation:`cloudDrift ${c.dur} linear ${c.delay} infinite`}}>
          <svg viewBox="0 0 220 80" fill={T.cloud} style={{width:'100%',height:'100%',filter:'blur(4px)'}}>
            <ellipse cx="110" cy="58" rx="100" ry="24"/>
            <ellipse cx="75"  cy="44" rx="52"  ry="30"/>
            <ellipse cx="145" cy="46" rx="46"  ry="26"/>
            <ellipse cx="110" cy="34" rx="38"  ry="24"/>
          </svg>
        </div>
      ))}
      <style>{`@keyframes cloudDrift{from{transform:translateX(0)}to{transform:translateX(118vw)}}`}</style>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
function TeacherModal({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}) {
  const [tab,        setTab]        = useState<'upload'|'questions'>('upload');
  const [file,       setFile]       = useState<File|null>(null);
  const [title,      setTitle]      = useState('');
  const [description,setDescription]= useState('');
  const [uploading,  setUploading]  = useState(false);
  const [questions,  setQuestions]  = useState<string[]>([]);
  const [loadingQ,   setLoadingQ]   = useState(false);
  const [qTopic,     setQTopic]     = useState('');
  const [qLevel,     setQLevel]     = useState<'básico'|'intermédio'|'avançado'>('intermédio');
  const [copiedIdx,  setCopiedIdx]  = useState<number|null>(null);

  if (!isOpen) return null;

  const toBase64 = (f:File):Promise<string> => new Promise((res,rej)=>{
    const r=new FileReader(); r.readAsDataURL(f);
    r.onload=()=>res(r.result as string); r.onerror=rej;
  });

  const handleUpload = async () => {
    if (!file)         return alert('Seleciona um ficheiro!');
    if (!title.trim()) return alert('Escreve o título!');
    setUploading(true);
    try {
      const b64 = await toBase64(file);
      await addDoc(collection(db,'materias'),{titulo:title,descricao:description,arquivoUrl:b64,tipo:file.type,dataCriacao:serverTimestamp(),autor:'Professor'});
      setUploading(false); setTitle(''); setDescription(''); setFile(null); onClose();
      alert('Matéria publicada com sucesso!');
    } catch(e){ console.error(e); alert('Falha no upload.'); setUploading(false); }
  };

  const generateQuestions = async () => {
    if (!qTopic.trim()) return alert('Escreve o tópico!');
    setLoadingQ(true); setQuestions([]);
    try {
      // ✅ URL corrigido para produção
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `És um professor. Gera exactamente 8 perguntas sobre "${qTopic}" de nível ${qLevel}. Array JSON: ["P1?","P2?",...]. Só JSON.`,
          userId: auth.currentUser?.uid || 'teacher-guest',
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.reply.replace(/```json|```/g,'').trim());
      setQuestions(Array.isArray(parsed) ? parsed : []);
    } catch(e){
      console.error(e);
      alert('Erro ao gerar perguntas. O servidor pode estar a acordar — tenta de novo em 30 segundos.');
    }
    setLoadingQ(false);
  };

  const copyQ   = (q:string,i:number)=>{ navigator.clipboard.writeText(q); setCopiedIdx(i); setTimeout(()=>setCopiedIdx(null),2000); };
  const copyAll = ()=>{ navigator.clipboard.writeText(questions.map((q,i)=>`${i+1}. ${q}`).join('\n')); setCopiedIdx(-1); setTimeout(()=>setCopiedIdx(null),2000); };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-3xl text-white max-h-[90vh] flex flex-col" style={{background:'#080f0c',border:`1px solid ${T.border}`,boxShadow:`0 0 80px ${T.glow}`}}>
        <div className="p-4 sm:p-5 flex justify-between items-center gap-2 border-b border-white/[0.08] shrink-0">
          <div className="flex gap-1 overflow-x-auto">
            {(['upload','questions'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap"
                style={tab===t?{background:T.accent,color:'#000'}:{color:'rgba(255,255,255,0.4)'}}>
                {t==='upload'?'📤 Enviar Matéria':'💡 Sugestões'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all shrink-0"><X className="w-5 h-5 text-white/50"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {tab==='upload' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{color:`${T.accent}99`}}>Título *</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Álgebra Linear — Cap. 3"
                  className="w-full p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:outline-none text-white placeholder:text-white/20 transition-all"/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{color:`${T.accent}99`}}>Descrição</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Breve descrição..."
                  className="w-full p-3.5 h-24 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:outline-none text-white placeholder:text-white/20 transition-all resize-none"/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{color:`${T.accent}99`}}>Ficheiro</label>
                <div className="relative border-2 border-dashed border-white/10 hover:border-emerald-500/30 rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer group">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e=>setFile(e.target.files?.[0]||null)}/>
                  {file?(
                    <div className="flex flex-col items-center gap-3" style={{color:T.accent}}>
                      <CheckCircle2 className="w-10 h-10"/>
                      <div><p className="font-bold break-all">{file.name}</p><p className="text-xs text-white/40 mt-1">{(file.size/1024/1024).toFixed(2)} MB</p></div>
                    </div>
                  ):(
                    <div className="text-white/30 flex flex-col items-center gap-3 group-hover:text-white/50 transition-colors">
                      <FileText className="w-10 h-10"/><div><p className="font-medium">Clica para seleccionar</p><p className="text-xs mt-1">PDF, imagem ou documento</p></div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={handleUpload} disabled={uploading} className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-black"
                style={{background:T.gradCss, boxShadow:`0 4px 20px ${T.glow}`}}>
                {uploading?<><Loader2 className="w-5 h-5 animate-spin text-black"/> A publicar...</>:<><Upload className="w-5 h-5"/> Publicar Matéria</>}
              </button>
            </div>
          )}
          {tab==='questions' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl" style={{background:`${T.accent}08`,border:`1px solid ${T.border}`}}>
                <p className="text-sm flex items-start gap-2" style={{color:`${T.accent}bb`}}>
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5"/> Escreve o tópico e a IA gera 8 perguntas pedagógicas para usar em testes ou aulas.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{color:`${T.accent}99`}}>Tópico da Matéria *</label>
                <input value={qTopic} onChange={e=>setQTopic(e.target.value)} onKeyDown={e=>e.key==='Enter'&&generateQuestions()}
                  placeholder="Ex: Fotossíntese, Equações do 2º grau..."
                  className="w-full p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:outline-none text-white placeholder:text-white/20 transition-all"/>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{color:`${T.accent}99`}}>Nível de Dificuldade</label>
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  {(['básico','intermédio','avançado'] as const).map(l=>(
                    <button key={l} onClick={()=>setQLevel(l)} className="flex-1 min-w-[28%] sm:min-w-0 py-2.5 rounded-xl text-xs font-bold capitalize transition-all"
                      style={qLevel===l?{background:T.accent,color:'#000'}:{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.4)'}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={generateQuestions} disabled={loadingQ} className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-black"
                style={{background:T.gradCss, boxShadow:`0 4px 20px ${T.glow}`}}>
                {loadingQ?<><Loader2 className="w-5 h-5 animate-spin"/> A gerar...</>:<><Brain className="w-5 h-5"/> Gerar Perguntas</>}
              </button>
              {questions.length>0&&(
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-white/70">{questions.length} perguntas geradas</h4>
                    <div className="flex gap-2">
                      <button onClick={generateQuestions} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all" title="Regenerar"><RefreshCw className="w-4 h-4 text-white/50"/></button>
                      <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all" style={{background:T.dim,border:`1px solid ${T.border}`,color:T.accent}}>
                        {copiedIdx===-1?<Check className="w-3.5 h-3.5"/>:<Copy className="w-3.5 h-3.5"/>}
                        {copiedIdx===-1?'Copiado!':'Copiar tudo'}
                      </button>
                    </div>
                  </div>
                  {questions.map((q,i)=>(
                    <div key={i} className="group flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 transition-all">
                      <span className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5" style={{background:T.dim,color:T.accent}}>{i+1}</span>
                      <p className="flex-1 text-sm text-white/75 leading-relaxed min-w-0">{q}</p>
                      <button onClick={()=>copyQ(q,i)} className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all">
                        {copiedIdx===i?<Check className="w-3.5 h-3.5" style={{color:T.accent}}/>:<Copy className="w-3.5 h-3.5 text-white/40"/>}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const [user,        setUser]       = useState<User|null>(null);
  const [scrolled,    setScrolled]   = useState(false);
  const [materias,    setMaterias]   = useState<Materia[]>([]);
  const [isModalOpen, setIsModalOpen]= useState(false);
  const [expandedId,  setExpandedId] = useState<string|null>(null);
  const [activeTab,   setActiveTab]  = useState<'materias'|'sobre'|'contacto'>('materias');

  // Contacto form
  const [form,    setForm]    = useState({name:'',email:'',subject:'',message:''});
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();

  useEffect(()=>{
    // ✅ Wake-up do servidor ao abrir o dashboard
    fetch(`${API_URL}/`).catch(()=>{});

    const onScroll=()=>setScrolled(window.scrollY>20);
    window.addEventListener('scroll',onScroll);
    const unsubAuth = onAuthStateChanged(auth,setUser);
    const q = query(collection(db,'materias'),orderBy('dataCriacao','desc'));
    const unsubFS = onSnapshot(q,snap=>setMaterias(snap.docs.map(d=>({
      id:d.id, titulo:d.data().titulo||'Sem título',
      descricao:d.data().descricao||d.data().description||'Sem descrição.',
      dataCriacao:d.data().dataCriacao||null, autor:d.data().autor||'Professor',
      arquivoUrl:d.data().arquivoUrl||'', tipo:d.data().tipo||'',
    }))),e=>console.error(e));
    return ()=>{ unsubAuth(); unsubFS(); window.removeEventListener('scroll',onScroll); };
  },[]);

  const handleLogout = async ()=>{ try{ await signOut(auth); navigate('/login'); }catch(e){console.error(e);} };
  const handleDelete = async (id:string,titulo:string)=>{
    if(!window.confirm(`Apagar "${titulo}"?`)) return;
    try{ await deleteDoc(doc(db,'materias',id)); }catch(e){console.error(e);}
  };
  const formatDate=(ts:any)=>{
    if(!ts) return 'Recentemente';
    if(typeof ts.toDate==='function') return ts.toDate().toLocaleDateString('pt-PT');
    return 'Recentemente';
  };
  const handleSendContact = async ()=>{
    if(!form.name||!form.email||!form.message) return alert('Preenche todos os campos obrigatórios!');
    setSending(true);
    try{
      await addDoc(collection(db,'contacts'),{...form,createdAt:serverTimestamp(),role:'professor'});
      alert('Mensagem enviada com sucesso!');
      setForm({name:'',email:'',subject:'',message:''});
    }catch(e){console.error(e);alert('Erro ao enviar.');}
    setSending(false);
  };

  // Abre o chat já com a matéria carregada no painel lateral de leitura,
  // para o professor poder ler o ficheiro e conversar com a IA ao mesmo tempo
  // (mesmo formato de leitura lateral usado pelo Claude ao abrir um artefacto).
  const handleAskIA = (m: Materia) => navigate('/chat', {
    state: {
      role: 'professor',
      prompt: `Explique detalhadamente: ${m.titulo}`,
      materia: {
        titulo: m.titulo,
        descricao: m.descricao,
        arquivoUrl: m.arquivoUrl,
        tipo: m.tipo,
        autor: m.autor,
      },
    },
  });

  const TABS=[
    {id:'materias', label:'📚 Matérias'},
    {id:'sobre',    label:'ℹ️ Sobre'},
    {id:'contacto', label:'✉️ Contacto'},
  ] as const;

  return (
    <div className="min-h-screen bg-[#050208] text-white relative overflow-x-hidden font-sans">

      {/* BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-50" style={{background:'radial-gradient(circle at 50% 50%,#0b2e1a 0%,#050208 100%)'}}/>
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] animate-pulse" style={{background:'rgba(16,185,129,0.10)'}}/>
        <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full blur-[100px]" style={{background:'rgba(20,184,166,0.06)'}}/>
        <div className="absolute inset-0 opacity-[0.10] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"/>
      </div>
      <Clouds/>

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled?'py-2':'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`flex items-center justify-between gap-2 px-3 sm:px-6 py-3 rounded-2xl border transition-all duration-500 ${scrolled?'bg-black/50 border-white/10 backdrop-blur-xl':'bg-transparent border-transparent'}`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src={avesLogo} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-white/20 shrink-0" alt="Logo"/>
              <span className={`text-base sm:text-2xl font-black tracking-tighter bg-gradient-to-r ${T.grad} bg-clip-text text-transparent whitespace-nowrap`}>
                A.V.E.S <span className="hidden sm:inline text-white/30 text-sm font-medium">PROF</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {user&&(
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 max-w-[140px]">
                  <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{background:T.accent}}/>
                  <span className="truncate">{user.email?.split('@')[0]}</span>
                </div>
              )}
              <button onClick={handleLogout} className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 transition-all shrink-0">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5"/>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 pt-32 sm:pt-40 md:pt-44 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase" style={{background:T.dim,border:`1px solid ${T.border}`,color:T.accent}}>
              <Sparkles className="w-3 h-3"/> Gestão de Saber
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] sm:leading-[0.9] tracking-tight">
              Organize o <br/>
              <span className={`bg-gradient-to-r ${T.grad} bg-clip-text text-transparent`}>Futuro.</span>
            </h1>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Gere conteúdos, envia materiais e usa IA para criar perguntas e transformar o ensino.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
              <button onClick={()=>navigate('/chat',{state:{role:'professor'}})} className="group relative w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-purple-600 rounded-2xl overflow-hidden transition-all hover:scale-105 shadow-[0_20px_50px_rgba(147,51,234,0.3)] font-bold flex items-center justify-center gap-3">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                <div className="relative flex items-center gap-3"><MessageSquare className="w-5 h-5"/> Testar IA</div>
              </button>
              <button onClick={()=>navigate('/vision')} className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl transition-all hover:scale-105 font-bold flex items-center justify-center gap-3" style={{background:T.dim,border:`1px solid ${T.border}`,color:T.accent}}>
                <Eye className="w-5 h-5"/> Visão IA
              </button>
              <button onClick={()=>setIsModalOpen(true)} className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl transition-all hover:scale-105 font-bold flex items-center justify-center gap-3 text-black" style={{background:T.gradCss,boxShadow:`0 20px 50px ${T.glow}`}}>
                <Upload className="w-5 h-5"/> Enviar Matéria
              </button>
            </div>
          </div>
          <div className="relative flex justify-center mt-4 lg:mt-0 w-full max-w-[280px] sm:max-w-[380px] lg:max-w-none mx-auto scale-x-[-1]">
            <AnimatedChickenMascot size="large"/>
            <div className="absolute w-[260px] sm:w-[380px] md:w-[500px] h-[260px] sm:h-[380px] md:h-[500px] rounded-full -z-10 animate-pulse" style={{background:`${T.accent}10`,filter:'blur(120px)'}}/>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="relative z-10 px-4 sm:px-6 mb-8">
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <div className="inline-flex bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1 gap-1 min-w-max">
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                className="px-4 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                style={activeTab===tab.id
                  ?{background:T.accent,color:'#000',boxShadow:`0 4px 12px ${T.glow}`}
                  :{color:'rgba(255,255,255,0.4)'}}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB: MATÉRIAS ── */}
      {activeTab==='materias'&&(
        <section className="relative z-10 px-4 sm:px-6 pb-20 sm:pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-8 sm:mb-10">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" style={{color:T.accent}}/>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">Matérias Geridas</h2>
              </div>
              <span className="text-sm text-white/30 font-medium">{materias.length} publicadas</span>
            </div>
            {materias.length===0?(
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-16 text-center">
                <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4"/>
                <p className="text-white/40 mb-6">Ainda não publicaste nenhum conteúdo.</p>
                <button onClick={()=>setIsModalOpen(true)} className="px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 mx-auto text-black" style={{background:T.gradCss}}>
                  <Upload className="w-4 h-4"/> Enviar primeira matéria
                </button>
              </div>
            ):(
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-8">
                {materias.map(m=>(
                  <div key={m.id} className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all backdrop-blur-xl hover:border-emerald-500/30">
                    <div className="h-px" style={{background:`linear-gradient(90deg,transparent,${T.accent}40,transparent)`}}/>
                    <div className="p-5 sm:p-7">
                      <div className="flex items-start justify-between gap-2 mb-5">
                        <div className="p-3 sm:p-4 rounded-2xl" style={{background:T.dim,border:`1px solid ${T.border}`}}>
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" style={{color:T.accent}}/>
                        </div>
                        <div className="flex items-center gap-2 text-white/30 text-xs shrink-0">
                          <Calendar className="w-3.5 h-3.5"/>{formatDate(m.dataCriacao)}
                        </div>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black mb-3 leading-tight group-hover:text-emerald-400 transition-colors break-words">{m.titulo}</h3>
                      <p className="text-white/50 leading-relaxed text-sm line-clamp-2 mb-4">{m.descricao}</p>
                      <button onClick={()=>setExpandedId(expandedId===m.id?null:m.id)}
                        className="flex items-center gap-1 text-[11px] font-bold mb-4 transition-colors" style={{color:`${T.accent}80`}}>
                        {expandedId===m.id?<><ChevronUp className="w-3.5 h-3.5"/> Menos</>:<><ChevronDown className="w-3.5 h-3.5"/> Ver mais</>}
                      </button>
                      {expandedId===m.id&&(
                        <p className="text-white/40 text-sm leading-relaxed mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">{m.descricao}</p>
                      )}
                      <div className="flex gap-3">
                        <button onClick={()=>setIsModalOpen(true)} className="flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5" style={{background:T.dim,border:`1px solid ${T.border}`,color:T.accent}}>
                          <Brain className="w-3.5 h-3.5"/> Gerar Perguntas
                        </button>
                        <button onClick={()=>handleAskIA(m)} className="py-3 px-4 rounded-xl border transition-all shrink-0" style={{background:T.dim,border:`1px solid ${T.border}`,color:T.accent}} title="Ler matéria e estudar com a IA">
                          <BookOpen className="w-4 h-4"/>
                        </button>
                        <button onClick={()=>handleDelete(m.id,m.titulo)} className="py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white transition-all shrink-0">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── TAB: SOBRE ── */}
      {activeTab==='sobre'&&(
        <section className="relative z-10 px-4 sm:px-6 pb-20 sm:pb-32">
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="rounded-3xl p-6 sm:p-8 md:p-12 border flex flex-col lg:flex-row items-center gap-8 lg:gap-10" style={{background:`linear-gradient(135deg,${T.dim},rgba(20,184,166,0.04))`,borderColor:T.border}}>
              <div className="flex-1 text-center lg:text-left space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase" style={{background:T.dim,border:`1px solid ${T.border}`,color:T.accent}}>
                  <Sparkles className="w-3 h-3"/> Inovação Tecnológica
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
                  Sobre o <span className={`bg-gradient-to-r ${T.grad} bg-clip-text text-transparent`}>A.V.E.S</span>
                </h2>
                <p className="text-white/50 leading-relaxed">
                  Um sistema de inteligência artificial criado para transformar a forma como os professores ensinam e os alunos aprendem — combinando chatbot, visão computacional e personalização adaptativa.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/50">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/> Status: Operacional
                </div>
              </div>
              <div className="relative shrink-0 w-full max-w-[220px] sm:max-w-[260px] lg:max-w-none mx-auto">
                <div className="absolute inset-0 rounded-full blur-[60px]" style={{background:`${T.accent}20`}}/>
                <div className="relative p-6 sm:p-8 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-2xl scale-x-[-1]">
                  <AnimatedChickenMascot size="medium" isGesturing/>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {icon:Target, title:'Missão',    desc:'Tornar a IA acessível para professores — gerando perguntas, organizando matérias e transformando o ensino.'},
                {icon:Rocket, title:'Visão',     desc:'Ser referência em educação aumentada por IA no contexto africano e lusófono.'},
                {icon:Cpu,    title:'Tecnologia',desc:'React, GPT-4o, YOLOv8, Firebase — tecnologia de ponta ao serviço da aprendizagem.'},
              ].map(({icon:Icon,title,desc},i)=>(
                <div key={i} className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 transition-all group">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform" style={{background:T.dim,border:`1px solid ${T.border}`}}>
                    <Icon className="w-5 h-5" style={{color:T.accent}}/>
                  </div>
                  <h3 className="text-lg font-black mb-2">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border" style={{background:`linear-gradient(135deg,${T.dim},transparent)`,borderColor:T.border}}>
              <h3 className="font-black text-xl mb-6 flex items-center gap-3">
                <Users className="w-5 h-5" style={{color:T.accent}}/> Core Team
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {name:'Tudilu Manuel',   role:'Lead Developer', emoji:'🔥'},
                  {name:'Elijah Gomes',    role:'AI Specialist',  emoji:'⚙️'},
                  {name:'Kiami De Almeida',role:'UI Designer',    emoji:'🎨'},
                ].map((m,i)=>(
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-black/30 border border-white/[0.06] hover:border-emerald-500/20 transition-all group min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shrink-0">{m.emoji}</div>
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate">{m.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{color:T.accent}}>{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[{val:'100%',label:'Student Dev'},{val:'V2.0',label:'Build'},{val:'∞',label:'Future'}].map((s,i)=>(
                <div key={i} className="p-3 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center group hover:border-emerald-500/20 transition-all">
                  <p className="text-xl sm:text-2xl md:text-3xl font-black" style={{color:T.accent}}>{s.val}</p>
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/30 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <button onClick={()=>setActiveTab('contacto')} className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] text-black" style={{background:T.gradCss,boxShadow:`0 8px 24px ${T.glow}`}}>
              Entrar em Contacto <ArrowRight className="w-5 h-5"/>
            </button>
          </div>
        </section>
      )}

      {/* ── TAB: CONTACTO ── */}
      {activeTab==='contacto'&&(
        <section className="relative z-10 px-4 sm:px-6 pb-20 sm:pb-32">
          <div className="max-w-5xl mx-auto space-y-8">

            <div className="text-center space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">Entre em <span className={`bg-gradient-to-r ${T.grad} bg-clip-text text-transparent`}>Contacto</span></h2>
              <p className="text-white/40 text-sm sm:text-base">Estamos aqui para ajudar. Resposta em até 24 horas.</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold" style={{background:T.dim,border:`1px solid ${T.border}`,color:T.accent}}>
                <div className="w-1.5 h-1.5 rounded-full animate-ping shrink-0" style={{background:T.accent}}/>
                <span className="whitespace-nowrap">⚡ Resposta em até 24 horas</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[
                  {icon:Mail,  title:'Email',      lines:['contato@aves.ai','suporte@aves.ai']},
                  {icon:Phone, title:'Telefone',    lines:['+244 923 456 789','Seg - Sex: 8h - 18h']},
                  {icon:MapPin,title:'Localização', lines:['Luanda, Angola','Centro Tecnológico']},
                ].map(({icon:Icon,title,lines},i)=>(
                  <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/20 flex items-center gap-4 transition-all group min-w-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{background:T.dim,border:`1px solid ${T.border}`}}>
                      <Icon className="w-5 h-5" style={{color:T.accent}}/>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-1">{title}</p>
                      {lines.map((l,j)=><p key={j} className="text-sm text-white/70 font-medium truncate">{l}</p>)}
                    </div>
                  </div>
                ))}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2"><Globe className="w-3.5 h-3.5"/> Canais Oficiais</p>
                  <div className="flex gap-3">
                    {[Facebook,Twitter,Instagram,Linkedin].map((Icon,i)=>(
                      <button key={i} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:scale-110">
                        <Icon className="w-4 h-4"/>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 md:p-8 rounded-3xl border space-y-4" style={{background:`linear-gradient(135deg,${T.dim},rgba(20,184,166,0.03))`,borderColor:T.border}}>
                <h3 className="text-xl font-black mb-2">Envie a sua <span style={{color:T.accent}}>Mensagem</span></h3>
                {[
                  {id:'name',    placeholder:'Nome completo',        type:'text'},
                  {id:'email',   placeholder:'O teu melhor e-mail', type:'email'},
                  {id:'subject', placeholder:'Assunto',              type:'text'},
                ].map(f=>(
                  <input key={f.id} type={f.type} placeholder={f.placeholder}
                    value={form[f.id as keyof typeof form]}
                    onChange={e=>setForm({...form,[f.id]:e.target.value})}
                    className="w-full p-3.5 rounded-2xl bg-black/30 border border-white/[0.08] focus:outline-none text-white placeholder:text-white/20 transition-all text-sm"/>
                ))}
                <textarea placeholder="Como podemos ajudar?" value={form.message}
                  onChange={e=>setForm({...form,message:e.target.value})}
                  className="w-full p-3.5 h-32 rounded-2xl bg-black/30 border border-white/[0.08] focus:outline-none text-white placeholder:text-white/20 transition-all text-sm resize-none"/>
                <button onClick={handleSendContact} disabled={sending}
                  className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 text-black"
                  style={{background:T.gradCss,boxShadow:`0 4px 20px ${T.glow}`}}>
                  {sending?'A enviar...':<><Send className="w-4 h-4"/> Enviar Mensagem</>}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <TeacherModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)}/>
    </div>
  );
}