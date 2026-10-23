
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DispositivoApi {
  id: number;
  name: string;
  manufacturer_name: string;
  device_type?: string | null;
  storage?: string | null;
  screen_resolution?: string | null;
  battery_capacity?: string | null;
  hardware?: string | null;
  image_url?: string | null;
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

export interface DispositivoDetalhado extends DispositivoApi {
  display?: {
    type?: string | null;
    size?: string | null;
    resolution?: string | null;
    other?: string | null;
  } | null;

  platform?: {
    os?: string | null;
    chipset?: string | null;
    cpu?: string | null;
    gpu?: string | null;
  } | null;

  memory?: {
    internal?: string | null;
    card_slot?: string | null;
  } | null;

  battery?: {
    type?: string | null;
    charging?: string | null;
  } | null;

  main_camera?: {
    modules?: string | null;
    features?: string | null;
    video?: string | null;
  } | null;

  selfie_camera?: {
    modules?: string | null;
    features?: string | null;
    video?: string | null;
  } | null;

  misc?: {
    price?: string | null;
    model_numbers?: string | null;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class CelularesApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:3000/api';

  buscarPorNome(nome: string): Observable<RespostaBuscaDispositivos> {
    const params = new HttpParams()
      .set('name', nome.trim())
      .set('limit', 5)
      .set('page', 1);

    return this.http.get<RespostaBuscaDispositivos>(
      `${this.baseUrl}/devices/search`,
      { params }
    );
  }

  buscarDetalhes(id: number): Observable<DispositivoDetalhado> {
    return this.http.get<DispositivoDetalhado>(
      `${this.baseUrl}/devices/${id}`
    );
  }
}
