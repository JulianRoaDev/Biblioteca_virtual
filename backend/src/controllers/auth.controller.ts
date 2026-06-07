import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM admin WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '8h' }
    );

    res.json({ token, username: admin.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const seedAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await pool.query('SELECT id FROM admin LIMIT 1');
    if (existing.rows.length > 0) {
      res.status(400).json({ message: 'El administrador ya existe' });
      return;
    }

    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO admin (username, password_hash) VALUES ($1, $2)',
      ['admin', hash]
    );

    res.json({ message: 'Administrador creado. Usuario: admin / Contraseña: admin123' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear administrador' });
  }
};