import { Injectable } from '@angular/core';

export interface Celular {
  nome: string;
  imagem?: string;
}

export interface Comparacao {
  id: number;
  celulares: Celular[];
}

@Injectable({
  providedIn: 'root'
})
export class Comparacoes {

  // Retorna os dados do usuário logado no localStorage
  getUsuarioLogado() {
    const userStr = localStorage.getItem('usuario_logado');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Busca as comparações vinculadas ao ID do usuário atual
  getComparacoes(): Comparacao[] {
    const usuario = this.getUsuarioLogado();
    if (!usuario) return [];

    const salvos = localStorage.getItem(`salvos_${usuario.id}`);
    return salvos ? JSON.parse(salvos) : [];
  }

  // Adiciona uma nova comparação à lista
  salvarComparacao(celulares: Celular[]): void {
    const usuario = this.getUsuarioLogado();
    if (!usuario) return;

    const comparacoes = this.getComparacoes();
    const novaComparacao: Comparacao = {
      id: Date.now(),
      celulares
    };

    comparacoes.push(novaComparacao);
    localStorage.setItem(`salvos_${usuario.id}`, JSON.stringify(comparacoes));
  }

  // Remove uma comparação por ID
  removerComparacao(id: number): void {
    const usuario = this.getUsuarioLogado();
    if (!usuario) return;

    let comparacoes = this.getComparacoes();
    comparacoes = comparacoes.filter(c => c.id !== id);
    localStorage.setItem(`salvos_${usuario.id}`, JSON.stringify(comparacoes));
  }
}