import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ExecuteRequestInput, ExecuteRequestResponse, Header } from '../types/requesttypes';

export class RequestExecutorService {
  async execute(input: ExecuteRequestInput): Promise<ExecuteRequestResponse> {
    const startTime = Date.now();

    try {
      // Convert headers array to object
      const headers: Record<string, string> = {};
      if (input.headers) {
        input.headers.forEach((header: Header) => {
          if (header.key && header.value) {
            headers[header.key] = header.value;
          }
        });
      }

      // Build axios config
      const config: AxiosRequestConfig = {
        method: input.method,
        url: input.url,
        headers,
        validateStatus: () => true, // Don't throw on any status code
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH'].includes(input.method.toUpperCase())) {
        if (input.body) {
          try {
            // Try to parse as JSON
            config.data = JSON.parse(input.body);
          } catch {
            // If not JSON, send as string
            config.data = input.body;
          }
        }
      }

      // Execute request
      const response: AxiosResponse = await axios(config);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Return formatted response
      return {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        responseTime,
      };
    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Handle network errors
      if (error.code === 'ENOTFOUND') {
        throw new Error('DNS lookup failed - Could not resolve hostname');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Connection refused - Target server is not responding');
      }
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Request timed out');
      }

      // Re-throw other errors
      throw new Error(error.message || 'Request execution failed');
    }
  }
}

export const requestExecutor = new RequestExecutorService();