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
window.editingId = null;
window.currentDebtView = 'active';

let expenseChartInstance = null;
let historyChartInstance = null;
let currentUser = null;
let confirmActionCallback = null;

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
    if (pref.data && pref.data.budget) window.userPreferences = { budget: pref.data.budget, currency: pref.data.currency || 'DOP' };
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
    const accs = window.accounts.reduce((a,c) => a + c.balance, 0);
    const invs = window.investments.reduce((a,c) => a + c.amount, 0);
    const owedToMe = window.debts.filter(d => d.type === 'owed' && d.amount > 0).reduce((a,c) => a + c.amount, 0);
    
    const iOwe = window.debts.filter(d => d.type === 'owe' && d.amount > 0).reduce((a,c) => a + c.amount, 0);
    
    const assets = accs + invs + owedToMe;
    const liabilities = iOwe;
    const netWorth = assets - liabilities;

    document.getElementById('netWorthDisplay').innerText = formatCurrency(netWorth);
    document.getElementById('totalAssets').innerText = formatCurrency(assets);
    
    const liabDisplay = document.getElementById('totalLiabilities');
    if (liabDisplay) liabDisplay.innerText = formatCurrency(liabilities);

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

    let s = 50;
    let savingsRate = mInc > 0 ? ((mInc - mExp) / mInc) * 100 : (mExp > 0 ? -100 : 0);
    
    if (savingsRate >= 20) s += 30;
    else if (savingsRate > 0) s += 15;
    else if (savingsRate < 0) s -= 20;

    if (pct <= 50) s += 20;
    else if (pct <= 80) s += 10;
    else if (pct > 100) s -= 30;

    if (liabilities === 0 && assets > 0) s += 10;
    else if (liabilities > assets) s -= 30;
    else if (liabilities > 0) s -= 10;

    s = Math.max(5, Math.min(100, Math.round(s)));

    document.getElementById('healthScoreText').innerText = s;
    document.getElementById('healthScoreCircle').setAttribute('stroke-dasharray', `${s}, 100`);
    document.getElementById('healthScoreCircle').setAttribute('class', `transition-all duration-1000 ease-out ${s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-orange-400' : 'text-red-500'}`);

    generateDashboardInsight(netWorth, assets, liabilities, mExp, mInc, b, pct);
}

function generateDashboardInsight(netWorth, assets, liabilities, mExp, mInc, budget, pct) {
    let insight = "Tienes un buen balance. Asegúrate de registrar todas tus transacciones diariamente para mantener este control.";
    
    if (pct >= 95) {
        insight = "¡Alerta Roja! Estás a punto de agotar o ya pasaste tu presupuesto mensual. ¡Detén gastos innecesarios!";
    } else if (pct >= 75) {
        insight = "Ojo, has gastado más del 75% de tu presupuesto. Trata de mantenerte por debajo del límite sugerido por día.";
    } else if (liabilities > assets) {
        insight = "Tus pasivos (deudas) superan tus activos actuales. Enfócate en saldar primero las cuentas con intereses más altos.";
    } else if (mExp > mInc && mInc > 0) {
        insight = "Cuidado, este mes has gastado más de lo que te ingresa. Analiza en la gráfica circular adónde se fue tu dinero.";
    } else if (pct < 50 && new Date().getDate() > 20) {
        insight = "¡Excelente disciplina! El mes casi termina y te sobra bastante presupuesto. Buen momento para pasarlo a tus Metas de Ahorro.";
    }

    const el = document.getElementById('insightText');
    if (el) el.innerText = insight;
}

window.showConfirmModal = (title, msg, callback) => {
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerText = msg;
    confirmActionCallback = callback;
    openModalUI('confirmModal', 'confirmContent');
};

window.closeConfirmModal = () => { window.closeModal('confirmModal', 'confirmContent'); };
window.executeConfirmAction = () => { if(confirmActionCallback) confirmActionCallback(); window.closeConfirmModal(); };

window.renderTransactions = () => {
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
    window.showConfirmModal('¿Eliminar transacción?', 'Se borrará completamente del historial.', async () => {
        await supabase.from('transactions').delete().eq('id', id);
        window.transactions = window.transactions.filter(t => t.id !== id);
        window.updateUI(); window.showToast('Transacción eliminada', 'bg-red-500');
    });
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

window.requestPasswordReset = async () => {
    if (!currentUser || !currentUser.email) return;
    const currentUrl = window.location.href;
    const redirectUrl = currentUrl.replace('principal.html', 'recoverdpass.html');

    const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, { redirectTo: redirectUrl });
    if (error) { window.showToast(error.message, 'bg-red-500'); } 
    else { window.showToast('Enlace de recuperación enviado a tu correo.', 'bg-emerald-500'); }
};

