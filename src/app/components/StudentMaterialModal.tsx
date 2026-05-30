import { X, Download, MessageSquare, FileText, Calendar } from 'lucide-react';

interface Materia {
  id: string;
  titulo: string;
  descricao: string;
  arquivoUrl: string;
  dataCriacao: any;
  autor: string;
}

interface StudentModalProps {
  materia: Materia | null;
  isOpen: boolean;
  onClose: () => void;
  onAskIA: (titulo: string) => void;
}

export function StudentMaterialModal({ materia, isOpen, onClose, onAskIA }: StudentModalProps) {
  if (!isOpen || !materia) return null;

  // Função para formatar a data de criação com segurança e evitar crash em milissegundos live
  const formatarData = (timestamp: any) => {
    if (!timestamp) return "A carregar...";
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('pt-PT');
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-PT');
    }
    return new Date().toLocaleDateString('pt-PT');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/80">
      <div className="bg-[#0d0617] w-full max-w-2xl rounded-3xl border border-blue-500/30 overflow-hidden shadow-[0_0_80px_rgba(37,99,235,0.2)] text-white animate-in fade-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="relative h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center px-8 border-b border-white/10">
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-white/50" />
            </button>
          </div>
          <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30 shadow-lg">
            <FileText className="text-blue-400 w-8 h-8" />
          </div>
          <div className="ml-6">
             <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Material de Estudo</span>
             <h2 className="text-2xl font-black text-white leading-tight">{materia.titulo}</h2>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/30">Descrição do Conteúdo</h3>
            <p className="text-purple-100/70 leading-relaxed">
              {materia.descricao || "Este material foi preparado para auxiliar nos seus estudos. Explore os conceitos e utilize a IA para aprofundar seu conhecimento."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-white/30 mb-1">
                <Calendar className="w-3 h-3" /> <span className="text-[10px] font-bold uppercase">Postado em</span>
              </div>
              <p className="text-sm font-medium">{formatarData(materia.dataCriacao)}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-white/30 mb-1">
                <FileText className="w-3 h-3" /> <span className="text-[10px] font-bold uppercase">Autor</span>
              </div>
              <p className="text-sm font-medium">{materia.autor || "Sistema A.V.E.S"}</p>
            </div>
          </div>

          {/* AÇÕES NO FUNDO */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={() => onAskIA(materia.titulo)}
              className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/20 group text-white"
            >
              <MessageSquare className="w-5 h-5 group-hover:animate-bounce" /> Estudar com IA
            </button>
            
            <a 
              href={materia.arquivoUrl}
              download={`${materia.titulo.replace(/\s+/g, '_')}_material`}
              className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-white text-center"
            >
              <Download className="w-5 h-5 text-blue-400" /> Baixar Material
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}