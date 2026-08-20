import { Elysia, t } from 'elysia';
import { db, users } from './db';

const app = new Elysia()
  .get('/', () => {
    return { message: 'Hello Elysia' };
  })
  .group('/users', (app) =>
    app
      .get('/', async () => {
        const allUsers = await db.select().from(users);
        return { success: true, data: allUsers };
      })
      .post(
        '/',
        async ({ body, set }) => {
          try {
            await db.insert(users).values({
              name: body.name,
              email: body.email,
            });
            set.status = 201;
            return { success: true, message: 'User created successfully' };
          } catch (error: any) {
            set.status = 400;
            return { success: false, error: error.message };
          }
        },
        {
          body: t.Object({
            name: t.String(),
            email: t.String({ format: 'email' }),
          }),
        }
      )
  )
  .listen(Number(process.env.PORT) || 3000);

console.log(`🦊 Elysia server is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
