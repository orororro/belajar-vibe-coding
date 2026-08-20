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
  );
