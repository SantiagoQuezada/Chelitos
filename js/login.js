    
        import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';

        const SUPABASE_URL = 'https://jsxwprhudkzoadvxohah.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_91yOfKfjuIjcS7eESuzvKw_TYZl0520'; 
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // 1. Verificación ULTRA ESTRICTA: Auth + Base de Datos
        const verifySessionStrict = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                console.log("Sesión local encontrada. Verificando validez...");
                
                // Paso A: Verificar que el usuario no haya sido borrado de Supabase Auth
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                
                if (authError || !user) {
                    console.warn("Sesión fantasma. Limpiando...");
                    await supabase.auth.signOut();
                    return;
                }

                // Paso B: Verificar que el usuario no haya sido borrado de TU TABLA (profiles)
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profile) {
                    console.warn("El usuario existe en caché pero NO en la tabla profiles. Bloqueando entrada...");
                    await supabase.auth.signOut(); // Destruye la sesión porque borraste los datos de la base de datos
                    return;
                }

                // Si pasa TODAS las pruebas de seguridad, entonces sí entra al Dashboard
                window.location.href = 'principal.html';
            }
        };

        // Ejecutamos la verificación al cargar la página
        verifySessionStrict();

        // --- LÓGICA DE INTERFAZ Y FORMULARIOS ---
        window.isLoginMode = true;

        window.toggleAuthMode = () => {
            window.isLoginMode = !window.isLoginMode;
            document.getElementById('loginForm').classList.toggle('hidden', !window.isLoginMode);
            document.getElementById('registerForm').classList.toggle('hidden', window.isLoginMode);
            document.getElementById('authSubtitle').innerText = window.isLoginMode ? 'Controla tu dinero inteligentemente.' : 'Únete a Chelitos y organiza tus finanzas.';
            document.getElementById('authToggleText').innerHTML = window.isLoginMode 
                ? '¿No tienes cuenta? <button type="button" onclick="window.toggleAuthMode()" class="font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors ml-1">Regístrate aquí</button>' 
                : '¿Ya tienes una cuenta? <button type="button" onclick="window.toggleAuthMode()" class="font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors ml-1">Inicia sesión</button>';
        };

        const handleSupabaseError = (err) => {
            console.error("🔥 Error completo de Supabase:", err); 
            const msg = err.message.toLowerCase();
            if (msg.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
            if (msg.includes('user already registered')) return 'El correo ya está registrado. Inicia sesión.';
            if (msg.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
            if (msg.includes('email rate limit exceeded')) return 'Demasiados intentos. Por favor espera un momento.';
            if (msg.includes('email not confirmed')) return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
            if (msg.includes('database error saving new user')) return 'Error en base de datos. Revisa el Trigger SQL.';
            if (msg.includes('jwt') || msg.includes('api key')) return 'Error de conexión. API Key incorrecta.';
            return 'Ocurrió un error: ' + err.message;
        };

        window.handleEmailLogin = async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const pwd = document.getElementById('loginPassword').value;
            const btn = document.getElementById('loginBtn');
            const orig = btn.innerHTML; 
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            
            // Validamos estrictamente las credenciales
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
            
            if (error) {
                window.showToast(handleSupabaseError(error), 'bg-red-500');
                btn.innerHTML = orig;
            } else {
                window.showToast('Iniciando sesión...', 'bg-[#42cbf5]');
                // REDIRECCIÓN MANUAL Y SEGURA SOLO DESPUÉS DE VALIDAR LOGIN EXITOSO
                window.location.href = 'principal.html';
            }
        };

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

        window.openModal = (m, c) => { const el = document.getElementById(m), cc = document.getElementById(c); el.classList.remove('hidden'); setTimeout(()=>{el.classList.remove('opacity-0'); cc.classList.remove('scale-95');},10); }
        window.closeModal = (m, c) => { const el = document.getElementById(m), cc = document.getElementById(c); el.classList.add('opacity-0'); cc.classList.add('scale-95'); setTimeout(()=>el.classList.add('hidden'),300); }

        window.executePasswordReset = async (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            const btn = document.getElementById('resetBtn');
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-slate-900"></i>';
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
            if (error) { window.showToast(handleSupabaseError(error), 'bg-red-500'); } 
            else { window.showToast('Enlace de recuperación enviado al correo.', 'bg-emerald-500'); window.closeModal('forgotPasswordModal', 'forgotPasswordContent'); }
            btn.innerHTML = orig;
        };

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
            
            console.log("Enviando datos a Supabase para registro...");
            
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
                btn.innerHTML = orig;
            } else {
                // Evaluamos si el sistema está pidiendo confirmación de correo o si lo saltó
                if (!data.session) {
                    // Si no hay sesión inmediata, el Confirm Email está ENCENDIDO (Lo correcto)
                    window.showToast('¡Cuenta Creada! Revisa tu correo electrónico para verificarla.', 'bg-emerald-500');
                    document.getElementById('registerForm').reset();
                    window.toggleAuthMode();
                    btn.innerHTML = orig;
                } else {
                    // Si entra directo, significa que tienes el "Confirm Email" APAGADO en Supabase
                    window.showToast('¡Cuenta Creada! Entrando automáticamente...', 'bg-emerald-500');
                    console.warn("Nota: Confirmación de correo está desactivada en tu panel de Supabase.");
                }
            }
        };

        window.showToast = (msg, bgClass = 'bg-[#42cbf5]') => {
            const t = document.getElementById('toast'); 
            document.getElementById('toastMsg').innerText = msg;
            
            const icon = document.getElementById('toastIcon');
            icon.className = bgClass.includes('red') ? 'fa-solid fa-circle-exclamation text-xl' : 'fa-solid fa-circle-check text-xl';
            
            t.className = `fixed bottom-6 right-6 text-white px-7 py-4 rounded-full shadow-2xl transition-all z-[200] flex items-center gap-3 font-bold translate-y-20 opacity-0 ${bgClass}`;
            
            setTimeout(() => t.classList.remove('translate-y-20', 'opacity-0'), 10); 
            setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 4500);
        };
    