import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export function getPagination(req: Request): PaginationParams {
  const query = req.query as PaginationQuery;
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
  allowedFields: string[],
  defaultField = 'createdAt',
): Record<string, 'asc' | 'desc'> {
  const field = allowedFields.includes(sortBy ?? '') ? sortBy! : defaultField;
  const order: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
  return { [field]: order };
}
