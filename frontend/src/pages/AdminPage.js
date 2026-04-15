import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Users, BookOpen, Dumbbell, MessageCircle, BarChart3 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, studentsRes] = await Promise.all([
          axios.get(`${API}/admin/stats`, { withCredentials: true }),
          axios.get(`${API}/admin/students`, { withCredentials: true })
        ]);
        setStats(statsRes.data);
        setStudents(studentsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="animate-pulse-gold w-12 h-12 rounded-full" style={{ border: '2px solid #D4AF37' }} />
      </div>
    );
  }

  const statCards = [
    { label: 'Allievi', value: stats?.total_students || 0, icon: <Users size={20} />, color: '#D4AF37' },
    { label: 'Moduli', value: stats?.total_modules || 0, icon: <BookOpen size={20} />, color: '#D4AF37' },
    { label: 'Lezioni', value: stats?.total_lessons || 0, icon: <BarChart3 size={20} />, color: '#D4AF37' },
    { label: 'Esercitazioni', value: stats?.total_exercises || 0, icon: <Dumbbell size={20} />, color: '#D4AF37' },
    { label: 'Messaggi AI', value: stats?.total_chat_messages || 0, icon: <MessageCircle size={20} />, color: '#D4AF37' },
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
            <div
              key={s.label}
              className="card-dark rounded-xl p-5 text-center opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards' }}
            >
              <div className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(212,175,55,0.1)' }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <p className="mono text-2xl font-light" style={{ color: '#EAEAEA' }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#71717A' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Students List */}
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
                  <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: '#D4AF37' }}>Data Iscrizione</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
