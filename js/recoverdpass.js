
  
        import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';
        const SUPABASE_URL = 'https://jsxwprhudkzoadvxohah.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_91yOfKfjuIjcS7eESuzvKw_TYZl0520';
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        window.showToast = (msg, isError = false) => {
            const t = document.getElementById('toast'), iC = document.getElementById('toastIconContainer'), i = document.getElementById('toastIcon'); 
            document.getElementById('toastMsg').innerText = msg;
            if(isError) { iC.className = "w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0"; i.className = "fa-solid fa-exclamation"; }
            else { iC.className = "w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0"; i.className = "fa-solid fa-check"; }
            t.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 4000);
        };

        document.addEventListener('DOMContentLoaded', () => {
            const hash = window.location.hash;
            if (hash && hash.includes('type=recovery')) {
                // Todo bien, el enlace parece válido, mostramos el formulario
                document.getElementById('verifyingState').classList.add('hidden');
                document.getElementById('recoveryView').classList.remove('hidden');
            } else {
                // No venimos de un enlace válido
                document.getElementById('verifyingState').classList.add('hidden');
                document.getElementById('errorView').classList.remove('hidden');
            }
        });


        window.handleUpdatePassword = async (e) => {
            e.preventDefault();
            const pwd = document.getElementById('newPwd').value;
            const btn = document.getElementById('updatePwdBtn');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Guardando...'; 
            btn.disabled = true;

            const { data, error } = await supabase.auth.updateUser({ password: pwd });

            if (error) {
                window.showToast(error.message, true);
                btn.innerHTML = 'Guardar Contraseña'; 
                btn.disabled = false;
            } else {
                window.showToast('¡Contraseña actualizada con éxito!');
                setTimeout(() => { 
                    window.location.href = 'principal.html'; 
                }, 1500);
            }
        };
    