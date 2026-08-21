import { Elysia } from 'elysia';
import { UnauthorizedError } from '../errors';

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .derive({ as: 'scoped' }, ({ headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError();
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      throw new UnauthorizedError();
    }

    return { token };
  });
