import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Send, Loader2, Sparkles, MessageCircle, Dumbbell } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AiChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'generate' ? 'generate' : 'chat';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      <nav className="glass-nav sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button data-testid="back-to-dashboard-ai" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm" style={{ color: '#A1A1AA' }}>
            <ArrowLeft size={18} /> Dashboard
          </button>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#121212' }}>
            <button
              data-testid="tab-chat"
              onClick={() => setActiveTab('chat')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{ background: activeTab === 'chat' ? 'rgba(212,175,55,0.15)' : 'transparent', color: activeTab === 'chat' ? '#D4AF37' : '#71717A' }}
            >
              <MessageCircle size={14} /> Chiedi al Maestro
            </button>
            <button
              data-testid="tab-generate"
              onClick={() => setActiveTab('generate')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{ background: activeTab === 'generate' ? 'rgba(212,175,55,0.15)' : 'transparent', color: activeTab === 'generate' ? '#D4AF37' : '#71717A' }}
            >
              <Sparkles size={14} /> Genera Esercitazione
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'chat' ? <ChatPanel /> : <GeneratePanel />}
      </div>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEnd = useRef(null);

  const scrollToBottom = () => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/ai/chat`, { message: userMsg, session_id: sessionId }, { withCredentials: true });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Mi dispiace, si e verificato un errore. Riprova tra un momento.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Chiedi al <span style={{ color: '#D4AF37' }}>Maestro</span>
        </h2>
        <p className="text-xs mt-1" style={{ color: '#71717A' }}>L'assistente AI della Periodizzazione Tattica</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle size={40} style={{ color: '#27272A' }} className="mx-auto mb-4" />
            <p className="text-sm" style={{ color: '#71717A' }}>Inizia una conversazione sulla Periodizzazione Tattica...</p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Cos\'e il morfociclo?', 'Parlami dell\'errore come connessione', 'Come creare il caos organizzato?'].map(suggestion => (
                <button
                  key={suggestion}
                  data-testid={`suggestion-${suggestion.slice(0, 10)}`}
                  onClick={() => { setInput(suggestion); }}
                  className="px-3 py-1.5 rounded-full text-xs transition-all"
                  style={{ border: '1px solid #27272A', color: '#A1A1AA' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 ${msg.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
              {msg.role === 'assistant' ? (
                <div className="lesson-content text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#EAEAEA' }}>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="chat-ai px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" style={{ color: '#D4AF37' }} />
              <span className="text-sm" style={{ color: '#71717A' }}>Il Maestro sta riflettendo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          data-testid="chat-input"
          type="text"
          className="input-dark flex-1"
          placeholder="Chiedi qualcosa sulla Periodizzazione Tattica..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          data-testid="chat-send-btn"
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-gold px-4 flex items-center"
          style={{ opacity: !input.trim() ? 0.5 : 1 }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function GeneratePanel() {
  const [principle, setPrinciple] = useState('');
  const [category, setCategory] = useState('generale');
  const [numPlayers, setNumPlayers] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (e) => {
    e.preventDefault();
    if (!principle.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const { data } = await axios.post(`${API}/ai/generate-exercise`, {
        principle: principle.trim(),
        category,
        num_players: numPlayers
      }, { withCredentials: true });
      setResult(data.exercise);
    } catch (err) {
      setResult({ error: 'Errore nella generazione. Riprova.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Genera <span style={{ color: '#D4AF37' }}>Esercitazione</span>
        </h2>
        <p className="text-xs mt-1" style={{ color: '#71717A' }}>Crea esercizi personalizzati con l'intelligenza artificiale</p>
      </div>

      <form onSubmit={generate} className="card-dark rounded-xl p-6 mb-8">
        <div className="space-y-5">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: '#A1A1AA' }}>Principio di Gioco</label>
            <input
              data-testid="gen-principle-input"
              className="input-dark"
              placeholder="es: Transizione offensiva rapida, pressing alto coordinato..."
              value={principle}
              onChange={(e) => setPrinciple(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#A1A1AA' }}>Categoria</label>
              <select
                data-testid="gen-category-select"
                className="input-dark"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="generale">Generale</option>
                <option value="possesso">Possesso</option>
                <option value="pressing">Pressing</option>
                <option value="costruzione">Costruzione</option>
                <option value="transizione">Transizione</option>
                <option value="tattica_reparto">Tattica di Reparto</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#A1A1AA' }}>Numero Giocatori</label>
              <input
                data-testid="gen-players-input"
                type="number"
                className="input-dark"
                min={4}
                max={22}
                value={numPlayers}
                onChange={(e) => setNumPlayers(parseInt(e.target.value) || 10)}
              />
            </div>
          </div>
          <button
            data-testid="gen-submit-btn"
            type="submit"
            disabled={loading || !principle.trim()}
            className="btn-gold w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : (
              <>
                <Sparkles size={18} /> Genera Esercitazione
              </>
            )}
          </button>
        </div>
      </form>

      {result && !result.error && (
        <div data-testid="generated-exercise" className="card-dark rounded-xl p-6 animate-fade-in-up">
          <h3 className="text-xl font-light mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#D4AF37' }}>
            {result.title || 'Esercitazione Generata'}
          </h3>

          {result.principle && (
            <div className="mb-4">
              <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>Principio:</span>
              <p className="text-sm mt-1" style={{ color: '#A1A1AA' }}>{result.principle}</p>
            </div>
          )}

          {result.setup && (
            <div className="mb-4">
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#D4AF37' }}>
                <Dumbbell size={12} /> Organizzazione:
              </span>
              <p className="text-sm mt-1" style={{ color: '#A1A1AA' }}>{result.setup}</p>
            </div>
          )}

          {result.description && (
            <div className="mb-4">
              <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>Descrizione:</span>
              <div className="text-sm mt-1 lesson-content" style={{ color: '#A1A1AA' }}>
                <ReactMarkdown>{result.description}</ReactMarkdown>
              </div>
            </div>
          )}

          {result.objectives && (
            <div className="mb-4">
              <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>Obiettivi:</span>
              <ul className="mt-1 space-y-1">
                {result.objectives.map((obj, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#A1A1AA' }}>
                    <span style={{ color: '#D4AF37' }}>&#8226;</span> {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.variations && (
            <div className="mb-4">
              <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>Varianti:</span>
              <ul className="mt-1 space-y-1">
                {result.variations.map((v, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#A1A1AA' }}>
                    <span style={{ color: '#D4AF37' }}>&#8226;</span> {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.philosophical_link && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="text-sm italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#F3E5AB', fontSize: '1rem' }}>
                {result.philosophical_link}
              </p>
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div className="text-center p-6" style={{ color: '#ef4444' }}>
          <p className="text-sm">{result.error}</p>
        </div>
      )}
    </div>
  );
}
