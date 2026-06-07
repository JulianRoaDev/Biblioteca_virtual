import { Router } from 'express';
import { login, seedAdmin } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/seed', seedAdmin); // Solo para crear el admin inicial

export default router;