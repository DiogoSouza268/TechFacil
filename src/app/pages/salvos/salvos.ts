import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Menu } from '../../componentes/menu/menu';
import { AvisoLogin } from '../../componentes/aviso-login/aviso-login';
import { Auth, Usuario } from '../../services/auth';
import { Comparacoes, Comparacao } from '../../services/comparacoes';

@Component({
  selector: 'app-salvos',
  standalone: true,
  imports: [CommonModule, Menu, AvisoLogin],
  templateUrl: './salvos.html',
  styleUrl: './salvos.css'
})
export class Salvos implements OnInit {
  authService = inject(Auth);
  comparacoesService = inject(Comparacoes);
  router = inject(Router);

  listaComparacoes: Comparacao[] = [];
  usuarioLogado: Usuario | null = null;

  get estaLogado(): boolean {
    return this.authService.usuarioLogado();
  }

  ngOnInit(): void {
    if (this.estaLogado) {
      this.usuarioLogado = this.authService.getUsuario();
      this.carregarComparacoes();
    }
  }

  carregarComparacoes(): void {
    this.listaComparacoes = this.comparacoesService.getComparacoes();
  }

  rever(item: Comparacao): void {
    this.router.navigate(['/home']);
  }

  excluir(id: number): void {
    if (confirm('Tem certeza de que deseja remover esta comparação salva?')) {
      this.comparacoesService.removerComparacao(id);
      this.carregarComparacoes(); 
    }
  }

  compartilhar(item: Comparacao): void {
    alert('Link da comparação copiado para a área de transferência!');
  }
}