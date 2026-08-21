import { Elysia } from 'elysia';
import { userRoute } from './routes/user-route';

export const app = new Elysia()
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
