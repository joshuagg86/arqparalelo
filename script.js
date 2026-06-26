document.addEventListener("DOMContentLoaded", function() {
  const container = document.querySelector('.carrusel-proyectos-container');
  const track = document.querySelector('.carrusel-track');
  const originalCards = document.querySelectorAll('.proyecto-card');
  const dots = document.querySelectorAll('.dot');
  
  if (!container || !track || originalCards.length === 0) return;

  // CLONACIÓN PARA EL EFECTO DE BUCLE INFINITO
  originalCards.forEach(card => {
    const cloneBefore = card.cloneNode(true);
    const cloneAfter = card.cloneNode(true);
    track.appendChild(cloneAfter);
    track.insertBefore(cloneBefore, track.firstChild);
  });

  const allCards = track.querySelectorAll('.proyecto-card');
  const originalCount = originalCards.length;
  
  let currentIndex = originalCount + 1; // Arrancamos en la tarjeta 2 real
  let isDown = false;
  let startX;
  let scrollLeft;
  let isMoving = false;

  // CALIBRACIÓN DINÁMICA DE POSICIÓN (REPARADA PARA MÓVIL Y ESCRITORIO)
  function getPositionX(index) {
    const cardWidth = allCards[index].offsetWidth;
    const containerWidth = container.clientWidth;
    
    // Obtenemos dinámicamente los estilos reales configurados en tu CSS
    const trackStyles = window.getComputedStyle(track);
    const gap = parseInt(trackStyles.gap) || 40;
    const paddingLeft = parseInt(trackStyles.paddingLeft) || 40;
    
    // Cálculo matemático basado en la posición física real del elemento en el riel
    const totalCardOffset = (index * (cardWidth + gap)) + paddingLeft;
    
    // Forzamos el centro exacto restando la mitad de la pantalla
    return totalCardOffset - (containerWidth / 2) + (cardWidth / 2);
  }

  function jumpToCard(index, smooth = true) {
    const targetX = getPositionX(index);
    container.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    container.scrollLeft = targetX;
    
    let dotIndex = (index - originalCount) % originalCount;
    if (dotIndex < 0) dotIndex += originalCount;
    
    dots.forEach(d => d.classList.remove('active'));
    if (dots[dotIndex]) dots[dotIndex].classList.add('active');
    
    currentIndex = index;
  }

  // --- EVENTOS DE ESCRITORIO (MOUSE) ---
  container.addEventListener('mousedown', (e) => {
    isDown = true;
    isMoving = false;
    container.style.scrollBehavior = 'auto';
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseleave', () => {
    if (!isDown) return;
    isDown = false;
    snapToNearest();
  });

  container.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    if (isMoving) snapToNearest();
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5; 
    if (Math.abs(walk) > 5) isMoving = true;
    container.scrollLeft = scrollLeft - walk;
  });

  // --- NUEVOS EVENTOS NATIVOS PARA MÓVIL (PANTALLA TÁCTIL) ---
  container.addEventListener('touchstart', (e) => {
    isDown = true;
    isMoving = false;
    container.style.scrollBehavior = 'auto';
    startX = e.touches[0].pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  }, { passive: true });

  container.addEventListener('touchend', () => {
    if (!isDown) return;
    isDown = false;
    snapToNearest();
  });

  container.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) isMoving = true;
    container.scrollLeft = scrollLeft - walk;
  }, { passive: true });

  // REAJUSTE AUTOMÁTICO AL SOLTAR EL DEDO O EL MOUSE
  function snapToNearest() {
    const containerCenter = container.scrollLeft + (container.clientWidth / 2);
    let closestIndex = 0;
    let minDistance = Infinity;

    allCards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    // Control del bucle infinito invisible
    if (closestIndex < originalCount) {
      jumpToCard(closestIndex + originalCount, false);
    } else if (closestIndex >= originalCount * 2) {
      jumpToCard(closestIndex - originalCount, false);
    } else {
      jumpToCard(closestIndex, true);
    }
  }

  // EVENTO PARA LOS DOTS
  dots.forEach(dot => {
    dot.addEventListener('click', function(e) {
      e.preventDefault();
      const dotIndex = parseInt(this.getAttribute('data-index'));
      jumpToCard(dotIndex + originalCount, true);
    });
  });

  // Inicio seguro centrado con retardo leve para que el móvil calcule el viewport
  setTimeout(() => {
    jumpToCard(originalCount + 1, false);
  }, 300);

  // Recalcular posición si el usuario llega a rotar la pantalla
  window.addEventListener('resize', () => {
    jumpToCard(currentIndex, false);
  });
});

