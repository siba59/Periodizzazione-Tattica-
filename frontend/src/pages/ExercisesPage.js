import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Target, Repeat, BookOpen, Lightbulb } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_LABELS = {
  possesso: 'Possesso',
  pressing: 'Pressing',
  costruzione: 'Costruzione',
  tattica_generale: 'Tattica Generale',
  tattica_reparto: 'Tattica di Reparto',
  generale: 'Generale'
};

function TacticalDiagram({ type }) {
  const fieldStyle = { fill: '#0a1a0a', stroke: '#D4AF37', strokeWidth: 1.5, strokeOpacity: 0.5 };
  const lineStyle = { stroke: '#D4AF37', strokeWidth: 1, strokeOpacity: 0.4, fill: 'none' };
  const playerStyle = { fill: '#D4AF37', fillOpacity: 0.8 };
  const playerAltStyle = { fill: '#71717A', fillOpacity: 0.6 };

  return (
    <svg viewBox="0 0 300 200" className="w-full h-48 tactical-field rounded-lg">
      {/* Field background */}
      <rect x="10" y="10" width="280" height="180" rx="4" {...fieldStyle} />
      {/* Center line */}
      <line x1="150" y1="10" x2="150" y2="190" {...lineStyle} />
      {/* Center circle */}
      <circle cx="150" cy="100" r="30" {...lineStyle} />
      {/* Penalty areas */}
      <rect x="10" y="50" width="50" height="100" {...lineStyle} />
      <rect x="240" y="50" width="50" height="100" {...lineStyle} />

      {type === 'possession_square' && (
        <g>
          {/* Players in 4v4+2 */}
          <circle cx="80" cy="60" r="6" {...playerStyle}><animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx="120" cy="120" r="6" {...playerStyle} />
          <circle cx="180" cy="70" r="6" {...playerStyle} />
          <circle cx="200" cy="140" r="6" {...playerStyle} />
          <circle cx="100" cy="90" r="6" {...playerAltStyle} />
          <circle cx="160" cy="110" r="6" {...playerAltStyle} />
          <circle cx="140" cy="60" r="6" {...playerAltStyle} />
          <circle cx="190" cy="100" r="6" {...playerAltStyle} />
          {/* Jolly */}
          <circle cx="150" cy="150" r="6" style={{ fill: '#F3E5AB', fillOpacity: 0.7 }} />
          <circle cx="130" cy="40" r="6" style={{ fill: '#F3E5AB', fillOpacity: 0.7 }} />
          {/* Pass lines */}
          <line x1="80" y1="60" x2="120" y2="120" style={{ stroke: '#D4AF37', strokeWidth: 0.8, strokeDasharray: '4,4', opacity: 0.5 }} />
          <line x1="120" y1="120" x2="180" y2="70" style={{ stroke: '#D4AF37', strokeWidth: 0.8, strokeDasharray: '4,4', opacity: 0.5 }} />
        </g>
      )}
      {type === 'half_field' && (
        <g>
          {[60,90,120,150,180,200,70].map((y, i) => (
            <circle key={`a-${i}`} cx={40 + i * 30} cy={y} r={6} {...playerStyle} />
          ))}
          {[80,100,130,160,140,110,90].map((y, i) => (
            <circle key={`b-${i}`} cx={50 + i * 30} cy={y} r={6} {...playerAltStyle} />
          ))}
        </g>
      )}
      {type === 'build_up' && (
        <g>
          <circle cx="50" cy="100" r="6" {...playerStyle} />
          <circle cx="90" cy="60" r="6" {...playerStyle} />
          <circle cx="90" cy="140" r="6" {...playerStyle} />
          <circle cx="130" cy="80" r="6" {...playerStyle} />
          <circle cx="130" cy="120" r="6" {...playerStyle} />
          <circle cx="200" cy="80" r="6" {...playerAltStyle} />
          <circle cx="200" cy="120" r="6" {...playerAltStyle} />
          <circle cx="170" cy="100" r="6" {...playerAltStyle} />
          <line x1="50" y1="100" x2="90" y2="60" style={{ stroke: '#D4AF37', strokeWidth: 0.8, strokeDasharray: '4,4', opacity: 0.5 }} />
          <line x1="90" y1="60" x2="130" y2="80" style={{ stroke: '#D4AF37', strokeWidth: 0.8, strokeDasharray: '4,4', opacity: 0.5 }} />
        </g>
      )}
      {type === 'pressing' && (
        <g>
          {/* Pressing arrows */}
          <circle cx="200" cy="60" r="6" {...playerStyle} />
          <circle cx="220" cy="100" r="6" {...playerStyle} />
          <circle cx="200" cy="140" r="6" {...playerStyle} />
          <circle cx="170" cy="80" r="6" {...playerStyle} />
          <circle cx="170" cy="120" r="6" {...playerStyle} />
          <circle cx="100" cy="80" r="6" {...playerAltStyle} />
          <circle cx="80" cy="120" r="6" {...playerAltStyle} />
          <circle cx="120" cy="100" r="6" {...playerAltStyle} />
          {/* Pressing arrows */}
          <line x1="170" y1="80" x2="130" y2="95" style={{ stroke: '#D4AF37', strokeWidth: 1.5, opacity: 0.7 }} markerEnd="url(#arrowhead)" />
          <line x1="170" y1="120" x2="130" y2="105" style={{ stroke: '#D4AF37', strokeWidth: 1.5, opacity: 0.7 }} markerEnd="url(#arrowhead)" />
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#D4AF37" />
            </marker>
          </defs>
        </g>
      )}
      {type === 'three_zones' && (
        <g>
          <rect x="20" y="40" width="75" height="120" rx="3" style={{ fill: 'rgba(212,175,55,0.05)', stroke: '#D4AF37', strokeWidth: 0.5, strokeDasharray: '3,3' }} />
          <rect x="110" y="30" width="80" height="140" rx="3" style={{ fill: 'rgba(212,175,55,0.08)', stroke: '#D4AF37', strokeWidth: 0.5, strokeDasharray: '3,3' }} />
          <rect x="205" y="20" width="85" height="160" rx="3" style={{ fill: 'rgba(212,175,55,0.12)', stroke: '#D4AF37', strokeWidth: 0.5, strokeDasharray: '3,3' }} />
          <text x="57" y="170" textAnchor="middle" fill="#D4AF37" fontSize="8" fontFamily="JetBrains Mono">10x10</text>
          <text x="150" y="180" textAnchor="middle" fill="#D4AF37" fontSize="8" fontFamily="JetBrains Mono">20x20</text>
          <text x="247" y="190" textAnchor="middle" fill="#D4AF37" fontSize="8" fontFamily="JetBrains Mono">30x30</text>
        </g>
      )}
    </svg>
  );
}