window.openDeleteAccountModal = () => { document.getElementById('deleteAccountConfirm').value = ''; openModalUI('deleteAccountModal', 'deleteAccountContent'); };

window.handleDeleteAccount = async (e) => {
    e.preventDefault();
    const confirmText = document.getElementById('deleteAccountConfirm').value;
    
    if (confirmText !== 'ELIMINAR') {
        window.showToast('Debes escribir la palabra ELIMINAR para confirmar.', 'bg-red-500');
        return;
    }

    const btn = document.getElementById('deleteAccountBtn');
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Borrando Datos...';
    btn.disabled = true;

    try {
        const uid = currentUser.id;
        
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

        const { error: rpcError } = await supabase.rpc('delete_user');
        
        if (rpcError) {
            throw new Error("La función delete_user() no está en Supabase.");
        }

        await supabase.auth.signOut();
        window.closeModal('deleteAccountModal', 'deleteAccountContent');
        window.showToast('Tu cuenta y datos han sido eliminados.', 'bg-emerald-500');
        setTimeout(() => window.redirectToLogin(), 1500);

    } catch (err) {
        btn.innerHTML = origText;
        btn.disabled = false;
        window.showToast('Aviso: Tus datos se borraron, pero la cuenta de autenticación no porque falta la función en Supabase.', 'bg-orange-500');
        setTimeout(() => window.redirectToLogin(), 3000);
    }
};

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
    window.showConfirmModal('¿Eliminar categoría?', `Esta acción borrará la categoría "${n}" de tu lista.`, async () => {
        await supabase.from('categories').delete().eq('user_id', currentUser.id).eq('name', n); 
        window.customCategories = window.customCategories.filter(c => c.name !== n); 
        window.updateUI(); 
    });
};

window.getAllCategories = () => [...new Set([...['Comida','Transporte','Vivienda','Entretenimiento','Salario','Otros','Ahorro'], ...window.customCategories.map(c=>c.name)])].sort();
function updateCategorySelects() { const o = window.getAllCategories().map(c=>`<option value="${c}">${c}</option>`).join(''); if(document.getElementById('category')) document.getElementById('category').innerHTML = o; if(document.getElementById('filterCategory')) document.getElementById('filterCategory').innerHTML = '<option value="">Categorías (Todas)</option>' + o; }

window.showToast = (msg, bg = 'bg-slate-800') => {
    const t = document.getElementById('toast'), iC = document.getElementById('toastIconContainer'), i = document.getElementById('toastIcon'); document.getElementById('toastMsg').innerText = msg;
    if(bg.includes('red')) { iC.className = "w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center"; i.className = "fa-solid fa-exclamation"; }
    else if (bg.includes('orange')) { iC.className = "w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center"; i.className = "fa-solid fa-info"; }
    else { iC.className = "w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center"; i.className = "fa-solid fa-check"; }
    t.className = `fixed bottom-6 left-6 lg:bottom-8 lg:left-8 ${bg} text-white border border-slate-700/50 px-6 py-4 rounded-2xl shadow-2xl transition-all z-[100] flex items-center gap-3 font-semibold`;
    setTimeout(() => t.classList.remove('translate-y-20', 'opacity-0'), 10); setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3500);
};

