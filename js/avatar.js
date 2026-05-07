// ============================================================
// CYBERNET VAULT // Avatar upload
// ============================================================

function bindAvatarUpload() {
  const btn = document.getElementById('avatar-upload-btn');
  const input = document.getElementById('avatar-file-input');
  if (!btn || !input) return;

  btn.addEventListener('click', () => input.click());

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Лимит 2 MB
    if (file.size > 2 * 1024 * 1024) {
      toast('Файл слишком большой, максимум 2 МБ', 'err');
      return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // Имя файла: {user_id}/avatar.{ext}
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${user.id}/avatar.${ext}`;

    toast('Загружаю...', 'in');

    // Удаляем старый файл (если был любой формат)
    for (const oldExt of ['png', 'jpg', 'jpeg', 'webp']) {
      if (oldExt !== ext) {
        await supabaseClient.storage.from('avatars').remove([`${user.id}/avatar.${oldExt}`]);
      }
    }

    // Загружаем новый
    const { error: uploadError } = await supabaseClient.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast('Ошибка загрузки: ' + uploadError.message, 'err');
      return;
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(path);
    // Кеш-бастинг чтобы новая картинка точно загрузилась
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;

    // Сохраняем в профиле
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ avatar_url: urlWithBust })
      .eq('id', user.id);

    if (updateError) {
      toast('Ошибка сохранения: ' + updateError.message, 'err');
      return;
    }

    // Обновляем локально
    if (window.myProfile) window.myProfile.avatar_url = urlWithBust;
    applyAvatar(urlWithBust);
    toast('Аватар обновлён', 'in');
  });
}

// Применить аватар к UI (профиль + топбар)
function applyAvatar(url) {
  // Профиль
  const wrap = document.getElementById('profile-avatar-wrap');
  const img = document.getElementById('profile-avatar-img');
  const initials = document.getElementById('profile-avatar-initials');

  if (url && img) {
    img.src = url;
    img.style.display = 'block';
    if (initials) initials.style.display = 'none';
  } else if (img && initials) {
    img.style.display = 'none';
    img.src = '';
    initials.style.display = '';
  }

  // Топбар
  const avatarBtn = document.getElementById('avatar-btn');
  if (avatarBtn && url) {
    avatarBtn.style.backgroundImage = `url("${url}")`;
    avatarBtn.style.backgroundSize = 'cover';
    avatarBtn.style.backgroundPosition = 'center';
    avatarBtn.textContent = '';
  } else if (avatarBtn) {
    avatarBtn.style.backgroundImage = '';
    // Текст вернётся через renderProfileHeader
  }
}