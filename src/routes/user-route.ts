import { Elysia, t } from 'elysia';
import { UserService } from '../services/user-service';

export const userRoute = new Elysia({ prefix: '/api/users' })
  .post(
    '/',
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
  );