function renderPortfolio() {
    const ag = document.getElementById('accountsGrid'), cg = document.getElementById('cardsGrid'), ig = document.getElementById('invGrid');
    if(ag) { ag.innerHTML=''; document.getElementById('accountsEmpty').classList.toggle('hidden', window.accounts.length>0); window.accounts.forEach(a => { ag.innerHTML += `<div class="glass-panel rounded-3xl p-6 relative group border-l-4 border-primary"><div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20"><button onclick="window.editAccount('${a.id}')" class="text-gray-500 hover:text-primary"><i class="fa-solid fa-pen"></i></button><button onclick="window.deleteDocItem('accounts','${a.id}')" class="text-gray-500 hover:text-red-400"><i class="fa-solid fa-trash"></i></button></div><h3 class="text-white font-bold pr-16">${a.name}</h3><p class="text-gray-400 text-xs mb-4">${a.bank} • ${a.type}</p><p class="text-3xl font-black text-white">${formatCurrency(a.balance, a.currency)}</p></div>`; }); }
    if(cg) { cg.innerHTML=''; document.getElementById('cardsEmpty').classList.toggle('hidden', window.cards.length>0); window.cards.forEach(c => { cg.innerHTML += `<div class="credit-card-bg rounded-3xl p-6 relative group h-40 flex flex-col justify-between"><div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 z-20"><button onclick="window.editCard('${c.id}')" class="text-gray-500 hover:text-secondary"><i class="fa-solid fa-pen"></i></button><button onclick="window.deleteDocItem('cards','${c.id}')" class="text-gray-500 hover:text-red-400"><i class="fa-solid fa-trash"></i></button></div><div class="flex justify-between items-start z-10"><div class="pr-16"><h3 class="text-white font-bold text-sm">${c.bank.toUpperCase()}</h3><p class="text-gray-400 text-xs">${c.name}</p></div><i class="fa-brands fa-cc-${c.network.toLowerCase()} text-3xl text-gray-300"></i></div><div class="z-10"><p class="text-[10px] text-gray-400">LÍMITE</p><p class="text-2xl font-bold text-white">${formatCurrency(c.limit_amount, c.currency)}</p></div></div>`; }); }
    if(ig) { ig.innerHTML=''; document.getElementById('invEmpty').classList.toggle('hidden', window.investments.length>0); window.investments.forEach(i => { ig.innerHTML += `<div class="glass-panel rounded-3xl p-6 relative group border-l-4 border-income"><div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20"><button onclick="window.editInv('${i.id}')" class="text-gray-500 hover:text-income"><i class="fa-solid fa-pen"></i></button><button onclick="window.deleteDocItem('investments','${i.id}')" class="text-gray-500 hover:text-red-400"><i class="fa-solid fa-trash"></i></button></div><h3 class="text-white font-bold pr-16">Certificado</h3><p class="text-gray-400 text-xs mb-4">${i.bank} • Vence: ${i.date}</p><div class="flex justify-between items-end"><p class="text-2xl font-black text-income">${formatCurrency(i.amount)}</p><span class="text-xs bg-income/20 border border-income/30 px-2 py-1 rounded-lg">${i.rate}%</span></div></div>`; }); }
}

window.deleteDocItem = async (col, id) => {
    window.showConfirmModal('¿Eliminar registro?', 'Esta acción no se puede deshacer y los datos se perderán.', async () => {
        await supabase.from(col).delete().eq('id', id);
        window[col] = window[col].filter(i => i.id !== id);
        window.updateUI(); window.showToast('Eliminado exitosamente', 'bg-orange-500');
    });
};

window.openAccountModal = () => { window.editingId = null; document.getElementById('modalAccountTitle').innerText = 'Nueva Cuenta'; document.getElementById('accName').value=''; document.getElementById('accBalance').value=''; openModalUI('accountModal', 'accountContent'); };
window.editAccount = (id) => {
    const a = window.accounts.find(x => x.id === id);
    if(!a) return;
    window.editingId = id;
    document.getElementById('modalAccountTitle').innerText = 'Editar Cuenta';
    document.getElementById('accName').value = a.name;
    document.getElementById('accBank').value = a.bank;
    document.getElementById('accType').value = a.type;
    document.getElementById('accCurrency').value = a.currency;
    document.getElementById('accBalance').value = a.balance;
    openModalUI('accountModal', 'accountContent');
};
window.handleAccountSubmit = async (e) => {
    e.preventDefault();
    const obj = { user_id: currentUser.id, name: document.getElementById('accName').value, bank: document.getElementById('accBank').value, type: document.getElementById('accType').value, currency: document.getElementById('accCurrency').value, balance: parseFloat(document.getElementById('accBalance').value) };
    if (window.editingId) {
        await supabase.from('accounts').update(obj).eq('id', window.editingId);
        window.accounts = window.accounts.map(x => x.id === window.editingId ? { ...x, ...obj } : x);
        window.showToast('Cuenta actualizada');
    } else {
        const { data } = await supabase.from('accounts').insert([obj]).select();
        if(data) window.accounts.push(data[0]);
        window.showToast('Cuenta Guardada');
    }
    window.updateUI(); window.closeModal('accountModal', 'accountContent');
};

