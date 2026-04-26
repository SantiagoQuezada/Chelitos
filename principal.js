import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';

// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = 'https://jsxwprhudkzoadvxohah.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_91yOfKfjuIjcS7eESuzvKw_TYZl0520';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado Global
window.transactions = []; window.customCategories = []; window.goals = []; window.subscriptions = []; window.debts = [];
window.accounts = []; window.cards = []; window.investments = [];
window.userPreferences = { budget: 10000, currency: 'DOP' };
const defaultCategories = ['Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salario', 'Otros', 'Ahorro'];
window.currentView = 'dashboard';

let expenseChartInstance = null; let historyChartInstance = null;
let currentUser = null; 
let appId = 'pylio-v4';

const dateObj = new Date(); 
window.currentMonthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

function getLocalISOString() { 
    const now = new Date(); 
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0,16); 
}

window.validateNumber = (input) => { 
    input.value = input.value.replace(/[^0-9.]/g, ''); 
    if ((input.value.match(/\./g) || []).length > 1) input.value = input.value.replace(/\.$/, ''); 
};

window.stepAmount = (inputId, amountChange) => { 
    const input = document.getElementById(inputId); 
    if (!input) return; 
    let v = parseFloat(input.value) || 0; 
    let n = v + amountChange; 
    if (n < 0) n = 0; 
    input.value = Number.isInteger(n) ? n : n.toFixed(2); 
};


// --- SISTEMA DE AUTENTICACIÓN (PROTECCIÓN DE RUTA) ---

// Validar sesión con Supabase al entrar
supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session || !session.user) {
        window.location.href = 'login.html';
    } else {
        currentUser = session.user;
        initDashboardUser(session.user);
    }
});

// Escuchar cambios (por si el usuario cierra sesión)
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        window.location.href = 'login.html';
    }
});

function initDashboardUser(user) {
    // Quitar la pantalla de carga
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.classList.add('opacity-0');
        setTimeout(() => { loader.classList.add('hidden'); }, 500);
    }

    const cloudEl = document.getElementById('cloudStatus');
    if (cloudEl) cloudEl.innerHTML = '<i class="fa-solid fa-cloud-check text-primary"></i>'; 
    
    let displayName = user.user_metadata?.full_name || user.email.split('@')[0];
    const userNameHeader = document.getElementById('userNameHeader');
    if (userNameHeader) userNameHeader.innerText = displayName.split(' ')[0];
    
    // Actualizar UI del usuario logueado
    const uidEl = document.getElementById('userIdDisplay');
    if (uidEl) uidEl.value = user.email; 
    
    const userProfileBadge = document.getElementById('userProfileBadge');
    if (userProfileBadge) { userProfileBadge.classList.remove('hidden'); userProfileBadge.classList.add('flex'); }

    window.updateUI();
}

window.handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};

// --- NAVEGACIÓN Y UI ---

window.navigateTo = (view) => {
    document.querySelectorAll('.view-section').forEach(el => { el.classList.add('hidden'); el.classList.remove('opacity-100'); });
    const activeView = document.getElementById(`view-${view}`);
    if (activeView) { activeView.classList.remove('hidden'); setTimeout(() => activeView.classList.add('opacity-100'), 10); }
    document.querySelectorAll('.nav-link').forEach(el => el.classList.replace('text-white', 'text-gray-400') || el.classList.remove('bg-slate-800'));
    const aLink = document.getElementById(`nav-${view}`); if(aLink) { aLink.classList.replace('text-gray-400', 'text-white'); aLink.classList.add('bg-slate-800'); }
    window.updateUI();
};

window.changeGlobalMonth = () => { window.currentMonthStr = document.getElementById('globalMonthFilter').value; window.updateUI(); };
window.updateUI = () => { updateCategorySelects(); renderPortfolio(); renderTransactions(); calculateBalancesAndBudget(); updateCharts(); };

const formatCurrency = (amount, cur = null) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: cur || window.userPreferences.currency || 'DOP' }).format(amount);

