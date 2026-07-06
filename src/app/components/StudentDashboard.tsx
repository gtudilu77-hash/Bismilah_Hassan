import { AnimatedChickenMascot } from './AnimatedChickenMascot';
import {
  LogOut, Eye, MessageSquare, BookOpen, Sparkles,
  ChevronRight, TrendingUp, Target, AlertCircle, Trophy,
  BarChart2, CheckCircle, XCircle, Brain, ArrowUp, Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import avesLogo from "../../assets/aves.jpeg";
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { StudentMaterialModal } from './StudentMaterialModal';

interface Materia {
  id: string; titulo: string; descricao: string;
  arquivoUrl: string; dataCriacao: any; autor: string; tipo?: string;
}

interface QuizResult {
  topic: string; score: number; total: number;
  date: string; wrong: string[];
}

interface StudentStats {
  totalQuizzes: number; avgScore: number;
  bestTopic: string; weakTopics: string[];
  recentResults: QuizResult[]; streak: number;
}

// ─── Nuvens (tema azul) ────────────────────────────────────────────────────
function Clouds() {
  const clouds = [
    { w: 240, h: 75,  top: '7%',  dur: '42s', delay: '0s',   op: 0.45 },
    { w: 170, h: 55,  top: '25%', dur: '56s', delay: '-20s', op: 0.28 },
    { w: 300, h: 90,  top: '48%', dur: '38s', delay: '-11s', op: 0.22 },
    { w: 200, h: 62,  top: '68%', dur: '32s', delay: '-28s', op: 0.32 },
    { w: 260, h: 80,  top: '88%', dur: '50s', delay: '-16s', op: 0.25 },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {clouds.map((c, i) => (
        <div key={i} style={{ position: 'absolute', top: c.top, left: '-18%', width: c.w, height: c.h, opacity: c.op, animation: `cloudDrift ${c.dur} linear ${c.delay} infinite` }}>
          <svg viewBox="0 0 220 80" fill="rgba(59,130,246,0.25)" style={{ width: '100%', height: '100%', filter: 'blur(4px)' }}>
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

// ─── Mini gráfico de barras ────────────────────────────────────────────────
function MiniBarChart({ results }: { results: QuizResult[] }) {
  const last5 = results.slice(-5);
  return (
    <div className="flex items-end gap-2 h-16">
      {last5.length === 0
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 bg-white/5 rounded-t-lg h-4" />
          ))
        : last5.map((r, i) => {
            const pct = Math.round((r.score / r.total) * 100);
            const h = Math.max(8, Math.round((pct / 100) * 56));
            const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#3b82f6' : '#f87171';
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold" style={{ color }}>{pct}%</span>
                <div className="w-full rounded-t-lg transition-all" style={{ height: h, background: color, opacity: 0.8 }} />
              </div>
            );
          })}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="relative p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-blue-500/30 transition-all group overflow-hidden">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at 0% 0%, ${color}15, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <ArrowUp className="w-3 h-3 text-green-400 opacity-60" />
      </div>
      <div className="text-xl sm:text-2xl lg:text-3xl font-black mb-0.5 truncate" style={{ color }}>{value}</div>
      <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider">{label}</div>
      <div className="text-[10px] text-white/30 mt-1">{sub}</div>
    </div>
  );
}

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<StudentStats>({
    totalQuizzes: 0, avgScore: 0, bestTopic: '—',
    weakTopics: [], recentResults: [], streak: 0,
  });
  const [activeTab, setActiveTab] = useState<'materias' | 'stats'>('materias');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await loadStats(u.uid);
    });
    const q = query(collection(db, "materias"), orderBy("dataCriacao", "desc"));
    const unsubFS = onSnapshot(q, snap => {
      setMaterias(snap.docs.map(d => ({
        id: d.id, titulo: d.data().titulo || "Sem título",
        descricao: d.data().descricao || d.data().description || "Sem descrição.",
        arquivoUrl: d.data().arquivoUrl || "", dataCriacao: d.data().dataCriacao || null,
        autor: d.data().autor || "Professor", tipo: d.data().tipo || d.data().type || ""
      })));
    });
    return () => { unsubAuth(); unsubFS(); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const loadStats = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "studentStats", uid));
      if (snap.exists()) {
        const d = snap.data() as StudentStats;
        // Calcula médias e tópicos fracos
        const results: QuizResult[] = d.recentResults || [];
        const avgScore = results.length > 0
          ? Math.round(results.reduce((a, r) => a + (r.score / r.total) * 100, 0) / results.length)
          : 0;
        const topicScores: Record<string, number[]> = {};
        results.forEach(r => {
          if (!topicScores[r.topic]) topicScores[r.topic] = [];
          topicScores[r.topic].push((r.score / r.total) * 100);
        });
        const topicAvgs = Object.entries(topicScores).map(([t, scores]) => ({
          topic: t, avg: scores.reduce((a, b) => a + b, 0) / scores.length
        }));
        const bestTopic = topicAvgs.sort((a, b) => b.avg - a.avg)[0]?.topic || '—';
        const weakTopics = topicAvgs.filter(t => t.avg < 60).map(t => t.topic);
        setStats({ ...d, avgScore, bestTopic, weakTopics, recentResults: results });
      }
    } catch (e) { console.error(e); }
  };

  // Expõe função global para o ChatInterface registar resultados de quiz
  useEffect(() => {
    (window as any).registerQuizResult = async (result: QuizResult) => {
      const u = auth.currentUser;
      if (!u) return;
      const ref = doc(db, "studentStats", u.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { recentResults: arrayUnion(result), totalQuizzes: (snap.data().totalQuizzes || 0) + 1 });
      } else {
        await setDoc(ref, { totalQuizzes: 1, recentResults: [result], streak: 1 });
      }
      await loadStats(u.uid);
    };
  }, []);

  const handleLogout = async () => { try { await signOut(auth); navigate("/login"); } catch (e) { console.error(e); } };
  const openMateria = (m: Materia) => { setSelectedMateria(m); setIsModalOpen(true); };

  // Abre o chat já com a matéria carregada no painel lateral de leitura,
  // para o aluno poder ler o documento e perguntar à IA ao mesmo tempo
  // (mesmo formato de leitura lateral usado pelo Claude ao abrir um artefacto).
  const handleAskIA = (m: Materia) => navigate("/chat", {
    state: {
      role: "aluno",
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

  // Erros mais frequentes
  const allWrong = stats.recentResults.flatMap(r => r.wrong || []);
  const wrongFreq: Record<string, number> = {};
  allWrong.forEach(w => { wrongFreq[w] = (wrongFreq[w] || 0) + 1; });
  const topErrors = Object.entries(wrongFreq).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#050409] text-white relative overflow-x-hidden font-sans">

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#091526_0%,#040812_70%,#020307_100%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.10] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>
      <Clouds />

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'py-2' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={`flex items-center justify-between gap-2 px-3 sm:px-6 py-3 rounded-2xl border transition-all duration-500 ${scrolled ? 'bg-black/50 border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'bg-white/[0.02] border-white/[0.05] backdrop-blur-md'}`}>
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate('/')}>
              <img src={avesLogo} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-white/20 shrink-0" alt="Logo" />
              <span className="text-base sm:text-2xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent whitespace-nowrap">
                A.V.E.S <span className="hidden sm:inline text-white/30 text-sm font-medium">ALUNO</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/60 backdrop-blur-md max-w-[140px]">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                  <span className="truncate">{user.email?.split('@')[0]}</span>
                </div>
              )}
              <button onClick={handleLogout} className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-red-500/20 transition-all shrink-0">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-32 sm:pt-40 md:pt-44 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3 h-3" /> Nova Era do Estudo
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] sm:leading-[0.9] tracking-tight">
              Aprenda com <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Clareza.</span>
            </h1>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Materiais dos teus professores, IA para estudar e acompanhamento real do teu progresso.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
              <button onClick={() => navigate("/chat", { state: { role: "aluno" } })} className="group relative w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#8b5cf6] rounded-2xl overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(139,92,246,0.4)] font-bold flex items-center justify-center gap-3">
                <div className="absolute inset-0 bg-gradient-to-r from-[#a78bfa] to-[#d946ef] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3"><MessageSquare className="w-5 h-5" /> Testar IA</div>
              </button>
              <button onClick={() => navigate("/vision")} className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-cyan-600/10 border border-cyan-500/20 rounded-2xl transition-all hover:scale-105 font-bold text-cyan-400 flex items-center justify-center gap-3 hover:bg-cyan-600/30 backdrop-blur-md">
                <Eye className="w-5 h-5" /> Visão IA
              </button>
            </div>
          </div>
          <div className="relative flex justify-center mt-4 lg:mt-0 w-full max-w-[280px] sm:max-w-[380px] lg:max-w-none mx-auto">
            <AnimatedChickenMascot size="large" />
            <div className="absolute w-[260px] sm:w-[350px] md:w-[450px] h-[260px] sm:h-[350px] md:h-[450px] rounded-full bg-[#bf5af2]/15 blur-[100px] -z-10 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <div className="relative z-10 px-4 sm:px-6 mb-8 overflow-x-auto">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1">
            {(['materias', 'stats'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-8 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)]' : 'text-white/40 hover:text-white/70'}`}>
                {tab === 'materias' ? '📚 Materiais' : '📊 Progresso'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MATERIAIS ── */}
      {activeTab === 'materias' && (
        <section className="relative z-10 px-4 sm:px-6 pb-20 sm:pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8 sm:mb-10">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
              <h2 className="text-3xl sm:text-4xl font-black">Materiais Disponíveis</h2>
            </div>
            {materias.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-3xl p-10 text-center text-white/50">
                Nenhuma matéria foi enviada ainda.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-8">
                {materias.map(m => (
                  <div key={m.id} className="group relative bg-white/[0.02] border border-white/[0.08] hover:border-blue-500/40 rounded-3xl p-5 sm:p-7 transition-all duration-300 hover:scale-[1.02] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-3xl" />
                    <div className="flex items-start justify-between mb-5">
                      <div className="p-3 sm:p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-blue-400 transition-all" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black mb-3 tracking-tight">{m.titulo}</h3>
                    <p className="text-white/50 leading-relaxed mb-5 line-clamp-3 text-sm">{m.descricao}</p>
                    <div className="flex gap-3">
                      <button onClick={() => openMateria(m)} className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-all font-bold text-sm shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]">
                        Abrir Material
                      </button>
                      <button onClick={() => handleAskIA(m)} className="px-4 py-3.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/40 transition-all" title="Ler e estudar com a IA">
                        <Brain className="w-4 h-4 text-purple-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── PROGRESSO / ESTATÍSTICAS ── */}
      {activeTab === 'stats' && (
        <section className="relative z-10 px-4 sm:px-6 pb-20 sm:pb-32">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-center gap-3">
              <BarChart2 className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
              <h2 className="text-3xl sm:text-4xl font-black">O teu Progresso</h2>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <StatCard icon={Target}     label="Média Geral"    value={`${stats.avgScore}%`}        sub="Todos os quizzes"           color="#3b82f6" />
              <StatCard icon={Trophy}     label="Melhor Tópico"  value={stats.bestTopic === '—' ? '—' : '🏆'} sub={stats.bestTopic}    color="#f59e0b" />
              <StatCard icon={Brain}      label="Quizzes Feitos" value={String(stats.totalQuizzes)}  sub="Total acumulado"            color="#8b5cf6" />
              <StatCard icon={Zap}        label="Streak"         value={`${stats.streak}d`}           sub="Dias consecutivos"         color="#10b981" />
            </div>

            <div className="grid lg:grid-cols-2 gap-5 sm:gap-8">

              {/* Histórico de resultados */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400" /> Últimos Quizzes</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">últimos 5</span>
                </div>
                <MiniBarChart results={stats.recentResults} />
                <div className="mt-4 space-y-3">
                  {stats.recentResults.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-4">Ainda não fizeste nenhum quiz. Faz um no chat!</p>
                  ) : (
                    stats.recentResults.slice(-5).reverse().map((r, i) => {
                      const pct = Math.round((r.score / r.total) * 100);
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${pct >= 80 ? 'bg-green-500/20 text-green-400' : pct >= 60 ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                            {pct}%
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{r.topic || 'Quiz'}</p>
                            <p className="text-[10px] text-white/30">{r.score}/{r.total} corretas · {r.date}</p>
                          </div>
                          {pct >= 80 ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Áreas a melhorar */}
              <div className="space-y-5">
                {/* Erros frequentes */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
                  <h3 className="font-black text-lg flex items-center gap-2 mb-5">
                    <AlertCircle className="w-5 h-5 text-red-400" /> Erros Frequentes
                  </h3>
                  {topErrors.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-4">Nenhum erro registado ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {topErrors.map(([question, count], i) => (
                        <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm text-white/70 leading-relaxed flex-1">{question}</p>
                            <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-2 py-1 rounded-lg shrink-0">{count}×</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" style={{ width: `${Math.min(100, count * 25)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tópicos fracos */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
                  <h3 className="font-black text-lg flex items-center gap-2 mb-5">
                    <Target className="w-5 h-5 text-orange-400" /> O que deves melhorar
                  </h3>
                  {stats.weakTopics.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-4">
                      {stats.totalQuizzes === 0 ? 'Faz um quiz primeiro!' : '🎉 Sem tópicos fracos. Continua assim!'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stats.weakTopics.map((t, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 flex-wrap p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
                          <span className="text-sm text-white/70 min-w-0 break-words">{t}</span>
                          <button onClick={() => navigate("/chat", { state: { role: "aluno", prompt: `Explica-me melhor o tópico: ${t}` } })} className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-all shrink-0">
                            Estudar →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sugestão da IA */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600/10 to-indigo-600/5 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-blue-400">Sugestão da IA</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed mb-4">
                    {stats.avgScore === 0
                      ? 'Começa por fazer um quiz no chat para eu te poder ajudar a identificar os teus pontos fracos.'
                      : stats.avgScore >= 80
                      ? 'Excelente desempenho! Experimenta tópicos mais avançados ou ajuda os colegas.'
                      : stats.weakTopics.length > 0
                      ? `Foca-te em "${stats.weakTopics[0]}" — é onde tens mais dificuldades. O A.V.E.S pode ajudar-te!`
                      : 'Bom progresso! Mantém o ritmo e continua a praticar com quizzes diários.'}
                  </p>
                  <button onClick={() => navigate("/chat", { state: { role: "aluno", prompt: stats.weakTopics.length > 0 ? `Preciso de ajuda com: ${stats.weakTopics[0]}` : "Sugere-me um plano de estudo personalizado." } })}
                    className="w-full py-3 rounded-2xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 text-sm font-bold text-blue-300 transition-all">
                    Pedir ajuda ao A.V.E.S →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <StudentMaterialModal materia={selectedMateria} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAskIA={() => selectedMateria && handleAskIA(selectedMateria)} />
    </div>
  );
}