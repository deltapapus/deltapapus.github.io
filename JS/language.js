function setLang(lang) {
  // Oculta todas las secciones de idioma explícitamente
  document.querySelectorAll('.lang-es').forEach(e => e.style.display = 'none');
  document.querySelectorAll('.lang-en').forEach(e => e.style.display = 'none');
  // Muestra solo la sección seleccionada
  if (lang === 'es') {
    document.querySelectorAll('.lang-es').forEach(e => e.style.display = 'block');
  } else {
    document.querySelectorAll('.lang-en').forEach(e => e.style.display = 'block');
  }
  // Actualiza los botones
  document.getElementById('lang-es-btn').setAttribute('aria-selected', lang === 'es');
  document.getElementById('lang-en-btn').setAttribute('aria-selected', lang === 'en');
  // Guarda preferencia
  localStorage.setItem('lang', lang);
}

// Restaurar preferencia al cargar
document.addEventListener('DOMContentLoaded', function() {
  const savedLang = localStorage.getItem('lang');
  setLang(savedLang === 'en' ? 'en' : 'es');    
});