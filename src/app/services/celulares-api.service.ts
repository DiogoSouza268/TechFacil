
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DispositivoApi {
  id: number;
  name: string;
  manufacturer_name: string;
  device_type: string;
  storage: string | null;
  screen_resolution: string | null;
  battery_capacity: string | null;
  hardware: string | null;
  image_url: string | null;
  match_certainty?: string;
}

export interface RespostaBuscaDispositivos {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  devices: DispositivoApi[];
  cached?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CelularesApiService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:3000/api/devices/search';

  buscarPorNome(nome: string): Observable<RespostaBuscaDispositivos> {
    const params = new HttpParams()
      .set('name', nome.trim())
      .set('limit', 5)
      .set('page', 1);

    return this.http.get<RespostaBuscaDispositivos>(
      this.apiUrl,
      { params }
    );
  }
}
