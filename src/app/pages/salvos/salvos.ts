import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { Menu } from '../../componentes/menu/menu';
import { Celular } from '../home/home';

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
  vencedor: VencedorSalvo | null;
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
    if (usuario) {
      const chave = `salvos_${usuario.id}`;
      this.comparacoesSalvas = JSON.parse(localStorage.getItem(chave) || '[]');
    }
  }

  removerComparacao(id: number): void {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      const chave = `salvos_${usuario.id}`;
      this.comparacoesSalvas = this.comparacoesSalvas.filter(c => c.id !== id);
      localStorage.setItem(chave, JSON.stringify(this.comparacoesSalvas));
    }
  }

  irParaHome(): void {
    this.router.navigate(['/home']);
  }
}