export default function ExercisesPage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const { data } = await axios.get(`${API}/exercises`);
        setExercises(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  const filtered = filter === 'all' ? exercises : exercises.filter(e => e.category === filter);
  const categories = ['all', ...new Set(exercises.map(e => e.category))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="animate-pulse-gold w-12 h-12 rounded-full" style={{ border: '2px solid #D4AF37' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      <nav className="glass-nav sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button data-testid="back-to-dashboard-ex" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm" style={{ color: '#A1A1AA' }}>
            <ArrowLeft size={18} /> Dashboard
          </button>
          <span className="text-sm font-medium" style={{ color: '#D4AF37' }}>Esercitazioni</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Le <span style={{ color: '#D4AF37' }}>Esercitazioni</span>
        </h1>
        <p className="text-sm mb-8" style={{ color: '#71717A' }}>
          Codici di allenamento basati sulla Periodizzazione Tattica
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              data-testid={`filter-${cat}`}
              onClick={() => setFilter(cat)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: filter === cat ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                border: `1px solid ${filter === cat ? 'rgba(212, 175, 55, 0.4)' : '#27272A'}`,
                color: filter === cat ? '#D4AF37' : '#71717A'
              }}
            >
              {cat === 'all' ? 'Tutte' : (CATEGORY_LABELS[cat] || cat)}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((ex, i) => (
            <div
              key={ex.id}
              data-testid={`exercise-card-${ex.id}`}
              onClick={() => setSelected(selected?.id === ex.id ? null : ex)}
              className={`card-dark rounded-xl overflow-hidden cursor-pointer opacity-0 animate-fade-in-up ${selected?.id === ex.id ? 'ring-1' : ''}`}
              style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards', ringColor: '#D4AF37' }}
            >
              <TacticalDiagram type={ex.diagram_type} />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }}>
                    {CATEGORY_LABELS[ex.category] || ex.category}
                  </span>
                </div>
                <h3 className="text-lg font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{ex.title}</h3>
                <p className="text-sm mb-3" style={{ color: '#71717A' }}>{ex.description}</p>

                {selected?.id === ex.id && (
                  <div className="mt-4 pt-4 space-y-4 animate-fade-in" style={{ borderTop: '1px solid #27272A' }}>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={14} style={{ color: '#D4AF37' }} />
                        <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>Obiettivi</span>
                      </div>
                      <ul className="space-y-1">
                        {ex.objectives?.map((obj, j) => (
                          <li key={j} className="text-sm flex items-start gap-2" style={{ color: '#A1A1AA' }}>
                            <span style={{ color: '#D4AF37' }}>&#8226;</span> {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Repeat size={14} style={{ color: '#D4AF37' }} />
                        <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>Varianti</span>
                      </div>
                      <ul className="space-y-1">
                        {ex.variations?.map((v, j) => (
                          <li key={j} className="text-sm flex items-start gap-2" style={{ color: '#A1A1AA' }}>
                            <span style={{ color: '#D4AF37' }}>&#8226;</span> {v}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={14} style={{ color: '#D4AF37' }} />
                        <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>Organizzazione</span>
                      </div>
                      <p className="text-sm" style={{ color: '#A1A1AA' }}>{ex.setup}</p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.04)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={14} style={{ color: '#D4AF37' }} />
                        <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>Collegamento Filosofico</span>
                      </div>
                      <p className="text-sm italic" style={{ color: '#A1A1AA', fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem' }}>
                        {ex.philosophical_link}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
