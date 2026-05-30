import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatedChickenMascot } from './AnimatedChickenMascot';
import {
  Send, ArrowLeft, Mic, Paperclip, Image as ImageIcon, Video,
  Volume2, VolumeX, CheckCircle2, BookOpen, Brain, ListChecks,
  ChevronRight, ChevronLeft, X, RotateCcw, Trophy, Sparkles,
  GraduationCap, Clock, Star
} from 'lucide-react';
import { db, auth } from "../../firebase";
import {
  collection, addDoc, serverTimestamp, doc,
  setDoc, query, orderBy, onSnapshot, limit
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string; text: string; sender: 'user' | 'ai'; timestamp: any;
  file?: string; fileType?: 'image' | 'video' | 'file' | 'audio';
}
interface ChatHistory { id: string; title: string; }
interface ChatInterfaceProps {
  onBack: () => void; isTeacher?: boolean; role?: 'professor' | 'aluno' | 'normal';
}
interface Flashcard { front: string; back: string; mastered: boolean; }
interface QuizQuestion { question: string; options: string[]; correct: number; }
interface Topic { title: string; subtopics: string[]; color: string; }
type SidePanelMode = 'none' | 'flashcards' | 'quiz' | 'organizer';

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {
  professor: {
    radial: 'radial-gradient(ellipse 90% 55% at 50% 0%, #0b2e1a 0%, #050208 65%)',
    accent: '#10b981', accentB: '#14b8a6',
    accentDim: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.12)',
    borderHover: 'rgba(16,185,129,0.3)',
    userMsg: 'linear-gradient(135deg,#059669,#0d9488)',
    aiMsg: 'rgba(10,31,22,0.85)',
    sidebarBg: 'rgba(3,10,6,0.96)',
    panelBg: 'rgba(2,8,4,0.98)',
    btnGrad: 'linear-gradient(135deg,#059669,#0d9488)',
    btnGlow: '0 6px 24px rgba(16,185,129,0.28)',
    mascoteTheme: 'emerald' as const,
    cloudColor: 'rgba(16,185,129,0.055)',
  },
  aluno: {
    radial: 'radial-gradient(ellipse 90% 55% at 50% 0%, #0b1a2e 0%, #050208 65%)',
    accent: '#3b82f6', accentB: '#6366f1',
    accentDim: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.12)',
    borderHover: 'rgba(59,130,246,0.3)',
    userMsg: 'linear-gradient(135deg,#2563eb,#4f46e5)',
    aiMsg: 'rgba(10,22,47,0.85)',
    sidebarBg: 'rgba(3,6,15,0.96)',
    panelBg: 'rgba(2,4,12,0.98)',
    btnGrad: 'linear-gradient(135deg,#2563eb,#4f46e5)',
    btnGlow: '0 6px 24px rgba(59,130,246,0.28)',
    mascoteTheme: 'blue' as const,
    cloudColor: 'rgba(59,130,246,0.055)',
  },
  normal: {
    radial: 'radial-gradient(ellipse 90% 55% at 50% 0%, #1a0b2e 0%, #050208 65%)',
    accent: '#8b5cf6', accentB: '#d946ef',
    accentDim: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.12)',
    borderHover: 'rgba(139,92,246,0.3)',
    userMsg: 'linear-gradient(135deg,#7c3aed,#c026d3)',
    aiMsg: 'rgba(19,9,36,0.85)',
    sidebarBg: 'rgba(6,2,12,0.96)',
    panelBg: 'rgba(4,1,10,0.98)',
    btnGrad: 'linear-gradient(135deg,#7c3aed,#c026d3)',
    btnGlow: '0 6px 24px rgba(139,92,246,0.28)',
    mascoteTheme: 'purple' as const,
    cloudColor: 'rgba(139,92,246,0.055)',
  },
};

