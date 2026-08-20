import { Elysia, t } from 'elysia';
import { UserService } from '../services/user-service';

export const userRoute = new Elysia({ prefix: '/api' })
  .post(
    '/users',
    async ({ body, set }) => {
      try {
        await UserService.registerUser({
          name: body.name,
          email: body.email,
          password: body.password,
        });

        set.status = 200;
        return {
          data: 'ok',
        };
      } catch (error: any) {
        if (error.message === 'email sudah terdaftar') {
          set.status = 400;
          return {
            error: 'email sudah terdaftar',
          };
        }

        set.status = 500;
        return {
          error: error.message || 'Internal Server Error',
        };
      }
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
    async ({ body, set }) => {
      try {
        const result = await UserService.loginUser({
          email: body.email,
          password: body.password,
        });

        set.status = 200;
        return {
          data: result.token,
        };
      } catch (error: any) {
        if (error.message === 'email atau password salah') {
          set.status = 400;
          return {
            error: 'email atau password salah',
          };
        }

        set.status = 500;
        return {
          error: error.message || 'Internal Server Error',
        };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get(
    '/current',
    async ({ headers, set }) => {
      try {
        const authHeader = headers.authorization;
        if (!authHeader) {
          set.status = 401;
          return {
            error: 'unauthorized',
          };
        }

        const token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7).trim()
          : authHeader.trim();

        if (!token) {
          set.status = 401;
          return {
            error: 'unauthorized',
          };
        }

        const user = await UserService.getCurrentUser(token);

        set.status = 200;
        return {
          data: user,
        };
      } catch (error: any) {
        if (error.message === 'unauthorized') {
          set.status = 401;
          return {
            error: 'unauthorized',
          };
        }

        set.status = 500;
        return {
          error: error.message || 'Internal Server Error',
        };
      }
    }
  )
  .delete(
    '/logout',
    async ({ headers, set }) => {
      try {
        const authHeader = headers.authorization;
        if (!authHeader) {
          set.status = 401;
          return {
            error: 'unauthorized',
          };
        }

        const token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7).trim()
          : authHeader.trim();

        if (!token) {
          set.status = 401;
          return {
            error: 'unauthorized',
          };
        }

        await UserService.logoutUser(token);

        set.status = 200;
        return {
          data: 'ok',
        };
      } catch (error: any) {
        if (error.message === 'unauthorized') {
          set.status = 401;
          return {
            error: 'unauthorized',
          };
        }

        set.status = 500;
        return {
          error: error.message || 'Internal Server Error',
        };
      }
    }
  );
