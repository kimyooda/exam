import { Router } from 'express';
import { getMenuById, getMenus } from '../controllers/menuController.js';

export const menuRoutes = Router();

menuRoutes.get('/', getMenus);
menuRoutes.get('/:id', getMenuById);
