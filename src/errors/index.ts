export class UnauthorizedError extends Error {
  constructor(message = 'unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class EmailAlreadyExistsError extends Error {
  constructor(message = 'email sudah terdaftar') {
    super(message);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message = 'email atau password salah') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}
