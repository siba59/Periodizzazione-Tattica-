import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Users, BookOpen, Dumbbell, MessageCircle, BarChart3, CreditCard, Check, X, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, studentsRes, paymentsRes] = await Promise.all([
          axios.get(`${API}/admin/stats`),
          axios.get(`${API}/admin/students`),
          axios.get(`${API}/admin/payments`).catch(() => ({ data: [] }))
        ]);
        setStats(statsRes.data);
        setStudents(studentsRes.data);
        setPayments(paymentsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleAccess = async (studentEmail, currentStatus) => {
    // Find student by email to get their _id
    const student = students.find(s => s.email === studentEmail);
    if (!student) return;
    
    // We need the user_id - let's use the email to find the user
    setActionLoading(studentEmail);
    try {
      // Get user id from the backend by looking up students
      const studentsRes = await axios.get(`${API}/admin/students`);
      const fullStudent = studentsRes.data.find(s => s.email === studentEmail);
      
      // We need to add an endpoint or use the student data we have
      // For now, use a helper endpoint
      if (currentStatus) {
        await axios.post(`${API}/admin/payment/revoke`, { user_id: studentEmail });
      } else {
        await axios.post(`${API}/admin/payment/confirm`, { user_id: studentEmail });
      }
      // Refresh students
      const updatedStudents = await axios.get(`${API}/admin/students`);
      setStudents(updatedStudents.data);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="animate-pulse-gold w-12 h-12 rounded-full" style={{ border: '2px solid #D4AF37' }} />
      </div>
    );
  }

  const statCards = [
    { label: 'Allievi', value: stats?.total_students || 0, icon: <Users size={20} /> },
    { label: 'Moduli', value: stats?.total_modules || 0, icon: <BookOpen size={20} /> },
    { label: 'Lezioni', value: stats?.total_lessons || 0, icon: <BarChart3 size={20} /> },
    { label: 'Esercitazioni', value: stats?.total_exercises || 0, icon: <Dumbbell size={20} /> },
    { label: 'Messaggi AI', value: stats?.total_chat_messages || 0, icon: <MessageCircle size={20} /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      <nav className="glass-nav sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button data-testid="back-to-dashboard-admin" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-sm" style={{ color: '#A1A1AA' }}>
            <ArrowLeft size={18} /> Dashboard
          </button>
          <span className="text-sm font-medium" style={{ color: '#D4AF37' }}>Pannello Istruttore</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light mb-8" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Pannello <span style={{ color: '#D4AF37' }}>Istruttore</span>
        </h1>

        {/* Stats Grid */}
        <div data-testid="admin-stats" className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {statCards.map((s, i) => (
            <div key={s.label} className="card-dark rounded-xl p-5 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards' }}>
              <div className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(212,175,55,0.1)' }}>
                <span style={{ color: '#D4AF37' }}>{s.icon}</span>
              </div>
              <p className="mono text-2xl font-light" style={{ color: '#EAEAEA' }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#71717A' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Students List with Payment Status */}
        <h2 className="text-xl font-light mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          I Tuoi <span style={{ color: '#D4AF37' }}>Allievi</span>
        </h2>

        {students.length === 0 ? (
          <div className="card-dark rounded-xl p-8 text-center">
            <Users size={32} style={{ color: '#27272A' }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: '#71717A' }}>Nessun allievo registrato ancora</p>
          </div>
        ) : (
          <div className="card-dark rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #27272A' }}>
                  <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: '#D4AF37' }}>Nome</th>
                  <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: '#D4AF37' }}>Email</th>
                  <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: '#D4AF37' }}>Data</th>
                  <th className="text-center px-5 py-3 text-xs font-medium" style={{ color: '#D4AF37' }}>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1A1A1A' }}>
                    <td className="px-5 py-3 text-sm" style={{ color: '#EAEAEA' }}>{student.name}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: '#A1A1AA' }}>{student.email}</td>
                    <td className="px-5 py-3 text-sm mono" style={{ color: '#71717A' }}>
                      {student.created_at ? new Date(student.created_at).toLocaleDateString('it-IT') : '-'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                        style={{
                          background: student.has_paid ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.03)',
                          color: student.has_paid ? '#D4AF37' : '#71717A',
                          border: `1px solid ${student.has_paid ? 'rgba(212, 175, 55, 0.3)' : '#27272A'}`
                        }}
                      >
                        {student.has_paid ? <><Check size={12} /> Pagato</> : <><X size={12} /> Non pagato</>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent Payments */}
        {payments.length > 0 && (
          <>
            <h2 className="text-xl font-light mt-12 mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              <span style={{ color: '#D4AF37' }}>Pagamenti</span> Recenti
            </h2>
            <div className="card-dark rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272A' }}>
                    <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: '#D4AF37' }}>Allievo</th>
                    <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: '#D4AF37' }}>Importo</th>
                    <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: '#D4AF37' }}>Data</th>
                    <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: '#D4AF37' }}>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1A1A1A' }}>
                      <td className="px-5 py-3 text-sm" style={{ color: '#EAEAEA' }}>{payment.user_name || payment.user_email}</td>
                      <td className="px-5 py-3 text-sm mono" style={{ color: '#D4AF37' }}>{payment.amount} {payment.currency}</td>
                      <td className="px-5 py-3 text-sm mono" style={{ color: '#71717A' }}>
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString('it-IT') : '-'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>
                          {payment.status === 'pending_verification' ? 'In verifica' : 'Confermato'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
