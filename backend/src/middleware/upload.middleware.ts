import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear carpetas si no existen
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'pdfs');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'covers');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'pdf' && file.mimetype !== 'application/pdf') {
    cb(new Error('Solo se permiten archivos PDF'));
    return;
  }
  if (file.fieldname === 'cover' && !file.mimetype.startsWith('image/')) {
    cb(new Error('Solo se permiten imágenes para la portada'));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const subDir = file.fieldname === 'pdf' ? 'pdfs' : 'covers';
      const dir = path.join(__dirname, '..', '..', 'uploads', subDir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB máximo
});