window.openCardModal = () => { window.editingId = null; document.getElementById('modalCardTitle').innerText = 'Nueva Tarjeta'; document.getElementById('cardName').value=''; document.getElementById('cardLimit').value=''; openModalUI('cardModal', 'cardModalContent'); };
window.editCard = (id) => {
    const c = window.cards.find(x => x.id === id);
    if(!c) return;
    window.editingId = id;
    document.getElementById('modalCardTitle').innerText = 'Editar Tarjeta';
    document.getElementById('cardName').value = c.name;
    document.getElementById('cardNetwork').value = c.network;
    document.getElementById('cardBank').value = c.bank;
    document.getElementById('cardCurrency').value = c.currency;
    document.getElementById('cardLimit').value = c.limit_amount;
    openModalUI('cardModal', 'cardModalContent');
};
window.handleCardSubmit = async (e) => {
    e.preventDefault();
    const obj = { user_id: currentUser.id, name: document.getElementById('cardName').value, network: document.getElementById('cardNetwork').value, bank: document.getElementById('cardBank').value, currency: document.getElementById('cardCurrency').value, limit_amount: parseFloat(document.getElementById('cardLimit').value) };
    if (window.editingId) {
        await supabase.from('cards').update(obj).eq('id', window.editingId);
        window.cards = window.cards.map(x => x.id === window.editingId ? { ...x, ...obj } : x);
        window.showToast('Tarjeta actualizada');
    } else {
        const { data } = await supabase.from('cards').insert([obj]).select();
        if(data) window.cards.push(data[0]);
        window.showToast('Tarjeta Guardada');
    }
    window.updateUI(); window.closeModal('cardModal', 'cardModalContent');
};

window.openInvModal = () => { window.editingId = null; document.getElementById('modalInvTitle').innerText = 'Nuevo Certificado'; document.getElementById('invBank').value=''; document.getElementById('invAmount').value=''; document.getElementById('invRate').value=''; openModalUI('invModal', 'invContent'); };
window.editInv = (id) => {
    const i = window.investments.find(x => x.id === id);
    if(!i) return;
    window.editingId = id;
    document.getElementById('modalInvTitle').innerText = 'Editar Certificado';
    document.getElementById('invBank').value = i.bank;
    document.getElementById('invAmount').value = i.amount;
    document.getElementById('invRate').value = i.rate;
    document.getElementById('invDate').value = i.date;
    openModalUI('invModal', 'invContent');
};
window.handleInvSubmit = async (e) => {
    e.preventDefault();
    const obj = { user_id: currentUser.id, bank: document.getElementById('invBank').value, amount: parseFloat(document.getElementById('invAmount').value), rate: parseFloat(document.getElementById('invRate').value), date: document.getElementById('invDate').value };
    if (window.editingId) {
        await supabase.from('investments').update(obj).eq('id', window.editingId);
        window.investments = window.investments.map(x => x.id === window.editingId ? { ...x, ...obj } : x);
        window.showToast('Inversión actualizada');
    } else {
        const { data } = await supabase.from('investments').insert([obj]).select();
        if(data) window.investments.push(data[0]);
        window.showToast('Inversión Registrada');
    }
    window.updateUI(); window.closeModal('invModal', 'invContent');
};

function renderGoals() {
    const gg = document.getElementById('goalsGrid'); gg.innerHTML=''; document.getElementById('goalsEmptyState').classList.toggle('hidden', window.goals.length>0); document.getElementById('goalsEmptyState').classList.toggle('block', window.goals.length===0);
    window.goals.forEach(g => { gg.innerHTML += `<div class="glass-panel rounded-3xl p-6 relative group hover-lift"><div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20"><button onclick="window.editGoal('${g.id}')" class="text-gray-500 hover:text-primary"><i class="fa-solid fa-pen"></i></button><button onclick="window.deleteDocItem('goals','${g.id}')" class="text-gray-500 hover:text-red-400"><i class="fa-solid fa-trash"></i></button></div><h3 class="text-xl font-bold text-white mb-1 pr-16">${g.name}</h3><p class="text-primary text-2xl font-black mb-4">${formatCurrency(g.amount)}</p><div class="bg-slate-900 rounded-full h-2 mb-2 overflow-hidden"><div class="bg-primary h-full w-[0%]"></div></div><p class="text-xs text-gray-400 text-right">Objetivo: ${new Date(g.date).toLocaleDateString('es-ES')}</p></div>`; });
}

