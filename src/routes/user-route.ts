import { Elysia, t } from 'elysia';
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UnauthorizedError,
} from '../errors';
import { authMiddleware } from '../middlewares/auth-middleware';
import { UserService } from '../services/user-service';

export const userRoute = new Elysia({ prefix: '/api' })
  .onError(({ code, error, set }) => {
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

    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        error: error.message || 'Validation Error',
      };
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
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ format: 'email', maxLength: 255 }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        summary: 'Registrasi Pengguna',
        description: 'Mendaftarkan akun pengguna baru ke dalam sistem',
        tags: ['User'],
      },
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
        email: t.String({ format: 'email', maxLength: 255 }),
        password: t.String({ minLength: 1 }),
      }),
      detail: {
        summary: 'Login Pengguna',
        description:
          'Mengautentikasi pengguna dan mengembalikan token sesi (Bearer)',
        tags: ['User'],
      },
    }
  )
  .use(authMiddleware)
  .get(
    '/current',
    async ({ token }) => {
      const user = await UserService.getCurrentUser(token);
      return {
        data: user,
      };
    },
    {
      detail: {
        summary: 'Dapatkan Profil Pengguna Saat Ini',
        description:
          'Mengambil profil pengguna yang sedang login berdasarkan token Bearer',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
      },
    }
  )
  .delete(
    '/logout',
    async ({ token }) => {
      await UserService.logoutUser(token);
      return {
        data: 'ok',
      };
    },
    {
      detail: {
        summary: 'Logout Pengguna',
        description:
          'Menghapus sesi login saat ini dan membatalkan token Bearer',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
      },
    }
  );
