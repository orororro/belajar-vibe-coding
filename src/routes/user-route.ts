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
        name: t.String({ minLength: 1, maxLength: 255, example: 'Eko Kurniawan' }),
        email: t.String({
          format: 'email',
          maxLength: 255,
          example: 'eko@example.com',
        }),
        password: t.String({ minLength: 1, example: 'secretpassword' }),
      }),
      response: {
        200: t.Object(
          {
            data: t.String({ example: 'ok' }),
          },
          { description: 'Registrasi berhasil' }
        ),
        400: t.Object(
          {
            error: t.String({ example: 'email sudah terdaftar' }),
          },
          { description: 'Validasi gagal atau email sudah terdaftar' }
        ),
      },
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
        email: t.String({
          format: 'email',
          maxLength: 255,
          example: 'eko@example.com',
        }),
        password: t.String({ minLength: 1, example: 'secretpassword' }),
      }),
      response: {
        200: t.Object(
          {
            data: t.String({
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Token sesi unik (UUID)',
            }),
          },
          { description: 'Login berhasil' }
        ),
        400: t.Object(
          {
            error: t.String({ example: 'email atau password salah' }),
          },
          { description: 'Kredensial tidak valid' }
        ),
      },
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
      response: {
        200: t.Object(
          {
            data: t.Object({
              id: t.Integer({ example: 1 }),
              name: t.String({ example: 'Eko Kurniawan' }),
              email: t.String({ example: 'eko@example.com' }),
              created_at: t.Date({ example: '2026-08-21T00:00:00.000Z' }),
            }),
          },
          { description: 'Data profil pengguna yang sedang login' }
        ),
        401: t.Object(
          {
            error: t.String({ example: 'unauthorized' }),
          },
          { description: 'Token tidak valid atau tidak disertakan' }
        ),
      },
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
      response: {
        200: t.Object(
          {
            data: t.String({ example: 'ok' }),
          },
          { description: 'Logout berhasil dan sesi dihapus' }
        ),
        401: t.Object(
          {
            error: t.String({ example: 'unauthorized' }),
          },
          { description: 'Token tidak valid atau sudah kadaluwarsa' }
        ),
      },
      detail: {
        summary: 'Logout Pengguna',
        description:
          'Menghapus sesi login saat ini dan membatalkan token Bearer',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
      },
    }
  );
