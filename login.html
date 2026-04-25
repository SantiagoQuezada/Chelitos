import React, { useState, useEffect } from 'react';
import { 
  Mail, Lock, User, AlertCircle, 
  CheckCircle, Loader2, Wallet, LogOut, ShieldCheck, Calendar, Database 
} from 'lucide-react';

// 👉 REEMPLAZA ESTAS DOS VARIABLES CON LAS DE TU PROYECTO SUPABASE
const SUPABASE_URL = 'https://jsxwprhudkzoadvxohah.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_91yOfKfjuIjcS7eESuzvKw_TYZl0520';

const isSupabaseConfigured = SUPABASE_URL !== 'REEMPLAZA_CON_TU_URL';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState('login'); 
  const [supabaseClient, setSupabaseClient] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoadingAuth(false);
      return;
    }

    let authSubscription = null;

    const initSupabase = async () => {
      try {
        const loadSupabase = new Function("return import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm')");
        const mod = await loadSupabase();
        const client = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabaseClient(client);

        const { data: { session } } = await client.auth.getSession();
        setCurrentUser(session?.user ?? null);
        if (session?.user) setCurrentView('mainApp'); // Si está logueado, va directo a la app principal
        
        const { data } = client.auth.onAuthStateChange((_event, session) => {
          setCurrentUser(session?.user ?? null);
          if (session?.user) {
            setCurrentView('mainApp');
          } else {
            setCurrentView('login');
          }
        });
        
        authSubscription = data.subscription;
      } catch (error) {
        console.error("Error inicializando Supabase:", error);
      } finally {
        setLoadingAuth(false);
      }
    };

    initSupabase();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Conectando con Supabase...</p>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return <SupabaseSetupWarning />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
      {currentView === 'login' && <LoginForm setView={setCurrentView} supabase={supabaseClient} />}
      {currentView === 'register' && <RegisterForm setView={setCurrentView} supabase={supabaseClient} />}
      {currentView === 'reset' && <ResetPasswordForm setView={setCurrentView} supabase={supabaseClient} />}
      
      {/* AQUÍ ES DONDE CONECTAMOS EL LOGIN CON TU APLICACIÓN PRINCIPAL */}
      {currentView === 'mainApp' && (
        <ChelitosMainApp 
          user={currentUser} 
          supabase={supabaseClient} 
        />
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE CONTENEDOR DE TU APP PRINCIPAL
// ==========================================
// Aquí es donde vas a poner tu código real (los gastos, gráficos, etc.)
const ChelitosMainApp = ({ user, supabase }) => {
  const [resending, setResending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const isEmailVerified = !!user?.email_confirmed_at;

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const handleResendVerification = async () => {
    if (!supabase) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email: user?.email });
    if (error) {
      alert("Error al reenviar el correo: " + error.message);
    } else {
      setVerificationSent(true);
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-xl font-black text-white">C</span>
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">Chelitos</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden sm:block">
                Hola, <span className="font-bold">{displayName}</span>
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-lg"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner de Verificación de Correo (Solo se muestra si no han verificado) */}
        {!isEmailVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-sm">
            <div className="flex gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-amber-800 font-bold">Verifica tu correo electrónico</h3>
                <p className="text-amber-700 text-sm mt-1">
                  Mantén tu cuenta segura verificando tu dirección: <strong>{user?.email}</strong>
                </p>
              </div>
            </div>
            <button 
              onClick={handleResendVerification}
              disabled={resending || verificationSent}
              className="text-sm px-4 py-2.5 bg-white text-amber-800 border border-amber-200 rounded-xl font-bold hover:bg-amber-100 transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              {resending ? 'Enviando...' : verificationSent ? '¡Correo Enviado!' : 'Reenviar código'}
            </button>
          </div>
        )}

        {/* ========================================================================
          🔥 ¡AQUÍ EMPIEZA TU APLICACIÓN PRINCIPAL DE CHELITOS! 🔥
          ========================================================================
          Cuando vayas a tu editor de código (VS Code), puedes borrar todo lo que está 
          dentro de este div y pegar los componentes de tu aplicación real.
          
          Ya tienes acceso a "user" (quien tiene el ID del usuario) y a "supabase" 
          (para guardar y leer las transacciones de tu base de datos).
        */}
        <div className="border-4 border-dashed border-blue-200 rounded-3xl p-8 bg-blue-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">Balance Total</h3>
              <p className="text-3xl font-black text-slate-800">$0.00</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">Ingresos</h3>
              <p className="text-3xl font-black text-emerald-500">+$0.00</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-slate-500 text-sm font-bold mb-2 uppercase tracking-wider">Gastos</h3>
              <p className="text-3xl font-black text-red-500">-$0.00</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-10 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">¡Bienvenido a Chelitos!</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              El login está conectado exitosamente. Aquí es donde insertarás el código principal de tu aplicación de finanzas.
            </p>
            <button className="px-6 py-3.5 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              Botón de Ejemplo
            </button>
          </div>
        </div>
        {/* ======================= FIN DE TU APP ======================= */}

      </main>
    </div>
  );
};


// ==========================================
// COMPONENTES DE DISEÑO / FONDOS
// ==========================================
const BackgroundBolitas = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div 
      className="absolute inset-0 opacity-40" 
      style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, #94a3b8 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}
    ></div>
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
    <div className="absolute top-1/4 -right-32 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
    <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
  </div>
);

const ChelitosLogo = () => (
  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
    <span className="text-4xl font-black text-white tracking-tighter">C</span>
    <span className="text-xl font-bold text-blue-100 absolute bottom-1 right-2">$</span>
  </div>
);

