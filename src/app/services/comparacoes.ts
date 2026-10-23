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

  getUsuarioLogado() {
    const userStr = localStorage.getItem('usuario_logado');
    return userStr ? JSON.parse(userStr) : null;
  }

  getComparacoes(): Comparacao[] {
    const usuario = this.getUsuarioLogado();
    if (!usuario) return [];

    const salvos = localStorage.getItem(`salvos_${usuario.id}`);
    return salvos ? JSON.parse(salvos) : [];
  }

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

  removerComparacao(id: number): void {
    const usuario = this.getUsuarioLogado();
    if (!usuario) return;

    let comparacoes = this.getComparacoes();
    comparacoes = comparacoes.filter(c => c.id !== id);
    localStorage.setItem(`salvos_${usuario.id}`, JSON.stringify(comparacoes));
  }
}