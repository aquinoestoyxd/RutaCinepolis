import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
  requestId?: string;
}

export class ResponseHelper {
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200,
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: res.req?.requestId,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    return this.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string,
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      message,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
      requestId: res.req?.requestId,
    };
    return res.status(200).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: Record<string, string[]>,
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: message,
      errors,
      timestamp: new Date().toISOString(),
      requestId: res.req?.requestId,
    };
    return res.status(statusCode).json(response);
  }

  static notFound(res: Response, message = 'Recurso no encontrado'): Response {
    return this.error(res, message, 404);
  }

  static unauthorized(res: Response, message = 'No autorizado'): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Acceso denegado'): Response {
    return this.error(res, message, 403);
  }

  static badRequest(
    res: Response,
    message: string,
    errors?: Record<string, string[]>,
  ): Response {
    return this.error(res, message, 400, errors);
  }

  static conflict(res: Response, message: string): Response {
    return this.error(res, message, 409);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
