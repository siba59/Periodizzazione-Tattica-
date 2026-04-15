import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ModulePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [mod, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modRes, lessRes, progRes] = await Promise.all([
          axios.get(`${API}/modules/${moduleId}`, { withCredentials: true }),
          axios.get(`${API}/modules/${moduleId}/lessons`, { withCredentials: true }),
          axios.get(`${API}/progress`, { withCredentials: true }).catch(() => ({ data: [] }))
        ]);
        setModule(modRes.data);
        setLessons(lessRes.data);
        setProgress(progRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [moduleId]);

  const isCompleted = (lessonId) => progress.some(p => p.lesson_id === lessonId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="animate-pulse-gold w-12 h-12 rounded-full" style={{ border: '2px solid #D4AF37' }} />
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <p style={{ color: '#71717A' }}>Modulo non trovato</p>
      </div>
    );
  }

  const completedCount = lessons.filter(l => isCompleted(l.id)).length;

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Top bar */}
      <nav className="glass-nav sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button data-testid="back-to-dashboard" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: '#A1A1AA' }}>
            <ArrowLeft size={18} /> Dashboard
          </button>
          <span className="mono text-xs" style={{ color: '#D4AF37' }}>
            MODULO {String(mod.order).padStart(2, '0')}
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Module Header */}
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-light mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {mod.title}
          </h1>
          <p className="text-lg font-light mb-6" style={{ color: '#D4AF37', fontFamily: "'Cormorant Garamond', serif" }}>
            {mod.subtitle}
          </p>
          <p className="leading-relaxed mb-6" style={{ color: '#A1A1AA' }}>{mod.description}</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: '#71717A' }} />
              <span className="text-xs" style={{ color: '#71717A' }}>{lessons.length} lezioni</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} style={{ color: '#D4AF37' }} />
              <span className="text-xs" style={{ color: '#71717A' }}>{completedCount}/{lessons.length} completate</span>
            </div>
          </div>
          <div className="progress-track mt-4">
            <div className="progress-fill" style={{ width: `${lessons.length > 0 ? (completedCount / lessons.length * 100) : 0}%` }} />
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          {lessons.map((lesson, i) => {
            const completed = isCompleted(lesson.id);
            return (
              <div
                key={lesson.id}
                data-testid={`lesson-card-${lesson.id}`}
                onClick={() => navigate(`/lessons/${lesson.id}`)}
                className="card-dark rounded-xl p-6 cursor-pointer group flex items-center justify-between opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center gap-5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mono text-sm"
                    style={{
                      background: completed ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${completed ? 'rgba(212, 175, 55, 0.4)' : '#27272A'}`,
                      color: completed ? '#D4AF37' : '#71717A'
                    }}
                  >
                    {completed ? <CheckCircle2 size={18} /> : String(lesson.order).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-base font-medium mb-1" style={{ color: '#EAEAEA' }}>{lesson.title}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: '#71717A' }}>
                        <Clock size={12} className="inline mr-1" />{lesson.duration_minutes} min
                      </span>
                      {completed && <span className="text-xs" style={{ color: '#D4AF37' }}>Completata</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" style={{ color: '#71717A' }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
