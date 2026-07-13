import { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection, onSnapshot, query, orderBy, limit,
  doc, getDoc, getDocs, setDoc, serverTimestamp, deleteDoc
} from "firebase/firestore";
import { signOut, getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { useNavigate } from "react-router-dom";
import { AnimatedChickenMascot } from "../components/AnimatedChickenMascot";
import {
  MessageSquare, Users, Activity, Mail, LogOut,
  ChevronRight, Loader2, AlertCircle, X, Clock,
  Search, ArrowLeft, Hash, User, Shield, Eye,
  BarChart2, Inbox, Database, UserPlus, Trash2
} from "lucide-react";

// URL do backend Node — usado (opcionalmente) para apagar de vez a conta
// de autenticação ao remover um utilizador. Ver nota no handleDeleteUser.
const API_URL = 'https://bismilah-hassan-1.onrender.com';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message { id: string; text: string; sender: string; timestamp?: any; }
interface Contact  { id: string; name: string; email: string; subject?: string; message: string; createdAt?: any; }
interface ChatRoom { id: string; title: string; createdAt?: any; userId?: string; msgCount?: number; }
interface ChatMsg  { id: string; text: string; sender: string; timestamp?: any; }
interface UserProfile { id: string; name?: string; email: string; role: string; createdAt?: any; }

type Tab = 'overview' | 'messages' | 'contacts' | 'users';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (ts: any, full = false) => {
  if (!ts) return "—";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return full
      ? d.toLocaleDateString('pt-PT', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return "—"; }
};

const roleColor = (role: string) =>
  role === 'admin'     ? { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', color: '#a855f7' } :
  role === 'miniadmin' ? { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', color: '#f59e0b' } :
  role === 'professor' ? { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', color: '#10b981' } :
  role === 'aluno'     ? { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', color: '#3b82f6' } :
                         { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)' };

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Glowing stat card */
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div style={{ padding: '22px 24px', borderRadius: 24, background: 'rgba(255,255,255,0.025)', border: `1px solid ${color}22`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 24px 0 80px', background: `${color}10` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: `${color}80`, margin: '0 0 10px' }}>{label}</p>
          <p style={{ fontSize: 32, fontWeight: 900, color, margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 14, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

/** Side drawer */
function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.25s ease', backdropFilter: 'blur(4px)' }} />
      {/* Panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 50, background: '#08040f', borderLeft: '1px solid rgba(168,85,247,0.15)', display: 'flex', flexDirection: 'column', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#a855f7' }}>{title}</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} color="rgba(255,255,255,0.4)" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }} className="adm-scroll">{children}</div>
      </div>
    </>
  );
}

/**
 * Modal para criar contas de aluno/professor.
 *
 * Usa uma instância SECUNDÁRIA do Firebase App só para o
 * createUserWithEmailAndPassword. Isto é necessário porque, no SDK
 * client-side, criar uma conta troca automaticamente a sessão activa
 * para a conta recém-criada — o que expulsaria o admin do painel.
 * Ao criar a conta na instância secundária e fazer signOut só dela,
 * a sessão do admin (na instância principal) nunca é tocada.
 */
function generateTempPassword(length = 20) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let pass = '';
  for (let i = 0; i < length; i++) pass += chars[arr[i] % chars.length];
  return pass;
}

function CreateUserModal({ open, onClose, allowMiniAdmin }: { open: boolean; onClose: () => void; allowMiniAdmin: boolean }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'aluno' | 'professor' | 'miniadmin'>('aluno');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ email: string } | null>(null);

  if (!open) return null;

  const roleOptions = allowMiniAdmin
    ? (['aluno', 'professor', 'miniadmin'] as const)
    : (['aluno', 'professor'] as const);

  const roleLabel = (r: string) => r === 'aluno' ? 'Aluno' : r === 'professor' ? 'Professor' : 'Mini-admin';
  const roleActiveColor = (r: string) => r === 'aluno' ? '#3b82f6' : r === 'professor' ? '#10b981' : '#f59e0b';
  const roleActiveBg = (r: string) => r === 'aluno' ? 'rgba(59,130,246,0.18)' : r === 'professor' ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)';
  const roleActiveBorder = (r: string) => r === 'aluno' ? 'rgba(59,130,246,0.4)' : r === 'professor' ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)';

  const resetFields = () => { setName(''); setEmail(''); setRole('aluno'); setError(null); };
  const handleClose = () => { onClose(); resetFields(); setSuccess(null); };

  const friendlyError = (code: string) => {
    if (code.includes('email-already-in-use')) return 'Este email já está registado.';
    if (code.includes('invalid-email'))        return 'Email inválido.';
    return 'Não foi possível criar a conta. Tenta novamente.';
  };

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Preenche o nome e o email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const existing = getApps().find(a => a.name === 'Secondary');
      const secondaryApp = existing || initializeApp(auth.app.options, 'Secondary');
      const secondaryAuth = getAuth(secondaryApp);

      // Password aleatória gerada só para satisfazer o Firebase Auth — ninguém
      // precisa de a saber, porque a pessoa vai definir a sua própria a
      // partir do email que recebe a seguir.
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), generateTempPassword());

      await setDoc(doc(db, 'users', cred.user.uid), {
        name: name.trim(),
        email: email.trim(),
        role,
        createdAt: serverTimestamp(),
      });

      // Envia um email real (via Firebase) com um link para a pessoa definir
      // a própria password — nada de partilhar credenciais manualmente.
      await sendPasswordResetEmail(secondaryAuth, email.trim());

      await signOut(secondaryAuth);

      setSuccess({ email: email.trim() });
      resetFields();
    } catch (err: any) {
      setError(friendlyError(err?.code || ''));
    }
    setLoading(false);
  };

  return (
    <div
      onClick={handleClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 420, maxWidth: '100%', borderRadius: 28, background: '#0c0714', border: '1px solid rgba(168,85,247,0.25)', boxShadow: '0 0 80px rgba(168,85,247,0.15)', padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#a855f7' }}>Novo Utilizador</span>
          <button onClick={handleClose} style={{ width: 28, height: 28, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} color="rgba(255,255,255,0.4)" />
          </button>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 16, borderRadius: 18, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Conta criada!</p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                Foi enviado um email para <span style={{ fontFamily: 'monospace', color: '#fff' }}>{success.email}</span> com um link para a pessoa definir a própria password. Pede-lhe para verificar a caixa de entrada (e o spam).
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSuccess(null)} style={{ flex: 1, padding: '12px', borderRadius: 16, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                Criar outro
              </button>
              <button onClick={handleClose} style={{ flex: 1, padding: '12px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              {roleOptions.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 14, fontSize: 11, fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                    background: role === r ? roleActiveBg(r) : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${role === r ? roleActiveBorder(r) : 'rgba(255,255,255,0.08)'}`,
                    color: role === r ? roleActiveColor(r) : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {roleLabel(r)}
                </button>
              ))}
            </div>

            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo"
              style={{ padding: '13px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, outline: 'none' }} />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
              style={{ padding: '13px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, outline: 'none' }} />

            {error && (
              <p style={{ margin: 0, fontSize: 11, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={12} /> {error}
              </p>
            )}

            <button
              onClick={handleCreate}
              disabled={loading}
              style={{ padding: '14px', borderRadius: 16, background: 'linear-gradient(135deg,#a855f7,#d946ef)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
              {loading ? 'A criar...' : 'Criar Conta'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();

  // Data
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [contacts,  setContacts]  = useState<Contact[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [users,     setUsers]     = useState<UserProfile[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // UI
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [search,    setSearch]    = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);

  // Papel de quem está logado (admin completo vs mini-admin) — determina
  // se pode criar/apagar mini-admins, ou só aluno/professor.
  const [myRole, setMyRole] = useState<string | null>(null);

  // Drawer — user detail
  const [drawerUser,    setDrawerUser]    = useState<UserProfile | null>(null);
  const [userChats,     setUserChats]     = useState<ChatRoom[]>([]);
  const [expandedChat,  setExpandedChat]  = useState<string | null>(null);
  const [chatMessages,  setChatMessages]  = useState<Record<string, ChatMsg[]>>({});
  const [loadingChat,   setLoadingChat]   = useState(false);

  // Drawer — chat room detail
  const [drawerChat,    setDrawerChat]    = useState<ChatRoom | null>(null);
  const [drawerChatMsgs,setDrawerChatMsgs] = useState<ChatMsg[]>([]);
  const [loadingDChat,  setLoadingDChat]  = useState(false);

  // Drawer — contact detail
  const [drawerContact, setDrawerContact] = useState<Contact | null>(null);

  useEffect(() => {
    // users é sempre subscrito — tanto admin como mini-admin precisam de o
    // ver (regra: allow read: if isSignedIn(), cobre os dois).
    const unsubUsers = onSnapshot(
      query(collection(db, "users")),
      snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserProfile[]),
      err => console.error(err)
    );

    // messages / contacts / chats (todas) só são lidos depois de sabermos
    // o role, e só se for admin completo — um mini-admin não tem
    // permissão para estas colecções nas firestore.rules, e tentar lê-las
    // na mesma provocava um permission-denied que travava o dashboard.
    let unsubExtra: (() => void)[] = [];

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      unsubExtra.forEach(fn => fn());
      unsubExtra = [];

      if (!u) { setMyRole(null); setLoading(false); return; }

      let role: string | null = null;
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        role = snap.exists() ? (snap.data().role || null) : null;
      } catch (err) { console.error(err); }
      setMyRole(role);

      if (role === 'admin') {
        const qMsg  = query(collection(db, "messages"), orderBy("timestamp", "desc"), limit(50));
        // ✅ FIX: os formulários de contacto (Contact.tsx / TeacherDashboard.tsx)
        // gravam o campo "createdAt", não "timestamp". Um orderBy num campo que
        // os documentos não têm faz o Firestore devolver a coleção vazia.
        const qCont = query(collection(db, "contacts"), orderBy("createdAt", "desc"), limit(50));
        const qChat = query(collection(db, "chats"),    orderBy("createdAt",  "desc"), limit(100));

        unsubExtra.push(
          onSnapshot(qMsg,  snap => { setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Message[]); setLoading(false); }, err => { setError("Erro: Neural Feed"); setLoading(false); }),
          onSnapshot(qCont, snap => setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Contact[]),        err => console.error(err)),
          onSnapshot(qChat, snap => setChatRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ChatRoom[]),      err => console.error(err)),
        );
      } else {
        // Mini-admin: sem estas 3 colecções, não há "loading" pendente
        setLoading(false);
      }
    });
    return () => { unsubUsers(); unsubAuth(); unsubExtra.forEach(fn => fn()); }
  }, []);

  const handleLogout = async () => { try { await signOut(auth); navigate("/login"); } catch {} };

  // Quem pode apagar quem:
  // - admin completo: qualquer conta, excepto outro admin (protecção contra
  //   lockout acidental) e a própria conta
  // - mini-admin: só aluno/professor, nunca admin nem outro mini-admin
  const canManageRole = (targetRole: string) => {
    if (myRole === 'admin') return targetRole !== 'admin';
    if (myRole === 'miniadmin') return targetRole === 'aluno' || targetRole === 'professor';
    return false;
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (u.id === auth.currentUser?.uid) {
      alert('Não podes apagar a tua própria conta.');
      return;
    }
    if (!canManageRole(u.role)) {
      alert('Sem permissão para apagar esta conta.');
      return;
    }
    if (!window.confirm(`Apagar definitivamente a conta de ${u.email}?`)) return;

    try {
      // Remove sempre o perfil no Firestore — isto já tira a pessoa de
      // todas as listagens e, sem "role", ela perde acesso às áreas
      // restritas da app.
      await deleteDoc(doc(db, "users", u.id));

      // Tenta também apagar a conta de autenticação a sério, através do
      // backend (Firebase Admin SDK) — o SDK do browser não tem permissão
      // para apagar contas de outras pessoas. Se o endpoint ainda não
      // estiver activo no servidor, falha em silêncio e só o perfil fica
      // removido (a pessoa consegue voltar a entrar, mas sem role).
      try {
        await fetch(`${API_URL}/api/delete-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: u.id }),
        });
      } catch (backendErr) {
        console.warn('Backend de eliminação de conta indisponível — só o perfil foi removido.', backendErr);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar utilizador.');
    }
  };

  // Open user drawer — load their chats
  const openUserDrawer = async (u: UserProfile) => {
    setDrawerUser(u);
    const chats = chatRooms.filter(c => c.userId === u.id);
    setUserChats(chats);
  };

  // Expand a chat inside user drawer — load messages
  const toggleChat = async (chatId: string) => {
    if (expandedChat === chatId) { setExpandedChat(null); return; }
    setExpandedChat(chatId);
    if (chatMessages[chatId]) return;
    setLoadingChat(true);
    try {
      const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
      const snap = await getDocs(q);
      setChatMessages(prev => ({ ...prev, [chatId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) as ChatMsg[] }));
    } catch {}
    setLoadingChat(false);
  };

  // Open chat room drawer
  const openChatDrawer = async (chat: ChatRoom) => {
    setDrawerChat(chat);
    setDrawerChatMsgs([]);
    setLoadingDChat(true);
    try {
      const q = query(collection(db, "chats", chat.id, "messages"), orderBy("timestamp", "asc"));
      const snap = await getDocs(q);
      setDrawerChatMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ChatMsg[]);
    } catch {}
    setLoadingDChat(false);
  };

  // Filtered data
  const filteredUsers    = users
    .filter(u => (u.email + (u.name || '') + u.role).toLowerCase().includes(search.toLowerCase()))
    // Mini-admin só gere aluno/professor — não vê contas admin/mini-admin
    .filter(u => myRole === 'admin' || u.role === 'aluno' || u.role === 'professor');
  const filteredContacts = contacts.filter(c => (c.name + c.email + c.message).toLowerCase().includes(search.toLowerCase()));
  const filteredChats    = chatRooms.filter(c => (c.title || '').toLowerCase().includes(search.toLowerCase()));
  const filteredMessages = messages.filter(m => (m.text + m.sender).toLowerCase().includes(search.toLowerCase()));

  const NAV: { id: Tab; icon: any; label: string }[] = myRole === 'miniadmin'
    ? [{ id: 'users', icon: Users, label: 'Utilizadores' }]
    : [
        { id: 'overview',  icon: BarChart2,      label: 'Overview'   },
        { id: 'messages',  icon: MessageSquare,  label: 'Mensagens'  },
        { id: 'contacts',  icon: Inbox,          label: 'Contatos'   },
        { id: 'users',     icon: Users,          label: 'Utilizadores'},
      ];

  // Mini-admin nunca deve ficar preso numa aba a que não tem acesso
  useEffect(() => {
    if (myRole === 'miniadmin' && activeTab !== 'users') setActiveTab('users');
  }, [myRole, activeTab]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050208', color: '#fff', display: 'flex', overflow: 'hidden', fontFamily: "'Sora','DM Sans',sans-serif" }}>

      {/* ── BG ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 70% 50% at 20% 50%, #1a0b2e 0%, #050208 70%)', pointerEvents: 'none' }} />

      {/* ── SIDEBAR ── */}
      <aside style={{ position: 'relative', zIndex: 20, width: 260, height: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'rgba(8,4,16,0.96)', borderRight: '1px solid rgba(168,85,247,0.1)', backdropFilter: 'blur(32px)' }}>

        {/* Mascot */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => navigate("/")}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: 'rgba(168,85,247,0.15)', filter: 'blur(16px)' }} />
            <AnimatedChickenMascot size="small" />
          </div>
          <h1 style={{ marginTop: 12, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontStyle: 'italic' }}>A.V.E.S. Core</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'ping 1.5s infinite' }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.25em' }}>Live</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{ width: '100%', padding: '13px 16px', borderRadius: 18, border: `1px solid ${active ? 'rgba(168,85,247,0.35)' : 'transparent'}`, background: active ? 'rgba(168,85,247,0.1)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.18s ease' }}>
                <Icon size={16} style={{ color: active ? '#a855f7' : 'rgba(255,255,255,0.3)' }} />
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: active ? '#a855f7' : 'rgba(255,255,255,0.35)' }}>{label}</span>
                {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#a855f7' }} />}
              </button>
            );
          })}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 4px' }} />

          <button onClick={handleLogout} style={{ width: '100%', padding: '13px 16px', borderRadius: 18, border: '1px solid rgba(239,68,68,0.12)', background: 'rgba(239,68,68,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <LogOut size={16} style={{ color: 'rgba(239,68,68,0.6)' }} />
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(239,68,68,0.6)' }}>Desconectar</span>
          </button>
        </nav>

        {/* Interceptions counter — só faz sentido para admin completo,
            que tem acesso a mensagens e contactos */}
        {myRole === 'admin' && (
          <div style={{ margin: '0 12px 16px', padding: '18px 20px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(217,70,239,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p style={{ fontSize: 8, fontWeight: 900, color: 'rgba(168,85,247,0.7)', textTransform: 'uppercase', letterSpacing: '0.3em', margin: '0 0 6px' }}>Interceptions</p>
            <p style={{ fontSize: 36, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', margin: 0, color: '#fff' }}>{messages.length + contacts.length}</p>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10, height: '100vh', minWidth: 0, overflowY: 'auto' }} className="adm-scroll">

        {/* Header */}
        <div style={{ padding: '28px 36px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: 'rgba(168,85,247,0.6)', margin: '0 0 4px' }}>{myRole === 'miniadmin' ? 'Mini-Admin Panel' : 'Admin Panel'}</p>
            <h2 style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
              {activeTab === 'overview' ? 'Overview' : activeTab === 'messages' ? 'Mensagens' : activeTab === 'contacts' ? 'Contatos' : 'Utilizadores'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeTab === 'users' && (
              <button
                onClick={() => setShowCreateUser(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 16, background: 'linear-gradient(135deg,#a855f7,#d946ef)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer' }}
              >
                <UserPlus size={13} /> Novo Utilizador
              </button>
            )}
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'rgba(255,255,255,0.7)', width: 160 }} />
            </div>
            {/* Node badge */}
            <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', animation: 'ping 2s infinite' }} />
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>
                {auth.currentUser?.email?.split('@')[0]}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ margin: '16px 36px 0', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#f87171', fontWeight: 700 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div style={{ padding: '24px 36px 36px', flex: 1 }}>

          {/* ══ OVERVIEW ══ */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                <StatCard label="Utilizadores"   value={users.length}     icon={Users}          color="#a855f7" />
                <StatCard label="Conversas"      value={chatRooms.length} icon={MessageSquare}  color="#3b82f6" />
                <StatCard label="Mensagens Live" value={messages.length}  icon={Activity}       color="#10b981" />
                <StatCard label="Contatos"       value={contacts.length}  icon={Mail}           color="#f59e0b" />
              </div>

              {/* Recent chats + recent contacts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Recent chats */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 28, overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Hash size={14} style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#3b82f6' }}>Conversas Recentes</span>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }} className="adm-scroll">
                    {chatRooms.slice(0, 8).map(chat => (
                      <div key={chat.id} onClick={() => openChatDrawer(chat)} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.06)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <div>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title || 'Sem título'}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{fmt(chat.createdAt, true)}</p>
                        </div>
                        <ChevronRight size={13} style={{ color: 'rgba(59,130,246,0.5)' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent contacts */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 28, overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Inbox size={14} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#f59e0b' }}>Leads Recentes</span>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }} className="adm-scroll">
                    {contacts.slice(0, 8).map(c => (
                      <div key={c.id} onClick={() => setDrawerContact(c)} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.06)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#f59e0b' }}>{c.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{c.name}</p>
                            <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{c.email}</p>
                          </div>
                        </div>
                        <ChevronRight size={13} style={{ color: 'rgba(245,158,11,0.5)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MENSAGENS ══ */}
          {activeTab === 'messages' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 'calc(100vh - 160px)' }}>

              {/* Neural feed (live messages) */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 28, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <Activity size={14} style={{ color: '#a855f7' }} />
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#a855f7' }}>Neural Feed Live</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{filteredMessages.length} entradas</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} className="adm-scroll">
                  {loading ? <Loader2 size={20} style={{ margin: 'auto', color: '#a855f7', animation: 'spin 1s linear infinite' }} /> :
                   filteredMessages.length === 0 ? <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 40 }}>Sem entradas</p> :
                   filteredMessages.map(msg => (
                    <div key={msg.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{msg.sender}</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{fmt(msg.timestamp)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat rooms */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 28, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <Hash size={14} style={{ color: '#3b82f6' }} />
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#3b82f6' }}>Salas de Chat</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{filteredChats.length} salas</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }} className="adm-scroll">
                  {filteredChats.map(chat => (
                    <div key={chat.id} onClick={() => openChatDrawer(chat)} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.06)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title || 'Sem título'}</p>
                        <p style={{ margin: '3px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{fmt(chat.createdAt, true)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Eye size={12} style={{ color: 'rgba(59,130,246,0.5)' }} />
                        <ChevronRight size={13} style={{ color: 'rgba(59,130,246,0.5)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ CONTACTS ══ */}
          {activeTab === 'contacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredContacts.length === 0 && (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 60 }}>Nenhum contacto encontrado</p>
              )}
              {filteredContacts.map(c => (
                <div key={c.id} onClick={() => setDrawerContact(c)} style={{ padding: '18px 22px', borderRadius: 22, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(245,158,11,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.05)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.25)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.1)'; }}>
                  <div style={{ width: 44, height: 44, borderRadius: 16, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#f59e0b', flexShrink: 0 }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.email}</span>
                      {c.subject && <span style={{ fontSize: 9, color: 'rgba(245,158,11,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>· {c.subject}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{fmt(c.createdAt, true)}</span>
                    <ChevronRight size={14} style={{ color: 'rgba(245,158,11,0.4)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ USERS ══ */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 32px 40px', gap: 12, padding: '0 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Utilizador', 'Role', 'Desde', '', ''].map((h, i) => (
                  <span key={`${h}-${i}`} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.2)' }}>{h}</span>
                ))}
              </div>
              {filteredUsers.map((u, i) => {
                const rc = roleColor(u.role);
                return (
                  <div key={u.id} onClick={() => openUserDrawer(u)} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 32px 40px', gap: 12, alignItems: 'center', padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.15s ease', animation: `msgIn 0.3s ease ${i * 0.04}s both` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.2)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 13, background: rc.bg, border: `1px solid ${rc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: rc.color, flexShrink: 0 }}>
                        {(u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        {u.name && <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>}
                        <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color, width: 'fit-content' }}>{u.role}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{fmt(u.createdAt, true) === '—' ? '—' : fmt(u.createdAt, true).split(',')[0]}</span>
                    {canManageRole(u.role) && u.id !== auth.currentUser?.uid ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(u); }}
                        title="Apagar utilizador"
                        style={{ width: 26, height: 26, borderRadius: 9, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', justifySelf: 'end' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : <span />}
                    <ChevronRight size={14} style={{ color: 'rgba(168,85,247,0.4)', justifySelf: 'end' }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ══ DRAWER — User Detail ══ */}
      <Drawer open={!!drawerUser} onClose={() => { setDrawerUser(null); setExpandedChat(null); }} title="Perfil do Utilizador">
        {drawerUser && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* User header */}
            <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 18, background: roleColor(drawerUser.role).bg, border: `1px solid ${roleColor(drawerUser.role).border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: roleColor(drawerUser.role).color }}>
                {drawerUser.email.charAt(0).toUpperCase()}
              </div>
              <div>
                {drawerUser.name && <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#fff' }}>{drawerUser.name}</p>}
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{drawerUser.email}</p>
                <span style={{ display: 'inline-flex', marginTop: 6, padding: '3px 10px', borderRadius: 8, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', background: roleColor(drawerUser.role).bg, border: `1px solid ${roleColor(drawerUser.role).border}`, color: roleColor(drawerUser.role).color }}>{drawerUser.role}</span>
              </div>
            </div>

            {/* IDs */}
            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ margin: '0 0 4px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)' }}>ID do Sistema</p>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{drawerUser.id}</p>
            </div>

            {/* Chats */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(168,85,247,0.7)', margin: '0 0 12px' }}>
                Histórico de Conversas ({userChats.length})
              </p>
              {userChats.length === 0 ? (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: 20 }}>Sem conversas registadas</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {userChats.map(chat => (
                    <div key={chat.id} style={{ borderRadius: 16, border: `1px solid ${expandedChat === chat.id ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`, overflow: 'hidden', background: expandedChat === chat.id ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease' }}>
                      <button onClick={() => toggleChat(chat.id)} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <Hash size={12} style={{ color: 'rgba(168,85,247,0.6)', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title || 'Conversa'}</span>
                        </div>
                        <ChevronRight size={13} style={{ color: 'rgba(168,85,247,0.4)', transform: expandedChat === chat.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                      </button>

                      {expandedChat === chat.id && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {loadingChat ? (
                            <Loader2 size={16} style={{ margin: 'auto', color: '#a855f7', animation: 'spin 1s linear infinite' }} />
                          ) : (chatMessages[chat.id] || []).length === 0 ? (
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>Sem mensagens</p>
                          ) : (chatMessages[chat.id] || []).map(m => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                              <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: m.sender === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: m.sender === 'user' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${m.sender === 'user' ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                                <p style={{ margin: '0 0 3px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: m.sender === 'user' ? '#a855f7' : 'rgba(255,255,255,0.3)' }}>{m.sender === 'user' ? 'Utilizador' : 'A.V.E.S'}</p>
                                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{m.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ══ DRAWER — Chat Detail ══ */}
      <Drawer open={!!drawerChat} onClose={() => setDrawerChat(null)} title="Histórico da Conversa">
        {drawerChat && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(59,130,246,0.7)' }}>Conversa</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>{drawerChat.title || 'Sem título'}</p>
              <p style={{ margin: '4px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{fmt(drawerChat.createdAt, true)}</p>
            </div>

            {loadingDChat ? (
              <Loader2 size={20} style={{ margin: '40px auto', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
            ) : drawerChatMsgs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 40 }}>Sem mensagens nesta conversa</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {drawerChatMsgs.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '88%' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: m.sender === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.3)', textAlign: m.sender === 'user' ? 'right' : 'left', paddingLeft: 4, paddingRight: 4 }}>
                        {m.sender === 'user' ? 'Utilizador' : 'A.V.E.S'} · {fmt(m.timestamp)}
                      </p>
                      <div style={{ padding: '10px 14px', borderRadius: m.sender === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: m.sender === 'user' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.sender === 'user' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{m.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ══ DRAWER — Contact Detail ══ */}
      <Drawer open={!!drawerContact} onClose={() => setDrawerContact(null)} title="Detalhe do Contacto">
        {drawerContact && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 18, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>
                {drawerContact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#fff' }}>{drawerContact.name}</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{drawerContact.email}</p>
                <p style={{ margin: '3px 0 0', fontSize: 9, color: 'rgba(245,158,11,0.6)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{fmt(drawerContact.createdAt, true)}</p>
              </div>
            </div>

            {drawerContact.subject && (
              <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: '0 0 4px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(245,158,11,0.6)' }}>Assunto</p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{drawerContact.subject}</p>
              </div>
            )}

            <div style={{ padding: '18px 20px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(245,158,11,0.6)' }}>Mensagem</p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontStyle: 'italic' }}>"{drawerContact.message}"</p>
            </div>

            <a href={`mailto:${drawerContact.email}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 16, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', textDecoration: 'none', transition: 'all 0.15s' }}>
              <Mail size={14} /> Responder por Email
            </a>
          </div>
        )}
      </Drawer>

      {/* ══ MODAL — Criar Utilizador ══ */}
      <CreateUserModal open={showCreateUser} onClose={() => setShowCreateUser(false)} allowMiniAdmin={myRole === 'admin'} />

      <style>{`
        @keyframes ping    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes msgIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .adm-scroll::-webkit-scrollbar       { width:3px }
        .adm-scroll::-webkit-scrollbar-track { background:transparent }
        .adm-scroll::-webkit-scrollbar-thumb { background:rgba(168,85,247,0.25);border-radius:99px }
      `}</style>
    </div>
  );
}