import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { BookOpen, MessageCircle, Dumbbell, BarChart3, LogOut, ChevronRight, Sparkles, Settings } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modRes, progRes] = await Promise.all([
          axios.get(`${API}/modules`, { withCredentials: true }),
          axios.get(`${API}/progress/summary`, { withCredentials: true }).catch(() => ({ data: null }))
        ]);
        setModules(modRes.data);
        setProgressData(progRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getModuleProgress = (moduleId) => {
    if (!progressData?.modules) return 0;
    const mp = progressData.modules.find(m => m.module_id === moduleId);
    return mp ? mp.percentage : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="animate-pulse-gold w-12 h-12 rounded-full" style={{ border: '2px solid #D4AF37' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 p-6 flex flex-col" style={{ background: '#0A0A0A', borderRight: '1px solid #1A1A1A' }}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>PT</span>
          </div>
          <span className="text-sm font-medium" style={{ color: '#EAEAEA' }}>Accademia PT</span>
        </div>

        <nav className="flex-1 space-y-1">
          <button data-testid="nav-modules" onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors" style={{ background: 'rgba(212, 175, 55, 0.08)', color: '#D4AF37' }}>
            <BookOpen size={18} /> Moduli
          </button>
          <button data-testid="nav-exercises" onClick={() => navigate('/exercises')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: '#A1A1AA' }}>
            <Dumbbell size={18} /> Esercitazioni
          </button>
          <button data-testid="nav-ai-chat" onClick={() => navigate('/ai-chat')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: '#A1A1AA' }}>
            <MessageCircle size={18} /> Assistente AI
          </button>
          <button data-testid="nav-progress" onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: '#A1A1AA' }}>
            <BarChart3 size={18} /> Progressi
          </button>
          {user?.role === 'admin' && (
            <button data-testid="nav-admin" onClick={() => navigate('/admin')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: '#A1A1AA' }}>
              <Settings size={18} /> Admin
            </button>
          )}
        </nav>

        <div className="pt-6" style={{ borderTop: '1px solid #1A1A1A' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm" style={{ color: '#EAEAEA' }}>{user?.name}</p>
              <p className="text-xs" style={{ color: '#71717A' }}>{user?.role === 'admin' ? 'Istruttore' : 'Allievo'}</p>
            </div>
          </div>
          <button data-testid="logout-btn" onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: '#71717A' }}>
            <LogOut size={16} /> Esci
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Benvenuto, <span style={{ color: '#D4AF37' }}>{user?.name}</span>
          </h1>
          <p className="text-sm" style={{ color: '#71717A' }}>Il tuo percorso di trasformazione continua.</p>
        </div>

        {/* Overall Progress */}
        {progressData && (
          <div data-testid="progress-overview" className="card-dark rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium" style={{ color: '#A1A1AA' }}>Progresso Generale</h3>
              <span className="mono text-2xl font-light" style={{ color: '#D4AF37' }}>{progressData.overall_percentage}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressData.overall_percentage}%` }} />
            </div>
            <p className="text-xs mt-2" style={{ color: '#71717A' }}>
              {progressData.completed_lessons} di {progressData.total_lessons} lezioni completate
            </p>
          </div>
        )}

        {/* Modules Grid */}
        <h2 className="text-xl font-light mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#EAEAEA' }}>
          I Moduli del Percorso
        </h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {modules.map((mod, i) => {
            const progress = getModuleProgress(mod.id);
            return (
              <div
                key={mod.id}
                data-testid={`module-card-${mod.id}`}
                onClick={() => navigate(`/modules/${mod.id}`)}
                className="card-dark rounded-xl p-6 cursor-pointer group opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="mono text-xs" style={{ color: '#D4AF37' }}>
                    MODULO {String(mod.order).padStart(2, '0')}
                  </span>
                  <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" style={{ color: '#71717A' }} />
                </div>
                <h3 className="text-xl font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{mod.title}</h3>
                <p className="text-sm mb-4" style={{ color: '#71717A' }}>{mod.subtitle}</p>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs mt-2 mono" style={{ color: '#71717A' }}>{progress}% completato</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <div
            data-testid="quick-ai-chat"
            onClick={() => navigate('/ai-chat')}
            className="card-dark rounded-xl p-6 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                <MessageCircle size={22} style={{ color: '#D4AF37' }} />
              </div>
              <div>
                <h3 className="text-base font-medium" style={{ color: '#EAEAEA' }}>Chiedi al Maestro</h3>
                <p className="text-sm" style={{ color: '#71717A' }}>L'assistente AI della Periodizzazione Tattica</p>
              </div>
            </div>
          </div>
          <div
            data-testid="quick-exercise-gen"
            onClick={() => navigate('/ai-chat?tab=generate')}
            className="card-dark rounded-xl p-6 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                <Sparkles size={22} style={{ color: '#D4AF37' }} />
              </div>
              <div>
                <h3 className="text-base font-medium" style={{ color: '#EAEAEA' }}>Genera Esercitazioni</h3>
                <p className="text-sm" style={{ color: '#71717A' }}>Crea esercizi basati sui principi PT con l'AI</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
