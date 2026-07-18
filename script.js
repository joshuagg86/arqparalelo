document.addEventListener("DOMContentLoaded", function() {
  const container = document.querySelector('.carrusel-proyectos-container');
  const track = document.querySelector('.carrusel-track');
  const originalCards = document.querySelectorAll('.proyecto-card');
  const dots = document.querySelectorAll('.dot');
  const btnPrev = document.querySelector('.btn-prev');
  const btnNext = document.querySelector('.btn-next');
  
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
  
  // CORRECCIÓN: Ajustado el índice base al inicio real de la cuadrícula
  let currentIndex = originalCount; 
  let isDown = false;
  let startX;
  let scrollLeft;
  let isMoving = false;
  let isScrollJumping = false; 
  
  // VARIABLES PARA EL SISTEMA AUTO-PLAY
  let autoplayInterval;
  const autoplaySpeed = 4000; 

  function getPositionX(index) {
    const cardWidth = allCards[index].offsetWidth;
    const containerWidth = container.clientWidth;
    const trackStyles = window.getComputedStyle(track);
    const gap = parseInt(trackStyles.gap) || 40;
    const paddingLeft = parseInt(trackStyles.paddingLeft) || 40;
    
    const totalCardOffset = (index * (cardWidth + gap)) + paddingLeft;
    return totalCardOffset - (containerWidth / 2) + (cardWidth / 2);
  }

  function jumpToCard(index, smooth = true) {
    if (index < 0 || index >= allCards.length) return;
    
    currentIndex = index;
    const targetX = getPositionX(index);
    
    container.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    container.scrollLeft = targetX;
    
    let dotIndex = (index - originalCount) % originalCount;
    if (dotIndex < 0) dotIndex += originalCount;
    
    dots.forEach(d => d.classList.remove('active'));
    if (dots[dotIndex]) dots[dotIndex].classList.add('active');
  }

  // --- ESCUCHADOR MAESTRO DE SCROLL (CORREGIDO DE RAÍZ) ---
  container.addEventListener('scroll', () => {
    if (isDown || isScrollJumping) return;

    const currentScroll = container.scrollLeft;
    // Límites matemáticos basados en índices reales comenzando desde 0
    const startLimit = getPositionX(originalCount - 1);
    const endLimit = getPositionX(originalCount * 2 - 1);

    // CORRECCIÓN: Si toca el extremo derecho, se regresa de forma invisible al Casa Umbral real (índice originalCount)
    if (currentScroll >= endLimit + 10) {
      isScrollJumping = true;
      currentIndex = originalCount;
      container.style.scrollBehavior = 'auto';
      container.scrollLeft = getPositionX(originalCount);
      requestAnimationFrame(() => { isScrollJumping = false; });
    } 
    // Si toca el extremo izquierdo, salta de forma invisible al clon del final
    else if (currentScroll <= startLimit - 10) {
      isScrollJumping = true;
      currentIndex = (originalCount * 2) - 1;
      container.style.scrollBehavior = 'auto';
      container.scrollLeft = getPositionX(currentIndex);
      requestAnimationFrame(() => { isScrollJumping = false; });
    }
  });

  // --- MOTOR DE CONTROL AUTOMÁTICO (AUTOPLAY) ---
  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      jumpToCard(currentIndex + 1, true);
    }, autoplaySpeed);
  }

  function stopAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
  }

  // --- CONTROLES DE LAS FLECHAS LATERALES ---
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      stopAutoplay();
      jumpToCard(currentIndex + 1, true);
      startAutoplay();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      stopAutoplay();
      jumpToCard(currentIndex - 1, true);
      startAutoplay();
    });
  }

  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', () => {
    if (!isDown) startAutoplay();
  });

  // --- EVENTOS DE ESCRITORIO (MOUSE DRAG) ---
  container.addEventListener('mousedown', (e) => {
    isDown = true;
    isMoving = false;
    stopAutoplay();
    container.style.scrollBehavior = 'auto';
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseleave', () => {
    if (!isDown) return;
    isDown = false;
    snapToNearest();
    startAutoplay();
  });

  container.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    if (isMoving) snapToNearest();
    startAutoplay();
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5; 
    if (Math.abs(walk) > 5) isMoving = true;
    container.scrollLeft = scrollLeft - walk;
  });

  // --- EVENTOS DE PANTALLA TÁCTIL (MÓVIL) ---
  container.addEventListener('touchstart', (e) => {
    isDown = true;
    isMoving = false;
    stopAutoplay();
    container.style.scrollBehavior = 'auto';
    startX = e.touches[0].pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  }, { passive: true });

  container.addEventListener('touchend', () => {
    if (!isDown) return;
    isDown = false;
    snapToNearest();
    startAutoplay();
  });

  container.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) isMoving = true;
    container.scrollLeft = scrollLeft - walk;
  }, { passive: true });

  function snapToNearest() {
    const containerCenter = container.scrollLeft + (container.clientWidth / 2);
    let closestIndex = originalCount;
    let minDistance = Infinity;

    allCards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });

    jumpToCard(closestIndex, true);
  }

  // EVENTO PARA LOS DOTS
  dots.forEach(dot => {
    dot.addEventListener('click', function(e) {
      e.preventDefault();
      stopAutoplay();
      const dotIndex = parseInt(this.getAttribute('data-index'));
      jumpToCard(dotIndex + originalCount, true);
      startAutoplay();
    });
  });

  // CORRECCIÓN: Inicialización limpia centrando la tarjeta 0 real (Casa Umbral)
  setTimeout(() => {
    jumpToCard(originalCount, false);
    startAutoplay(); 
  }, 200);
  
  // EVENTO RUEDA / TRACKPAD
  let wheelCooldown = false;
  container.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > 4 || Math.abs(e.deltaY) > 4) {
      e.preventDefault(); 
      stopAutoplay();

      if (wheelCooldown) return; 
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

      if (Math.abs(delta) > 15) { 
        wheelCooldown = true;
        if (delta > 0) {
          jumpToCard(currentIndex + 1, true);
        } else {
          jumpToCard(currentIndex - 1, true);
        }

        setTimeout(() => {
          wheelCooldown = false;
          startAutoplay();
        }, 600);
      }
    }
  }, { passive: false });

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
    root: null,
    threshold: 0.12,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

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
  const videoHero = document.getElementById('hero-bg-video');

  if (!preloader || !videoPreloader) return;

  if (sessionStorage.getItem('preloaderVisto') === 'true') {
    preloader.style.display = 'none';
    if (videoHero) videoHero.play();
    return;
  }

  videoPreloader.play().catch(error => {
    console.log("Play automático del preloader bloqueado, saltando al fade-out.");
    ejecutarSalida();
  });

  videoPreloader.addEventListener('ended', function() {
    ejecutarSalida();
  });

  setTimeout(() => {
    if (!preloader.classList.contains('fade-out')) {
      ejecutarSalida();
    }
  }, 4000);

  function ejecutarSalida() {
    preloader.classList.add('fade-out');
    sessionStorage.setItem('preloaderVisto', 'true');
    
    if (videoHero) {
      videoHero.play().catch(err => console.log("El navegador bloqueó el play del hero de forma automática."));
    }
  }
});

