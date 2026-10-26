// ================= CONFIG =================
const CONFIG = {
    WA: '919306456633', RZP_KEY: '', ADS_CLIENT: '', ADS_SLOT: '',
    ADMIN_EMAIL: 'vivektanwaradv@gmail.com',
    FIREBASE: {
        apiKey: "AIzaSyBaVbANNSRLr376IiTZ46MfoZihdbn6tro", 
        authDomain: "website-vivek.firebaseapp.com",
        projectId: "website-vivek", 
        storageBucket: "website-vivek.appspot.com", // Corrected storage bucket format
        messagingSenderId: "989462065688", 
        appId: "1:989462065688:web:428e988cc35a4a7a22896d", 
        measurementId: "G-93NJ5H9HYF"
    }
};
const $ = id => document.getElementById(id), Q = s => document.querySelectorAll(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AVATAR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1e3a8a"/><circle cx="50" cy="38" r="18" fill="#f59e0b"/><path d="M14 100c0-24 16-38 36-38s36 14 36 38z" fill="#f59e0b"/></svg>');
const HERO = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=1950&q=80';
const wa = t => 'https://wa.me/' + CONFIG.WA + '?text=' + encodeURIComponent(t);
const PAGE = document.body.dataset.page, EDIT = /[?&]edit=1/.test(location.search);
let DB = { photo: '', hero: '', texts: {}, blogs: [], docs: [], team: [], teamSeeded: false, teamLoaded: false, blogsLoaded: false }, isAdmin = false, textsApplied = false;

// Initialize Firebase
firebase.initializeApp(CONFIG.FIREBASE);
const fdb = firebase.firestore(), auth = firebase.auth();

// ================= DATABASE HELPERS =================
const DEFAULT_TEAM = [{ id: 't1', name: 'Vivek Tanwar', role: 'Advocate', owner: true },
    { id: 't2', name: 'Priya Sharma', role: 'Legal Consultant', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80' }];
const teamList = () => (DB.teamSeeded || DB.team.length) ? DB.team : DEFAULT_TEAM;
function fail(e) { alert(e && e.code === 'permission-denied' ? 'Not allowed. Please log in as admin.' : 'Could not save: ' + (e.message || e)); return false; }
async function put(c, o) {
    if (JSON.stringify(o).length > 950000) return alert('Item too large (limit ~1 MB). Use smaller images or a file link.') || false;
    try { await fdb.collection(c).doc(o.id).set(o); return true; } catch (e) { return fail(e); }
}
async function del(c, id) { try { await fdb.collection(c).doc(id).delete(); return true; } catch (e) { return fail(e); } }
async function setSite(o, d = 'site/main') { try { await fdb.doc(d).set(o, { merge: true }); return true; } catch (e) { return fail(e); } }
function img(file, max = 700, q = 0.8) {
    return new Promise(res => {
        const r = new FileReader();
        r.onload = () => { const i = new Image(); i.onload = () => {
            const s = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement('canvas');
            c.width = i.width * s; c.height = i.height * s;
            const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(i, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', q)); }; i.src = r.result; };
        r.readAsDataURL(file);
    });
}
function clean(h) {
    const d = new DOMParser().parseFromString(h, 'text/html');
    d.querySelectorAll('script,style,object,embed,link,meta').forEach(e => e.remove());
    d.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => { if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) e.removeAttribute(a.name); }));
    return d.body.innerHTML;
}
const fmt = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const sz = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.ceil(n / 1024) + ' KB';
function excerpt(b) { const t = document.createElement('div'); t.innerHTML = clean(b.html); const s = t.textContent.trim(); return s.length > 180 ? s.slice(0, 180) + '…' : s; }

// ================= LAYOUT (nav + footer shared by all pages) =================
if (PAGE !== 'admin') {
    const s = EDIT ? '?edit=1' : '', L = [['index.html', 'Home', 'home'], ['about.html', 'About', 'about'], ['blogs.html', 'Blogs', 'blogs'], ['contact.html', 'Contact', 'contact']];
    const link = (l, cls) => `<a href="${l[0]}${s}" class="${cls} ${PAGE === l[2] ? 'text-amber-400' : ''}">${l[1]}</a>`;
    document.body.insertAdjacentHTML('afterbegin', `
    <nav class="bg-slate-900 text-white shadow-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-20 items-center">
        <a href="index.html${s}" class="flex items-center"><i class="fas fa-balance-scale text-amber-500 text-3xl mr-3"></i>
          <div><span class="block font-bold text-xl tracking-wide leading-none">VIVEK TANWAR</span><span class="block text-xs text-slate-400 tracking-widest uppercase">Advocate</span></div></a>
        <div class="hidden md:flex space-x-1">${L.map(l => link(l, 'hover:bg-slate-800 hover:text-amber-400 transition px-4 py-2 rounded-md text-sm font-medium')).join('')}</div>
        <button id="mobile-menu-btn" class="md:hidden text-white hover:text-amber-400" aria-label="Menu"><i class="fas fa-bars text-2xl"></i></button>
      </div>
      <div id="mobile-menu" class="hidden md:hidden bg-slate-800 pb-4 px-4">${L.map(l => link(l, 'block py-3 border-b border-slate-700 hover:text-amber-400')).join('')}</div>
    </nav>`);
    document.body.insertAdjacentHTML('beforeend', `
    <footer class="bg-slate-900 text-white py-10 mt-auto border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <div class="flex justify-center space-x-6 mb-4">
          <a href="#" data-wa target="_blank" rel="noopener" aria-label="WhatsApp" class="text-slate-400 hover:text-amber-500"><i class="fab fa-whatsapp text-2xl"></i></a>
          <a href="tel:+919671755613" aria-label="Call" class="text-slate-400 hover:text-amber-500"><i class="fas fa-phone text-2xl"></i></a>
          <a href="mailto:${CONFIG.ADMIN_EMAIL}" aria-label="Email" class="text-slate-400 hover:text-amber-500"><i class="fas fa-envelope text-2xl"></i></a>
        </div>
        <div class="flex flex-wrap justify-center gap-x-6 gap-y-1 mb-4 text-sm text-slate-400">
          <a href="contact.html${s}#privacy" class="hover:text-amber-500">Privacy Policy</a><a href="contact.html${s}#terms" class="hover:text-amber-500">Terms &amp; Refund</a><a href="contact.html${s}#disclaimer" class="hover:text-amber-500">Disclaimer</a><a href="contact.html${s}" class="hover:text-amber-500">Contact</a>
        </div>
        <p class="text-slate-400 text-sm">&copy; 2026 Vivek Tanwar, Advocate. All Rights Reserved.</p>
        ${PAGE === 'about' && !EDIT ? '<a href="admin.html" aria-label="Admin" class="inline-block mt-6 text-slate-600 hover:text-slate-400 p-2 rounded-full border border-slate-700 hover:border-slate-500"><i class="fas fa-lock text-sm"></i></a>' : ''}
      </div>
    </footer>
    <a id="wa-float" data-wa href="#" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:scale-110 transition"><i class="fab fa-whatsapp text-3xl"></i></a>
    <div id="cookie-bar" class="hidden fixed bottom-4 left-4 right-24 md:right-auto md:max-w-md z-[55] bg-white border shadow-xl rounded-xl p-4 text-sm text-gray-700">
      We use cookies to improve your experience and to show relevant ads. See our <a href="contact.html#privacy" class="text-blue-700 underline">Privacy Policy</a>.
      <div class="mt-3 flex gap-2"><button onclick="cookieSet('yes')" class="bg-blue-900 text-white px-4 py-1 rounded">Accept</button><button onclick="cookieSet('no')" class="border px-4 py-1 rounded">Decline</button></div>
    </div>`);
    $('mobile-menu-btn').onclick = () => $('mobile-menu').classList.toggle('hidden');
    Q('[data-wa]').forEach(a => a.href = wa('Hello Advocate Vivek Tanwar, I visited your website and would like to consult regarding a legal matter.'));
    if (!localStorage.getItem('vt_cookie') && !EDIT) $('cookie-bar').classList.remove('hidden');
}
function cookieSet(v) { localStorage.setItem('vt_cookie', v); $('cookie-bar').classList.add('hidden'); if (v === 'no') (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1; }

// ================= ADS =================
const adUnit = () => CONFIG.ADS_CLIENT && CONFIG.ADS_SLOT ? `<ins class="adsbygoogle" style="display:block" data-ad-client="${CONFIG.ADS_CLIENT}" data-ad-slot="${CONFIG.ADS_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins>` : '';
function pushAds() { if (CONFIG.ADS_CLIENT) Q('ins.adsbygoogle:not([data-done])').forEach(e => { e.dataset.done = 1; try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (x) {} }); }
if (CONFIG.ADS_CLIENT) { const s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous'; s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CONFIG.ADS_CLIENT; document.head.appendChild(s); }

// ================= EDITABLE TEXT =================
function applyTexts() {
    if (EDIT && textsApplied) return;
    Q('[data-edit]').forEach(el => { const k = el.dataset.edit; let v = DB.texts[k]; if (v == null && el.dataset.legacy != null) v = DB.texts[el.dataset.legacy]; if (v != null) el.innerHTML = clean(v); });
    textsApplied = true;
}

// ================= PUBLIC RENDERING =================
function paintProfile() { Q('.profile-img').forEach(i => i.src = DB.photo || AVATAR); const h = $('hero-bg-img'); if (h) h.src = DB.hero || HERO; }
function renderTeam() {
    const c = $('team-container'); if (!c) return;
    c.innerHTML = teamList().map(m => `<div class="bg-white rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden border border-gray-100 team-card">
        <div class="aspect-square overflow-hidden bg-gray-200"><img src="${m.owner ? (DB.photo || AVATAR) : (m.photo || AVATAR)}" alt="${esc(m.name)}" class="w-full h-full object-cover team-img"></div>
        <div class="p-6 text-center"><h4 class="font-bold text-lg text-slate-800">${esc(m.name)}</h4><p class="text-amber-600 text-sm font-semibold mt-1">${esc(m.role)}</p></div></div>`).join('');
}
let bq = '', dq = '';
function cover(b, cls) { return b.cover ? `<img src="${b.cover}" alt="${esc(b.title)}" class="${cls} object-cover">` : `<div class="${cls} bg-gradient-to-br from-blue-900 to-slate-800 flex items-center justify-center min-h-[10rem]"><i class="fas fa-balance-scale text-amber-500 text-5xl"></i></div>`; }
function renderBlogs() {
    if (!$('blog-list')) return;
    const q = bq.toLowerCase(), list = DB.blogs.filter(b => !q || (b.title + ' ' + excerpt(b)).toLowerCase().includes(q));
    $('blog-list').innerHTML = list.length ? list.map(b => `<article class="bg-white rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100 overflow-hidden flex flex-col sm:flex-row">
        ${cover(b, 'w-full sm:w-56 h-44 sm:h-auto shrink-0')}
        <div class="p-6 flex flex-col"><div class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">${fmt(b.date)}</div>
        <h3 class="text-xl font-bold text-blue-900 mb-2 serif">${esc(b.title)}</h3><p class="text-gray-600 text-sm mb-4">${esc(excerpt(b))}</p>
        <a href="#post/${b.id}" class="mt-auto self-start bg-blue-900 text-white px-5 py-2 rounded-lg hover:bg-blue-800 text-sm font-semibold">Read <i class="fas fa-arrow-right ml-1"></i></a></div></article>`).join('')
        : `<p class="text-gray-400 text-center py-16 bg-white rounded-xl">${DB.blogs.length ? 'No posts match your search.' : 'No blogs published yet.'}</p>`;
    $('blog-recent').innerHTML = DB.blogs.slice(0, 6).map(b => `<li><a href="#post/${b.id}" class="block hover:text-amber-600"><span class="font-semibold text-blue-900 block leading-snug">${esc(b.title)}</span><span class="text-xs text-gray-400">${fmt(b.date)}</span></a></li>`).join('') || '<li class="text-gray-400 text-sm">Nothing yet.</li>';
    $('blog-ad').innerHTML = DB.blogs.length ? adUnit() : ''; pushAds();
}
function renderPost(id) {
    const b = DB.blogs.find(x => x.id === id);
    if (!b) { $('single-blog-title').textContent = DB.blogsLoaded ? 'Post not found' : 'Loading…'; $('single-blog-date').textContent = ''; $('single-blog-content').innerHTML = ''; return; }
    $('single-blog-title').textContent = b.title; $('single-blog-date').textContent = fmt(b.date) + ' • By Vivek Tanwar, Advocate';
    $('single-blog-content').innerHTML = (b.cover ? `<img src="${b.cover}" alt="">` : '') + clean(b.html);
    $('post-share').href = 'https://wa.me/?text=' + encodeURIComponent(b.title + ' ' + location.href.split('#')[0] + '#post/' + id);
    $('post-ad').innerHTML = adUnit(); pushAds(); document.title = b.title + ' | Vivek Tanwar, Advocate';
}
function blogRoute() {
    if (PAGE !== 'blogs') return;
    const h = location.hash.slice(1), p = h.startsWith('post/');
    $('blog-main').classList.toggle('hidden', p); $('post-view').classList.toggle('hidden', !p);
    if (p) renderPost(h.slice(5)); else document.title = 'Blogs | Vivek Tanwar | Advocate';
}
const paid = () => { try { return JSON.parse(localStorage.getItem('vt_paid')) || {}; } catch (e) { return {}; } };
function renderDocs() {
    const c = $('docs-container'); if (!c) return;
    const q = dq.toLowerCase(), P = paid(), l = DB.docs.filter(d => !q || d.name.toLowerCase().includes(q));
    c.innerHTML = l.length ? l.map(d => {
        const ext = (d.fileName || 'link').split('.').pop().toLowerCase(), locked = d.price > 0 && !P[d.id];
        return `<div class="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center"><div class="bg-blue-50 p-3 rounded-lg mr-4"><i class="fas fa-file text-blue-500 text-2xl"></i></div>
        <div><h4 class="font-bold text-gray-800">${esc(d.name)}</h4><p class="text-xs text-gray-500">${esc(ext.toUpperCase())}${d.size ? ' • ' + sz(d.size) : ''} • ${d.price > 0 ? '<b class="text-amber-600">₹' + d.price + '</b>' : '<b class="text-green-600">Free</b>'}</p></div></div>
        <button onclick="getDoc('${d.id}')" class="${locked ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} px-4 py-2 rounded-lg font-medium"><i class="fas ${locked ? 'fa-lock' : 'fa-download'} mr-2"></i>${locked ? 'Buy ₹' + d.price + ' &amp; Download' : 'Download'}</button></div>`;
    }).join('') : `<p class="text-gray-400 text-center py-12">${DB.docs.length ? 'No documents match your search.' : 'No documents available yet.'}</p>`;
}
function sendFile(d) {
    if (d.link) return window.open(d.link, '_blank', 'noopener');
    if (!d.data) return alert('File not available.');
    const a = document.createElement('a'); a.href = d.data; a.download = d.fileName || d.name; a.click();
}
function getDoc(id) {
    const d = DB.docs.find(x => x.id === id);
    if (!d.price || paid()[id]) return sendFile(d);
    if (!CONFIG.RZP_KEY) return window.open(wa(`Hello, I would like to purchase the document "${d.name}" (₹${d.price}). Please share payment details.`), '_blank');
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => new Razorpay({ key: CONFIG.RZP_KEY, amount: d.price * 100, currency: 'INR', name: 'Vivek Tanwar, Advocate', description: d.name, theme: { color: '#1e3a8a' },
        handler: r => { const P = paid(); P[id] = r.razorpay_payment_id; localStorage.setItem('vt_paid', JSON.stringify(P)); renderDocs(); sendFile(d); } }).open();
    document.head.appendChild(s);
}
function globalSearch() {
    const raw = $('home-search').value.trim(), q = raw.toLowerCase(); if (!q) return;
    const has = s => s.toLowerCase().includes(q);
    const items = [
        ...DB.blogs.filter(b => has(b.title + ' ' + excerpt(b))).map(b => ({ t: b.title, s: 'Blog • ' + fmt(b.date), h: 'blogs.html#post/' + b.id })),
        ...DB.docs.filter(d => has(d.name)).map(d => ({ t: d.name, s: 'Document • ' + (d.price ? '₹' + d.price : 'Free'), h: 'blogs.html#documents' })),
        ...[['Civil Disputes', 'Property disputes, contracts, recovery suits'], ['Criminal Law', 'Bail, trial defense, appeals, FIR'], ['Revenue Affairs', 'Land records mutation, revenue court'], ['Consumer Cases', 'Deficiency in services, product liability']].filter(a => has(a.join(' '))).map(a => ({ t: a[0], s: 'Practice area — ' + a[1], h: 'contact.html' })),
        ...[['About', 'about.html'], ['Blogs', 'blogs.html'], ['Documents', 'blogs.html#documents'], ['Contact', 'contact.html']].filter(p => has(p[0])).map(p => ({ t: p[0] + ' page', s: 'Page', h: p[1] }))
    ];
    $('search-title').textContent = 'Results for “' + raw + '”';
    $('search-results').innerHTML = items.length ? items.map(i => `<a href="${i.h}" class="block p-3 rounded-lg hover:bg-blue-50"><div class="font-semibold text-blue-900">${esc(i.t)}</div><div class="text-xs text-gray-500">${esc(i.s)}</div></a>`).join('') : '<p class="text-gray-500 p-3">No results found.</p>';
    $('search-modal').classList.remove('hidden');
}
function closeSearch() { $('search-modal').classList.add('hidden'); }
function sendContact(e) { e.preventDefault(); const f = e.target.elements; window.open(wa(`Hello Advocate Vivek Tanwar,\nName: ${f[0].value}\nEmail: ${f[1].value}\n\n${f[2].value}`), '_blank'); }

// ================= LIVE EDIT MODE (used inside the admin page) =================
let saveTimer;
function status(s) { try { if (parent !== window && parent.adminStatus) parent.adminStatus(s); } catch (e) {} }
function scheduleSave() { status('saving'); clearTimeout(saveTimer); saveTimer = setTimeout(saveTexts, 1200); }
async function saveTexts() {
    const t = {}; Q('[data-edit]').forEach(el => t[el.dataset.edit] = clean(el.innerHTML));
    status(await setSite({ texts: t }) ? 'saved' : 'error');
}
async function changeProfile(inp) { if (inp.files[0]) { const d = await img(inp.files[0], 600); if (await setSite({ photo: d })) { DB.photo = d; paintProfile(); renderTeam(); } } }
async function changeHero(inp) { if (inp.files[0]) { const d = await img(inp.files[0], 1400, 0.7); if (await setSite({ hero: d }, 'site/hero')) { DB.hero = d; paintProfile(); } } }
function enableEdit() {
    document.body.classList.add('is-admin');
    Q('[data-edit]').forEach(e => e.contentEditable = 'true');
    Q('#cookie-bar,#wa-float').forEach(e => e.remove());
    document.addEventListener('input', scheduleSave);
    document.addEventListener('click', e => { const a = e.target.closest('a'); if (a && !/\.html(\?edit=1)?$/.test(a.getAttribute('href') || '') && !/\.html\?edit=1#/.test(a.getAttribute('href') || '')) e.preventDefault(); }, true);
    status('ready');
}

// ================= LIVE DATA =================
function refresh() { paintProfile(); renderTeam(); renderBlogs(); renderDocs(); blogRoute(); document.dispatchEvent(new Event('dbchange')); }
async function maybeSeed() {
    if (PAGE !== 'admin' || !isAdmin || !DB.teamLoaded || DB.teamSeeded || DB.team.length) return;
    for (const m of DEFAULT_TEAM) await put('team', Object.assign({ order: Date.now() + DEFAULT_TEAM.indexOf(m) }, m));
    setSite({ teamSeeded: true });
}
function listen() {
    fdb.doc('site/main').onSnapshot(s => { const d = s.data() || {}; DB.photo = d.photo || ''; DB.texts = d.texts || {}; DB.teamSeeded = !!d.teamSeeded; applyTexts(); refresh(); maybeSeed(); });
    if (PAGE === 'home') fdb.doc('site/hero').onSnapshot(s => { DB.hero = (s.data() || {}).img || ''; refresh(); });
    if (['home', 'blogs', 'admin'].includes(PAGE)) {
        fdb.collection('blogs').orderBy('date', 'desc').onSnapshot(s => { DB.blogs = s.docs.map(d => d.data()); DB.blogsLoaded = true; refresh(); });
        fdb.collection('docs').orderBy('created', 'desc').onSnapshot(s => { DB.docs = s.docs.map(d => d.data()); refresh(); });
    }
    if (['about', 'admin'].includes(PAGE)) fdb.collection('team').orderBy('order').onSnapshot(s => { DB.team = s.docs.map(d => d.data()); DB.teamLoaded = true; refresh(); maybeSeed(); });
    auth.onAuthStateChanged(u => {
        const ok = !!u && u.email === CONFIG.ADMIN_EMAIL, was = isAdmin; isAdmin = ok;
        document.dispatchEvent(new CustomEvent('authchange', { detail: { user: u, ok } }));
        if (EDIT && ok && !was) enableEdit();
        maybeSeed();
    });
}
window.addEventListener('hashchange', blogRoute);
listen();