function calculateBalancesAndBudget() {
    const assetsAcc = window.accounts.reduce((a,c) => a + c.balance, 0);
    const assetsInv = window.investments.reduce((a,c) => a + c.amount, 0);
    const liabilitiesDebt = window.debts.filter(d=>d.type==='i_owe').reduce((a,c)=>a+(c.amount-(c.paid||0)), 0);
    const nw = (assetsAcc + assetsInv) - liabilitiesDebt;
    
    const elNw = document.getElementById('netWorthDisplay'); if(elNw) elNw.innerText = formatCurrency(nw);
    const elAst = document.getElementById('totalAssets'); if(elAst) elAst.innerText = formatCurrency(assetsAcc + assetsInv);
    const elLib = document.getElementById('totalLiabilities'); if(elLib) elLib.innerText = formatCurrency(liabilitiesDebt);

    const monthlyTx = window.transactions.filter(t => t.date.startsWith(window.currentMonthStr));
    const monthlyExp = monthlyTx.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);
    
    const elExp = document.getElementById('monthlyExpense'); if(elExp) elExp.innerText = formatCurrency(monthlyExp);
    const elInc = document.getElementById('monthlyIncome'); if(elInc) elInc.innerText = formatCurrency(monthlyTx.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0));

    const b = window.userPreferences.budget || 10000;
    const pct = Math.min((monthlyExp / b) * 100, 100).toFixed(1);
    
    const bar = document.getElementById('budgetProgressBar');
    if(bar) {
        bar.style.width = `${pct}%`;
        bar.className = `h-full transition-all duration-1000 ${pct>=90?'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]' : pct>=75?'bg-secondary shadow-[0_0_10px_rgba(241,90,36,0.4)]' : 'bg-primary shadow-[0_0_10px_rgba(66,203,245,0.3)]'}`;
    }

    const score = document.getElementById('healthScoreText');
    if(score) {
        let s = 100; if(pct>100) s-=30; if(nw<0) s-=20;
        score.innerText = s;
        const scoreCircle = document.getElementById('healthScoreCircle');
        if (scoreCircle) scoreCircle.setAttribute('stroke-dasharray', `${s}, 100`);
    }
}

function renderPortfolio() {
    const accG = document.getElementById('accountsGrid'); const cardG = document.getElementById('cardsGrid'); const invG = document.getElementById('invGrid');
    if(!accG) return;
    accG.innerHTML = ''; cardG.innerHTML = ''; invG.innerHTML = '';

    if(window.accounts.length===0) document.getElementById('accountsEmpty').classList.remove('hidden');
    else {
        document.getElementById('accountsEmpty').classList.add('hidden');
        window.accounts.forEach(a => {
            accG.innerHTML += `<div class="bank-card-bg rounded-3xl p-6 shadow-xl relative group">
                <button onclick="window.deleteDocItem('accounts','${a.id}')" class="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><i class="fa-solid fa-trash"></i></button>
                <h3 class="text-white font-bold text-lg mb-1">${a.name}</h3><p class="text-gray-400 text-xs mb-4">${a.bank} • ${a.type}</p>
                <p class="text-3xl font-bold text-white">${formatCurrency(a.balance, a.currency)}</p>
            </div>`;
        });
    }

    if(window.cards.length===0) document.getElementById('cardsEmpty').classList.remove('hidden');
    else {
        document.getElementById('cardsEmpty').classList.add('hidden');
        const icons = {'Visa': 'fa-cc-visa', 'Mastercard': 'fa-cc-mastercard', 'Amex': 'fa-cc-amex', 'Discover': 'fa-cc-discover'};
        window.cards.forEach(c => {
            cardG.innerHTML += `<div class="credit-card-bg rounded-3xl p-6 border border-slate-700 shadow-2xl relative group h-40 flex flex-col justify-between">
                <button onclick="window.deleteDocItem('cards','${c.id}')" class="absolute top-4 right-4 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 z-10"><i class="fa-solid fa-trash"></i></button>
                <div class="flex justify-between items-start z-10"><div><h3 class="text-white font-bold tracking-widest text-sm">${c.bank.toUpperCase()}</h3><p class="text-gray-400 text-xs">${c.name}</p></div><i class="fa-brands ${icons[c.network] || 'fa-credit-card'} text-3xl text-gray-300"></i></div>
                <div class="z-10"><p class="text-[10px] text-gray-400 mb-0.5">LÍMITE</p><p class="text-2xl font-bold text-white tracking-wider">${formatCurrency(c.limit, c.currency)}</p></div>
            </div>`;
        });
    }

    if(window.investments.length===0) document.getElementById('invEmpty').classList.remove('hidden');
    else {
        document.getElementById('invEmpty').classList.add('hidden');
        window.investments.forEach(i => {
            invG.innerHTML += `<div class="inv-card-bg rounded-3xl p-6 shadow-xl relative group">
                <button onclick="window.deleteDocItem('investments','${i.id}')" class="absolute top-4 right-4 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><i class="fa-solid fa-trash"></i></button>
                <h3 class="text-white font-bold text-lg mb-1">Certificado Financiero</h3><p class="text-gray-400 text-xs mb-4">${i.bank} • Vence: ${i.date}</p>
                <div class="flex justify-between items-end"><p class="text-2xl font-bold text-income">${formatCurrency(i.amount)}</p><span class="text-secondary font-bold text-sm bg-secondary/10 px-2 py-1 rounded">${i.rate}% Anual</span></div>
            </div>`;
        });
    }
}

