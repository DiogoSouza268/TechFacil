import { Injectable } from '@angular/core';

// 1. Exporta a interface para o 'salvos.ts' conseguir importar
export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {

  // 2. Método que verifica se existe uma sessão ativa no localStorage
  usuarioLogado(): boolean {
    return !!localStorage.getItem('usuario_logado');
  }

  // 3. Método que devolve os dados do utilizador logado
  getUsuario(): Usuario | null {
    const userStr = localStorage.getItem('usuario_logado');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Métodos auxiliares para quando implementar a ecrã de login/logout:
  login(usuario: Usuario): void {
    localStorage.setItem('usuario_logado', JSON.stringify(usuario));
  }

  logout(): void {
    localStorage.removeItem('usuario_logado');
  }

  // 🔴 NOVO MÉTODOS PARA DELETAR A CONTA E OS DADOS VINCULADOS
  excluirConta(id: number): void {
    // 1. Apaga apenas a gaveta de salvos deste usuário específico
    localStorage.removeItem(`salvos_${id}`);

    // 2. Remove o usuário da lista geral de cadastrados (se houver)
    const usuariosSalvos = localStorage.getItem('usuarios_cadastrados');
    if (usuariosSalvos) {
      const lista: Usuario[] = JSON.parse(usuariosSalvos);
      const listaAtualizada = lista.filter(u => u.id !== id);
      localStorage.setItem('usuarios_cadastrados', JSON.stringify(listaAtualizada));
    }

    // 3. Apaga a sessão atual (logout)
    this.logout();
  }
}