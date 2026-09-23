/* ==========================================================================
   INTEGRACIÓN HEADLESS CON LÍNEA DE TIEMPO DINÁMICA
   ========================================================================== */

const WP_API_URL = 'https://blog.arqparalelo.com/wp-json/wp/v2/posts?_embed&per_page=10';

document.addEventListener('DOMContentLoaded', () => {
  cargarBlogsPage();
  crearModalLector();
});

async function cargarBlogsPage() {
  const contenedorGrid = document.getElementById('blog-grid-page');
  const contenedorTimeline = document.getElementById('blog-timeline-list');
  if (!contenedorGrid) return;

  try {
    const respuesta = await fetch(WP_API_URL);
    if (!respuesta.ok) throw new Error('Error al consultar WordPress');

    const entradas = await respuesta.json();

    if (entradas.length === 0) {
      contenedorGrid.innerHTML = '<p class="blog-loading">No hay publicaciones disponibles por el momento.</p>';
      if (contenedorTimeline) contenedorTimeline.innerHTML = '<li>Sin historial.</li>';
      return;
    }

    // Limpiar contenedores
    contenedorGrid.innerHTML = '';
    if (contenedorTimeline) contenedorTimeline.innerHTML = '';

    entradas.forEach((post) => {
      // 1. EXTRAER DATOS
      let imagenUrl = 'assets/img/team.jpg'; 
      if (post._embedded && post._embedded['wp:featuredmedia']) {
        imagenUrl = post._embedded['wp:featuredmedia'][0].source_url;
      }

      const fecha = new Date(post.date).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      const titulo = post.title.rendered;
      const extracto = post.excerpt.rendered;

      // 2. CONSTRUIR TARJETA DE LA IZQUIERDA
      const tarjetaHTML = `
        <article class="blog-card-page">
          <div class="blog-card-img-wrapper">
            <img src="${imagenUrl}" alt="${titulo}" loading="lazy">
          </div>
          <div class="blog-card-body">
            <span class="blog-card-date">${fecha}</span>
            <h2 class="blog-card-page-title">${titulo}</h2>
            <div class="blog-card-page-excerpt">${extracto}</div>
            <button type="button" onclick="abrirArticulo(${post.id})" class="btn-read-more-page" style="background:none; border:none; cursor:pointer; padding:0;">
              Leer artículo completo &rarr;
            </button>
          </div>
        </article>
      `;
      contenedorGrid.innerHTML += tarjetaHTML;

      // 3. CONSTRUIR ITEM DE LA LÍNEA DE TIEMPO (DERECHA)
      if (contenedorTimeline) {
        const timelineHTML = `
          <li class="timeline-item">
            <span class="timeline-dot"></span>
            <span class="timeline-date">${fecha}</span>
            <a href="javascript:void(0)" onclick="abrirArticulo(${post.id})" class="timeline-title-link">
              ${titulo}
            </a>
          </li>
        `;
        contenedorTimeline.innerHTML += timelineHTML;
      }
    });

  } catch (error) {
    console.error('Error al obtener los blogs:', error);
    contenedorGrid.innerHTML = '<p class="blog-loading">Ocurrió un error al cargar las publicaciones.</p>';
  }
}

/* ==========================================================================
   LECTOR DE ARTÍCULO COMPLETO (MODAL)
   ========================================================================== */
function crearModalLector() {
  const modalHTML = `
    <div id="blog-modal-reader" class="blog-modal-overlay" style="display: none;">
      <div class="blog-modal-content">
        <button class="blog-modal-close" onclick="cerrarArticulo()">&times;</button>
        <div id="blog-modal-body">
          <p style="text-align:center; padding: 40px;">Cargando contenido...</p>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function abrirArticulo(postId) {
  const modal = document.getElementById('blog-modal-reader');
  const body = document.getElementById('blog-modal-body');
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  body.innerHTML = '<p style="text-align:center; padding: 40px; font-size:18px;">Cargando entrada...</p>';

  try {
    const respuesta = await fetch(`https://blog.arqparalelo.com/wp-json/wp/v2/posts/${postId}?_embed`);
    const post = await respuesta.json();

    let imagenUrl = '';
    if (post._embedded && post._embedded['wp:featuredmedia']) {
      imagenUrl = post._embedded['wp:featuredmedia'][0].source_url;
    }

    const fecha = new Date(post.date).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    body.innerHTML = `
      ${imagenUrl ? `<img src="${imagenUrl}" class="blog-modal-banner" alt="${post.title.rendered}">` : ''}
      <span class="blog-modal-date">${fecha}</span>
      <h1 class="blog-modal-title">${post.title.rendered}</h1>
      <div class="blog-modal-text">${post.content.rendered}</div>
    `;

  } catch (error) {
    body.innerHTML = '<p style="text-align:center; color: red;">Error al abrir el artículo.</p>';
  }
}

function cerrarArticulo() {
  const modal = document.getElementById('blog-modal-reader');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}