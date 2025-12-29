import React, { useState, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Cpu, 
  MessageSquare, 
  Send, 
  Loader2, 
  ChevronRight,
  Shield,
  FileText
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Nota para despliegue: En un entorno real, estas variables vendrían de un archivo .env
// Para este ejemplo, usamos las variables globales del entorno de ejecución.
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "TU_API_KEY", authDomain: "TU_DOMAIN", projectId: "TU_PROJECT_ID" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'profile-analyzer-app';

const App = () => {
  const [user, setUser] = useState(null);
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  // Datos profesionales consolidados
  const userData = {
    name: "Diego Aparicio Sánchez",
    title: "Ingeniero de Ciberseguridad | Pentesting | Cloud Security",
    education: [
      { degree: "Grado en Ingeniería de Ciberseguridad", institution: "Universidad Rey Juan Carlos", years: "2022-2026" },
      { degree: "Máster en Ciberseguridad", institution: "IMMUNE Technology Institute", years: "2021-2022" },
      { degree: "Administración de Sistemas Informáticos en Red", institution: "IES Clara del Rey", years: "2018-2020" }
    ],
    experience: [
      { role: "Cyber Intelligence Analyst", company: "Advens Iberia", period: "2025 - Actualidad", desc: "Automatización con Python y AWS, gestión de vulnerabilidades." },
      { role: "DevOps Engineer", company: "MMG-DEZZAI", period: "2020", desc: "CI/CD, Docker y automatización de tareas de despliegue." }
    ],
    skills: ["Python", "AWS (IaC)", "Pentesting Web", "OSINT", "Ansible", "Docker", "Threat Intel"]
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Error de autenticación:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const callLLM = async (prompt) => {
    const apiKey = ""; // La API Key se inyecta automáticamente en el entorno
    const systemPrompt = `Eres un asistente experto en carrera técnica para Diego Aparicio Sánchez. 
    Contexto: Diego es Ingeniero de Ciberseguridad, experto en Python, AWS y Pentesting. 
    Ha sido validado por Europol para proyectos críticos. 
    Responde preguntas sobre su perfil, sugiere mejoras de CV o analiza su idoneidad para puestos de ciberseguridad.`;

    let retries = 0;
    const maxRetries = 5;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (err) {
        retries++;
        await new Promise(r => setTimeout(r, Math.pow(2, retries) * 1000));
      }
    }
    return "Lo siento, el servicio de análisis no está disponible en este momento.";
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!queryInput.trim() || isLoading) return;

    const currentQuery = queryInput;
    setChatHistory(prev => [...prev, { role: 'user', content: currentQuery }]);
    setIsLoading(true);
    setQueryInput('');

    const aiResponse = await callLLM(currentQuery);
    setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{userData.name}</h1>
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Cybersecurity Expert</p>
            </div>
          </div>
          <nav className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              CV Online
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              <Cpu className="w-4 h-4" /> AI Analyst
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'profile' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2 italic">Stack Tecnológico</h3>
                <div className="flex flex-wrap gap-2">
                  {userData.skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-100 hover:border-indigo-300 transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                   <Shield size={120} />
                </div>
                <h3 className="font-bold text-lg mb-2 relative z-10">¿Buscas un experto?</h3>
                <p className="text-sm text-indigo-100 mb-6 relative z-10">Usa el Analizador IA para validar cómo mi experiencia encaja en tu equipo.</p>
                <button 
                  onClick={() => setActiveTab('ai')}
                  className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg"
                >
                  Probar IA
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" /> Experiencia Destacada
                </h2>
                <div className="space-y-8">
                  {userData.experience.map((exp, idx) => (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{exp.role}</h4>
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded uppercase tracking-tighter">{exp.period}</span>
                      </div>
                      <p className="text-indigo-600 text-xs font-black mb-2 uppercase">{exp.company}</p>
                      <p className="text-sm text-slate-50 text-slate-500 leading-relaxed">{exp.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" /> Formación
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userData.education.map((edu, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                      <p className="text-[10px] text-indigo-500 font-black uppercase mb-1">{edu.years}</p>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1">{edu.degree}</h4>
                      <p className="text-xs text-slate-500">{edu.institution}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[600px] flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-sm uppercase tracking-widest">AI Profile Agent</span>
                  <p className="text-[10px] text-slate-400">Analizando CV de Diego Aparicio</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="bg-white p-6 rounded-full shadow-inner mb-4">
                    <MessageSquare className="w-10 h-10 text-indigo-600 opacity-20" />
                  </div>
                  <h3 className="font-black text-slate-800 text-lg uppercase">Consultoría Inteligente</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs">Haz preguntas técnicas sobre mi perfil o pide recomendaciones de contratación.</p>
                </div>
              )}
              
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white font-medium' 
                      : 'bg-white border border-slate-100 text-slate-800'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Procesando...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <form onSubmit={handleAskAI} className="flex gap-2">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Ej: ¿Qué experiencia tiene en AWS?"
                  className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
                <button 
                  disabled={isLoading || !queryInput.trim()}
                  className="bg-slate-900 text-white p-3 rounded-2xl disabled:opacity-20 hover:bg-indigo-600 transition-all shadow-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 px-6 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Desarrollado con React & Gemini AI • 2025
        </p>
      </footer>
    </div>
  );
};

export default App;