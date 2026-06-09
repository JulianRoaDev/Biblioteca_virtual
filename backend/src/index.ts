import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/books.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'https://proyecto-biblioteca-virtual.netlify.app/', // URL de producción
    'http://localhost:3000', // para desarrollo local
    'http://localhost:5500',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Headers extra para que el iframe pueda embeber el PDF
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Servir las páginas HTML directamente en el servidor
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'pages')));
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

app.get('/', (_req, res) => {
  res.redirect('/login.html');
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});