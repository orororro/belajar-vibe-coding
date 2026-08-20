import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, sessions, users } from '../db';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export class UserService {
  static async registerUser(input: RegisterUserInput) {
    // 1. Cek apakah email sudah terdaftar
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUsers.length > 0) {
      throw new Error('email sudah terdaftar');
    }

    // 2. Hash password menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // 3. Simpan data user baru ke database
    await db.insert(users).values({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });

    return { success: true };
  }

  static async loginUser(input: LoginUserInput) {
    // 1. Cari data user berdasarkan email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      throw new Error('email atau password salah');
    }

    // 2. Bandingkan password dengan hash bcrypt
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new Error('email atau password salah');
    }

    // 3. Generate unique UUID token
    const token = crypto.randomUUID();

    // 4. Simpan session baru ke database
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return { token };
  }

  static async getCurrentUser(token: string) {
    // 1. Cari user yang memiliki session token ini melalui JOIN sessions dan users
    const [result] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (!result) {
      throw new Error('unauthorized');
    }

    return {
      id: result.id,
      name: result.name,
      email: result.email,
      created_at: result.createdAt,
    };
  }
}
