import { beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { db, sessions, users } from '../src/db';
import { app } from '../src/index';

describe('User API Integration Tests', () => {
  beforeEach(async () => {
    // Bersihkan data sebelum setiap skenario dijalankan untuk menjamin konsistensi
    await db.delete(sessions);
    await db.delete(users);
  });

  describe('POST /api/users (Registrasi)', () => {
    it('Skenario 1: Berhasil registrasi dengan data valid', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Eko Kurniawan',
            email: 'eko@example.com',
            password: 'secretpassword',
          }),
        })
      );

      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json).toEqual({ data: 'ok' });

      // Verifikasi user tersimpan di database
      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'eko@example.com'))
        .limit(1);

      expect(savedUser).toBeDefined();
      expect(savedUser?.name).toBe('Eko Kurniawan');
    });

    it('Skenario 2: Gagal registrasi karena format email tidak valid atau terlalu panjang', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Eko Kurniawan',
            email: 'bukan-email-valid',
            password: 'secretpassword',
          }),
        })
      );

      expect(response.status).toBe(400);
      const json: any = await response.json();
      expect(json).toHaveProperty('error');
    });

    it('Skenario 3: Gagal registrasi karena name atau password kosong', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '',
            email: 'eko@example.com',
            password: '',
          }),
        })
      );

      expect(response.status).toBe(400);
      const json: any = await response.json();
      expect(json).toHaveProperty('error');
    });

    it('Skenario 4: Gagal registrasi karena email sudah terdaftar', async () => {
      // Registrasi pertama
      await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Eko Kurniawan',
            email: 'eko@example.com',
            password: 'secretpassword',
          }),
        })
      );

      // Registrasi kedua dengan email yang sama
      const response = await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Eko Duplicate',
            email: 'eko@example.com',
            password: 'anotherpassword',
          }),
        })
      );

      expect(response.status).toBe(400);
      const json: any = await response.json();
      expect(json).toEqual({ error: 'email sudah terdaftar' });
    });
  });

  describe('POST /api/login (Login)', () => {
    beforeEach(async () => {
      // Buat user untuk pengujian login
      await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Eko Kurniawan',
            email: 'eko@example.com',
            password: 'secretpassword',
          }),
        })
      );
    });

    it('Skenario 1: Berhasil login dengan email dan password benar', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'eko@example.com',
            password: 'secretpassword',
          }),
        })
      );

      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json).toHaveProperty('data');
      expect(typeof json.data).toBe('string');
      expect(json.data.length).toBeGreaterThan(0);

      // Verifikasi token session tersimpan di DB
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, json.data))
        .limit(1);

      expect(session).toBeDefined();
    });

    it('Skenario 2: Gagal login karena format email tidak valid', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'bukan-email',
            password: 'secretpassword',
          }),
        })
      );

      expect(response.status).toBe(400);
      const json: any = await response.json();
      expect(json).toHaveProperty('error');
    });

    it('Skenario 3: Gagal login karena email tidak ditemukan', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'tidakada@example.com',
            password: 'secretpassword',
          }),
        })
      );

      expect(response.status).toBe(400);
      const json: any = await response.json();
      expect(json).toEqual({ error: 'email atau password salah' });
    });

    it('Skenario 4: Gagal login karena password salah', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'eko@example.com',
            password: 'passwordsalah',
          }),
        })
      );

      expect(response.status).toBe(400);
      const json: any = await response.json();
      expect(json).toEqual({ error: 'email atau password salah' });
    });
  });

  describe('GET /api/current (Get Current User)', () => {
    let authToken = '';

    beforeEach(async () => {
      // Registrasi dan login untuk mendapatkan token valid
      await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Eko Kurniawan',
            email: 'eko@example.com',
            password: 'secretpassword',
          }),
        })
      );

      const loginRes = await app.handle(
        new Request('http://localhost/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'eko@example.com',
            password: 'secretpassword',
          }),
        })
      );

      const loginData: any = await loginRes.json();
      authToken = loginData.data;
    });

    it('Skenario 1: Berhasil mengambil profil dengan token Bearer valid', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/current', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json).toHaveProperty('data');
      expect(json.data.name).toBe('Eko Kurniawan');
      expect(json.data.email).toBe('eko@example.com');
      expect(json.data).toHaveProperty('id');
      expect(json.data).toHaveProperty('created_at');
    });

    it('Skenario 2: Gagal mengambil profil tanpa header Authorization', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/current', {
          method: 'GET',
        })
      );

      expect(response.status).toBe(401);
      const json: any = await response.json();
      expect(json).toEqual({ error: 'unauthorized' });
    });

    it('Skenario 3: Gagal mengambil profil tanpa prefix Bearer', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/current', {
          method: 'GET',
          headers: {
            Authorization: authToken, // Tanpa 'Bearer ' prefix
          },
        })
      );

      expect(response.status).toBe(401);
      const json: any = await response.json();
      expect(json).toEqual({ error: 'unauthorized' });
    });

    it('Skenario 4: Gagal mengambil profil dengan token invalid / tidak ada di database', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/current', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer invalid-random-token-12345',
          },
        })
      );

      expect(response.status).toBe(401);
      const json: any = await response.json();
      expect(json).toEqual({ error: 'unauthorized' });
    });
  });

  describe('DELETE /api/logout (Logout)', () => {
    let authToken = '';

    beforeEach(async () => {
      // Registrasi dan login untuk mendapatkan token valid
      await app.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Eko Kurniawan',
            email: 'eko@example.com',
            password: 'secretpassword',
          }),
        })
      );

      const loginRes = await app.handle(
        new Request('http://localhost/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'eko@example.com',
            password: 'secretpassword',
          }),
        })
      );

      const loginData: any = await loginRes.json();
      authToken = loginData.data;
    });

    it('Skenario 1: Berhasil logout dengan token valid dan menghapus session dari DB', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/logout', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const json: any = await response.json();
      expect(json).toEqual({ data: 'ok' });

      // Verifikasi token session benar-benar terhapus dari database
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, authToken))
        .limit(1);

      expect(session).toBeUndefined();

      // Verifikasi bahwa token yang sama tidak bisa lagi dipakai untuk /api/current
      const currentRes = await app.handle(
        new Request('http://localhost/api/current', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
      );
      expect(currentRes.status).toBe(401);
    });

    it('Skenario 2: Gagal logout tanpa header Authorization', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/logout', {
          method: 'DELETE',
        })
      );

      expect(response.status).toBe(401);
      const json: any = await response.json();
      expect(json).toEqual({ error: 'unauthorized' });
    });

    it('Skenario 3: Gagal logout dengan token yang sudah kadaluwarsa / pernah dilogout', async () => {
      // Logout pertama
      await app.handle(
        new Request('http://localhost/api/logout', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
      );

      // Logout kedua dengan token yang sama
      const response = await app.handle(
        new Request('http://localhost/api/logout', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
      );

      expect(response.status).toBe(401);
      const json: any = await response.json();
      expect(json).toEqual({ error: 'unauthorized' });
    });
  });
});
