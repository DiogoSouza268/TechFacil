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
}