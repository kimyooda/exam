import { Router } from 'express';
import {
  createAdminMenu,
  deleteAdminOrder,
  deleteAllAdminOrders,
  getAdminOrders,
  hideAdminMenu,
  updateAdminMenu
} from '../controllers/adminController.js';

export const adminRoutes = Router();

adminRoutes.get('/orders', getAdminOrders);
adminRoutes.post('/menus', createAdminMenu);
adminRoutes.put('/menus/:menuId', updateAdminMenu);
adminRoutes.delete('/orders', deleteAllAdminOrders);
adminRoutes.delete('/orders/:orderId', deleteAdminOrder);
adminRoutes.delete('/menus/:menuId', hideAdminMenu);