// CONTROL DE VISIBILIDAD PARA EL BOTÓN FLOTANTE "SCROLL TO TOP"
window.addEventListener('scroll', function() {
  const btnScroll = document.querySelector('.btn-scroll-top');
  if (!btnScroll) return;

  if (window.scrollY > 400) {
    btnScroll.classList.add('visible');
  } else {
    btnScroll.classList.remove('visible');
  }
});

// ==========================================================================
// CONTROL SIMPLIFICADO DE ACORDEÓN (VERSIÓN BLINDADA PARA LA JUNTA)
// ==========================================================================
function toggleServicio(button) {
  // Localizamos únicamente el bloque donde se hizo click
  const bloque = button.closest('.servicio-item-bloque');
  const detalle = bloque.querySelector('.servicio-panel-detalle');
  
  if (!bloque || !detalle) return;

  // Si está abierto, lo cerramos
  if (bloque.classList.contains('active')) {
    bloque.classList.remove('active');
    detalle.style.maxHeight = '0px';
  } else {
    // Si está cerrado, lo abrimos calculando su altura exacta
    bloque.classList.add('active');
    detalle.style.maxHeight = detalle.scrollHeight + "px";
  }
}

// CONTROL DE CAMBIO DE Renders INTERNOS
function cambiarSlide(dot, indexSlide) {
  const contenedor = dot.closest('.panel-carrusel-contenedor');
  if (!contenedor) return;
  
  const slides = contenedor.querySelectorAll('.slide-img');
  const dots = contenedor.querySelectorAll('.dot');
  
  slides.forEach(img => img.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  
  if (slides[indexSlide]) slides[indexSlide].classList.add('active');
  dot.classList.add('active');
}