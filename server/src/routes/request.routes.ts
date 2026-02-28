import { Router } from 'express';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
  executeRequest,
  executeSavedRequest,
  getRequestHistory,
} from '../controllers/request.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Request CRUD
router.post('/', createRequest);
router.get('/', getRequests);
router.get('/:id', getRequestById);
router.put('/:id', updateRequest);
router.delete('/:id', deleteRequest);

// Execute requests
router.post('/execute', executeRequest); // Execute without saving
router.post('/:id/execute', executeSavedRequest); // Execute saved request

// History
router.get('/:id/history', getRequestHistory);

export default router;