export interface UserResponse {
  id: number;
  username: string;
  activo: boolean;
  rol: string | null;
  rolMostrar: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  rol?: string;
}

export interface UserUpdateRequest {
  username?: string;
  password?: string;
}
