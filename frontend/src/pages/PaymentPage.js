import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { ArrowLeft, Check, Lock, Shield, BookOpen, MessageCircle, Dumbbell, Award, Loader2 } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paypalClientId, setPaypalClientId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, statusRes] = await Promise.all([
          axios.get(`${API}/payment/info`),
          axios.get(`${API}/payment/status`).catch(() => ({ data: { has_paid: false } }))
        ]);
        setPaymentInfo(infoRes.data);
        setPaymentStatus(statusRes.data);
        if (statusRes.data?.has_paid) setSuccess(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePayPalPayment = async (transactionId) => {
    setProcessing(true);
    try {
      await axios.post(`${API}/payment/record`, { transaction_id: transactionId || 'paypal-direct' });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="animate-pulse-gold w-12 h-12 rounded-full" style={{ border: '2px solid #D4AF37' }} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050505' }}>
        <div className="text-center max-w-md animate-fade-in-up">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '2px solid #D4AF37' }}>
            <Check size={36} style={{ color: '#D4AF37' }} />
          </div>
          <h1 className="text-3xl font-light mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Benvenuto nel <span style={{ color: '#D4AF37' }}>Percorso Completo</span>
          </h1>
          <p className="text-sm mb-8" style={{ color: '#A1A1AA' }}>
            Hai accesso a tutti i moduli, le lezioni, le esercitazioni e l'assistente AI.
            Il tuo viaggio nella Periodizzazione Tattica inizia ora.
          </p>
          <button data-testid="go-to-dashboard-btn" onClick={() => navigate('/dashboard')} className="btn-gold">
            Vai alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      <nav className="glass-nav sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button data-testid="back-from-payment" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm" style={{ color: '#A1A1AA' }}>
            <ArrowLeft size={18} /> Dashboard
          </button>
          <span className="text-sm font-medium" style={{ color: '#D4AF37' }}>Accesso Completo</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Left: What you get */}
          <div className="animate-fade-in-up">
            <h1 className="text-4xl font-light mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Sblocca il <span style={{ color: '#D4AF37' }}>Percorso Completo</span>
            </h1>
            <p className="text-sm mb-8" style={{ color: '#71717A' }}>
              La prima lezione di ogni modulo e gratuita. Per accedere a tutto il percorso di trasformazione:
            </p>

            <div className="space-y-4 mb-8">
              {[
                { icon: <BookOpen size={18} />, text: '7 Moduli con 18 lezioni approfondite' },
                { icon: <Dumbbell size={18} />, text: '5+ esercitazioni pratiche con diagrammi tattici' },
                { icon: <MessageCircle size={18} />, text: 'Assistente AI dedicato alla Periodizzazione Tattica' },
                { icon: <Award size={18} />, text: 'Certificato PDF di completamento' },
                { icon: <Shield size={18} />, text: 'Accesso illimitato a tutti i contenuti futuri' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                    <span style={{ color: '#D4AF37' }}>{item.icon}</span>
                  </div>
                  <span className="text-sm" style={{ color: '#EAEAEA' }}>{item.text}</span>
                </div>
              ))}
            </div>

            <blockquote className="p-4 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.04)', borderLeft: '3px solid #D4AF37' }}>
              <p className="text-sm italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#F3E5AB', fontSize: '1.05rem' }}>
                "Finche c'e gioia, c'e corso. Un percorso dove gli ostacoli non sono da aggirare ma sono quiz da risolvere."
              </p>
            </blockquote>
          </div>

          {/* Right: Payment */}
          <div className="animate-fade-in-up delay-3">
            <div className="card-dark rounded-xl p-8">
              <div className="text-center mb-6">
                <span className="mono text-4xl font-light" style={{ color: '#D4AF37' }}>
                  {paymentInfo?.price || 49}
                </span>
                <span className="text-lg ml-1" style={{ color: '#71717A' }}>{paymentInfo?.currency || 'EUR'}</span>
                <p className="text-xs mt-2" style={{ color: '#71717A' }}>Pagamento unico - Accesso permanente</p>
              </div>

              <div className="space-y-4">
                {/* PayPal Button */}
                <div className="rounded-lg p-4" style={{ background: '#1A1A1A' }}>
                  <p className="text-xs text-center mb-3" style={{ color: '#A1A1AA' }}>Paga con PayPal</p>
                  
                  <a
                    data-testid="paypal-pay-btn"
                    href={`https://www.paypal.com/paypalme/latuafrica/${paymentInfo?.price || 49}EUR`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                    style={{ background: '#FFC439', color: '#111' }}
                  >
                    Paga con PayPal - {paymentInfo?.price || 49} EUR
                  </a>
                  
                  <p className="text-xs text-center mt-3" style={{ color: '#71717A' }}>
                    Dopo il pagamento, clicca "Conferma Pagamento" qui sotto
                  </p>
                </div>

                {/* Confirm Payment Button */}
                <button
                  data-testid="confirm-payment-btn"
                  onClick={() => handlePayPalPayment('paypal-manual')}
                  disabled={processing}
                  className="btn-gold-outline w-full flex items-center justify-center gap-2 text-sm"
                >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Ho effettuato il pagamento PayPal
                </button>

                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: '#27272A' }} />
                  <span className="text-xs" style={{ color: '#71717A' }}>oppure</span>
                  <div className="flex-1 h-px" style={{ background: '#27272A' }} />
                </div>

                {/* Direct bank / contact */}
                <div className="text-center">
                  <p className="text-xs" style={{ color: '#71717A' }}>
                    Per altre modalita di pagamento contatta l'istruttore:
                  </p>
                  <a 
                    href={`mailto:${paymentInfo?.paypal_email}`} 
                    className="text-xs inline-block mt-1 transition-colors hover:opacity-80"
                    style={{ color: '#D4AF37' }}
                  >
                    {paymentInfo?.paypal_email}
                  </a>
                </div>
              </div>

              <div className="mt-6 pt-4 flex items-center justify-center gap-2" style={{ borderTop: '1px solid #27272A' }}>
                <Lock size={12} style={{ color: '#71717A' }} />
                <span className="text-xs" style={{ color: '#71717A' }}>Pagamento sicuro con PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
