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

  function getPositionX(index) {
    const cardWidth = originalCards[0].offsetWidth;
    const gap = 40; 
    const containerWidth = container.clientWidth;
    return (index * (cardWidth + gap)) - (containerWidth / 2) + (cardWidth / 2) + 40;
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

  // EVENTOS DEL MOUSE (Mover arrastrando)
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

  // Reajuste automático al soltar el mouse
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

  // Inicio seguro centrado en el segundo proyecto real
  setTimeout(() => {
    jumpToCard(originalCount + 1, false);
  }, 200);
});

// AGREGAR AL FINAL DE TU ARCHIVO SCRIPT.JS EXISTENTE
function loadWordPressBlogs() {
  // Reemplaza esta URL con el dominio real de tu WordPress en el hosting
  const wpApiUrl = "https://www.arqparalelo.com/wp-json/wp/v2/posts?_embed&per_page=4";
  const container = document.getElementById('blog-dynamic-container');
  
  if (!container) return;

  fetch(wpApiUrl)
    .then(response => {
      if (!response.ok) throw new Error("Error al conectar con la API de WordPress");
      return response.json();
    })
    .then(posts => {
      // Limpiamos el mensaje de "Cargando..."
      container.innerHTML = "";

      posts.forEach(post => {
        // 1. Intentamos extraer la imagen destacada de WordPress de forma segura
        let imageUrl = "assets/img/fallback-blog.png"; // Imagen por si no subieron foto destacada
        try {
          if (post._embedded && post._embedded['wp:featuredmedia']) {
            imageUrl = post._embedded['wp:featuredmedia'][0].source_url;
          }
        } catch (e) { console.log("Post sin imagen destacada"); }

        // 2. Limpiamos las etiquetas HTML raras que WordPress mete en el extracto corto
        let excerptText = post.excerpt.rendered.replace(/<\/?[^>]+(>|$)/g, "");
        
        // 3. Estructuramos e inyectamos la tarjeta con tus clases CSS exactas
        const cardHTML = `
          <div class="blog-card" style="background-image: url('${imageUrl}');">
            
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

// Ejecutamos la carga en cuanto el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  loadWordPressBlogs();
});