// ─── CSS-only clouds ──────────────────────────────────────────────────────────
function Clouds({ color }: { color: string }) {
  const clouds = [
    { w: 200, h: 65,  top: '6%',  dur: '30s', delay: '0s',   op: 0.9 },
    { w: 260, h: 80,  top: '20%', dur: '42s', delay: '-14s', op: 0.6 },
    { w: 140, h: 48,  top: '36%', dur: '24s', delay: '-7s',  op: 0.5 },
    { w: 220, h: 70,  top: '54%', dur: '36s', delay: '-20s', op: 0.65 },
    { w: 170, h: 55,  top: '70%', dur: '28s', delay: '-9s',  op: 0.45 },
    { w: 240, h: 75,  top: '85%', dur: '38s', delay: '-25s', op: 0.5 },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {clouds.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', top: c.top, left: '-15%',
          width: c.w, height: c.h, opacity: c.op,
          animation: `cloudDrift ${c.dur} linear ${c.delay} infinite`,
        }}>
          <svg viewBox="0 0 220 80" fill={color} style={{ width: '100%', height: '100%', filter: 'blur(3px)' }}>
            <ellipse cx="110" cy="58" rx="100" ry="24" />
            <ellipse cx="75"  cy="44" rx="52"  ry="30" />
            <ellipse cx="145" cy="46" rx="46"  ry="26" />
            <ellipse cx="110" cy="34" rx="38"  ry="24" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ─── Flashcard Panel ──────────────────────────────────────────────────────────
function FlashcardPanel({ t, onGenerate, cards, isLoading }: { t: any; onGenerate: () => void; cards: Flashcard[]; isLoading: boolean }) {
  const [idx, setIdx]   = useState(0);
  const [flip, setFlip] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  const card     = cards[idx];
  const progress = cards.length > 0 ? (mastered.size / cards.length) * 100 : 0;
  const go = (d: number) => { setFlip(false); setTimeout(() => setIdx(i => (i + d + cards.length) % cards.length), 180); };
  const toggleMaster = () => setMastered(s => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}66`, margin: 0 }}>Flashcards</p>
          {cards.length > 0 && <p style={{ fontSize: 11, color: t.accent, margin: '2px 0 0', fontWeight: 700 }}>{idx + 1}<span style={{ opacity: 0.4 }}>/{cards.length}</span></p>}
        </div>
        <button onClick={onGenerate} disabled={isLoading} className="tool-btn" style={{ '--ac': t.accent, '--acd': t.accentDim, '--acb': t.border } as any}>
          <Sparkles size={9} /> {isLoading ? 'Gerando...' : 'Gerar'}
        </button>
      </div>

      {cards.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.accentDim, border: `1px solid ${t.border}` }}>
            <BookOpen size={26} style={{ color: `${t.accent}60` }} />
          </div>
          <p style={{ color: `${t.accent}50`, fontSize: 11, maxWidth: 160, lineHeight: 1.6, margin: 0 }}>Gera flashcards automaticamente da conversa</p>
        </div>
      ) : (
        <>
          <div style={{ height: 2, borderRadius: 99, background: `${t.accent}18`, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${progress}%`, background: `linear-gradient(90deg,${t.accent},${t.accentB})`, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1000 }}>
            <div onClick={() => setFlip(f => !f)} style={{ width: '100%', height: 180, cursor: 'pointer', transformStyle: 'preserve-3d', position: 'relative', transform: flip ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, backfaceVisibility: 'hidden', background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, backdropFilter: 'blur(16px)' }}>
                <div style={{ width: 24, height: 1, background: `linear-gradient(90deg,transparent,${t.accent},transparent)` }} />
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>{card.front}</p>
                <p style={{ fontSize: 9, color: `${t.accent}40`, textTransform: 'uppercase', letterSpacing: '0.3em', margin: 0 }}>toca para revelar</p>
              </div>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: `linear-gradient(135deg,${t.accentDim},rgba(0,0,0,0.3))`, border: `1px solid ${t.borderHover}` }}>
                <Star size={14} style={{ color: t.accent }} />
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>{card.back}</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => go(-1)} style={{ width: 40, height: 40, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} color="rgba(255,255,255,0.35)" /></button>
            <button onClick={toggleMaster} style={{ flex: 1, height: 40, borderRadius: 14, border: `1px solid ${mastered.has(idx) ? t.borderHover : 'rgba(255,255,255,0.07)'}`, background: mastered.has(idx) ? t.accentDim : 'rgba(255,255,255,0.03)', cursor: 'pointer', color: mastered.has(idx) ? t.accent : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Trophy size={11} /> {mastered.has(idx) ? 'Dominado' : 'Marcar'}
            </button>
            <button onClick={() => go(1)} style={{ width: 40, height: 40, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} color="rgba(255,255,255,0.35)" /></button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Quiz Panel ───────────────────────────────────────────────────────────────
function QuizPanel({ t, onGenerate, questions, isLoading }: { t: any; onGenerate: () => void; questions: QuizQuestion[]; isLoading: boolean }) {
  const [idx, setIdx]     = useState(0);
  const [sel, setSel]     = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone]   = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const reset = () => { setIdx(0); setSel(null); setScore(0); setDone(false); setAnswers([]); };
  const confirm = () => {
    if (sel === null) return;
    const newAns = [...answers, sel];
    setAnswers(newAns);
    if (sel === questions[idx].correct) setScore(s => s + 1);
    if (idx + 1 >= questions.length) setDone(true);
    else setTimeout(() => { setSel(null); setIdx(i => i + 1); }, 600);
  };
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const q = questions[idx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}66`, margin: 0 }}>Quiz</p>
          {!done && questions.length > 0 && <p style={{ fontSize: 11, color: t.accent, margin: '2px 0 0', fontWeight: 700 }}>{idx + 1}<span style={{ opacity: 0.4 }}>/{questions.length}</span></p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {done && <button onClick={reset} className="tool-btn" style={{ '--ac': t.accent, '--acd': t.accentDim, '--acb': t.border } as any}><RotateCcw size={9} /> Repetir</button>}
          <button onClick={onGenerate} disabled={isLoading} className="tool-btn" style={{ '--ac': t.accent, '--acd': t.accentDim, '--acb': t.border } as any}><Sparkles size={9} /> {isLoading ? 'Gerando...' : 'Gerar'}</button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.accentDim, border: `1px solid ${t.border}` }}><Brain size={26} style={{ color: `${t.accent}60` }} /></div>
          <p style={{ color: `${t.accent}50`, fontSize: 11, maxWidth: 160, lineHeight: 1.6, margin: 0 }}>Gera um quiz inteligente da conversa</p>
        </div>
      ) : done ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            <svg width="96" height="96" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="48" cy="48" r="40" fill="none" stroke={t.accent} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                style={{ filter: `drop-shadow(0 0 6px ${t.accent})`, transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: t.accent }}>{pct}%</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{score}/{questions.length}</span>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{pct === 100 ? '🏆 Perfeito!' : pct >= 70 ? '✅ Bom!' : '📚 Continua!'}</p>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }} className="custom-scroll">
            {questions.map((q, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 14, background: answers[i] === q.correct ? `${t.accent}0a` : 'rgba(239,68,68,0.06)', border: `1px solid ${answers[i] === q.correct ? `${t.accent}20` : 'rgba(239,68,68,0.15)'}` }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: answers[i] === q.correct ? t.accent : '#f87171' }}>{answers[i] === q.correct ? '✓' : '✗'}</span>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{ height: 2, borderRadius: 99, background: `${t.accent}18`, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(idx / questions.length) * 100}%`, background: `linear-gradient(90deg,${t.accent},${t.accentB})`, transition: 'width 0.4s ease', borderRadius: 99 }} />
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}` }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>{q.question}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            {q.options.map((opt, i) => {
              const isSelected = sel === i;
              const showOk  = sel !== null && i === q.correct;
              const showBad = isSelected && i !== q.correct;
              return (
                <button key={i} onClick={() => sel === null && setSel(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 16, cursor: 'pointer', textAlign: 'left', background: showOk ? `${t.accent}14` : showBad ? 'rgba(239,68,68,0.1)' : isSelected ? t.accentDim : 'rgba(255,255,255,0.025)', border: `1px solid ${showOk ? t.accent : showBad ? '#ef4444' : isSelected ? t.borderHover : 'rgba(255,255,255,0.07)'}`, color: showOk ? t.accent : showBad ? '#f87171' : 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 500, transition: 'all 0.2s ease' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, background: isSelected || showOk ? `${t.accent}20` : 'rgba(255,255,255,0.05)', color: isSelected || showOk ? t.accent : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{['A','B','C','D'][i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>
          <button onClick={confirm} disabled={sel === null} style={{ padding: 12, borderRadius: 18, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: sel !== null ? 'pointer' : 'not-allowed', background: sel !== null ? `linear-gradient(135deg,${t.accent},${t.accentB})` : 'rgba(255,255,255,0.04)', color: sel !== null ? '#000' : 'rgba(255,255,255,0.2)', border: 'none', boxShadow: sel !== null ? t.btnGlow : 'none', transition: 'all 0.2s ease' }}>
            Confirmar →
          </button>
        </>
      )}
    </div>
  );
}

// ─── Organizer Panel ──────────────────────────────────────────────────────────
function OrganizerPanel({ t, onGenerate, topics, isLoading }: { t: any; onGenerate: () => void; topics: Topic[]; isLoading: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}66`, margin: 0 }}>Matéria</p>
          {topics.length > 0 && <p style={{ fontSize: 11, color: t.accent, margin: '2px 0 0', fontWeight: 700 }}>{topics.length} tópicos</p>}
        </div>
        <button onClick={onGenerate} disabled={isLoading} className="tool-btn" style={{ '--ac': t.accent, '--acd': t.accentDim, '--acb': t.border } as any}><Sparkles size={9} /> {isLoading ? 'Organizando...' : 'Organizar'}</button>
      </div>
      {topics.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.accentDim, border: `1px solid ${t.border}` }}><ListChecks size={26} style={{ color: `${t.accent}60` }} /></div>
          <p style={{ color: `${t.accent}50`, fontSize: 11, maxWidth: 160, lineHeight: 1.6, margin: 0 }}>Organiza a matéria em tópicos e subtópicos</p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} className="custom-scroll">
          {topics.map((topic, i) => (
            <div key={i} style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${expanded === i ? topic.color + '44' : 'rgba(255,255,255,0.06)'}`, background: expanded === i ? `${topic.color}06` : 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease' }}>
              <button onClick={() => setExpanded(expanded === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: topic.color, boxShadow: `0 0 6px ${topic.color}60`, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{topic.title}</span>
                </div>
                <ChevronRight size={12} color="rgba(255,255,255,0.2)" style={{ transform: expanded === i ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
              </button>
              {expanded === i && (
                <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topic.subtopics.map((sub, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: topic.color, marginTop: 5, flexShrink: 0 }} />
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>{sub}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ChatInterface({ onBack, isTeacher = false, role }: ChatInterfaceProps) {
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [inputValue,    setInputValue]    = useState('');
  const [isTyping,      setIsTyping]      = useState(false);
  const [isRecording,   setIsRecording]   = useState(false);
  const [voiceEnabled,  setVoiceEnabled]  = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [preview,       setPreview]       = useState<{ file: File; url: string; type: 'image' | 'video' | 'file' } | null>(null);
  const [sidePanel,     setSidePanel]     = useState<SidePanelMode>('none');
  const [flashcards,    setFlashcards]    = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [topics,        setTopics]        = useState<Topic[]>([]);
  const [toolLoading,   setToolLoading]   = useState<SidePanelMode>('none');

  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const fileRef          = useRef<HTMLInputElement>(null);
  const imageRef         = useRef<HTMLInputElement>(null);
  const videoRef         = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks      = useRef<Blob[]>([]);
  const globalAudioRef   = useRef<HTMLAudioElement>(new Audio());

  const location       = useLocation();
  const navigationRole = location.state?.role;
  const currentRole    = (role || navigationRole || (isTeacher ? 'professor' : 'normal')) as keyof typeof THEMES;
  const t              = THEMES[currentRole] ?? THEMES.normal;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("createdAt", "desc"), limit(15));
    return onSnapshot(q, snap => setChatHistories(snap.docs.map(d => ({ id: d.id, title: d.data().title || "Protocolo Ativo" }))));
  }, []);

  useEffect(() => {
    if (!currentChatId) {
      setMessages([{ id: 'init', text: "A.V.E.S Neural Link Online. Aguardando sincronização de dados...", sender: 'ai', timestamp: new Date() }]);
      return;
    }
    const q = query(collection(db, "chats", currentChatId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() || new Date() })) as Message[]));
  }, [currentChatId]);

  const unlockAudio = () => {
    if (audioUnlocked) return;
    const a = globalAudioRef.current;
    a.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    a.play().then(() => setAudioUnlocked(true)).catch(() => {});
  };

  const speak = async (text: string) => {
    if (!voiceEnabled) return;
    try {
      const res = await fetch("http://localhost:3001/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      globalAudioRef.current.src = URL.createObjectURL(await res.blob());
      await globalAudioRef.current.play();
    } catch {}
  };

  const handleSelectFile = (file: File | null) => {
    if (!file) return;
    const type: 'image' | 'video' | 'file' = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
    setPreview({ file, url: URL.createObjectURL(file), type });
  };

  const toggleRecording = async () => {
    unlockAudio();
    if (isRecording) { mediaRecorderRef.current?.stop(); mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop()); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder; audioChunks.current = [];
      recorder.ondataavailable = e => audioChunks.current.push(e.data);
      recorder.onstop = async () => {
        const fd = new FormData(); fd.append("audio", new Blob(audioChunks.current, { type: recorder.mimeType }), "voice.webm");
        const data = await (await fetch("http://localhost:3001/api/transcribe", { method: "POST", body: fd })).json();
        if (data.text) setInputValue(v => v ? v + " " + data.text : data.text);
      };
      recorder.start(); setIsRecording(true);
    } catch { alert("Microfone inacessível!"); }
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !preview) return;
    unlockAudio();
    const user = auth.currentUser; if (!user) return;
    const textToSend = inputValue || `Anexo: ${preview?.file.name}`;
    const cp = preview;
    setInputValue(''); setPreview(null); setIsTyping(true);
    try {
      let chatId = currentChatId;
      if (!chatId) {
        const ref = doc(collection(db, "chats"));
        await setDoc(ref, { title: textToSend.slice(0, 30), createdAt: serverTimestamp(), userId: user.uid });
        chatId = ref.id; setCurrentChatId(chatId);
      }
      let reply = "";
      if (cp) {
        const fd = new FormData();
        let ep = "analyze-file";
        if (cp.type === "image") { fd.append("image", cp.file); ep = "analyze-image"; }
        else if (cp.type === "video") { fd.append("video", cp.file); ep = "analyze-video"; }
        else fd.append("file", cp.file);
        await addDoc(collection(db, "chats", chatId, "messages"), { text: cp.file.name, sender: 'user', file: cp.url, fileType: cp.type, timestamp: serverTimestamp() });
        reply = ((await (await fetch(`http://localhost:3001/api/${ep}`, { method: "POST", body: fd })).json()).result) || '';
      } else {
        await addDoc(collection(db, "chats", chatId, "messages"), { text: textToSend, sender: 'user', timestamp: serverTimestamp() });
        reply = (await (await fetch("http://localhost:3001/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: textToSend, userId: user.uid }) })).json()).reply;
      }
      await addDoc(collection(db, "chats", chatId, "messages"), { text: reply, sender: 'ai', timestamp: serverTimestamp() });
      speak(reply);
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  const getCtx = () => messages.slice(-8).map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');

  const callAI = async (prompt: string) => {
    const res = await fetch("http://localhost:3001/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: prompt, userId: auth.currentUser?.uid }) });
    return JSON.parse((await res.json()).reply.replace(/```json|```/g, '').trim());
  };

  const generateFlashcards = async () => {
    setToolLoading('flashcards');
    try { setFlashcards((await callAI(`Gera 6 flashcards JSON: [{"front":"...","back":"..."}]. Conversa: ${getCtx()}. Só JSON.`)).map((f: any) => ({ ...f, mastered: false }))); } catch {}
    setToolLoading('none');
  };
  const generateQuiz = async () => {
    setToolLoading('quiz');
    try { setQuizQuestions(await callAI(`Cria 5 perguntas JSON: [{"question":"...","options":["A","B","C","D"],"correct":0}]. Conversa: ${getCtx()}. Só JSON.`)); } catch {}
    setToolLoading('none');
  };
  const generateOrganizer = async () => {
    setToolLoading('organizer');
    const colors = [t.accent, '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];
    try { setTopics((await callAI(`Organiza em tópicos JSON: [{"title":"...","subtopics":["..."]}]. Máx 5. Conversa: ${getCtx()}. Só JSON.`)).map((tp: any, i: number) => ({ ...tp, color: colors[i % colors.length] }))); } catch {}
    setToolLoading('none');
  };

  const togglePanel = (mode: SidePanelMode) => setSidePanel(p => p === mode ? 'none' : mode);

  const TOOLS = [
    { id: 'flashcards' as SidePanelMode, icon: BookOpen,   label: 'Cards' },
    { id: 'quiz'       as SidePanelMode, icon: Brain,      label: 'Quiz' },
    { id: 'organizer'  as SidePanelMode, icon: ListChecks, label: 'Matéria' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050208', color: '#fff', display: 'flex', overflow: 'hidden', position: 'relative', fontFamily: "'Sora','DM Sans',sans-serif" }}>

      {/* BG */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: t.radial, pointerEvents: 'none' }} />
      <Clouds color={t.cloudColor} />

      {/* ── SIDEBAR ── */}
      <aside style={{ position: 'relative', zIndex: 20, width: 272, height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, background: t.sidebarBg, borderRight: `1px solid ${t.border}`, backdropFilter: 'blur(32px)' }}>

        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${t.border}` }}>
          <button onClick={onBack} className="back-btn" style={{ '--ac': t.accent } as any}>
            <ArrowLeft size={13} /> Voltar
          </button>
          <button onClick={() => setCurrentChatId(null)} style={{ width: '100%', padding: '14px 0', borderRadius: 18, background: t.btnGrad, boxShadow: t.btnGlow, border: 'none', color: '#000', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', marginTop: 16 }}>
            + New Protocol
          </button>
        </div>

        {/* ── MASCOTE ORIGINAL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 20px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ padding: 16, borderRadius: 28, background: t.accentDim, border: `1px solid ${t.border}`, boxShadow: `0 0 40px ${t.accent}10` }}>
            <AnimatedChickenMascot
              size="medium"
              isGesturing={isTyping}
              theme={t.mascoteTheme}
            />
          </div>
          <p style={{ marginTop: 12, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', color: `${t.accent}50` }}>A.V.E.S Neural Link</p>
          <div style={{ width: 48, height: 1, marginTop: 6, background: `linear-gradient(90deg,transparent,${t.accent}50,transparent)`, animation: 'linePulse 2.5s ease-in-out infinite' }} />
        </div>

        {/* Study tools */}
        <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${t.border}` }}>
          <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}35`, margin: '0 0 10px 4px' }}>Estudo</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {TOOLS.map(({ id, icon: Icon, label }) => {
              const active = sidePanel === id;
              return (
                <button key={id} onClick={() => togglePanel(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '11px 6px', borderRadius: 18, cursor: 'pointer', background: active ? `linear-gradient(135deg,${t.accent}18,${t.accentB}0a)` : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? t.borderHover : 'rgba(255,255,255,0.06)'}`, boxShadow: active ? `0 0 18px ${t.accent}18` : 'none', transition: 'all 0.2s ease' }}>
                  <Icon size={15} style={{ color: active ? t.accent : 'rgba(255,255,255,0.2)' }} />
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: active ? t.accent : 'rgba(255,255,255,0.2)' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scroll">
          <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}35`, margin: '0 0 10px 4px' }}>Histórico</p>
          {chatHistories.map(chat => {
            const active = currentChatId === chat.id;
            return (
              <div key={chat.id} onClick={() => setCurrentChatId(chat.id)} style={{ padding: '9px 12px', borderRadius: 16, cursor: 'pointer', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, background: active ? `${t.accent}12` : 'transparent', border: `1px solid ${active ? t.borderHover : 'transparent'}`, transition: 'all 0.15s ease' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: active ? t.accent : 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.28)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</p>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── STUDY PANEL ── */}
      <div style={{ position: 'relative', zIndex: 20, height: '100vh', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: sidePanel !== 'none' ? 300 : 0, opacity: sidePanel !== 'none' ? 1 : 0, transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease', background: t.panelBg, borderRight: `1px solid ${t.border}` }}>
        {sidePanel !== 'none' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: t.accent }}>
                {sidePanel === 'flashcards' ? 'Flashcards' : sidePanel === 'quiz' ? 'Quiz' : 'Matéria'}
              </span>
              <button onClick={() => setSidePanel('none')} style={{ width: 28, height: 28, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} color="rgba(255,255,255,0.3)" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scroll">
              {sidePanel === 'flashcards' && <FlashcardPanel t={t} cards={flashcards}     onGenerate={generateFlashcards} isLoading={toolLoading === 'flashcards'} />}
              {sidePanel === 'quiz'       && <QuizPanel      t={t} questions={quizQuestions} onGenerate={generateQuiz}       isLoading={toolLoading === 'quiz'} />}
              {sidePanel === 'organizer'  && <OrganizerPanel t={t} topics={topics}          onGenerate={generateOrganizer}  isLoading={toolLoading === 'organizer'} />}
            </div>
          </>
        )}
      </div>

      {/* ── MAIN CHAT ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10, height: '100vh', minWidth: 0 }}>

        {messages.length <= 1 && (
          <div style={{ padding: '28px 32px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[{ icon: GraduationCap, label: 'Explicar um conceito' }, { icon: ListChecks, label: 'Resumir a matéria' }, { icon: Brain, label: 'Fazer um quiz rápido' }, { icon: Clock, label: 'Plano de estudo' }].map(({ icon: Icon, label }) => (
              <button key={label} onClick={() => setInputValue(label)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, color: 'rgba(255,255,255,0.35)', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}>
                <Icon size={12} style={{ color: t.accent }} />{label}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }} className="custom-scroll">
          {messages.map((msg, i) => (
            <div key={msg.id || i} className="msg-enter" style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '68%' }}>
                <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: 6, paddingLeft: 4, paddingRight: 4, textAlign: msg.sender === 'user' ? 'right' : 'left', color: msg.sender === 'user' ? 'rgba(255,255,255,0.2)' : `${t.accent}60` }}>
                  {msg.sender === 'user' ? 'Operador' : 'A.V.E.S'}
                </p>
                <div style={{ padding: '16px 22px', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', background: msg.sender === 'user' ? t.userMsg : t.aiMsg, borderRadius: msg.sender === 'user' ? '22px 4px 22px 22px' : '4px 22px 22px 22px', border: `1px solid ${msg.sender === 'user' ? 'rgba(255,255,255,0.1)' : t.border}`, backdropFilter: 'blur(16px)', color: 'rgba(255,255,255,0.88)' }}>
                  {msg.text}
                  {msg.file && (
                    <div style={{ marginTop: 14, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {msg.fileType === 'image' && <img src={msg.file} style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }} />}
                      {msg.fileType === 'video' && <video src={msg.file} controls style={{ width: '100%', maxHeight: 280 }} />}
                    </div>
                  )}
                </div>
                {msg.sender === 'ai' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, paddingLeft: 4, alignItems: 'center' }}>
                    <CheckCircle2 size={8} style={{ color: t.accent }} />
                    <span style={{ fontSize: 8, color: `${t.accent}40`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Sincronizado</span>
                    <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
                    <button onClick={() => { togglePanel('flashcards'); generateFlashcards(); }} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${t.accent}60`, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, padding: 0 }}><BookOpen size={8} /> Cards</button>
                    <button onClick={() => { togglePanel('quiz'); generateQuiz(); }} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${t.accent}60`, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, padding: 0 }}><Brain size={8} /> Quiz</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 18px', borderRadius: '4px 20px 20px 20px', background: t.aiMsg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent, animation: `typingBounce 0.9s ease-in-out ${d}s infinite` }} />
                  ))}
                </div>
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: `${t.accent}60` }}>A processar</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT ── */}
        <div style={{ padding: '0 24px 24px' }}>
          {preview && (
            <div style={{ marginBottom: 10, padding: '10px 16px', borderRadius: 18, background: t.accentDim, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 640, margin: '0 auto 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {preview.type === 'image' ? <img src={preview.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Paperclip size={15} style={{ color: t.accent }} />}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: t.accent }}>Neural Ready</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.file.name}</p>
                </div>
              </div>
              <button onClick={() => setPreview(null)} style={{ fontSize: 9, fontWeight: 900, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -1, borderRadius: 28, background: `linear-gradient(135deg,${t.accent}25,${t.accentB}15)`, filter: 'blur(6px)', pointerEvents: 'none', animation: 'glowPulse 3s ease-in-out infinite' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 8px 8px 16px', borderRadius: 28, background: 'rgba(6,4,12,0.9)', border: `1px solid ${t.border}`, backdropFilter: 'blur(32px)' }}>
              <div style={{ display: 'flex', gap: 2, paddingRight: 8, borderRight: `1px solid ${t.border}` }}>
                {([{ ref: fileRef, Icon: Paperclip }, { ref: imageRef, Icon: ImageIcon }, { ref: videoRef, Icon: Video }] as const).map(({ ref, Icon }, i) => (
                  <button key={i} onClick={() => (ref as any).current?.click()} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                    <Icon size={16} />
                  </button>
                ))}
              </div>
              <button onClick={toggleRecording} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: isRecording ? 'rgba(239,68,68,0.15)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isRecording ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
                <Mic size={16} />
              </button>
              <button onClick={() => { unlockAudio(); setVoiceEnabled(!voiceEnabled); }} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: voiceEnabled ? t.accentDim : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: voiceEnabled ? t.accent : 'rgba(255,255,255,0.2)' }}>
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Transmitir diretiva..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'rgba(255,255,255,0.85)', padding: '0 8px', caretColor: t.accent }} />
              <button onClick={handleSend} disabled={isTyping} style={{ width: 40, height: 40, borderRadius: 20, background: t.btnGrad, boxShadow: t.btnGlow, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={16} color="#000" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <input type="file" ref={fileRef}  hidden onChange={e => handleSelectFile(e.target.files?.[0] || null)} />
      <input type="file" ref={imageRef} hidden accept="image/*" onChange={e => handleSelectFile(e.target.files?.[0] || null)} />
      <input type="file" ref={videoRef} hidden accept="video/*" onChange={e => handleSelectFile(e.target.files?.[0] || null)} />

      <style>{`
        @keyframes cloudDrift    { from{transform:translateX(0)} to{transform:translateX(115vw)} }
        @keyframes typingBounce  { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-5px);opacity:1} }
        @keyframes glowPulse     { 0%,100%{opacity:0.5} 50%{opacity:0.9} }
        @keyframes linePulse     { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes msgIn         { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .msg-enter               { animation: msgIn 0.32s ease forwards }
        .custom-scroll::-webkit-scrollbar       { width:3px }
        .custom-scroll::-webkit-scrollbar-track { background:transparent }
        .custom-scroll::-webkit-scrollbar-thumb { background:${t.accent}28; border-radius:99px }
        .tool-btn  { display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:12px;cursor:pointer;border:1px solid var(--acb);background:var(--acd);color:var(--ac);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em }
        .tool-btn:disabled { opacity:0.5;cursor:not-allowed }
        .back-btn  { display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:var(--ac);opacity:0.5;transition:opacity 0.15s }
        .back-btn:hover { opacity:0.85 }
      `}</style>
    </div>
  );
}