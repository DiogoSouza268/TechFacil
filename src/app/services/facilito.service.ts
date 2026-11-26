import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type EspecificacaoFacilito =
  | 'ram'
  | 'armazenamento'
  | 'gpu'
  | 'tela'
  | 'bateria'
  | 'processador'
  | 'camera';

export type OrigemEspecificacaoFacilito = 'catalogo' | 'usuario';

export interface DadoEspecificacaoFacilito {
  valor: string;
  fonte: OrigemEspecificacaoFacilito;
}

export interface CelularFacilito {
  id: number;
  especificacoes: Record<
    EspecificacaoFacilito,
    DadoEspecificacaoFacilito
  >;
}

export interface PedidoFacilito {
  celulares: CelularFacilito[];
}

export interface PosicaoFacilito {
  celularId: number;
  posicao: 1 | 2 | 3;
  justificativa: string;
}

export interface FonteFacilito {
  titulo: string;
  url: string;
}

export interface ResultadoFacilito {
  status: 'concluida';
  resumo: string;
  classificacao: PosicaoFacilito[];
  observacoes: string[];
  fontes: FonteFacilito[];
}

@Injectable({ providedIn: 'root' })
export class FacilitoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/facilito/comparar`;

  comparar(pedido: PedidoFacilito): Observable<ResultadoFacilito> {
    return this.http.post<ResultadoFacilito>(this.url, pedido);
  }
}