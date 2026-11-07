
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { Menu } from '../../componentes/menu/menu';
import { Celular } from '../home/home';
import { ResultadoFacilito } from '../../services/facilito.service';

export interface VencedorSalvo {
  nome: string;
  imagem: string;
  pontos: number;
  motivos: string[];
}

export interface ComparacaoSalva {
  id: number;
  data: string;
  celulares: Celular[];
  filtros: string[];

  // Resultado novo, produzido pelo Facilito.AI.
  resultadoFacilito?: ResultadoFacilito;

  // Campos mantidos para compatibilidade com comparações antigas.
  vencedor?: VencedorSalvo | null;
  empatados?: VencedorSalvo[];
}

@Component({
  selector: 'app-salvos',
  standalone: true,
  imports: [CommonModule, RouterLink, Menu],
  templateUrl: './salvos.html',
  styleUrl: './salvos.css'
})
export class Salvos implements OnInit {
  authService = inject(Auth);
  router = inject(Router);

  comparacoesSalvas: ComparacaoSalva[] = [];

  ngOnInit(): void {
    this.carregarComparacoes();
  }

  carregarComparacoes(): void {
    const usuario = this.authService.getUsuario();

    if (!usuario) {
      this.comparacoesSalvas = [];
      return;
    }

    const chave = `salvos_${usuario.id}`;

    try {
      this.comparacoesSalvas = JSON.parse(
        localStorage.getItem(chave) || '[]'
      );
    } catch (erro) {
      console.error('Erro ao carregar comparações salvas:', erro);
      this.comparacoesSalvas = [];
    }
  }

  // Retorna a posição de um celular no resultado do Facilito.
  obterPosicao(
    item: ComparacaoSalva,
    celularId: number
  ): number | null {
    const classificacao =
      item.resultadoFacilito?.classificacao ?? [];

    const resultado = classificacao.find(
      celular => celular.celularId === celularId
    );

    return resultado?.posicao ?? null;
  }

  // Retorna a justificativa apresentada pelo Facilito.
  obterJustificativa(
    item: ComparacaoSalva,
    celularId: number
  ): string {
    const resultado =
      item.resultadoFacilito?.classificacao.find(
        celular => celular.celularId === celularId
      );

    return resultado?.justificativa ?? '';
  }

  // Identifica empate no resultado novo ou no formato antigo.
  celularEstaEmpatado(
    item: ComparacaoSalva,
    nomeCelular: string
  ): boolean {
    if (item.resultadoFacilito) {
      const celular = item.celulares.find(
        aparelho => aparelho.nome === nomeCelular
      );

      if (!celular) return false;

      const posicao = this.obterPosicao(item, celular.id);

      if (posicao === null) return false;

      const quantidadeNaPosicao =
        item.resultadoFacilito.classificacao.filter(
          resultado => resultado.posicao === posicao
        ).length;

      return quantidadeNaPosicao > 1;
    }

    return item.empatados?.some(
      celular => celular.nome === nomeCelular
    ) ?? false;
  }

  removerComparacao(id: number): void {
    const usuario = this.authService.getUsuario();

    if (!usuario) return;

    const chave = `salvos_${usuario.id}`;

    this.comparacoesSalvas =
      this.comparacoesSalvas.filter(
        comparacao => comparacao.id !== id
      );

    localStorage.setItem(
      chave,
      JSON.stringify(this.comparacoesSalvas)
    );
  }

  irParaHome(): void {
    this.router.navigate(['/home']);
  }
}
