import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { CreateRequestInput, ExecuteRequestInput } from '../types/requesttypes';
import { requestExecutor } from '../services/request.service';

// Create a new request
export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { name, method, url, headers, body }: CreateRequestInput = req.body;

    // Validate input
    if (!name || !method || !url) {
      res.status(400).json({ error: 'Name, method, and URL are required' });
      return;
    }

    // Create request
    const request = await prisma.request.create({
      data: {
        name,
        method,
        url,
        headers: headers ? JSON.parse(JSON.stringify(headers)) : null,
        body,
        userId,
      },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all requests for current user
export const getRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const requests = await prisma.request.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single request by ID
export const getRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const request = await prisma.request.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    res.status(200).json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update request
export const updateRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, method, url, headers, body }: CreateRequestInput = req.body;

    // Check if request exists and belongs to user
    const existingRequest = await prisma.request.findFirst({
      where: { id: requestId, userId },
    });

    if (!existingRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Update request
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: {
        name,
        method,
        url,
        headers: headers ? JSON.parse(JSON.stringify(headers)) : null,
        body,
      },
    });

    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete request
export const deleteRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Check if request exists and belongs to user
    const existingRequest = await prisma.request.findFirst({
      where: { id: requestId, userId },
    });

    if (!existingRequest) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Delete request (history will cascade delete)
    await prisma.request.delete({
      where: { id: requestId },
    });

    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Execute a request (without saving)
export const executeRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { method, url, headers, body }: ExecuteRequestInput = req.body;

    // Validate input
    if (!method || !url) {
      res.status(400).json({ error: 'Method and URL are required' });
      return;
    }

    // Execute the HTTP request
    const result = await requestExecutor.execute({ method, url, headers, body });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Execute request error:', error);
    res.status(500).json({ 
      error: error.message || 'Request execution failed',
      statusCode: 0,
      responseTime: 0,
    });
  }
};

// Execute a saved request and log to history
export const executeSavedRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Get request
    const request = await prisma.request.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Execute the HTTP request
    try {
      const result = await requestExecutor.execute({
        method: request.method,
        url: request.url,
        headers: request.headers as any,
        body: request.body || undefined,
      });

      // Save to history
      await prisma.history.create({
        data: {
          requestId: request.id,
          userId,
          method: request.method,
          url: request.url,
          statusCode: result.statusCode,
          responseTime: result.responseTime,
          requestData: {
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body,
          },
          responseData: {
            statusCode: result.statusCode,
            statusText: result.statusText,
            headers: result.headers,
            data: result.data,
          },
        },
      });

      res.status(200).json(result);
    } catch (error: any) {
      // Save failed request to history (with null statusCode and responseTime)
      await prisma.history.create({
        data: {
          requestId: request.id,
          userId,
          method: request.method,
          url: request.url,
          statusCode: null,
          responseTime: null,
          error: error.message,
          requestData: {
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body,
          },
          responseData: null,
        },
      });

      res.status(500).json({ 
        error: error.message || 'Request execution failed',
        statusCode: 0,
        responseTime: 0,
      });
    }
  } catch (error) {
    console.error('Execute saved request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get request history
export const getRequestHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const requestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Verify request belongs to user
    const request = await prisma.request.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    // Get history
    const history = await prisma.history.findMany({
      where: { requestId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 executions
    });

    res.status(200).json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};