window.openGoalModal = () => { window.editingId = null; document.getElementById('modalGoalTitle').innerText = 'Nueva Meta'; document.getElementById('goalName').value=''; document.getElementById('goalAmount').value=''; openModalUI('goalModal', 'goalContent'); };
window.editGoal = (id) => {
    const g = window.goals.find(x => x.id === id);
    if(!g) return;
    window.editingId = id;
    document.getElementById('modalGoalTitle').innerText = 'Editar Meta';
    document.getElementById('goalName').value = g.name;
    document.getElementById('goalAmount').value = g.amount;
    document.getElementById('goalDate').value = g.date;
    openModalUI('goalModal', 'goalContent');
};
window.handleGoalSubmit = async (e) => {
    e.preventDefault();
    const obj = { user_id: currentUser.id, name: document.getElementById('goalName').value, amount: parseFloat(document.getElementById('goalAmount').value), date: document.getElementById('goalDate').value };
    if (window.editingId) {
        await supabase.from('goals').update(obj).eq('id', window.editingId);
        window.goals = window.goals.map(x => x.id === window.editingId ? { ...x, ...obj } : x);
        window.showToast('Meta actualizada');
    } else {
        const { data } = await supabase.from('goals').insert([obj]).select();
        if(data) window.goals.push(data[0]);
        window.showToast('Meta Guardada');
    }
    window.updateUI(); window.closeModal('goalModal', 'goalContent');
};

function renderSubscriptions() {
    const sg = document.getElementById('subscriptionsGrid'); sg.innerHTML=''; document.getElementById('subsEmptyState').classList.toggle('hidden', window.subscriptions.length>0); document.getElementById('subsEmptyState').classList.toggle('block', window.subscriptions.length===0);
    let t = 0; 
    window.subscriptions.forEach(s => { 
        t += (s.freq === 'Anual' ? s.amount/12 : s.amount); 
        const dayText = s.billing_day ? `Día ${s.billing_day}` : 'Sin fecha';
        sg.innerHTML += `<div class="glass-panel rounded-3xl p-6 relative group flex items-center justify-between">
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                <button onclick="window.editSub('${s.id}')" class="text-gray-500 hover:text-accent"><i class="fa-solid fa-pen"></i></button>
                <button onclick="window.deleteDocItem('subscriptions','${s.id}')" class="text-gray-500 hover:text-red-400"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="pr-12">
                <h3 class="text-white font-bold">${s.name}</h3>
                <p class="text-xs text-gray-400">${s.freq} • Cobro: <span class="text-primary font-bold">${dayText}</span></p>
            </div>
            <p class="text-accent font-bold text-lg">${formatCurrency(s.amount)}</p>
        </div>`; 
    });
    document.getElementById('totalSubscriptions').innerText = formatCurrency(t);
}

window.openSubModal = () => { window.editingId = null; document.getElementById('modalSubTitle').innerText = 'Nueva Suscripción'; document.getElementById('subName').value=''; document.getElementById('subAmount').value=''; document.getElementById('subDate').value=''; openModalUI('subModal', 'subContent'); };
window.editSub = (id) => {
    const s = window.subscriptions.find(x => x.id === id);
    if(!s) return;
    window.editingId = id;
    document.getElementById('modalSubTitle').innerText = 'Editar Suscripción';
    document.getElementById('subName').value = s.name;
    document.getElementById('subAmount').value = s.amount;
    document.getElementById('subFreq').value = s.freq;
    document.getElementById('subDate').value = s.billing_day || 1;
    openModalUI('subModal', 'subContent');
};
window.handleSubSubmit = async (e) => {
    e.preventDefault();
    const obj = { 
        user_id: currentUser.id, 
        name: document.getElementById('subName').value, 
        amount: parseFloat(document.getElementById('subAmount').value), 
        freq: document.getElementById('subFreq').value,
        billing_day: parseInt(document.getElementById('subDate').value) || 1
    };
    if (window.editingId) {
        await supabase.from('subscriptions').update(obj).eq('id', window.editingId);
        window.subscriptions = window.subscriptions.map(x => x.id === window.editingId ? { ...x, ...obj } : x);
        window.showToast('Suscripción actualizada');
    } else {
        const { data } = await supabase.from('subscriptions').insert([obj]).select();
        if(data) window.subscriptions.push(data[0]);
        window.showToast('Suscripción Guardada');
    }
    window.updateUI(); window.closeModal('subModal', 'subContent');
};

window.setDebtView = (view) => {
    window.currentDebtView = view;
    document.getElementById('btnDebtActive').className = view === 'active' ? 'text-white font-bold border-b-2 border-primary pb-1 px-2 transition-all' : 'text-gray-500 hover:text-white font-bold border-b-2 border-transparent pb-1 px-2 transition-all';
    document.getElementById('btnDebtSettled').className = view === 'settled' ? 'text-white font-bold border-b-2 border-primary pb-1 px-2 transition-all' : 'text-gray-500 hover:text-white font-bold border-b-2 border-transparent pb-1 px-2 transition-all';
    renderDebts();
};

