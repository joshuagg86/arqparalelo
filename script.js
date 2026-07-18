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
  
  let currentIndex = originalCount + 1; 
  let isDown = false;
  let startX;
  let scrollLeft;
  let isMoving = false;
  
  // VARIABLES PARA EL SISTEMA AUTO-PLAY
  let autoplayInterval;
  const autoplaySpeed = 2300; // 1 Segundo de intervalo por tarjeta

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
    const targetX = getPositionX(index);
    container.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    container.scrollLeft = targetX;
    
    let dotIndex = (index - originalCount) % originalCount;
    if (dotIndex < 0) dotIndex += originalCount;
    
    dots.forEach(d => d.classList.remove('active'));
    if (dots[dotIndex]) dots[dotIndex].classList.add('active');
    
    currentIndex = index;
  }

  // --- MOTOR DE CONTROL AUTOMÁTICO (AUTOPLAY) ---
  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      let targetIndex = currentIndex + 1;
      
      if (targetIndex >= originalCount * 2) {
        jumpToCard(targetIndex - originalCount, false);
        setTimeout(() => {
          jumpToCard(currentIndex + 1, true);
        }, 50);
      } else {
        jumpToCard(targetIndex, true);
      }
    }, autoplaySpeed);
  }

  function stopAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
  }

  // --- CONTROLES DE LAS FLECHAS LATERALES ---
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      stopAutoplay();
      let targetIndex = currentIndex + 1;
      if (targetIndex >= originalCount * 2) {
        jumpToCard(targetIndex - originalCount, false);
        setTimeout(() => jumpToCard(currentIndex + 1, true), 50);
      } else {
        jumpToCard(targetIndex, true);
      }
      startAutoplay();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      stopAutoplay();
      let targetIndex = currentIndex - 1;
      if (targetIndex < originalCount) {
        jumpToCard(targetIndex + originalCount, false);
        setTimeout(() => jumpToCard(currentIndex - 1, true), 50);
      } else {
        jumpToCard(targetIndex, true);
      }
      startAutoplay();
    });
  }

  // PAUSAR AL ENTRAR CON EL RATÓN, REANUDAR AL SALIR
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
      stopAutoplay();
      const dotIndex = parseInt(this.getAttribute('data-index'));
      jumpToCard(dotIndex + originalCount, true);
      startAutoplay();
    });
  });

  // Inicialización controlada
  setTimeout(() => {
    jumpToCard(originalCount + 1, false);
    startAutoplay(); 
  }, 300);
  
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
          if (currentIndex < originalCount) {
            jumpToCard(currentIndex + originalCount, false);
          } else if (currentIndex >= originalCount * 2) {
            jumpToCard(currentIndex - originalCount, false);
          }
          wheelCooldown = false;
          startAutoplay();
        }, 800);
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

  // Si el usuario baja más de 400px (pasando la sección Hero), el botón se desvanece hacia adentro
  if (window.scrollY > 400) {
    btnScroll.classList.add('visible');
  } else {
    btnScroll.classList.remove('visible');
  }
});

/* ==========================================================================
   LÓGICA INTERACTIVA PARA EL ACORDEÓN Y CARRUSELES DE SERVICIOS
   ========================================================================== */

// 1. Manejo del Despliegue Colapsable (Slide Up / Down)
function toggleServicio(boton) {
  const bloquePadre = boton.closest('.servicio-item-bloque');
  const panelDetalle = bloquePadre.querySelector('.servicio-panel-detalle');
  
  // Si ya está activo, lo cerramos
  if (bloquePadre.classList.contains('active')) {
    bloquePadre.classList.remove('active');
    panelDetalle.style.maxHeight = null;
  } else {
    // Cerramos cualquier otro panel abierto para mantener orden
    document.querySelectorAll('.servicio-item-bloque').forEach(item => {
      item.classList.remove('active');
      item.querySelector('.servicio-panel-detalle').style.maxHeight = null;
    });
    
    // Abrimos el panel actual calculando su altura matemática exacta en tiempo real
    bloquePadre.classList.add('active');
    panelDetalle.style.maxHeight = panelDetalle.scrollHeight + "px";
  }
}

// 2. Control de los Carruseles Internos de los Paneles
function cambiarSlide(dotSelector, indexDestino) {
  const contenedorCarrusel = dotSelector.closest('.panel-carrusel-contenedor');
  const slides = contenedorCarrusel.querySelectorAll('.slide-img');
  const dots = contenedorCarrusel.querySelectorAll('.dot');
  
  // Removemos clases activas previas
  slides.forEach(slide => slide.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));
  
  // Encendemos el slide y el punto seleccionado
  slides[indexDestino].classList.add('active');
  dotSelector.classList.add('active');
}