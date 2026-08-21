import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, sessions, users } from '../db';
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UnauthorizedError,
} from '../errors';

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
  /**
   * Mendaftarkan pengguna baru ke dalam sistem.
   * Fungsi ini akan memverifikasi ketersediaan email, melakukan hashing pada password
   * menggunakan bcrypt, dan menyimpan data pengguna baru ke database.
   *
   * @param input Data registrasi (name, email, password)
   * @throws {EmailAlreadyExistsError} Jika email sudah terdaftar sebelumnya
   * @returns Object berisi status success
   */
  static async registerUser(input: RegisterUserInput) {
    // 1. Cek apakah email sudah terdaftar
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUsers.length > 0) {
      throw new EmailAlreadyExistsError();
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

  /**
   * Mengautentikasi pengguna berdasarkan email dan password.
   * Jika berhasil, fungsi ini akan menghasilkan token sesi (UUID) yang unik
   * dan menyimpannya di database untuk keperluan otorisasi selanjutnya.
   *
   * @param input Data login (email, password)
   * @throws {InvalidCredentialsError} Jika email tidak ditemukan atau password salah
   * @returns Object berisi token sesi
   */
  static async loginUser(input: LoginUserInput) {
    // 1. Cari data user berdasarkan email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 2. Bandingkan password dengan hash bcrypt
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
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

  /**
   * Mengambil data profil pengguna yang sedang aktif berdasarkan token sesi.
   * Melakukan validasi token dengan menggabungkan data dari tabel sessions dan users.
   *
   * @param token Token sesi Bearer yang valid
   * @throws {UnauthorizedError} Jika token tidak valid atau tidak ditemukan
   * @returns Data profil pengguna (id, name, email, created_at)
   */
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
      throw new UnauthorizedError();
    }

    return {
      id: result.id,
      name: result.name,
      email: result.email,
      created_at: result.createdAt,
    };
  }

  /**
   * Mengakhiri sesi pengguna dengan menghapus token dari database.
   * 
   * @param token Token sesi yang akan dihapus
   * @throws {UnauthorizedError} Jika token tidak ditemukan atau gagal dihapus
   * @returns Object berisi status success
   */
  static async logoutUser(token: string) {
    // Optimasi: Eksekusi DELETE langsung dan periksa affectedRows
    const [result] = await db.delete(sessions).where(eq(sessions.token, token));

    if (!result || (result as any).affectedRows === 0) {
      throw new UnauthorizedError();
    }

    return { success: true };
  }
}
