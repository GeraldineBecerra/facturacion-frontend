import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, retry, shareReplay, timeout, timer } from 'rxjs';

export interface EconomicIndicator {
  code: 'uf' | 'utm' | 'dolar' | 'euro';
  label: string;
  value: number | null;
}

interface MindicadorResponse {
  uf?: { valor?: number };
  utm?: { valor?: number };
  dolar?: { valor?: number };
  euro?: { valor?: number };
}

@Injectable({ providedIn: 'root' })
export class EconomicIndicatorsService {
  private readonly apiUrl = '/api/indicadores-economicos';

  constructor(private http: HttpClient) {}

  getIndicators(): Observable<EconomicIndicator[]> {
    return this.http.get<MindicadorResponse>(this.apiUrl).pipe(
      timeout({ each: 10000 }),
      retry({ count: 1, delay: () => timer(2000) }),
      map((response) => [
        { code: 'uf' as const, label: 'UF', value: response.uf?.valor ?? null },
        { code: 'utm' as const, label: 'UTM', value: response.utm?.valor ?? null },
        { code: 'dolar' as const, label: 'Dólar', value: response.dolar?.valor ?? null },
        { code: 'euro' as const, label: 'Euro', value: response.euro?.valor ?? null },
      ]),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
