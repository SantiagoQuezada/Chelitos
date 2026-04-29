
        import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';
        const SUPABASE_URL = 'https://jsxwprhudkzoadvxohah.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_91yOfKfjuIjcS7eESuzvKw_TYZl0520';
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        window.transactions = [];
        window.customCategories = [];
        window.accounts = [];
        window.cards = [];
        window.investments = [];
        window.goals = [];
        window.subscriptions = [];
        window.debts = [];
        window.userPreferences = { budget: 15000, currency: 'DOP' };
        window.currentView = 'dashboard';
        window.editingTxId = null;

        let expenseChartInstance = null;
        let historyChartInstance = null;
        let currentUser = null;

        document.getElementById('currentDateHeader').innerText = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        window.currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

        function getLocalISOString() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16); }
        window.validateNumber = (input) => { input.value = input.value.replace(/[^0-9.]/g, ''); if ((input.value.match(/\./g) || []).length > 1) input.value = input.value.replace(/\.$/, ''); };
        window.stepAmount = (id, chg) => { const i = document.getElementById(id); if(!i) return; let n = (parseFloat(i.value)||0) + chg; i.value = n < 0 ? 0 : Number.isInteger(n) ? n : n.toFixed(2); };

        window.redirectToLogin = () => {
            document.body.innerHTML = '<div class="fixed inset-0 bg-darker flex flex-col items-center justify-center z-[200]"><i class="fa-solid fa-shield-halved text-5xl text-primary mb-4 animate-pulse"></i><h1 class="text-2xl font-bold text-white mb-2">Sesión Cerrada</h1><p class="text-gray-400">Por favor, inicia sesión para continuar.</p><a href="login.html" class="mt-6 bg-primary text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-cyan-300 transition-colors shadow-lg shadow-primary/20">Ir al Login</a></div>';
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session || !session.user) window.redirectToLogin();
            else { currentUser = session.user; initDashboardUser(session.user); }
        }).catch(() => {
            window.redirectToLogin();
        });

        supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') window.redirectToLogin();
        });

        async function initDashboardUser(user) {
            let name = user.user_metadata?.full_name || user.email.split('@')[0];
            document.getElementById('userNameHeader').innerText = name;
            document.getElementById('settingProfileName').value = name;
            document.getElementById('userIdDisplay').value = user.email;
            document.getElementById('dropdownEmail').innerText = user.email;
            document.getElementById('userProfileBadge').classList.replace('hidden', 'flex');

            await loadDataFromSupabase();

            const loader = document.getElementById('loadingOverlay');
            if (loader) { loader.classList.add('opacity-0'); setTimeout(() => loader.classList.add('hidden'), 500); }
            const cloudEl = document.getElementById('cloudStatus');
            if (cloudEl) cloudEl.innerHTML = '<i class="fa-solid fa-cloud-check text-emerald-400"></i>';

            window.updateUI();
        }

        async function loadDataFromSupabase() {
            if (!currentUser) return;
            const uid = currentUser.id;

            const [tx, acc, crd, inv, gls, sub, dbts, cat, pref] = await Promise.all([
                supabase.from('transactions').select('*').eq('user_id', uid),
                supabase.from('accounts').select('*').eq('user_id', uid),
                supabase.from('cards').select('*').eq('user_id', uid),
                supabase.from('investments').select('*').eq('user_id', uid),
                supabase.from('goals').select('*').eq('user_id', uid),
                supabase.from('subscriptions').select('*').eq('user_id', uid),
                supabase.from('debts').select('*').eq('user_id', uid),
                supabase.from('categories').select('*').eq('user_id', uid),
                supabase.from('user_preferences').select('*').eq('user_id', uid).maybeSingle()
            ]);

            if (tx.data) window.transactions = tx.data;
            if (acc.data) window.accounts = acc.data;
            if (crd.data) window.cards = crd.data;
            if (inv.data) window.investments = inv.data;
            if (gls.data) window.goals = gls.data;
            if (sub.data) window.subscriptions = sub.data;
            if (dbts.data) window.debts = dbts.data;
            if (cat.data) window.customCategories = cat.data;
            if (pref.data) window.userPreferences = { budget: pref.data.budget, currency: pref.data.currency };
        }

        
        window.toggleUserMenu = () => {
            const menu = document.getElementById('userDropdown');
            menu.classList.toggle('hidden');
        };

     
        document.addEventListener('click', (e) => {
            const badge = document.getElementById('userProfileBadge');
            const menu = document.getElementById('userDropdown');
            if (badge && menu && !badge.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });

        window.handleLogout = async () => { await supabase.auth.signOut(); };

        window.navigateTo = (v) => {
            document.querySelectorAll('.view-section').forEach(el => { el.classList.add('hidden'); el.classList.remove('opacity-100'); });
            const act = document.getElementById(`view-${v}`);
            if (act) { act.classList.remove('hidden'); setTimeout(() => act.classList.add('opacity-100'), 10); }
            document.querySelectorAll('.nav-link').forEach(el => { el.classList.replace('text-white', 'text-gray-400'); el.classList.remove('bg-slate-800/80', 'shadow-md'); });
            const aLink = document.getElementById(`nav-${v}`);
            if(aLink) { aLink.classList.replace('text-gray-400', 'text-white'); aLink.classList.add('bg-slate-800/80', 'shadow-md'); }
            window.updateUI();
        };

        window.changeGlobalMonth = () => { window.currentMonthStr = document.getElementById('globalMonthFilter').value; window.updateUI(); };

        window.updateUI = () => {
            updateCategorySelects(); renderPortfolio(); renderTransactions(); calculateBalancesAndBudget(); updateCharts();
            renderGoals(); renderSubscriptions(); renderDebts();
            if(window.renderCategoriesUI) window.renderCategoriesUI();
        };

        const formatCurrency = (amount, cur = null) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: cur || window.userPreferences.currency || 'DOP' }).format(amount);

        function calculateBalancesAndBudget() {
            const assets = window.accounts.reduce((a,c) => a + c.balance, 0) + window.investments.reduce((a,c) => a + c.amount, 0);
            document.getElementById('netWorthDisplay').innerText = formatCurrency(assets);
            document.getElementById('totalAssets').innerText = formatCurrency(assets);

            const mTx = window.transactions.filter(t => t.date.startsWith(window.currentMonthStr));
            const mExp = mTx.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);
            const mInc = mTx.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0);

            document.getElementById('monthlyExpense').innerText = formatCurrency(mExp);
            document.getElementById('monthlyIncome').innerText = formatCurrency(mInc);

            const b = window.userPreferences.budget || 10000;
            const pct = Math.min((mExp / b) * 100, 100).toFixed(1);

            document.getElementById('budgetSpent').innerText = formatCurrency(mExp);
            document.getElementById('budgetTotal').innerText = formatCurrency(b);

            const daysInMonth = new Date(parseInt(window.currentMonthStr.split('-')[0]), parseInt(window.currentMonthStr.split('-')[1]), 0).getDate();
            const daysLeft = daysInMonth - new Date().getDate() > 0 ? daysInMonth - new Date().getDate() : 1;
            document.getElementById('dailySuggestedBudget').innerText = `${formatCurrency(Math.max((b - mExp) / daysLeft, 0))} / día`;

            const bar = document.getElementById('budgetProgressBar');
            if(bar) {
                bar.style.width = `${pct}%`;
                bar.className = `h-full transition-all duration-1000 relative ${pct>=90?'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : pct>=75?'bg-gradient-to-r from-orange-400 to-secondary shadow-[0_0_15px_rgba(241,90,36,0.4)]' : 'bg-gradient-to-r from-cyan-500 to-primary shadow-[0_0_15px_rgba(66,203,245,0.4)]'}`;
            }

            let s = 100; if(pct>100) s-=30; else if(pct>80) s-=10; if(mExp > mInc && mInc > 0) s-=15;
            document.getElementById('healthScoreText').innerText = s;
            document.getElementById('healthScoreCircle').setAttribute('stroke-dasharray', `${s}, 100`);
            document.getElementById('healthScoreCircle').setAttribute('class', `transition-all duration-1000 ease-out ${s > 70 ? 'text-emerald-400' : s > 40 ? 'text-orange-400' : 'text-red-500'}`);
        }

        window.renderTransactions = () => {
            // Dashboard List (Resumen rápido del mes actual)
            const dashList = document.getElementById('dashboardTransactionList');
            let mTx = window.transactions.filter(t => t.date.startsWith(window.currentMonthStr)).sort((a,b)=>new Date(b.date)-new Date(a.date));
            if(dashList) {
                dashList.innerHTML = '';
                document.getElementById('dashEmptyState').classList.toggle('hidden', mTx.length > 0);
                document.getElementById('dashEmptyState').classList.toggle('flex', mTx.length === 0);
                mTx.slice(0,5).forEach(t => {
                    const isInc = t.type === 'income';
                    dashList.innerHTML += `<tr class="border-b border-slate-700/30 hover:bg-slate-800/20"><td class="p-4 text-white font-medium">${t.description}</td><td class="p-4"><span class="bg-slate-800 text-[10px] px-2.5 py-1 rounded text-gray-300 font-bold">${t.category}</span></td><td class="p-4 text-gray-400 text-sm">${new Date(t.date).toLocaleDateString('es-ES', {day:'numeric',month:'short'})}</td><td class="p-4 text-right font-bold ${isInc?'text-emerald-400':'text-red-400'}">${isInc?'+':'-'}${formatCurrency(t.amount)}</td></tr>`;
                });
            }

            // Full List (Lista completa con filtros de Búsqueda, Categoría y Tipo)
            const fullList = document.getElementById('fullTransactionList');
            if(fullList) {
                fullList.innerHTML = '';
                const sQ = (document.getElementById('searchTransaction')?.value || '').toLowerCase();
                const cQ = document.getElementById('filterCategory')?.value || '';
                const tQ = document.getElementById('filterType')?.value || '';

                let fTx = window.transactions.sort((a,b)=>new Date(b.date)-new Date(a.date)).filter(t => 
                    (t.description.toLowerCase().includes(sQ) || t.amount.toString().includes(sQ)) && 
                    (cQ === '' || t.category === cQ) &&
                    (tQ === '' || t.type === tQ)
                );

                document.getElementById('fullEmptyState').classList.toggle('hidden', fTx.length > 0);
                document.getElementById('fullEmptyState').classList.toggle('flex', fTx.length === 0);

                fTx.forEach(t => {
                    const isInc = t.type === 'income';
                    fullList.innerHTML += `<tr class="border-b border-slate-700/30 hover:bg-slate-800/30 group"><td class="p-4 text-white font-medium">${t.description}</td><td class="p-4"><span class="bg-slate-800 border border-slate-700 text-[10px] px-2.5 py-1 rounded text-gray-300 font-bold">${t.category}</span></td><td class="p-4 text-gray-400 text-sm">${new Date(t.date).toLocaleString('es-ES', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td><td class="p-4 text-right font-bold text-lg ${isInc?'text-emerald-400':'text-red-400'}">${isInc?'+':'-'}${formatCurrency(t.amount)}</td><td class="p-4 text-center"><button onclick="window.editTransaction('${t.id}')" class="text-gray-500 hover:text-primary bg-slate-800 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 hover:scale-110 mr-1"><i class="fa-solid fa-pen text-xs"></i></button><button onclick="window.deleteTransaction('${t.id}')" class="text-gray-500 hover:text-red-400 bg-slate-800 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 hover:scale-110"><i class="fa-solid fa-trash text-xs"></i></button></td></tr>`;
                });
            }
        };

        window.deleteTransaction = async (id) => {
            if(!confirm("¿Eliminar transacción?")) return;
            await supabase.from('transactions').delete().eq('id', id);
            window.transactions = window.transactions.filter(t => t.id !== id);
            window.updateUI(); window.showToast('Transacción eliminada', 'bg-red-500');
        };

        window.editTransaction = (id) => {
            const t = window.transactions.find(x => x.id === id);
            if(!t) return;
            window.editingTxId = id;
            document.getElementById('modalTxTitle').innerText = 'Editar Transacción';
            document.getElementById('amount').value = t.amount;
            document.getElementById('description').value = t.description;
            document.getElementById('category').value = t.category;
            document.getElementById('date').value = t.date;
            document.querySelector(`input[name="type"][value="${t.type}"]`).checked = true;
            openModalUI('transactionModal', 'modalContent');
        };

        window.exportCSV = () => {
            if(window.transactions.length === 0) return window.showToast('No hay datos', 'bg-orange-500');
            const rows = [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto'], ...window.transactions.map(t => [t.date.split('T')[0], t.type === 'income' ? 'Ingreso' : 'Gasto', t.category, t.description, t.amount])];
            const link = document.createElement("a");
            link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n")));
            link.setAttribute("download", `Chelitos_Export_${window.currentMonthStr}.csv`);
            document.body.appendChild(link); link.click();
            window.showToast('Exportación exitosa');
        };

        function updateCharts() {
            const ctx1 = document.getElementById('expenseChart');
            if(ctx1) {
                const exps = window.transactions.filter(t=>t.type==='expense' && t.date.startsWith(window.currentMonthStr));
                const data = {}; exps.forEach(t=>data[t.category]=(data[t.category]||0)+t.amount);
                if(expenseChartInstance) expenseChartInstance.destroy();
                if(Object.keys(data).length > 0) {
                    document.getElementById('noDataChart').classList.replace('flex','hidden');
                    expenseChartInstance = new Chart(ctx1.getContext('2d'), { type: 'doughnut', data: { labels: Object.keys(data), datasets: [{ data: Object.values(data), backgroundColor: ['#42cbf5', '#f15a24', '#10b981', '#8b5cf6', '#eab308', '#ec4899'], borderWidth: 0 }] }, options: { cutout: '70%', plugins: { legend: { position: 'right', labels: {color: '#cbd5e1'} } } } });
                } else document.getElementById('noDataChart').classList.replace('hidden','flex');
            }
            const ctx2 = document.getElementById('historyChart');
            if(ctx2) {
                const lbls = [], incs = [], exps = [];
                for(let i=5; i>=0; i--) {
                    let d = new Date(); d.setMonth(d.getMonth() - i);
                    lbls.push(d.toLocaleString('es-ES', {month: 'short'}).toUpperCase());
                    let mTx = window.transactions.filter(t => t.date.startsWith(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`));
                    incs.push(mTx.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0)); exps.push(mTx.filter(t=>t.type==='expense').reduce((a,c)=>a+c.amount,0));
                }
                if(historyChartInstance) historyChartInstance.destroy();
                historyChartInstance = new Chart(ctx2.getContext('2d'), { type: 'bar', data: { labels: lbls, datasets: [{ label: 'Ingresos', data: incs, backgroundColor: '#10b981', borderRadius: 4 }, { label: 'Gastos', data: exps, backgroundColor: '#ef4444', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } }, plugins: { legend: { labels: { color: '#cbd5e1' } } } } });
            }
        }

        function openModalUI(m, c) { const el = document.getElementById(m), cc = document.getElementById(c); el.classList.remove('hidden'); setTimeout(()=>{el.classList.remove('opacity-0'); cc.classList.remove('scale-95');},10); }
        window.closeModal = (m, c) => { const el = document.getElementById(m), cc = document.getElementById(c); el.classList.add('opacity-0'); cc.classList.add('scale-95'); setTimeout(()=>el.classList.add('hidden'),300); }

        window.openModal = () => { window.editingTxId = null; document.getElementById('modalTxTitle').innerText = 'Nueva Transacción'; document.getElementById('transactionForm').reset(); document.getElementById('date').value = getLocalISOString(); openModalUI('transactionModal', 'modalContent'); }
        
        window.handleFormSubmit = async (e) => {
            e.preventDefault();
            const obj = { user_id: currentUser.id, type: document.querySelector('input[name="type"]:checked').value, amount: parseFloat(document.getElementById('amount').value), description: document.getElementById('description').value, category: document.getElementById('category').value, date: document.getElementById('date').value };
            if (window.editingTxId) {
                await supabase.from('transactions').update(obj).eq('id', window.editingTxId);
                window.transactions = window.transactions.map(t => t.id === window.editingTxId ? { ...obj, id: window.editingTxId } : t);
            } else {
                const { data } = await supabase.from('transactions').insert([obj]).select();
                if(data) window.transactions.push(data[0]);
            }
            window.updateUI(); window.closeModal('transactionModal', 'modalContent'); window.showToast(window.editingTxId ? 'Transacción actualizada' : 'Transacción registrada');
        };

        window.openBudgetPrompt = () => { document.getElementById('quickBudgetInput').value = window.userPreferences.budget; openModalUI('budgetModal', 'budgetContent'); };
        window.saveQuickBudget = async () => {
            const v = parseFloat(document.getElementById('quickBudgetInput').value);
            if(v && v > 0) {
                window.userPreferences.budget = v;
                await supabase.from('user_preferences').upsert({ user_id: currentUser.id, budget: v, currency: window.userPreferences.currency });
                window.updateUI(); window.closeModal('budgetModal', 'budgetContent'); window.showToast('Presupuesto actualizado');
            }
        };

        // --- Nuevas funciones de Ajustes y Seguridad ---

        window.requestPasswordReset = async () => {
            if (!currentUser || !currentUser.email) return;
            
            // Construimos la URL de forma más segura detectando en qué carpeta estás
            const currentUrl = window.location.href;
            const redirectUrl = currentUrl.replace('principal.html', 'recoverdpass.html');

            const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
                redirectTo: redirectUrl
            });
            
            if (error) {
                console.error("Detalle del error de Supabase:", error);
                // Ahora mostrará el error real que envía Supabase en vez del genérico
                window.showToast(error.message, 'bg-red-500');
            } else {
                window.showToast('Enlace de recuperación enviado a tu correo.', 'bg-emerald-500');
            }
        };

        window.openDeleteAccountModal = () => {
            document.getElementById('deleteAccountPwd').value = '';
            openModalUI('deleteAccountModal', 'deleteAccountContent');
        };

        window.handleDeleteAccount = async (e) => {
            e.preventDefault();
            const pwd = document.getElementById('deleteAccountPwd').value;
            const btn = document.getElementById('deleteAccountBtn');
            const origText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Verificando...';
            btn.disabled = true;

            // 1. Verificamos la contraseña (re-autenticando al usuario)
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: currentUser.email,
                password: pwd
            });

            if (authError) {
                window.showToast('Contraseña incorrecta. Inténtalo de nuevo.', 'bg-red-500');
                btn.innerHTML = origText;
                btn.disabled = false;
                return;
            }

            try {
                const uid = currentUser.id;
                
                // NOTA TÉCNICA: Supabase en el frontend no permite borrar el usuario por seguridad.
                // Intentamos llamar a un procedimiento almacenado SQL si lo tienes creado.
                const { error: rpcError } = await supabase.rpc('delete_user');
                
                if (rpcError) {
                    // Plan de Contingencia: Borramos manualmente todos los datos del usuario usando sus políticas RLS
                    await Promise.all([
                        supabase.from('transactions').delete().eq('user_id', uid),
                        supabase.from('accounts').delete().eq('user_id', uid),
                        supabase.from('cards').delete().eq('user_id', uid),
                        supabase.from('investments').delete().eq('user_id', uid),
                        supabase.from('goals').delete().eq('user_id', uid),
                        supabase.from('subscriptions').delete().eq('user_id', uid),
                        supabase.from('debts').delete().eq('user_id', uid),
                        supabase.from('categories').delete().eq('user_id', uid),
                        supabase.from('user_preferences').delete().eq('user_id', uid)
                    ]);
                }

                // 3. Cerramos sesión permanentemente
                await supabase.auth.signOut();
                window.closeModal('deleteAccountModal', 'deleteAccountContent');
                window.showToast('Tu cuenta y datos han sido eliminados.', 'bg-emerald-500');
                
                // Redirigir después del mensaje
                setTimeout(() => window.redirectToLogin(), 1500);

            } catch (err) {
                window.showToast('Error al procesar la solicitud.', 'bg-red-500');
                btn.innerHTML = origText;
                btn.disabled = false;
            }
        };

        // --- Fin Nuevas Funciones ---

        window.calculateLoan = (e) => { e.preventDefault(); const a=parseFloat(document.getElementById('calcLoanAmount').value), r=parseFloat(document.getElementById('calcLoanRate').value)/100/12, m=parseInt(document.getElementById('calcLoanMonths').value); document.getElementById('loanResultMonthly').innerText = formatCurrency((a*r*Math.pow(1+r,m))/(Math.pow(1+r,m)-1)); document.getElementById('calcLoanResult').classList.remove('hidden'); };
        window.calculateCompound = (e) => { e.preventDefault(); const p=parseFloat(document.getElementById('calcCompInitial').value), pmt=parseFloat(document.getElementById('calcCompMonthly').value), r=parseFloat(document.getElementById('calcCompRate').value)/100, t=parseInt(document.getElementById('calcCompYears').value); document.getElementById('compResultTotal').innerText = formatCurrency(p*Math.pow(1+r/12, 12*t) + pmt*((Math.pow(1+r/12, 12*t)-1)/(r/12))); document.getElementById('calcCompResult').classList.remove('hidden'); };
        window.calculateSimple = (e) => { e.preventDefault(); const p=parseFloat(document.getElementById('calcSimpInitial').value), r=parseFloat(document.getElementById('calcSimpRate').value)/100, t=parseFloat(document.getElementById('calcSimpYears').value); document.getElementById('simpResultTotal').innerText = formatCurrency(p * (1 + (r * t))); document.getElementById('calcSimpResult').classList.remove('hidden'); };
        window.calculateSavingsGoal = (e) => { e.preventDefault(); const target=parseFloat(document.getElementById('calcGoalAmount').value), m=parseInt(document.getElementById('calcGoalMonths').value); document.getElementById('goalResultMonthly').innerText = formatCurrency(target/m) + ' /mes'; document.getElementById('calcGoalResult').classList.remove('hidden'); };

        window.saveSettings = async (e) => {
            e.preventDefault();
            window.userPreferences.currency = document.getElementById('settingCurrency').value;
            await supabase.from('user_preferences').upsert({ user_id: currentUser.id, budget: window.userPreferences.budget, currency: window.userPreferences.currency });
            window.showToast('Preferencias guardadas'); window.updateUI();
        };

        window.saveProfile = async (e) => {
            e.preventDefault();
            const name = document.getElementById('settingProfileName').value;
            await supabase.auth.updateUser({ data: { full_name: name } });
            document.getElementById('userNameHeader').innerText = name;
            window.showToast('Perfil actualizado exitosamente');
        };

        window.handleAddCategory = async (e) => {
            e.preventDefault();
            const i = document.getElementById('newCategoryName'), n = i.value.trim();
            if(n && !window.getAllCategories().includes(n)) {
                const { data } = await supabase.from('categories').insert([{ user_id: currentUser.id, name: n }]).select();
                if(data) window.customCategories.push(data[0]);
                i.value = ''; window.updateUI(); window.showToast('Categoría añadida');
            }
        };

        window.renderCategoriesUI = () => { const l=document.getElementById('categoryListUI'); if(l) l.innerHTML = window.getAllCategories().map(c => `<li class="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex justify-between items-center"><span class="text-white font-medium">${c}</span>${!['Comida','Transporte','Vivienda','Entretenimiento','Salario','Otros','Ahorro'].includes(c) ? `<button onclick="window.deleteCategory('${c}')" class="text-gray-500 hover:text-red-400"><i class="fa-solid fa-trash text-xs"></i></button>` : '<span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Fijo</span>'}</li>`).join(''); };
        
        window.deleteCategory = async (n) => {
            await supabase.from('categories').delete().eq('user_id', currentUser.id).eq('name', n);
            window.customCategories = window.customCategories.filter(c => c.name !== n);
            window.updateUI();
        };

        window.getAllCategories = () => [...new Set([...['Comida','Transporte','Vivienda','Entretenimiento','Salario','Otros','Ahorro'], ...window.customCategories.map(c=>c.name)])].sort();
        function updateCategorySelects() { const o = window.getAllCategories().map(c=>`<option value="${c}">${c}</option>`).join(''); if(document.getElementById('category')) document.getElementById('category').innerHTML = o; if(document.getElementById('filterCategory')) document.getElementById('filterCategory').innerHTML = '<option value="">Categorías (Todas)</option>' + o; }

        window.showToast = (msg, bg = 'bg-slate-800') => {
            const t = document.getElementById('toast'), iC = document.getElementById('toastIconContainer'), i = document.getElementById('toastIcon'); document.getElementById('toastMsg').innerText = msg;
            if(bg.includes('red')) { iC.className = "w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center"; i.className = "fa-solid fa-exclamation"; }
            else if (bg.includes('orange')) { iC.className = "w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center"; i.className = "fa-solid fa-info"; }
            else { iC.className = "w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center"; i.className = "fa-solid fa-check"; }
            t.className = `fixed bottom-6 right-6 lg:bottom-8 lg:right-8 ${bg} text-white border border-slate-700/50 px-6 py-4 rounded-2xl shadow-2xl transition-all z-[100] flex items-center gap-3 font-semibold`;
            setTimeout(() => t.classList.remove('translate-y-20', 'opacity-0'), 10); setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3500);
        };

        function renderPortfolio() {
            const ag = document.getElementById('accountsGrid'), cg = document.getElementById('cardsGrid'), ig = document.getElementById('invGrid');
            if(ag) { ag.innerHTML=''; document.getElementById('accountsEmpty').classList.toggle('hidden', window.accounts.length>0); window.accounts.forEach(a => { ag.innerHTML += `<div class="glass-panel rounded-3xl p-6 relative group border-l-4 border-primary"><button onclick="window.deleteDocItem('accounts','${a.id}')" class="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"><i class="fa-solid fa-trash"></i></button><h3 class="text-white font-bold">${a.name}</h3><p class="text-gray-400 text-xs mb-4">${a.bank} • ${a.type}</p><p class="text-3xl font-black text-white">${formatCurrency(a.balance, a.currency)}</p></div>`; }); }
            if(cg) { cg.innerHTML=''; document.getElementById('cardsEmpty').classList.toggle('hidden', window.cards.length>0); window.cards.forEach(c => { cg.innerHTML += `<div class="credit-card-bg rounded-3xl p-6 relative group h-40 flex flex-col justify-between"><button onclick="window.deleteDocItem('cards','${c.id}')" class="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 z-20"><i class="fa-solid fa-trash"></i></button><div class="flex justify-between items-start z-10"><div><h3 class="text-white font-bold text-sm">${c.bank.toUpperCase()}</h3><p class="text-gray-400 text-xs">${c.name}</p></div><i class="fa-brands fa-cc-${c.network.toLowerCase()} text-3xl text-gray-300"></i></div><div class="z-10"><p class="text-[10px] text-gray-400">LÍMITE</p><p class="text-2xl font-bold text-white">${formatCurrency(c.limit_amount, c.currency)}</p></div></div>`; }); }
            if(ig) { ig.innerHTML=''; document.getElementById('invEmpty').classList.toggle('hidden', window.investments.length>0); window.investments.forEach(i => { ig.innerHTML += `<div class="glass-panel rounded-3xl p-6 relative group border-l-4 border-income"><button onclick="window.deleteDocItem('investments','${i.id}')" class="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"><i class="fa-solid fa-trash"></i></button><h3 class="text-white font-bold">Certificado</h3><p class="text-gray-400 text-xs mb-4">${i.bank} • Vence: ${i.date}</p><div class="flex justify-between items-end"><p class="text-2xl font-black text-income">${formatCurrency(i.amount)}</p><span class="text-xs bg-income/20 border border-income/30 px-2 py-1 rounded-lg">${i.rate}%</span></div></div>`; }); }
        }

        window.deleteDocItem = async (col, id) => {
            if(!confirm("¿Eliminar registro?")) return;
            await supabase.from(col).delete().eq('id', id);
            window[col] = window[col].filter(i => i.id !== id);
            window.updateUI(); window.showToast('Eliminado', 'bg-orange-500');
        };

        window.openAccountModal = () => { document.getElementById('accName').value=''; document.getElementById('accBalance').value=''; openModalUI('accountModal', 'accountContent'); };
        window.handleAccountSubmit = async (e) => {
            e.preventDefault();
            const obj = { user_id: currentUser.id, name: document.getElementById('accName').value, bank: document.getElementById('accBank').value, type: document.getElementById('accType').value, currency: document.getElementById('accCurrency').value, balance: parseFloat(document.getElementById('accBalance').value) };
            const { data } = await supabase.from('accounts').insert([obj]).select();
            if(data) window.accounts.push(data[0]);
            window.updateUI(); window.closeModal('accountModal', 'accountContent'); window.showToast('Cuenta Guardada');
        };

        window.openCardModal = () => { document.getElementById('cardName').value=''; document.getElementById('cardLimit').value=''; openModalUI('cardModal', 'cardModalContent'); };
        window.handleCardSubmit = async (e) => {
            e.preventDefault();
            const obj = { user_id: currentUser.id, name: document.getElementById('cardName').value, network: document.getElementById('cardNetwork').value, bank: document.getElementById('cardBank').value, currency: document.getElementById('cardCurrency').value, limit_amount: parseFloat(document.getElementById('cardLimit').value) };
            const { data } = await supabase.from('cards').insert([obj]).select();
            if(data) window.cards.push(data[0]);
            window.updateUI(); window.closeModal('cardModal', 'cardModalContent'); window.showToast('Tarjeta Guardada');
        };

        window.openInvModal = () => { document.getElementById('invBank').value=''; document.getElementById('invAmount').value=''; document.getElementById('invRate').value=''; openModalUI('invModal', 'invContent'); };
        window.handleInvSubmit = async (e) => {
            e.preventDefault();
            const obj = { user_id: currentUser.id, bank: document.getElementById('invBank').value, amount: parseFloat(document.getElementById('invAmount').value), rate: parseFloat(document.getElementById('invRate').value), date: document.getElementById('invDate').value };
            const { data } = await supabase.from('investments').insert([obj]).select();
            if(data) window.investments.push(data[0]);
            window.updateUI(); window.closeModal('invModal', 'invContent'); window.showToast('Inversión Registrada');
        };

        function renderGoals() {
            const gg = document.getElementById('goalsGrid'); gg.innerHTML=''; document.getElementById('goalsEmptyState').classList.toggle('hidden', window.goals.length>0); document.getElementById('goalsEmptyState').classList.toggle('block', window.goals.length===0);
            window.goals.forEach(g => { gg.innerHTML += `<div class="glass-panel rounded-3xl p-6 relative group hover-lift"><button onclick="window.deleteDocItem('goals','${g.id}')" class="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><i class="fa-solid fa-trash"></i></button><h3 class="text-xl font-bold text-white mb-1">${g.name}</h3><p class="text-primary text-2xl font-black mb-4">${formatCurrency(g.amount)}</p><div class="bg-slate-900 rounded-full h-2 mb-2 overflow-hidden"><div class="bg-primary h-full w-[0%]"></div></div><p class="text-xs text-gray-400 text-right">Objetivo: ${new Date(g.date).toLocaleDateString('es-ES')}</p></div>`; });
        }

        window.openGoalModal = () => { document.getElementById('goalName').value=''; document.getElementById('goalAmount').value=''; openModalUI('goalModal', 'goalContent'); };
        window.handleGoalSubmit = async (e) => {
            e.preventDefault();
            const obj = { user_id: currentUser.id, name: document.getElementById('goalName').value, amount: parseFloat(document.getElementById('goalAmount').value), date: document.getElementById('goalDate').value };
            const { data } = await supabase.from('goals').insert([obj]).select();
            if(data) window.goals.push(data[0]);
            window.updateUI(); window.closeModal('goalModal', 'goalContent'); window.showToast('Meta Guardada');
        };

        function renderSubscriptions() {
            const sg = document.getElementById('subscriptionsGrid'); sg.innerHTML=''; document.getElementById('subsEmptyState').classList.toggle('hidden', window.subscriptions.length>0); document.getElementById('subsEmptyState').classList.toggle('block', window.subscriptions.length===0);
            let t = 0; window.subscriptions.forEach(s => { t += (s.freq === 'Anual' ? s.amount/12 : s.amount); sg.innerHTML += `<div class="glass-panel rounded-3xl p-6 relative group flex items-center justify-between"><button onclick="window.deleteDocItem('subscriptions','${s.id}')" class="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><i class="fa-solid fa-xmark"></i></button><div><h3 class="text-white font-bold">${s.name}</h3><p class="text-xs text-gray-400">${s.freq}</p></div><p class="text-accent font-bold text-lg">${formatCurrency(s.amount)}</p></div>`; });
            document.getElementById('totalSubscriptions').innerText = formatCurrency(t);
        }

        window.openSubModal = () => { document.getElementById('subName').value=''; document.getElementById('subAmount').value=''; openModalUI('subModal', 'subContent'); };
        window.handleSubSubmit = async (e) => {
            e.preventDefault();
            const obj = { user_id: currentUser.id, name: document.getElementById('subName').value, amount: parseFloat(document.getElementById('subAmount').value), freq: document.getElementById('subFreq').value };
            const { data } = await supabase.from('subscriptions').insert([obj]).select();
            if(data) window.subscriptions.push(data[0]);
            window.updateUI(); window.closeModal('subModal', 'subContent'); window.showToast('Suscripción Guardada');
        };

        function renderDebts() {
            const dl = document.getElementById('debtsList'); dl.innerHTML=''; document.getElementById('debtsEmptyState').classList.toggle('hidden', window.debts.length>0); document.getElementById('debtsEmptyState').classList.toggle('flex', window.debts.length===0);
            let owe = 0, owed = 0;
            window.debts.forEach(d => {
                if(d.type === 'owe') owe += d.amount; else owed += d.amount;
                const isOwe = d.type === 'owe';
                dl.innerHTML += `<tr class="border-b border-slate-700/30 hover:bg-slate-800/30 group"><td class="p-4 text-white font-medium flex items-center gap-3"><div class="w-8 h-8 rounded-full flex items-center justify-center ${isOwe?'bg-red-500/20 text-red-500':'bg-emerald-500/20 text-emerald-500'}"><i class="fa-solid ${isOwe?'fa-arrow-up':'fa-arrow-down'}"></i></div>${d.entity}</td><td class="p-4 text-right font-bold text-lg ${isOwe?'text-red-400':'text-emerald-400'}">${formatCurrency(d.amount)}</td><td class="p-4 text-center"><button onclick="window.deleteDocItem('debts','${d.id}')" class="text-gray-500 hover:text-primary bg-slate-800 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"><i class="fa-solid fa-check mr-1"></i> Saldar</button></td></tr>`;
            });
            document.getElementById('totalOwedToMe').innerText = formatCurrency(owed); document.getElementById('totalIOwe').innerText = formatCurrency(owe);
        }

        window.openDebtModal = () => { document.getElementById('debtEntity').value=''; document.getElementById('debtAmount').value=''; openModalUI('debtModal', 'debtContent'); };
        window.handleDebtSubmit = async (e) => {
            e.preventDefault();
            const obj = { user_id: currentUser.id, type: document.querySelector('input[name="debtType"]:checked').value, entity: document.getElementById('debtEntity').value, amount: parseFloat(document.getElementById('debtAmount').value) };
            const { data } = await supabase.from('debts').insert([obj]).select();
            if(data) window.debts.push(data[0]);
            window.updateUI(); window.closeModal('debtModal', 'debtContent'); window.showToast('Registro Guardado');
        };

        document.addEventListener('DOMContentLoaded', () => { document.getElementById('globalMonthFilter').value = window.currentMonthStr; updateCategorySelects(); if(window.renderCategoriesUI) window.renderCategoriesUI(); });