function renderDebts() {
    const dl = document.getElementById('debtsList'); dl.innerHTML=''; 
    let owe = 0, owed = 0;
    const mF = document.getElementById('debtMonthFilter')?.value;
    
    let filteredDebts = window.debts.filter(d => window.currentDebtView === 'active' ? d.amount > 0 : d.amount <= 0);

    if(mF) {
        filteredDebts = filteredDebts.filter(d => {
            if(window.currentDebtView === 'active') return d.created_at && d.created_at.startsWith(mF);
            return d.settled_at && d.settled_at.startsWith(mF);
        });
    }

    document.getElementById('debtsEmptyState').classList.toggle('hidden', filteredDebts.length > 0); 
    document.getElementById('debtsEmptyState').classList.toggle('flex', filteredDebts.length === 0);
    
    window.debts.filter(d => d.amount > 0).forEach(d => {
        if(d.type === 'owe') owe += d.amount; else owed += d.amount;
    });

    filteredDebts.forEach(d => {
        const isOwe = d.type === 'owe';
        const cD = d.created_at ? new Date(d.created_at).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit', year:'numeric'}) : '--/--/----';
        const sD = d.settled_at ? new Date(d.settled_at).toLocaleDateString('es-ES', {day:'2-digit', month:'2-digit', year:'numeric'}) : 'Pendiente';
        
        let actions = '';
        if (window.currentDebtView === 'active') {
            actions = `<div class="flex justify-center gap-2"><button onclick="window.editDebt('${d.id}')" class="text-gray-500 hover:text-primary bg-slate-800 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"><i class="fa-solid fa-pen"></i> Editar</button><button onclick="window.openDebtPaymentModal('${d.id}')" class="text-gray-500 hover:text-secondary bg-slate-800 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"><i class="fa-solid fa-hand-holding-dollar"></i> Abonar</button><button onclick="window.settleDebt('${d.id}')" class="text-gray-500 hover:text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"><i class="fa-solid fa-check"></i> Saldar</button></div>`;
        } else {
            actions = `<div class="flex justify-center gap-2"><button onclick="window.editDebt('${d.id}')" class="text-gray-500 hover:text-primary bg-slate-800 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"><i class="fa-solid fa-pen"></i> Editar</button><button onclick="window.deleteDocItem('debts','${d.id}')" class="text-gray-500 hover:text-red-400 bg-slate-800 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"><i class="fa-solid fa-trash"></i> Eliminar</button></div>`;
        }

        dl.innerHTML += `<tr class="border-b border-slate-700/30 hover:bg-slate-800/30 group">
            <td class="p-4 text-white font-medium w-1/3">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOwe?'bg-red-500/20 text-red-500':'bg-emerald-500/20 text-emerald-500'}"><i class="fa-solid ${isOwe?'fa-arrow-up':'fa-arrow-down'}"></i></div>
                    <span class="${d.amount <= 0 ? 'line-through text-gray-500' : ''} truncate">${d.entity}</span>
                </div>
            </td>
            <td class="p-4 w-1/4">
                <div class="flex flex-col gap-1 text-[11px] font-medium tracking-wide">
                    <span class="text-gray-400"><span class="text-gray-500 w-12 inline-block">Creada:</span> <span class="text-white">${cD}</span></span>
                    ${d.amount <= 0 ? `<span class="text-emerald-400"><span class="text-emerald-500/70 w-12 inline-block">Saldada:</span> ${sD}</span>` : ''}
                </div>
            </td>
            <td class="p-4 text-right font-bold text-lg w-1/5 ${d.amount <= 0 ? 'text-gray-500' : (isOwe?'text-red-400':'text-emerald-400')}">${d.amount <= 0 ? 'Saldada' : formatCurrency(d.amount)}</td>
            <td class="p-4 text-center whitespace-nowrap w-1/4">${actions}</td>
        </tr>`;
    });
    
    document.getElementById('totalOwedToMe').innerText = formatCurrency(owed); document.getElementById('totalIOwe').innerText = formatCurrency(owe);
}

