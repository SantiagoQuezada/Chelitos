// Importando cliente oficial de Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';

// TUS CREDENCIALES EXACTAS
const SUPABASE_URL = 'https://jsxwprhudkzoadvxohah.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_91yOfKfjuIjcS7eESuzvKw_TYZl0520';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Redirigir automáticamente si ya existe una sesión activa
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user && session.user.email_confirmed_at) {
        window.location.href = 'principal.html';
    }
});

// 2. Escuchar cambios de autenticación
supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user && event === 'SIGNED_IN') {
        window.location.href = 'principal.html';
    }
});

// --- LÓGICA DE INTERFAZ Y FORMULARIOS ---

window.isLoginMode = true;

// Alternar entre Login y Registro
window.toggleAuthMode = () => {
    window.isLoginMode = !window.isLoginMode;
    document.getElementById('loginForm').classList.toggle('hidden', !window.isLoginMode);
    document.getElementById('registerForm').classList.toggle('hidden', window.isLoginMode);
    document.getElementById('authSubtitle').innerText = window.isLoginMode ? 'Controla tu dinero inteligentemente.' : 'Únete a Chelitos y organiza tus finanzas.';
    document.getElementById('authToggleText').innerHTML = window.isLoginMode 
        ? '¿No tienes cuenta? <button type="button" onclick="window.toggleAuthMode()" class="font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors ml-1">Regístrate aquí</button>' 
        : '¿Ya tienes una cuenta? <button type="button" onclick="window.toggleAuthMode()" class="font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors ml-1">Inicia sesión</button>';
};

// MANEJADOR DE ERRORES CENTRALIZADO (Igual que en tu React)
const handleSupabaseError = (err) => {
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (msg.includes('user already registered')) return 'El correo ya está registrado. Inicia sesión.';
    if (msg.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (msg.includes('email rate limit exceeded')) return 'Demasiados intentos. Por favor espera un momento y vuelve a intentar.';
    if (msg.includes('email not confirmed')) return 'Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.';
    return 'Ocurrió un error: ' + err.message;
};

// INICIAR SESIÓN CON EMAIL Y CONTRASEÑA
window.handleEmailLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pwd = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const orig = btn.innerHTML; 
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    
    if (error) {
        window.showToast(handleSupabaseError(error), 'bg-red-500');
        btn.innerHTML = orig;
    } else {
        window.showToast('Iniciando sesión...', 'bg-[#42cbf5]');
        // Si no hay error, el listener de arriba redirige a principal.html
    }
};

// INICIAR SESIÓN CON GOOGLE
window.handleGoogleLogin = async () => {
    const btn = document.getElementById('googleBtn');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-slate-500"></i>';

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/principal.html' }
    });

    if (error) {
        window.showToast(handleSupabaseError(error), 'bg-red-500');
        btn.innerHTML = orig;
    }
};

// REGISTRAR CUENTA (Incluyendo la metadata completa: nombre y fecha de nacimiento)
window.handleEmailRegister = async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const birthDate = document.getElementById('regBirth').value;
    const email = document.getElementById('regEmail').value;
    const pwd = document.getElementById('regPassword').value;
    const confirmPwd = document.getElementById('regConfirmPassword').value;
    
    if (pwd !== confirmPwd) {
        return window.showToast('Las contraseñas no coinciden.', 'bg-red-500');
    }
    
    const btn = document.getElementById('regBtn');
    const orig = btn.innerHTML; 
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    
    const { data, error } = await supabase.auth.signUp({
        email, 
        password: pwd,
        options: { 
            data: { 
                full_name: name, 
                birth_date: birthDate 
            } 
        }
    });

    if (error) {
        window.showToast(handleSupabaseError(error), 'bg-red-500');
    } else {
        window.showToast('¡Cuenta Creada! Revisa tu correo para verificar tu cuenta.', 'bg-emerald-500');
        document.getElementById('registerForm').reset();
        window.toggleAuthMode();
    }
    btn.innerHTML = orig;
};

// RECUPERAR CONTRASEÑA
window.handlePasswordReset = async () => {
    const email = document.getElementById('loginEmail').value;
    if (!email) {
        return window.showToast('Escribe tu correo en el campo de arriba para recuperar.', 'bg-[#f15a24]');
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo: window.location.origin 
    });
    
    if (error) {
        window.showToast(handleSupabaseError(error), 'bg-red-500');
    } else {
        window.showToast('Enlace de recuperación enviado al correo.', 'bg-emerald-500');
    }
};

// NOTIFICACIONES (TOASTS)
window.showToast = (msg, bgClass = 'bg-[#42cbf5]') => {
    const t = document.getElementById('toast'); 
    document.getElementById('toastMsg').innerText = msg;
    
    // Configurar icono según si es error o éxito
    const icon = document.getElementById('toastIcon');
    icon.className = bgClass.includes('red') ? 'fa-solid fa-circle-exclamation text-xl' : 'fa-solid fa-circle-check text-xl';
    
    t.className = `fixed bottom-6 right-6 text-white px-7 py-4 rounded-full shadow-2xl transition-all z-[90] flex items-center gap-3 font-bold translate-y-20 opacity-0 ${bgClass}`;
    
    setTimeout(() => t.classList.remove('translate-y-20', 'opacity-0'), 10); 
    setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 4500);
};