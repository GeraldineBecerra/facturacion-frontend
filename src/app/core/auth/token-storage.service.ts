import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly key = 'token';

  getToken(): string | null {
    return localStorage.getItem(this.key) ?? sessionStorage.getItem(this.key);
  }

  setToken(token: string, remember: boolean): void {
    this.clear();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(this.key, token);
  }

  clear(): void {
    localStorage.removeItem(this.key);
    sessionStorage.removeItem(this.key);
    localStorage.removeItem('access_token');
    localStorage.removeItem('accessToken');
  }
}