window.openDebtModal = () => { window.editingId = null; document.getElementById('modalDebtTitle').innerText = 'Nueva Deuda'; document.getElementById('debtEntity').value=''; document.getElementById('debtAmount').value=''; openModalUI('debtModal', 'debtContent'); };
window.editDebt = (id) => {
    const d = window.debts.find(x => x.id === id);
    if(!d) return;
    window.editingId = id;
    document.getElementById('modalDebtTitle').innerText = 'Editar Deuda';
    document.getElementById('debtEntity').value = d.entity;
    document.getElementById('debtAmount').value = d.amount <= 0 ? 0 : d.amount;
    document.querySelector(`input[name="debtType"][value="${d.type}"]`).checked = true;
    openModalUI('debtModal', 'debtContent');
};
window.handleDebtSubmit = async (e) => {
    e.preventDefault();
    const obj = { user_id: currentUser.id, type: document.querySelector('input[name="debtType"]:checked').value, entity: document.getElementById('debtEntity').value, amount: parseFloat(document.getElementById('debtAmount').value) };
    if (window.editingId) {
        await supabase.from('debts').update(obj).eq('id', window.editingId);
        window.debts = window.debts.map(x => x.id === window.editingId ? { ...x, ...obj } : x);
        window.showToast('Deuda actualizada');
    } else {
        const { data } = await supabase.from('debts').insert([obj]).select();
        if(data) window.debts.push(data[0]);
        window.showToast('Deuda Guardada');
    }
    window.updateUI(); window.closeModal('debtModal', 'debtContent'); 
};

window.openDebtPaymentModal = (id) => {
    const d = window.debts.find(x => x.id === id);
    if(!d) return;
    document.getElementById('payDebtId').value = id;
    document.getElementById('payDebtType').value = d.type;
    document.getElementById('payDebtName').innerText = `Abonar a: ${d.entity}`;
    document.getElementById('payDebtRemaining').innerText = `Restante: ${formatCurrency(d.amount)}`;
    document.getElementById('payDebtAmount').value = '';
    document.getElementById('payDebtDate').value = getLocalISOString();
    openModalUI('debtPaymentModal', 'debtPaymentContent');
};

window.handleDebtPaymentSubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('payDebtId').value;
    const type = document.getElementById('payDebtType').value;
    const amt = parseFloat(document.getElementById('payDebtAmount').value);
    const date = document.getElementById('payDebtDate').value;
    
    const d = window.debts.find(x => x.id === id);
    if(!d || amt <= 0) return;
    
    if(amt > d.amount) {
        return window.showToast('El abono no puede ser mayor a la deuda', 'bg-red-500');
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn.innerText;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';
    btn.disabled = true;

    const newAmount = d.amount - amt;
    
    if (newAmount <= 0) {
        await supabase.from('debts').update({ amount: 0, settled_at: getLocalISOString() }).eq('id', id);
        d.amount = 0;
        d.settled_at = getLocalISOString();
    } else {
        await supabase.from('debts').update({ amount: newAmount }).eq('id', id);
        d.amount = newAmount;
    }

    const txObj = {
        user_id: currentUser.id,
        type: type === 'owe' ? 'expense' : 'income', 
        amount: amt,
        description: `Abono a deuda: ${d.entity}`,
        category: 'Otros',
        date: date
    };
    
    const { data: txData } = await supabase.from('transactions').insert([txObj]).select();
    if(txData) window.transactions.push(txData[0]);

    btn.innerHTML = origText;
    btn.disabled = false;
    window.updateUI();
    window.closeModal('debtPaymentModal', 'debtPaymentContent');
    window.showToast('Abono registrado con éxito');
};

window.settleDebt = async (id) => {
    window.showConfirmModal('¿Saldar deuda?', 'Se creará un abono automático en el historial por el monto restante y la deuda pasará a Saldadas.', async () => {
        const d = window.debts.find(x => x.id === id);
        if(!d || d.amount <= 0) return;

        const amt = d.amount;
        
        const txObj = {
            user_id: currentUser.id,
            type: d.type === 'owe' ? 'expense' : 'income',
            amount: amt,
            description: `Liquidación de deuda: ${d.entity}`,
            category: 'Otros',
            date: getLocalISOString()
        };
        const { data: txData } = await supabase.from('transactions').insert([txObj]).select();
        if(txData) window.transactions.push(txData[0]);

        await supabase.from('debts').update({ amount: 0, settled_at: getLocalISOString() }).eq('id', id);
        d.amount = 0;
        d.settled_at = getLocalISOString();
        
        window.updateUI();
        window.showToast('Deuda saldada por completo', 'bg-emerald-500');
    });
};