// ==========================================
// COMPONENTES DE LOGIN / REGISTRO
// ==========================================
const LoginForm = ({ setView, supabase }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) handleSupabaseError(error, setError);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });

    if (error) handleSupabaseError(error, setError);
    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 bg-slate-50">
      <BackgroundBolitas />
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative z-10">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <ChelitosLogo />
            <h1 className="text-3xl font-bold text-slate-900 mt-4 tracking-tight">Chelitos</h1>
            <p className="text-sm text-slate-500 mt-2">Controla tu dinero inteligentemente.</p>
          </div>

          {error && <AlertMessage message={error} type="error" />}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email" required
                  className="block w-full pl-11 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all bg-white/50"
                  placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                <button type="button" onClick={() => setView('reset')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password" required
                  className="block w-full pl-11 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all bg-white/50"
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 transition-all transform active:scale-[0.98]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-slate-500 text-xs font-medium uppercase tracking-wider">O continúa con</span></div>
            </div>
            <div className="mt-6">
              <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-70 transition-all transform active:scale-[0.98]">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>
            </div>
          </div>
        </div>
        <div className="bg-slate-50/80 px-8 py-5 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            ¿No tienes cuenta? <button onClick={() => setView('register')} className="font-bold text-blue-600 hover:text-blue-700 transition-colors">Regístrate aquí</button>
          </p>
        </div>
      </div>
    </div>
  );
};

const RegisterForm = ({ setView, supabase }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

    setLoading(true);
    if (!supabase) return;

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, birth_date: birthDate } }
    });

    if (error) handleSupabaseError(error, setError);
    else setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="relative flex items-center justify-center min-h-screen p-4 bg-slate-50">
        <BackgroundBolitas />
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 p-8 sm:p-10 text-center relative z-10">
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Cuenta Creada!</h2>
          <p className="text-slate-600 mb-8">Hemos enviado un enlace a <strong>{email}</strong>. Por favor, revisa tu correo para verificar tu cuenta.</p>
          <button onClick={() => setView('login')} className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 py-12 bg-slate-50">
      <BackgroundBolitas />
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative z-10">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Crear una cuenta</h1>
            <p className="text-sm text-slate-500 mt-2">Únete a Chelitos y organiza tus finanzas.</p>
          </div>
          {error && <AlertMessage message={error} type="error" />}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                <input type="text" required className="block w-full pl-11 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white/50" placeholder="Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Nacimiento</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Calendar className="h-5 w-5 text-slate-400" /></div>
                <input type="date" required className="block w-full pl-11 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white/50 text-slate-700" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                <input type="email" required className="block w-full pl-11 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white/50" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                <input type="password" required className="block w-full pl-11 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white/50" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                <input type="password" required className="block w-full pl-11 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white/50" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 transition-all mt-6 transform active:scale-[0.98]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta'}
            </button>
          </form>
        </div>
        <div className="bg-slate-50/80 px-8 py-5 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">¿Ya tienes una cuenta? <button onClick={() => setView('login')} className="font-bold text-blue-600 hover:text-blue-700 transition-colors">Inicia sesión</button></p>
        </div>
      </div>
    </div>
  );
};

const ResetPasswordForm = ({ setView, supabase }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    if (!supabase) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) handleSupabaseError(error, setError);
    else setMessage('Se ha enviado un enlace para restablecer tu contraseña a tu correo.');
    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 bg-slate-50">
      <BackgroundBolitas />
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative z-10">
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Recuperar Contraseña</h1>
            <p className="text-sm text-slate-500 mt-2">Ingresa tu correo y te enviaremos un enlace.</p>
          </div>
          {error && <AlertMessage message={error} type="error" />}
          {message && <AlertMessage message={message} type="success" />}
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                <input type="email" required className="block w-full pl-11 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white/50" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={loading || message !== ''} className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-70 transition-all transform active:scale-[0.98]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Enlace'}
            </button>
          </form>
        </div>
        <div className="bg-slate-50/80 px-8 py-5 border-t border-slate-100 text-center">
          <button onClick={() => setView('login')} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Volver al inicio de sesión</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// FUNCIONES AUXILIARES & UI 
// ==========================================
const AlertMessage = ({ message, type = 'error' }) => {
  const isError = type === 'error';
  return (
    <div className={`p-4 rounded-xl mb-6 text-sm flex items-start gap-3 ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
      {isError ? <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
      <span className="font-medium leading-relaxed">{message}</span>
    </div>
  );
};

const handleSupabaseError = (err, setError) => {
  const msg = err.message.toLowerCase();
  if (msg.includes('invalid login credentials')) setError('Correo o contraseña incorrectos.');
  else if (msg.includes('user already registered')) setError('El correo ya está registrado. Inicia sesión.');
  else if (msg.includes('password should be at least')) setError('La contraseña debe tener al menos 6 caracteres.');
  else if (msg.includes('email rate limit exceeded')) setError('Demasiados intentos. Por favor espera un momento y vuelve a intentar.');
  else if (msg.includes('email not confirmed')) setError('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada o carpeta de spam.');
  else setError('Ocurrió un error: ' + err.message);
  console.error("Supabase Error:", err);
};

const SupabaseSetupWarning = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg border border-red-100 text-center">
      <Database className="w-16 h-16 text-blue-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Falta conectar Supabase</h2>
      <p className="text-slate-600 mb-6">Faltan las credenciales en App.jsx</p>
    </div>
  </div>
);