// FUNCIÓN PARA NOTAS DE WORDPRESS DESDE LA REST API
function loadWordPressBlogs() {
  const wpApiUrl = "https://www.arqparalelo.com/wp-json/wp/v2/posts?_embed&per_page=4";
  const container = document.getElementById('blog-dynamic-container');
  
  if (!container) return;

  fetch(wpApiUrl)
    .then(response => {
      if (!response.ok) throw new Error("Error al conectar con la API de WordPress");
      return response.json();
    })
    .then(posts => {
      container.innerHTML = "";

      posts.forEach(post => {
        let imageUrl = "assets/img/fallback-blog.png";
        try {
          if (post._embedded && post._embedded['wp:featuredmedia']) {
            imageUrl = post._embedded['wp:featuredmedia'][0].source_url;
          }
        } catch (e) { console.log("Post sin imagen destacada"); }

        let excerptText = post.excerpt.rendered.replace(/<\/?[^>]+(>|$)/g, "");
        
        const cardHTML = `
          <div class="blog-card " style="background-image: url('${imageUrl}');">
            <a href="${post.link}" class="blog-card-arrow" target="_blank">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 19L19 5M19 5H10M19 5V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <div class="blog-card-content">
              <h3 class="blog-card-title">${post.title.rendered}</h3>
              <p class="blog-card-excerpt">${excerptText}</p>
              <a href="${post.link}" class="btn-blog-read" target="_blank">Leer más</a>
            </div>
          </div>
        `;
        
        container.innerHTML += cardHTML;
      });
    })
    .catch(error => {
      console.error(error);
      container.innerHTML = `<div class="blog-loading">No se pudieron cargar las notas de forma dinámica.</div>`;
    });
}

// Carga de blogs de WordPress al procesar el DOM
document.addEventListener("DOMContentLoaded", () => {
  loadWordPressBlogs();
});

// CONTROL INTERACTIVO DEL MENÚ HAMBURGUESA EN MÓVIL
const menuBtn = document.getElementById('mobile-menu-btn');
const mainNav = document.getElementById('main-nav');

if (menuBtn && mainNav) {
  menuBtn.addEventListener('click', function() {
    this.classList.toggle('active');
    mainNav.classList.toggle('active');
  });

  const navLinks = mainNav.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('active');
      mainNav.classList.remove('active');
    });
  });
}

// MOTOR DE ANIMACIONES NATIVO (INTERSECTION OBSERVER)
document.addEventListener("DOMContentLoaded", function() {
  const elementsToReveal = document.querySelectorAll('.reveal-anim');

  const revealOptions = {
    root: null,          // Usa el viewport del navegador
    threshold: 0.12,     // Se activa cuando el 12% del elemento ya es visible
    rootMargin: "0px 0px -50px 0px" // Se dispara un poquito antes de llegar para suavizar
  };

  const revealObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Añadimos la clase que dispara la transición CSS
        entry.target.classList.add('animated');
        // Dejamos de vigilarlo para que la animación solo ocurra la primera vez
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  // Ponemos a vigilar a todos los elementos marcados
  elementsToReveal.forEach(element => {
    revealObserver.observe(element);
  });
});

// DETECTOR DE SCROLL PARA CAMBIO DE COLOR EN NAVBAR
window.addEventListener('scroll', function() {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// CONTROL INTELIGENTE DEL PRELOADER CON SINCRONIZACIÓN DE VIDEO HERO
document.addEventListener("DOMContentLoaded", function() {
  const preloader = document.getElementById('custom-preloader');
  const videoPreloader = document.getElementById('preloader-video');
  const videoHero = document.getElementById('hero-bg-video'); // Capturamos el video del fondo

  if (!preloader || !videoPreloader) return;

  // Si el usuario ya vio la animación en esta sesión, liberamos el sitio de inmediato
  if (sessionStorage.getItem('preloaderVisto') === 'true') {
    preloader.style.display = 'none';
    if (videoHero) videoHero.play(); // Si no hay preloader, el video del fondo corre directo
    return;
  }

  // Si es la primera vez, reproducimos el preloader
  videoPreloader.play().catch(error => {
    console.log("Play automático del preloader bloqueado, saltando al fade-out.");
    ejecutarSalida();
  });

  // Cuando el video del preloader termina de forma natural...
  videoPreloader.addEventListener('ended', function() {
    ejecutarSalida();
  });

  // Candado de seguridad (4 segundos máximo por si se traba el archivo)
  setTimeout(() => {
    if (!preloader.classList.contains('fade-out')) {
      ejecutarSalida();
    }
  }, 4000);

  function ejecutarSalida() {
    preloader.classList.add('fade-out');
    sessionStorage.setItem('preloaderVisto', 'true');
    
    // ACCIÓN MÁGICA: Encendemos el video del Hero justo cuando la pantalla blanca se disuelve
    if (videoHero) {
      videoHero.play().catch(err => console.log("El navegador bloqueó el play del hero de forma automática."));
    }
  }
});