window.toggleAiChat = () => {
    const w = document.getElementById('aiChatWidget');
    if (w.classList.contains('hidden')) {
        w.classList.remove('hidden');
        setTimeout(() => { w.classList.remove('translate-y-10', 'opacity-0'); }, 10);
    } else {
        w.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => { w.classList.add('hidden'); }, 300);
    }
};

window.sendAiMessage = async (e) => {
    e.preventDefault();
    const input = document.getElementById('aiChatInput');
    const text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    const messages = document.getElementById('aiChatMessages');
    
    messages.innerHTML += `
        <div class="flex gap-3 justify-end fade-in">
            <div class="bg-primary text-slate-900 rounded-2xl rounded-tr-none p-3 text-sm font-bold shadow-md">${text}</div>
            <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-white"><i class="fa-solid fa-user"></i></div>
        </div>
    `;
    
    const loadingId = 'loading-' + Date.now();
    messages.innerHTML += `
        <div id="${loadingId}" class="flex gap-3 fade-in">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shrink-0 text-white text-sm shadow-[0_0_10px_rgba(66,203,245,0.2)]"><i class="fa-solid fa-user-astronaut"></i></div>
            <div class="bg-slate-800 rounded-2xl rounded-tl-none p-3 flex items-center gap-1.5 h-10">
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
            </div>
        </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    try {
        const apiKey = "";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        
        const assets = document.getElementById('totalAssets').innerText;
        const liabilities = document.getElementById('totalLiabilities').innerText;
        const mExp = document.getElementById('monthlyExpense').innerText;
        const mInc = document.getElementById('monthlyIncome').innerText;
        const budget = document.getElementById('budgetTotal').innerText;

        const systemPrompt = `Eres Chelito, un asesor financiero personal experto. Eres amigable, simpático, usas emojis y siempre motivador.
        Responde siempre en español. Tus respuestas deben ser breves, claras y no usar párrafos gigantes.
        CONOCE AL USUARIO - Este es su contexto financiero real este mes:
        - Patrimonio Neto: ${document.getElementById('netWorthDisplay').innerText}
        - Activos: ${assets}
        - Pasivos: ${liabilities}
        - Ingresos del mes: ${mInc}
        - Gastos del mes: ${mExp}
        - Presupuesto mensual establecido: ${budget}`;

        const payload = {
            contents: [{ parts: [{ text }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };

        const fetchWithRetry = async (url, options, retries = 3) => {
            const delays = [1000, 2000, 4000];
            for (let i = 0; i < retries; i++) {
                try {
                    const res = await fetch(url, options);
                    if (!res.ok) throw new Error(`Error HTTP`);
                    return await res.json();
                } catch (err) {
                    if (err.name === 'AbortError') throw err;
                    if (i === retries - 1) throw err;
                    await new Promise(r => setTimeout(r, delays[i]));
                }
            }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const replyText = response.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, tuve un problema procesando tu consulta.";
        const formattedReply = replyText.replace(/\*\*(.*?)\*\*/g, '<b class="text-white">$1</b>');

        document.getElementById(loadingId).remove();
        
        messages.innerHTML += `
            <div class="flex gap-3 fade-in">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shrink-0 text-white text-sm shadow-[0_0_10px_rgba(66,203,245,0.2)]"><i class="fa-solid fa-user-astronaut"></i></div>
                <div class="bg-slate-800 rounded-2xl rounded-tl-none p-3 text-sm text-gray-300 leading-relaxed">${formattedReply.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        messages.scrollTop = messages.scrollHeight;

    } catch (error) {
        document.getElementById(loadingId).remove();
        let errorMsg = "Hubo un error de conexión, por favor intenta de nuevo más tarde.";
        if (error.name === 'AbortError') {
            errorMsg = "Me quedé pensando demasiado tiempo. Mi servidor está un poco lento, ¿Podrías intentar preguntar de nuevo?";
        }
        
        messages.innerHTML += `
            <div class="flex gap-3 fade-in">
                <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 text-red-500"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="bg-slate-800 rounded-2xl rounded-tl-none p-3 text-sm text-red-400">${errorMsg}</div>
            </div>
        `;
        messages.scrollTop = messages.scrollHeight;
    }
};

document.addEventListener('DOMContentLoaded', () => { document.getElementById('globalMonthFilter').value = window.currentMonthStr; updateCategorySelects(); if(window.renderCategoriesUI) window.renderCategoriesUI(); });