window.renderTransactions = () => {
    const dashList = document.getElementById('dashboardTransactionList');
    if(!dashList) return;
    dashList.innerHTML = '';
    let monthly = window.transactions.filter(t => t.date.startsWith(window.currentMonthStr)).sort((a,b)=>new Date(b.date)-new Date(a.date));
    
    if(monthly.length === 0) document.getElementById('dashEmptyState').classList.replace('hidden', 'flex');
    else {
        document.getElementById('dashEmptyState').classList.replace('flex', 'hidden');
        monthly.slice(0,5).forEach(t => {
            const isInc = t.type === 'income';
            dashList.innerHTML += `<tr class="border-b border-slate-700/30"><td class="p-4 text-white">${t.description}</td><td class="p-4"><span class="bg-slate-800 text-xs px-3 py-1 rounded-full text-gray-300">${t.category}</span></td><td class="p-4 text-right font-bold ${isInc?'text-income':'text-expense'}">${isInc?'+':'-'}${formatCurrency(t.amount)}</td></tr>`;
        });
    }
};

// --- MANEJO DE MODALES ---
function openModalUI(m, c) { const el = document.getElementById(m), cc = document.getElementById(c); el.classList.remove('hidden'); setTimeout(()=>{el.classList.remove('opacity-0'); cc.classList.remove('scale-95');},10); }
window.closeModal = (m, c) => { const el = document.getElementById(m), cc = document.getElementById(c); el.classList.add('opacity-0'); cc.classList.add('scale-95'); setTimeout(()=>el.classList.add('hidden'),300); }

window.openAccountModal = () => { document.getElementById('accName').value=''; document.getElementById('accBalance').value=''; openModalUI('accountModal', 'accountContent'); }
window.handleAccountSubmit = async (e) => {
    e.preventDefault(); 
    const obj = { id: Date.now().toString(), name: document.getElementById('accName').value, bank: document.getElementById('accBank').value, type: document.getElementById('accType').value, currency: document.getElementById('accCurrency').value, balance: parseFloat(document.getElementById('accBalance').value) };
    window.accounts.push(obj);
    window.updateUI();
    window.closeModal('accountModal', 'accountContent'); window.showToast('Cuenta Guardada');
};

window.openCardModal = () => { document.getElementById('cardName').value=''; document.getElementById('cardLimit').value=''; openModalUI('cardModal', 'cardModalContent'); }
window.handleCardSubmit = async (e) => {
    e.preventDefault(); 
    const obj = { id: Date.now().toString(), name: document.getElementById('cardName').value, network: document.getElementById('cardNetwork').value, bank: document.getElementById('cardBank').value, currency: document.getElementById('cardCurrency').value, limit: parseFloat(document.getElementById('cardLimit').value) };
    window.cards.push(obj);
    window.updateUI();
    window.closeModal('cardModal', 'cardModalContent'); window.showToast('Tarjeta Guardada');
};

window.openInvModal = () => { document.getElementById('invBank').value=''; document.getElementById('invAmount').value=''; document.getElementById('invRate').value=''; openModalUI('invModal', 'invContent'); }
window.handleInvSubmit = async (e) => {
    e.preventDefault(); 
    const obj = { id: Date.now().toString(), bank: document.getElementById('invBank').value, amount: parseFloat(document.getElementById('invAmount').value), rate: parseFloat(document.getElementById('invRate').value), date: document.getElementById('invDate').value };
    window.investments.push(obj);
    window.updateUI();
    window.closeModal('invModal', 'invContent'); window.showToast('Inversión Registrada');
};

