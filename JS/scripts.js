// Menú toggle para dispositivos móviles
const menuToggle = document.getElementById('menuToggle');
const navbarCenter = document.querySelector('.navbar-center');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navbarCenter.classList.toggle('active');
  });

  // Cerrar menú al hacer clic en un enlace
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navbarCenter.classList.remove('active');
    });
  });
}

// Contador de caracteres para webhook
const anonMessage = document.getElementById('anonMessage');
const charCount = document.getElementById('charCount');

if (anonMessage) {
  anonMessage.addEventListener('input', () => {
    charCount.textContent = anonMessage.value.length;
  });
}

// Smooth scroll para navegación (mejorado)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});