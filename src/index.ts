import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { userRoute } from './routes/user-route';

export const app = new Elysia()
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: 'Belajar Vibe Coding API',
          version: '1.0.0',
          description:
            'Dokumentasi API lengkap untuk aplikasi Belajar Vibe Coding',
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    })
  )
  .get('/', () => {
    return { message: 'Hello Elysia' };
  })
  .use(userRoute);

if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(process.env.PORT) || 3000);
  console.log(
    `🦊 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`
  );
}

export type App = typeof app;