window.openModal = () => { document.getElementById('transactionForm').reset(); document.getElementById('date').value = getLocalISOString(); openModalUI('transactionModal', 'modalContent'); }
window.handleFormSubmit = async (e) => {
    e.preventDefault(); 
    const obj = { id: Date.now().toString(), type: document.querySelector('input[name="type"]:checked').value, amount: parseFloat(document.getElementById('amount').value), description: document.getElementById('description').value, category: document.getElementById('category').value, date: document.getElementById('date').value };
    window.transactions.push(obj);
    window.updateUI();
    window.closeModal('transactionModal', 'modalContent'); window.showToast('Transacción Guardada');
};

// --- CALCULADORAS ---
window.calculateLoan = (e) => {
    e.preventDefault(); const a = parseFloat(document.getElementById('calcLoanAmount').value), r = parseFloat(document.getElementById('calcLoanRate').value)/100/12, m = parseInt(document.getElementById('calcLoanMonths').value);
    const cuota = (a * r * Math.pow(1+r, m)) / (Math.pow(1+r, m) - 1);
    document.getElementById('loanResultMonthly').innerText = formatCurrency(cuota); document.getElementById('calcLoanResult').classList.remove('hidden');
};
window.calculateCompound = (e) => {
    e.preventDefault(); const p=parseFloat(document.getElementById('calcCompInitial').value), pmt=parseFloat(document.getElementById('calcCompMonthly').value), r=parseFloat(document.getElementById('calcCompRate').value)/100, t=parseInt(document.getElementById('calcCompYears').value);
    const total = p*Math.pow(1+r/12, 12*t) + pmt*((Math.pow(1+r/12, 12*t)-1)/(r/12));
    document.getElementById('compResultTotal').innerText = formatCurrency(total); document.getElementById('calcCompResult').classList.remove('hidden');
};
window.calculateSavingsGoal = (e) => {
    e.preventDefault(); const target=parseFloat(document.getElementById('calcGoalAmount').value), m=parseInt(document.getElementById('calcGoalMonths').value);
    document.getElementById('goalResultMonthly').innerText = formatCurrency(target/m) + ' /mes'; document.getElementById('calcGoalResult').classList.remove('hidden');
};

window.getAllCategories = () => [...new Set([...defaultCategories, ...window.customCategories.map(c=>c.name)])].sort();
function updateCategorySelects() { const cs=document.getElementById('category'); if(cs) cs.innerHTML = window.getAllCategories().map(c=>`<option value="${c}">${c}</option>`).join(''); }

window.deleteDocItem = async (col, id) => {
    if(!confirm("¿Eliminar?")) return;
    window[col] = window[col].filter(item => item.id !== id);
    window.updateUI();
    window.showToast('Eliminado', 'bg-expense');
};

window.showToast = (msg, bg = 'bg-primary') => {
    const t = document.getElementById('toast'); document.getElementById('toastMsg').innerText = msg;
    t.className = `fixed bottom-6 right-6 lg:bottom-8 lg:right-8 text-white px-7 py-4 rounded-full shadow-2xl transition-all z-[90] flex items-center gap-3 font-bold ${bg}`;
    setTimeout(() => t.classList.remove('translate-y-20', 'opacity-0'), 10); setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
};

function updateCharts() {
    const ctx = document.getElementById('expenseChart'); if(!ctx) return;
    const exps = window.transactions.filter(t=>t.type==='expense' && t.date.startsWith(window.currentMonthStr));
    const data = {}; exps.forEach(t=>data[t.category]=(data[t.category]||0)+t.amount);
    if(expenseChartInstance) expenseChartInstance.destroy();
    if(Object.keys(data).length > 0) {
        document.getElementById('noDataChart').classList.replace('flex','hidden');
        expenseChartInstance = new Chart(ctx.getContext('2d'), { type: 'doughnut', data: { labels: Object.keys(data), datasets: [{ data: Object.values(data), backgroundColor: ['#42cbf5', '#f15a24', '#7a7a7a', '#10b981', '#8b5cf6'], borderWidth: 0 }] }, options: { cutout: '75%', plugins: { legend: { position: 'right', labels: {color: 'white'} } } } });
    } else document.getElementById('noDataChart').classList.replace('hidden','flex');
}

// Inicializamos todo al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('globalMonthFilter').value = window.currentMonthStr;
});