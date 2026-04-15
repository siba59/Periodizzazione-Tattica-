import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, BookOpen, Brain, Zap, Users, Sparkles, ChevronRight } from 'lucide-react';

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/79b1bef3-9937-45cc-8e8f-538170a59c92/images/65e59157b75f0b98600d20732d39a355806fd702b030dc5f4af25209286f2d54.png";
const STADIUM_IMG = "https://static.prod-images.emergentagent.com/jobs/79b1bef3-9937-45cc-8e8f-538170a59c92/images/38998ff1a2f52cde95d3e627a185c5bb155473db477614069e71b3157495a4e8.png";

const modules = [
  { num: "01", title: "Le Connessioni", desc: "Sistemi complessi e liberta di pensiero", icon: <Brain size={20} /> },
  { num: "02", title: "La Metodologia PT", desc: "Il Tutto come sistema frattale", icon: <Sparkles size={20} /> },
  { num: "03", title: "L'Armonia Musicale", desc: "L'errore come connessione", icon: <Zap size={20} /> },
  { num: "04", title: "Il Caos Organizzato", desc: "Le esercitazioni come opera d'arte", icon: <BookOpen size={20} /> },
  { num: "05", title: "L'Architetto e il Giardiniere", desc: "Il linguaggio adattivo", icon: <Users size={20} /> },
  { num: "06", title: "I Principi Trasformabili", desc: "L'adattamento al contesto", icon: <ArrowRight size={20} /> },
  { num: "07", title: "La Metamorfosi", desc: "Trasformazione dell'allenatore", icon: <Sparkles size={20} /> },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ background: '#050505' }}>
      {/* Navigation */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <span className="text-sm font-semibold" style={{ color: '#D4AF37' }}>PT</span>
            </div>
            <span className="text-sm font-medium" style={{ color: '#EAEAEA' }}>Periodizzazione Tattica</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <button data-testid="nav-dashboard-btn" onClick={() => navigate('/dashboard')} className="btn-gold text-sm py-2 px-5">
                Dashboard
              </button>
            ) : (
              <>
                <button data-testid="nav-login-btn" onClick={() => navigate('/auth')} className="text-sm transition-colors hover:opacity-80" style={{ color: '#A1A1AA' }}>
                  Accedi
                </button>
                <button data-testid="nav-register-btn" onClick={() => navigate('/auth')} className="btn-gold text-sm py-2 px-5">
                  Inizia il Percorso
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section data-testid="hero-section" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative z-10 text-center max-w-4xl px-6 animate-fade-in-up">
          <p className="text-xs tracking-[0.3em] uppercase mb-6" style={{ color: '#D4AF37' }}>
            Accademia Allenatori
          </p>
          <h1 className="text-5xl md:text-7xl font-light leading-tight mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#EAEAEA' }}>
            Periodizzazione Tattica<br />
            <span className="text-gold-gradient">&amp; Calcio Relazionale</span>
          </h1>
          <p className="text-lg md:text-xl font-light leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: '#A1A1AA' }}>
            Un percorso dove gli ostacoli non sono da aggirare ma sono quiz da risolvere.
            Dove il morfociclo e ritmo, gioia, costruzione. Dove il pallone e la tua anima.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button data-testid="hero-start-btn" onClick={() => navigate('/auth')} className="btn-gold flex items-center gap-2 text-base">
              Inizia il Viaggio <ArrowRight size={18} />
            </button>
            <button data-testid="hero-explore-btn" onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })} className="btn-gold-outline text-base">
              Esplora i Moduli
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight size={20} className="rotate-90" style={{ color: '#71717A' }} />
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: '#D4AF37' }}>La Filosofia</p>
            <h2 className="text-4xl font-light mb-6 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Chi capisce solo di calcio,<br />
              <span style={{ color: '#D4AF37' }}>non capisce niente di calcio</span>
            </h2>
            <p className="leading-relaxed mb-4" style={{ color: '#A1A1AA', fontSize: '1.05rem' }}>
              La Periodizzazione Tattica non e una metodologia di allenamento. E una visione del mondo
              dove tecnica, tattica, mentale e condizionale sono tutt'uno con la sessione di allenamento.
            </p>
            <p className="leading-relaxed" style={{ color: '#A1A1AA', fontSize: '1.05rem' }}>
              Il modello di gioco e uno stile di vita, non un'imposizione tattica assoluta.
              I principi sono pensieri. Il caos e organizzazione. L'errore e la piu grande connessione.
            </p>
          </div>
          <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid #27272A' }}>
            <img src={STADIUM_IMG} alt="Lo stadio della filosofia" className="w-full h-80 object-cover opacity-80" />
            <div className="absolute inset-0 flex items-end p-6" style={{ background: 'linear-gradient(0deg, rgba(5,5,5,0.9) 0%, transparent 60%)' }}>
              <blockquote className="text-lg italic font-light" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#D4AF37' }}>
                "Il pallone e la tua anima, il tuo cuore, la tua mente."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Preview */}
      <section id="modules" className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: '#D4AF37' }}>Il Percorso</p>
            <h2 className="text-4xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              7 Moduli di <span style={{ color: '#D4AF37' }}>Trasformazione</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((mod, i) => (
              <div
                key={mod.num}
                data-testid={`module-preview-${mod.num}`}
                className="card-dark rounded-xl p-6 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="mono text-xs" style={{ color: '#D4AF37' }}>{mod.num}</span>
                  <span style={{ color: '#D4AF37' }}>{mod.icon}</span>
                </div>
                <h3 className="text-xl font-light mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{mod.title}</h3>
                <p className="text-sm" style={{ color: '#71717A' }}>{mod.desc}</p>
              </div>
            ))}
            {/* CTA Card */}
            <div className="rounded-xl p-6 flex flex-col items-center justify-center text-center" style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px dashed rgba(212, 175, 55, 0.3)' }}>
              <Sparkles size={28} style={{ color: '#D4AF37' }} className="mb-3" />
              <p className="text-sm mb-3" style={{ color: '#A1A1AA' }}>Assistente AI integrato</p>
              <p className="text-xs" style={{ color: '#71717A' }}>Chiedi al Maestro e genera esercitazioni</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light mb-12" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Il Morfociclo e <span style={{ color: '#D4AF37' }}>il Tutto</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Ritmo', 'Gioia', 'Costruzione', 'Divertimento', 'Sapere', 'Stare Insieme', 'Filosofia', 'Armonia'].map((val, i) => (
              <div key={val} className="py-4 px-3 rounded-lg opacity-0 animate-fade-in-up" style={{ background: '#111', border: '1px solid #27272A', animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards' }}>
                <span className="text-sm font-light" style={{ color: '#D4AF37' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6" style={{ background: 'linear-gradient(180deg, #050505 0%, #0A0A0A 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Finche c'e gioia, c'e corso
          </h2>
          <p className="mb-8" style={{ color: '#71717A' }}>Il percorso e ad esaurimento argomenti. Crea le tue fotografie di te stesso.</p>
          <button data-testid="footer-cta-btn" onClick={() => navigate('/auth')} className="btn-gold text-base flex items-center gap-2 mx-auto">
            Inizia Ora <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: '1px solid #1A1A1A' }}>
        <p className="text-xs" style={{ color: '#71717A' }}>Periodizzazione Tattica &amp; Calcio Relazionale &mdash; Un percorso di trasformazione</p>
      </footer>
    </div>
  );
}
