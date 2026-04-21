import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, BookOpen, Brain, Zap, Users, Sparkles, ChevronRight, Award, Shield, GraduationCap } from 'lucide-react';

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
  { num: "08", title: "Tutta PT a Modo mio", desc: "Il percorso completo — voce autentica dell'istruttore", icon: <BookOpen size={20} /> },
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
            con Roberto Bassi — Coach UEFA
          </p>
          <h1 className="text-5xl md:text-7xl font-light leading-tight mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#EAEAEA' }}>
            Periodizzazione Tattica<br />
            <span className="text-gold-gradient">&amp; Calcio Relazionale</span>
          </h1>
          <p className="text-lg md:text-xl font-light leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: '#A1A1AA' }}>
            Non ti insegnero degli schemi. Ti insegnero a pensare.
            Perche il calcio e semplice. Gli esseri umani no.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button data-testid="hero-start-btn" onClick={() => navigate('/auth')} className="btn-gold flex items-center gap-2 text-base">
              Inizia il Viaggio <ArrowRight size={18} />
            </button>
            <button data-testid="hero-explore-btn" onClick={() => document.getElementById('instructor')?.scrollIntoView({ behavior: 'smooth' })} className="btn-gold-outline text-base">
              Scopri il Percorso
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight size={20} className="rotate-90" style={{ color: '#71717A' }} />
        </div>
      </section>

      {/* ROBERTO BASSI - Chi Sono */}
      <section id="instructor" className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div className="animate-fade-in-up">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: '#D4AF37' }}>Il Tuo Istruttore</p>
            <h2 className="text-4xl md:text-5xl font-light mb-2 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Roberto <span style={{ color: '#D4AF37' }}>Bassi</span>
            </h2>
            <div className="flex flex-wrap gap-3 mb-8 mt-4">
              {[
                { icon: <Shield size={14} />, label: 'Coach UEFA' },
                { icon: <GraduationCap size={14} />, label: 'Master Psicologia dello Sport' },
                { icon: <Users size={14} />, label: 'Formatore di Allenatori' },
                { icon: <Brain size={14} />, label: 'Mental Coach' },
              ].map((badge, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#D4AF37' }}>
                  {badge.icon} {badge.label}
                </span>
              ))}
            </div>

            <p className="leading-relaxed mb-4" style={{ color: '#A1A1AA', fontSize: '1.05rem' }}>
              Da anni formo allenatori che hanno il coraggio di andare oltre i dogmi.
              Non quelli che cercano la ricetta magica o l'esercitazione da copiare — quelli
              li trovi ovunque. Io cerco chi sente che il calcio e qualcosa di piu grande
              di un 4-3-3 scritto su una lavagna.
            </p>
            <p className="leading-relaxed mb-4" style={{ color: '#A1A1AA', fontSize: '1.05rem' }}>
              Il mio percorso e fatto di spogliatoi veri, di campi in terra battuta,
              di ragazzi che avevano bisogno di qualcuno che li guardasse negli occhi
              prima di guardarli i piedi.
            </p>
            <p className="leading-relaxed" style={{ color: '#A1A1AA', fontSize: '1.05rem' }}>
              Ho un <strong style={{ color: '#EAEAEA' }}>Master in Psicologia dello Sport e Coaching Sportivo</strong> perche
              ho capito presto che non puoi allenare il corpo di un giocatore se non capisci
              la sua mente. E non puoi capire la sua mente se non ti interessa la sua anima.
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid #27272A' }}>
              <img src={STADIUM_IMG} alt="Il campo" className="w-full h-64 object-cover opacity-80" />
              <div className="absolute inset-0 flex items-end p-6" style={{ background: 'linear-gradient(0deg, rgba(5,5,5,0.95) 0%, transparent 50%)' }}>
                <blockquote className="text-base italic font-light" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#D4AF37' }}>
                  "Il pallone e la tua anima, il tuo cuore, la tua mente.
                  E lo strumento supremo che da tono a tutte le opere."
                </blockquote>
              </div>
            </div>

            {/* La mia filosofia */}
            <div className="card-dark rounded-xl p-6">
              <h3 className="text-lg font-light mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#D4AF37' }}>La mia filosofia</h3>
              <div className="space-y-3">
                {[
                  { bold: 'Il pallone', text: "non e un attrezzo — e l'anima del gioco" },
                  { bold: "L'errore", text: "non e un delitto — e la piu grande connessione che esiste" },
                  { bold: 'Il caos', text: "non e confusione — e l'unico mezzo per trovare l'ordine" },
                  { bold: 'I principi', text: 'non si cambiano — si trasformano' },
                  { bold: 'Il morfociclo', text: 'non e un calendario — e ritmo, gioia, costruzione' },
                ].map((item, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: '#A1A1AA' }}>
                    <span style={{ color: '#D4AF37' }}>{item.bold}</span> {item.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A chi mi rivolgo */}
      <section className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: '#D4AF37' }}>A Chi Mi Rivolgo</p>
            <h2 className="text-3xl md:text-4xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Questo percorso e <span style={{ color: '#D4AF37' }}>per te</span> se...
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              'Alleni nei dilettanti e senti che c\'e qualcosa di piu',
              'Hai fatto il corso a Coverciano ma senti che manca un pezzo',
              'Sei stanco di ripetere esercitazioni fotocopia senza capire il perche',
              'Vuoi che i tuoi giocatori pensino, non eseguano',
            ].map((text, i) => (
              <div key={i} className="card-dark rounded-xl p-5 flex items-start gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                  <ChevronRight size={14} style={{ color: '#D4AF37' }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#EAEAEA' }}>{text}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-sm italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#71717A', fontSize: '1.05rem' }}>
              Non ti prometto di farti vincere il campionato. Ti prometto che guarderai
              il calcio — e la vita — con occhi diversi.
            </p>
          </div>
        </div>
      </section>

      {/* Modules Preview */}
      <section id="modules" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: '#D4AF37' }}>Il Percorso</p>
            <h2 className="text-4xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              8 Moduli di <span style={{ color: '#D4AF37' }}>Trasformazione</span>
            </h2>
            <p className="text-sm mt-3" style={{ color: '#71717A' }}>La prima lezione di ogni modulo e gratuita</p>
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
      <section className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-light mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Il Morfociclo e <span style={{ color: '#D4AF37' }}>il Tutto</span>
          </h2>
          <p className="text-sm mb-12" style={{ color: '#71717A' }}>Non separo la tattica dalla tecnica, la mente dal corpo, il giocatore dalla persona</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Ritmo', 'Gioia', 'Costruzione', 'Divertimento', 'Sapere', 'Stare Insieme', 'Filosofia', 'Armonia'].map((val, i) => (
              <div key={val} className="py-4 px-3 rounded-lg opacity-0 animate-fade-in-up" style={{ background: '#111', border: '1px solid #27272A', animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards' }}>
                <span className="text-sm font-light" style={{ color: '#D4AF37' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Il mio metodo */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: '#D4AF37' }}>Il Mio Metodo</p>
          <h2 className="text-3xl md:text-4xl font-light mb-8 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Finche c'e gioia, <span style={{ color: '#D4AF37' }}>c'e corso</span>
          </h2>
          <div className="space-y-6 text-left">
            <p className="leading-relaxed" style={{ color: '#A1A1AA', fontSize: '1.05rem' }}>
              Non faccio corsi con date di scadenza. I miei allievi non devono seguire alla lettera — devono
              crearsi le loro <strong style={{ color: '#EAEAEA' }}>fotografie di se stessi</strong>.
            </p>
            <p className="leading-relaxed" style={{ color: '#A1A1AA', fontSize: '1.05rem' }}>
              Ogni lezione e un viaggio, non una destinazione. Ogni esercitazione e un capolavoro
              irripetibile, non uno schema da fotocopiare. Ogni errore e una porta che si apre,
              non un muro da abbattere.
            </p>
          </div>
          <blockquote className="mt-10 p-6 rounded-xl text-left" style={{ background: 'rgba(212, 175, 55, 0.04)', borderLeft: '3px solid #D4AF37' }}>
            <p className="text-lg italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#F3E5AB' }}>
              "Come un sogno, un percorso dove gli ostacoli non sono da aggirare
              ma sono quiz da risolvere per superarli. Dove lo stile di vita e composto
              da affetti, amicizia, giochi, divertimento — tutti legati ad un unico filo logico."
            </p>
          </blockquote>
        </div>
      </section>

      {/* Cosa include */}
      <section className="py-24 px-6" style={{ background: '#0A0A0A' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: '#D4AF37' }}>Cosa Include</p>
            <h2 className="text-3xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Tutto cio che serve per la <span style={{ color: '#D4AF37' }}>trasformazione</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <BookOpen size={24} />, title: '8 Moduli, 28 Lezioni', desc: 'Contenuti profondi scritti come un istruttore parla ai suoi allievi' },
              { icon: <Sparkles size={24} />, title: 'Assistente AI', desc: 'Chiedi qualsiasi cosa sulla PT e genera esercitazioni personalizzate' },
              { icon: <Zap size={24} />, title: 'Esercitazioni Pratiche', desc: 'Diagrammi tattici, varianti, collegamento filosofico al modello di gioco' },
              { icon: <Brain size={24} />, title: 'Mental Coaching', desc: 'La psicologia dello sport integrata in ogni lezione' },
              { icon: <Users size={24} />, title: 'Prima Lezione Gratis', desc: 'Prova la prima lezione di ogni modulo senza impegno' },
              { icon: <Award size={24} />, title: 'Certificato PDF', desc: 'Attestato di completamento al termine del percorso' },
            ].map((item, i) => (
              <div key={i} className="card-dark rounded-xl p-6 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                  <span style={{ color: '#D4AF37' }}>{item.icon}</span>
                </div>
                <h3 className="text-base font-medium mb-2" style={{ color: '#EAEAEA' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: '#71717A' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Il calcio e semplice.<br />
            <span style={{ color: '#D4AF37' }}>Gli esseri umani no.</span>
          </h2>
          <p className="mb-8" style={{ color: '#71717A' }}>Inizia il percorso di trasformazione con Roberto Bassi</p>
          <button data-testid="footer-cta-btn" onClick={() => navigate('/auth')} className="btn-gold text-base flex items-center gap-2 mx-auto">
            Inizia il Viaggio <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: '1px solid #1A1A1A' }}>
        <p className="text-xs" style={{ color: '#71717A' }}>
          Roberto Bassi — Coach UEFA | Formatore Allenatori | Mental Coach
        </p>
        <p className="text-xs mt-1" style={{ color: '#3f3f46' }}>
          Periodizzazione Tattica &amp; Calcio Relazionale
        </p>
      </footer>
    </div>
  );
}
