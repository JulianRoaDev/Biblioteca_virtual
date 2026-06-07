const API = 'http://localhost:3000/api';

// Verificar sesión
if (!localStorage.getItem('token')) {
  window.location.href = 'login.html';
}

const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');

if (!bookId) {
  window.location.href = 'books.html';
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

// Menú hamburguesa
const toggle = document.getElementById('nav-toggle');
if (toggle) {
  toggle.addEventListener('click', () =>
    document.querySelector('.nav-links').classList.toggle('open')
  );
}

// ✅ Cargar datos del libro y apuntar el iframe directamente al endpoint
fetch(`${API}/books/${bookId}`)
  .then(res => {
    if (!res.ok) throw new Error('Libro no encontrado');
    return res.json();
  })
  .then(book => {
    document.title = `${book.title} — Biblioteca Virtual`;
    document.getElementById('book-title').textContent = book.title;
    document.getElementById('book-author').textContent = `✍️ ${book.author}`;
    document.getElementById('book-synopsis').textContent =
      book.synopsis || 'Sin sinopsis disponible.';
    document.getElementById('book-date').textContent = book.publication_date
      ? `📅 Publicado: ${new Date(book.publication_date).toLocaleDateString('es-CO')}`
      : '';

    // ✅ URL directa al PDF — el iframe la carga sin necesitar JS adicional
    const pdfUrl = `${API}/books/${bookId}/pdf`;
    document.getElementById('pdf-iframe').src = pdfUrl;

    // Botón de descarga
    const dlBtn = document.getElementById('download-btn');
    dlBtn.href = `${pdfUrl}?download=true`;
    dlBtn.setAttribute('download', `${book.title}.pdf`);
  })
  .catch(err => {
    console.error(err);
    document.getElementById('book-title').textContent = 'Error al cargar el libro';
    document.getElementById('book-author').textContent = '';
  });