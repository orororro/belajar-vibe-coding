import { Elysia } from 'elysia';
import { UnauthorizedError } from '../errors';

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .derive({ as: 'scoped' }, ({ headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError();
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    if (!token) {
      throw new UnauthorizedError();
    }

    return { token };
  });
