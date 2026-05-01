// ============================================================
// CYBERNET VAULT // Auth (login + signup)
// ============================================================

function bindAuth() {
  $$('.auth__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.auth__tab').forEach(t => t.classList.remove('auth__tab--active'));
      tab.classList.add('auth__tab--active');
      const which = tab.dataset.tab;
      $$('.auth__pane').forEach(p => p.hidden = p.dataset.pane !== which);
    });
  });

  $('#form-login')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#login-email').value;
    const password = $('#login-pw').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      toast(error.message, 'err');
      return;
    }
    await loadAllData();
    showApp();
  });

  $('#form-signup')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const firstName = form.querySelectorAll('input[type="text"]')[0].value;
    const lastName = form.querySelectorAll('input[type="text"]')[1].value;
    const team = form.querySelector('select').value;

    // Только корпоративные email
    if (!email.endsWith('@cybernet.ai')) {
      toast('Регистрация только для @cybernet.ai', 'err');
      return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email, password,
      options: { data: { name: `${firstName} ${lastName}`, team } }
    });
    if (error) { toast(error.message, 'err'); return; }

    toast('Аккаунт создан · стартовый бонус +500 CC', 'in');
    await loadAllData();
    showApp();
  });
}

async function logout() {
  await supabaseClient.auth.signOut();
  state.cart = [];
  showAuth();
}

function showApp() {
  $('#shell-auth').classList.remove('shell--active');
  $('#shell-app').classList.add('shell--active');
  window.scrollTo({ top: 0 });
}
function showAuth() {
  $('#shell-app').classList.remove('shell--active');
  $('#shell-auth').classList.add('shell--active');
}

function quickLogin() {
  // Demo SSO — для прототипа можно оставить так
  toast('SSO ещё не настроен — используй email', 'err');
}