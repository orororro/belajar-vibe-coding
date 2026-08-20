import { Elysia, t } from 'elysia';
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UnauthorizedError,
} from '../errors';
import { authMiddleware } from '../middlewares/auth-middleware';
import { UserService } from '../services/user-service';

export const userRoute = new Elysia({ prefix: '/api' })
  .onError(({ error, set }) => {
    if (error instanceof UnauthorizedError) {
      set.status = 401;
      return { error: error.message };
    }

    if (
      error instanceof EmailAlreadyExistsError ||
      error instanceof InvalidCredentialsError
    ) {
      set.status = 400;
      return { error: error.message };
    }

    set.status = 500;
    return {
      error: (error as any).message || 'Internal Server Error',
    };
  })
  .post(
    '/users',
    async ({ body }) => {
      await UserService.registerUser({
        name: body.name,
        email: body.email,
        password: body.password,
      });

      return {
        data: 'ok',
      };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    '/login',
    async ({ body }) => {
      const result = await UserService.loginUser({
        email: body.email,
        password: body.password,
      });

      return {
        data: result.token,
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .use(authMiddleware)
  .get('/current', async ({ token }) => {
    const user = await UserService.getCurrentUser(token);
    return {
      data: user,
    };
  })
  .delete('/logout', async ({ token }) => {
    await UserService.logoutUser(token);
    return {
      data: 'ok',
    };
  });
