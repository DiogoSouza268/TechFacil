import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Comparacoes, Comparacao } from '../../services/comparacoes';
import { Menu } from '../../componentes/menu/menu';

// SE O MENU FOR UM COMPONENTE SEPARADO:
// Certifique-se de importar o seu componente Menu e adicioná-lo no 'imports' abaixo.
// import { Menu } from '../../componentes/menu/menu';

@Component({
  selector: 'app-salvos',
  standalone: true,
  imports: [CommonModule, RouterLink /*, Menu */, Menu],
  templateUrl: './salvos.html',
  styleUrl: './salvos.css'
})
export class Salvos implements OnInit {
  usuarioLogado: any = null;
  listaComparacoes: Comparacao[] = [];

  constructor(
    private comparacoesService: Comparacoes,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.usuarioLogado = this.comparacoesService.getUsuarioLogado();
    if (this.usuarioLogado) {
      this.listaComparacoes = this.comparacoesService.getComparacoes();
    }
  }

  rever(comparacao: Comparacao): void {
    this.router.navigate(['/home'], { state: { comparacao } });
  }

  excluir(id: number): void {
    this.comparacoesService.removerComparacao(id);
    this.carregarDados();
  }

  compartilhar(comparacao: Comparacao): void {
    const nomes = comparacao.celulares.map(c => c.nome).join(' vs ');
    navigator.clipboard.writeText(`Confira esta comparação: ${nomes}`);
    alert('Link copiado para a área de transferência!');
  }
}