export type AppRole = 'ROLE_SUPER_ADMIN' | 'ROLE_ADMIN' | 'ROLE_USER';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  bearerToken?: string;
}

export interface JwtPayload {
  sub: string;
  empresaId?: number | null;
  companyId?: number | null;
  empresaNombre?: string | null;
  companyName?: string | null;
  razonSocial?: string | null;
  rol: AppRole;
  iat: number;
  exp: number;
}
