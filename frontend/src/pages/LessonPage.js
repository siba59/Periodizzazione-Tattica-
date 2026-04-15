import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const lesRes = await axios.get(`${API}/lessons/${lessonId}`, { withCredentials: true });
        setLesson(lesRes.data);
        // Fetch module lessons for navigation
        const modLessons = await axios.get(`${API}/modules/${lesRes.data.module_id}/lessons`, { withCredentials: true });
        setAllLessons(modLessons.data);
        // Check progress
        const progRes = await axios.get(`${API}/progress`, { withCredentials: true }).catch(() => ({ data: [] }));
        setCompleted(progRes.data.some(p => p.lesson_id === lessonId));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lessonId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await axios.post(`${API}/progress/${lessonId}/complete`, {}, { withCredentials: true });
      setCompleted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const renderVideo = () => {
    if (!lesson?.video_url || lesson.video_type === 'none') return null;
    if (lesson.video_type === 'youtube' || lesson.video_url.includes('youtube') || lesson.video_url.includes('youtu.be')) {
      let videoId = '';
      if (lesson.video_url.includes('youtu.be/')) videoId = lesson.video_url.split('youtu.be/')[1]?.split('?')[0];
      else if (lesson.video_url.includes('v=')) videoId = lesson.video_url.split('v=')[1]?.split('&')[0];
      else videoId = lesson.video_url;
      return (
        <div className="relative rounded-xl overflow-hidden mb-8" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={lesson.title}
          />
        </div>
      );
    }
    if (lesson.video_type === 'vimeo' || lesson.video_url.includes('vimeo')) {
      const vimeoId = lesson.video_url.split('/').pop();
      return (
        <div className="relative rounded-xl overflow-hidden mb-8" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://player.vimeo.com/video/${vimeoId}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={lesson.title}
          />
        </div>
      );
    }
    return (
      <video controls className="w-full rounded-xl mb-8" style={{ border: '1px solid #27272A' }}>
        <source src={lesson.video_url} />
      </video>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="animate-pulse-gold w-12 h-12 rounded-full" style={{ border: '2px solid #D4AF37' }} />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <p style={{ color: '#71717A' }}>Lezione non trovata</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Top bar */}
      <nav className="glass-nav sticky top-0 z-50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button data-testid="back-to-module" onClick={() => navigate(`/modules/${lesson.module_id}`)} className="flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: '#A1A1AA' }}>
            <ArrowLeft size={18} /> Torna al Modulo
          </button>
          <div className="flex items-center gap-2">
            {completed && (
              <span className="flex items-center gap-1 text-xs" style={{ color: '#D4AF37' }}>
                <CheckCircle2 size={14} /> Completata
              </span>
            )}
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12 animate-fade-in-up">
        {/* Lesson Header */}
        <div className="mb-8">
          <span className="mono text-xs" style={{ color: '#D4AF37' }}>
            LEZIONE {String(lesson.order).padStart(2, '0')}
          </span>
        </div>

        {/* Video */}
        {renderVideo()}

        {/* Content */}
        <div data-testid="lesson-content" className="lesson-content">
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </div>

        {/* Complete Button */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid #1A1A1A' }}>
          {!completed ? (
            <button
              data-testid="complete-lesson-btn"
              onClick={handleComplete}
              disabled={completing}
              className="btn-gold flex items-center gap-2 mx-auto"
            >
              {completing ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <CheckCircle2 size={18} /> Segna come Completata
                </>
              )}
            </button>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <CheckCircle2 size={16} style={{ color: '#D4AF37' }} />
                <span className="text-sm" style={{ color: '#D4AF37' }}>Lezione Completata</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-8" style={{ borderTop: '1px solid #1A1A1A' }}>
          {prevLesson ? (
            <button
              data-testid="prev-lesson-btn"
              onClick={() => navigate(`/lessons/${prevLesson.id}`)}
              className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
              style={{ color: '#A1A1AA' }}
            >
              <ArrowLeft size={16} />
              <span className="hidden md:inline">{prevLesson.title}</span>
              <span className="md:hidden">Precedente</span>
            </button>
          ) : <div />}
          {nextLesson ? (
            <button
              data-testid="next-lesson-btn"
              onClick={() => navigate(`/lessons/${nextLesson.id}`)}
              className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
              style={{ color: '#D4AF37' }}
            >
              <span className="hidden md:inline">{nextLesson.title}</span>
              <span className="md:hidden">Successiva</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              data-testid="back-to-module-btn"
              onClick={() => navigate(`/modules/${lesson.module_id}`)}
              className="flex items-center gap-2 text-sm"
              style={{ color: '#D4AF37' }}
            >
              Torna al Modulo <ArrowRight size={16} />
            </button>
          )}
        </div>
      </article>
    </div>
  );
}
