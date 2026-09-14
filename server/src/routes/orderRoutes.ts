import { Router } from 'express';
import { createOrder, getOrders } from '../controllers/orderController.js';

export const orderRoutes = Router();

orderRoutes.get('/', getOrders);
orderRoutes.post('/', createOrder);
