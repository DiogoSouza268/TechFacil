
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface FiltroFacilito {
  key: string;
  label: string;
}


export type EspecificacaoFacilito =
  | 'ram'
  | 'armazenamento'
  | 'bateria'
  | 'processador'
  | 'gpu'
  | 'qualidadeImagem'
  | 'camera';


export interface CelularFacilito {
  id: number;
  nome: string;
  origem: 'local' | 'api';

  // Pode ser null quando Preço baixo não foi selecionado.
  precoLoja: number | null;

  // Somente as especificações dos filtros selecionados
  // precisam estar presentes no pedido.
  especificacoes: Partial<
    Record<EspecificacaoFacilito, string>
  >;
}


export interface PedidoFacilito {
  celulares: CelularFacilito[];
  filtros: FiltroFacilito[];
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
  status: 'concluida' | 'inconclusiva';
  resumo: string;
  classificacao: PosicaoFacilito[];
  observacoes: string[];
  fontes: FonteFacilito[];
}


@Injectable({
  providedIn: 'root'
})
export class FacilitoService {

  private readonly http = inject(HttpClient);

  private readonly url =
    'http://localhost:3000/api/facilito/comparar';


  comparar(
    pedido: PedidoFacilito
  ): Observable<ResultadoFacilito> {

    return this.http.post<ResultadoFacilito>(
      this.url,
      pedido
    );
  }

}
