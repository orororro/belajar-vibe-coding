import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users } from '../db';

export interface RegisterUserInput {
  name: string;
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
}
