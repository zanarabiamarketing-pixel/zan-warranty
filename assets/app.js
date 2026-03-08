
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const SUPPORT_WA = (window.ZX_CONFIG && window.ZX_CONFIG.SUPPORT_WA) || "966505676786";
  const API_BASE = (window.ZX_CONFIG && window.ZX_CONFIG.API_BASE) || "";
  const THEME_KEY = "zx_theme_v5";
  const SESSION_KEY = "zx_session_v5";

  const safe = (x) => String(x ?? "").trim();
  const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(e));
  const normalizePhone = (p) => {
    p = safe(p).replace(/[^0-9+]/g,'');
    if (p.startsWith('05') && p.length === 10) p = '+966' + p.slice(1);
    if (p.startsWith('5') && p.length === 9) p = '+966' + p;
    if (p.startsWith('966') && !p.startsWith('+')) p = '+' + p;
    return p.slice(0, 32);
  };
  const setMsg = (el, text, ok) => {
    if (!el) return;
    el.className = "msg " + (ok ? "ok" : "bad");
    el.textContent = text || "";
  };

  function setTheme(mode){
    document.body.classList.toggle('light', mode === 'light');
    localStorage.setItem(THEME_KEY, mode);
    const icon = $('#btnTheme i');
    if (icon) icon.className = mode === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
  setTheme(localStorage.getItem(THEME_KEY) || 'dark');
  $('#btnTheme')?.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light');
    setTheme(isLight ? 'dark' : 'light');
  });

  function setSession(s){ sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function getSession(){ try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)||""); } catch(e){ return null; } }
  function clearSession(){ sessionStorage.removeItem(SESSION_KEY); }

  async function apiPost(action, payload){
  if (!API_BASE) throw new Error("لم يتم ضبط API_BASE بعد.");

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({ action, ...payload })
  });

  const txt = await res.text();
  let data;

  try {
    data = JSON.parse(txt);
  } catch (e) {
    data = { status: 'error', message: txt };
  }

  if (!res.ok || data.status === 'error') {
    throw new Error(data.message || ('HTTP ' + res.status));
  }

  return data;
}
  // WhatsApp modal
  const waModal = $('#waModal');
  const waBtn = $('#waBtn');
  const waClose = $('#waClose');
  const waCancel = $('#waCancel');
  const waOpen = $('#waOpen');
  if (waBtn && waModal){
    const openWaModal = () => { waModal.style.display = 'grid'; const t=$('#waText'); if(t) t.focus(); };
    const closeWaModal = () => { waModal.style.display = 'none'; };
    waBtn.addEventListener('click', openWaModal);
    waClose?.addEventListener('click', closeWaModal);
    waCancel?.addEventListener('click', closeWaModal);
    waModal.addEventListener('click', (e)=>{ if (e.target === waModal) closeWaModal(); });
    waOpen?.addEventListener('click', () => {
      const text = safe($('#waText')?.value) || "مرحبًا، أحتاج دعم بخصوص بوابة الضمان.";
      const url = "https://wa.me/" + SUPPORT_WA + "?text=" + encodeURIComponent(text);
      window.open(url, "_blank", "noopener");
      closeWaModal();
    });
  }

  const page = document.body.dataset.page || "";

  if (page === "login"){
    $('#btnLogin')?.addEventListener('click', async () => {
      const m = $('#loginMsg'); setMsg(m,'',true);
      try{
        const dealer_email = safe($('#loginEmail').value);
        const dealer_phone = normalizePhone($('#loginPhone').value);
        const password = safe($('#loginPass').value);
        if (!isEmail(dealer_email)) throw new Error("اكتب بريد صحيح.");
        if (!dealer_phone || dealer_phone.length < 8) throw new Error("اكتب رقم هاتف صحيح.");
        if (!password) throw new Error("اكتب كلمة المرور.");
        const out = await apiPost('dealer_login_password', { dealer_email, dealer_phone, password });
        setSession({ token: out.token, dealer_email: out.dealer_email, dealer_phone: out.dealer_phone, dealer_name: out.dealer_name });
        window.location.href = "portal.html";
      }catch(err){ setMsg(m, err.message, false); }
    });
    $('#btnGoRegister')?.addEventListener('click', () => window.location.href = "register.html");
  }

  if (page === "register"){
    $('#btnRegister')?.addEventListener('click', async () => {
      const m = $('#regMsg'); setMsg(m,'',true);
      try{
        const dealer_name = safe($('#regName').value);
        const dealer_email = safe($('#regEmail').value);
        const dealer_phone = normalizePhone($('#regPhone').value);
        const pass = safe($('#regPass').value);
        const pass2 = safe($('#regPass2').value);
        if (!dealer_name) throw new Error("اكتب اسم الموزّع.");
        if (!isEmail(dealer_email)) throw new Error("اكتب بريد صحيح.");
        if (!dealer_phone || dealer_phone.length < 8) throw new Error("اكتب رقم هاتف صحيح.");
        if (pass.length < 6) throw new Error("كلمة المرور لا تقل عن 6 أحرف.");
        if (pass !== pass2) throw new Error("كلمتا المرور غير متطابقتين.");
        const out = await apiPost('dealer_register_password', { dealer_name, dealer_email, dealer_phone, password: pass });
        setSession({ token: out.token, dealer_email: out.dealer_email, dealer_phone: out.dealer_phone, dealer_name: out.dealer_name });
        window.location.href = "portal.html";
      }catch(err){ setMsg(m, err.message, false); }
    });
    $('#btnGoLogin')?.addEventListener('click', () => window.location.href = "login.html");
  }

  function requireAuth(){
    const s = getSession();
    if (!s || !s.token) { window.location.href = "login.html"; return null; }
    return s;
  }

  if (page === "portal"){
    const s = requireAuth(); if (!s) return;
    const who = $('#who'); if (who) who.textContent = (s.dealer_name || '') + " — " + s.dealer_email;
    $('#btnNew')?.addEventListener('click', () => window.location.href = "new.html");
    $('#btnEdit')?.addEventListener('click', () => window.location.href = "edit.html");
    $('#btnLogout')?.addEventListener('click', () => { clearSession(); window.location.href = "login.html"; });
  }

  if (page === "new"){
    const s = requireAuth(); if (!s) return;
    $('#dealerNameFixed').textContent = s.dealer_name || "";
    const form = $('#formNew');
    const steps = Array.from(document.querySelectorAll('.step'));
    const panes = Array.from(document.querySelectorAll('.pane'));
    let stepN = 1;

    const setStep = (n) => {
      stepN = n;
      steps.forEach(b => b.classList.toggle('active', Number(b.dataset.s) === n));
      panes.forEach(p => p.style.display = (Number(p.dataset.pane) === n ? '' : 'none'));
      $('#btnPrev').style.display = (n === 1 ? 'none' : '');
      $('#btnNext').style.display = (n === 3 ? 'none' : '');
      $('#btnSaveNew').style.display = (n === 3 ? '' : 'none');
    };
    steps.forEach(b => b.addEventListener('click', () => setStep(Number(b.dataset.s))));
    setStep(1);

    form.invoice_file.addEventListener('change', () => {
      const f = form.invoice_file.files && form.invoice_file.files[0];
      $('#newFileLine').textContent = f ? ('Selected: ' + f.name) : '';
    });

    $('#btnPrev').addEventListener('click', () => setStep(Math.max(1, stepN-1)));
    $('#btnNext').addEventListener('click', () => {
      const fd = new FormData(form);
      const m = $('#newMsg'); setMsg(m,'',true);
      const req1 = ['invoice_number','install_date','city'];
      const req2 = ['customer_name','customer_phone','customer_email','roll_number','product_name'];

      if (stepN === 1){
        for (const k of req1) if (!safe(fd.get(k))) return setMsg(m, 'أكمل بيانات الفاتورة.', false);
      }
      if (stepN === 2){
        for (const k of req2) if (!safe(fd.get(k))) return setMsg(m, 'أكمل بيانات العميل.', false);
        if (!isEmail(fd.get('customer_email'))) return setMsg(m, 'البريد الإلكتروني غير صحيح.', false);

        const f = form.invoice_file.files && form.invoice_file.files[0];
        const v = (k)=> safe(fd.get(k));
        $('#newReview').innerHTML =
          `المركز/الموزّع: <span class="k">${s.dealer_name || ''}</span><br>`+
          `رقم الفاتورة: <span class="k">${v('invoice_number')}</span><br>`+
          `تاريخ التركيب: ${v('install_date')}<br>`+
          `المدينة: ${v('city')}<br><br>`+
          `اسم العميل: <span class="k">${v('customer_name')}</span><br>`+
          `الهاتف: ${v('customer_phone')}<br>`+
          `البريد: ${v('customer_email')}<br>`+
          `الرول: ${v('roll_number')}<br>`+
          `المنتج: ${v('product_name')}<br>`+
          `ملف الفاتورة: ${(f && f.name) ? f.name : '—'}`;
      }
      setStep(Math.min(3, stepN+1));
    });

    $('#btnBackHome').addEventListener('click', () => window.location.href = "portal.html");

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const m = $('#newMsg'); setMsg(m,'',true);

      const req = ['invoice_number','install_date','city','customer_name','customer_phone','customer_email','roll_number','product_name'];
      for (const k of req) if (!safe(fd.get(k))) return setMsg(m, 'يرجى تعبئة جميع الحقول المطلوبة.', false);
      if (!isEmail(fd.get('customer_email'))) return setMsg(m,'البريد الإلكتروني غير صحيح.', false);

      const f = form.invoice_file.files && form.invoice_file.files[0];

      const payload = {
        token: s.token,
        dealer_name: s.dealer_name,
        dealer_email: s.dealer_email,
        dealer_phone: s.dealer_phone,
        invoice_number: safe(fd.get('invoice_number')),
        install_date: safe(fd.get('install_date')),
        customer_name: safe(fd.get('customer_name')),
        customer_phone: safe(fd.get('customer_phone')),
        customer_email: safe(fd.get('customer_email')),
        roll_number: safe(fd.get('roll_number')),
        product_name: safe(fd.get('product_name')),
        installer_name: s.dealer_name,
        city: safe(fd.get('city')),
        invoice_file_name: f ? f.name : ''
      };

      try{
        const out = await apiPost('submission_create', payload);
        setMsg(m, out.message || 'تم الحفظ.', true);
        setTimeout(()=> window.location.href = "portal.html", 700);
      }catch(err){ setMsg(m, err.message, false); }
    });
  }

  if (page === "edit"){
    const s = requireAuth(); if (!s) return;
    $('#dealerNameFixed').textContent = s.dealer_name || "";
    const form = $('#formEdit');

    form.invoice_file.addEventListener('change', () => {
      const f = form.invoice_file.files && form.invoice_file.files[0];
      $('#editFileLine').textContent = f ? ('Selected: ' + f.name) : '';
    });

    $('#btnBackHome2')?.addEventListener('click', () => window.location.href = "portal.html");

    $('#btnLoadEdit')?.addEventListener('click', async () => {
      const inv = safe($('#editInvoice').value);
      const m = $('#editLoadMsg'); setMsg(m,'',true);
      if (!inv) return setMsg(m, "اكتب رقم الفاتورة.", false);
      try{
        const out = await apiPost('submission_get_for_edit', { token: s.token, invoice_number: inv });
        fillEdit(out.row);
        setMsg(m, out.message || "تم التحميل.", true);
      }catch(err){
        form.style.display = 'none';
        setMsg(m, err.message, false);
      }
    });

    function fillEdit(r){
      form.style.display = '';
      form.invoice_number.value = r.invoice_number || '';
      form.install_date.value = r.install_date || '';
      form.city.value = r.city || '';
      form.customer_name.value = r.customer_name || '';
      form.customer_phone.value = r.customer_phone || '';
      form.customer_email.value = r.customer_email || '';
      form.roll_number.value = r.roll_number || '';
      form.product_name.value = r.product_name || '';
      $('#existingFile').textContent = r.invoice_file_name ? ('ملف موجود: ' + r.invoice_file_name) : 'لا يوجد ملف محفوظ.';
      $('#editFileLine').textContent = '';
      setMsg($('#editMsg'), '', true);
    }

    $('#btnCancelEdit')?.addEventListener('click', () => {
      form.reset();
      form.style.display = 'none';
      $('#editInvoice').value = '';
      setMsg($('#editLoadMsg'), '', true);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const m = $('#editMsg'); setMsg(m,'',true);

      const req = ['invoice_number','install_date','city','customer_name','customer_phone','customer_email','roll_number','product_name'];
      for (const k of req) if (!safe(fd.get(k))) return setMsg(m, 'يرجى تعبئة جميع الحقول المطلوبة.', false);
      if (!isEmail(fd.get('customer_email'))) return setMsg(m,'البريد الإلكتروني غير صحيح.', false);

      const f = form.invoice_file.files && form.invoice_file.files[0];

      const payload = {
        token: s.token,
        invoice_number: safe(fd.get('invoice_number')),
        install_date: safe(fd.get('install_date')),
        customer_name: safe(fd.get('customer_name')),
        customer_phone: safe(fd.get('customer_phone')),
        customer_email: safe(fd.get('customer_email')),
        roll_number: safe(fd.get('roll_number')),
        product_name: safe(fd.get('product_name')),
        installer_name: s.dealer_name,
        city: safe(fd.get('city')),
        invoice_file_name: f ? f.name : ''
      };

      try{
        const out = await apiPost('submission_update_once', payload);
        setMsg(m, out.message || "تم الحفظ.", true);
        setTimeout(()=> window.location.href = "portal.html", 700);
      }catch(err){ setMsg(m, err.message, false); }
    });
  }

})();
