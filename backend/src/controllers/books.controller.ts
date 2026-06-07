import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/db';

export const getAllBooks = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, title, author, synopsis, publication_date, cover_image, created_at FROM books ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener libros' });
  }
};

export const getBookById = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Libro no encontrado' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el libro' });
  }
};

export const createBook = async (req: Request, res: Response): Promise<void> => {
  const { title, author, synopsis, publication_date } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files?.pdf?.[0]) {
    res.status(400).json({ message: 'El PDF es obligatorio' });
    return;
  }

  const pdfPath = `/uploads/pdfs/${files.pdf[0].filename}`;
  const coverPath = files?.cover?.[0]
    ? `/uploads/covers/${files.cover[0].filename}`
    : null;

  try {
    const result = await pool.query(
      `INSERT INTO books (title, author, synopsis, publication_date, cover_image, pdf_path)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, author, synopsis, publication_date, coverPath, pdfPath]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el libro' });
  }
};

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, author, synopsis, publication_date } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  try {
    const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ message: 'Libro no encontrado' });
      return;
    }

    const pdfPath = files?.pdf?.[0]
      ? `/uploads/pdfs/${files.pdf[0].filename}`
      : existing.rows[0].pdf_path;

    const coverPath = files?.cover?.[0]
      ? `/uploads/covers/${files.cover[0].filename}`
      : existing.rows[0].cover_image;

    const result = await pool.query(
      `UPDATE books SET title=$1, author=$2, synopsis=$3, publication_date=$4,
       cover_image=$5, pdf_path=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title, author, synopsis, publication_date, coverPath, pdfPath, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el libro' });
  }
};

export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ message: 'Libro no encontrado' });
      return;
    }

    // Eliminar archivos físicos
    const book = existing.rows[0];
    const pdfFull = path.join(__dirname, '..', '..', book.pdf_path.replace(/^[/\\]+/, ''));
    if (fs.existsSync(pdfFull)) fs.unlinkSync(pdfFull);

    if (book.cover_image) {
      const coverFull = path.join(__dirname, '..', '..', book.cover_image.replace(/^[/\\]+/, ''));
      if (fs.existsSync(coverFull)) fs.unlinkSync(coverFull);
    }

    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.json({ message: 'Libro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el libro' });
  }
};

export const streamPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT pdf_path, title FROM books WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Libro no encontrado' });
      return;
    }

    const { pdf_path, title } = result.rows[0];
    const pdfAbsolute = path.join(__dirname, '..', '..', pdf_path.replace(/^[/\\]+/, ''));

    if (!fs.existsSync(pdfAbsolute)) {
      res.status(404).json({ message: 'Archivo PDF no encontrado en disco' });
      return;
    }

    const stat = fs.statSync(pdfAbsolute);
    const isDownload = req.query.download === 'true';

    // ✅ Headers necesarios para iframe + descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors http://localhost:3000 http://127.0.0.1:3000;");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(title)}.pdf"`
    );

    fs.createReadStream(pdfAbsolute).pipe(res);
  } catch (error) {
    console.error('Error streamPDF:', error);
    res.status(500).json({ message: 'Error al obtener el PDF' });
  }
};