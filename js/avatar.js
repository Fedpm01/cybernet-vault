// ============================================================
// CYBERNET VAULT // Avatar upload + remove
// ============================================================

function bindAvatarUpload() {
  const btn = document.getElementById('avatar-upload-btn');
  const removeBtn = document.getElementById('avatar-remove-btn');
  const input = document.getElementById('avatar-file-input');
  if (!btn || !input) return;

  // Открыть файл-пикер
  btn.addEventListener('click', () => input.click());

  // Загрузка нового файла
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Лимит 2 MB
    if (file.size > 2 * 1024 * 1024) {
      toast('Файл слишком большой, максимум 2 МБ', 'err');
      e.target.value = '';
      return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${user.id}/avatar.${ext}`;

    toast('Загружаю...', 'in');

    // Удаляем старые форматы (на случай если был png, а сейчас jpg)
    for (const oldExt of ['png', 'jpg', 'jpeg', 'webp']) {
      if (oldExt !== ext) {
        await supabaseClient.storage.from('avatars').remove([`${user.id}/avatar.${oldExt}`]);
      }
    }

    // Загружаем новый файл
    const { error: uploadError } = await supabaseClient.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast('Ошибка загрузки: ' + uploadError.message, 'err');
      e.target.value = '';
      return;
    }

    const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(path);
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ avatar_url: urlWithBust })
      .eq('id', user.id);

    if (updateError) {
      toast('Ошибка сохранения: ' + updateError.message, 'err');
      return;
    }

    if (window.myProfile) window.myProfile.avatar_url = urlWithBust;
    applyAvatar(urlWithBust);
    toast('Аватар обновлён', 'in');
    e.target.value = '';   // сброс инпута чтобы можно было выбрать тот же файл повторно
  });

  // Удаление аватара
  if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
      if (!confirm('Удалить аватар? Вернутся инициалы.')) return;

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      toast('Удаляю...', 'in');

      // Удаляем файлы из storage (все возможные форматы)
      for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
        await supabaseClient.storage.from('avatars').remove([`${user.id}/avatar.${ext}`]);
      }

      // Очищаем avatar_url в профиле
      const { error } = await supabaseClient
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) {
        toast('Ошибка: ' + error.message, 'err');
        return;
      }

      if (window.myProfile) window.myProfile.avatar_url = null;
      applyAvatar(null);
      toast('Аватар удалён', 'in');
    });
  }
}

// Применить аватар к UI (профиль + топбар) + управлять видимостью кнопки удаления
function applyAvatar(url) {
  const img = document.getElementById('profile-avatar-img');
  const initials = document.getElementById('profile-avatar-initials');
  const removeBtn = document.getElementById('avatar-remove-btn');

  if (url) {
    if (img) {
      img.src = url;
      img.style.display = 'block';
    }
    if (initials) initials.style.display = 'none';
    if (removeBtn) removeBtn.style.display = '';   // показать кнопку удаления
  } else {
    if (img) {
      img.style.display = 'none';
      img.src = '';
    }
    if (initials) initials.style.display = '';
    if (removeBtn) removeBtn.style.display = 'none';   // скрыть кнопку удаления
  }

  // Топбар
  const avatarBtn = document.getElementById('avatar-btn');
  if (avatarBtn) {
    if (url) {
      avatarBtn.style.backgroundImage = `url("${url}")`;
      avatarBtn.style.backgroundSize = 'cover';
      avatarBtn.style.backgroundPosition = 'center';
      avatarBtn.textContent = '';
    } else {
      avatarBtn.style.backgroundImage = '';
      // Возвращаем инициалы в топбар
      if (window.myProfile && typeof getInitials === 'function') {
        avatarBtn.textContent = getInitials(window.myProfile.name);
      }
    }
  }
}
