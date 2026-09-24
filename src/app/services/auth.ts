import { Injectable } from '@angular/core';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {

  usuarioLogado(): boolean {
    return !!localStorage.getItem('usuario_logado');
  }

  getUsuario(): Usuario | null {
    const userStr = localStorage.getItem('usuario_logado');
    return userStr ? JSON.parse(userStr) : null;
  }

  getUsuariosCadastrados(): Usuario[] {
    const usuarios = localStorage.getItem('usuarios_cadastrados');
    return usuarios ? JSON.parse(usuarios) : [];
  }

  cadastrar(novoUsuario: Omit<Usuario, 'id'>): boolean {
    const usuarios = this.getUsuariosCadastrados();

    const jaExiste = usuarios.some(u => u.email.toLowerCase() === novoUsuario.email.toLowerCase());
    if (jaExiste) return false;

    const usuarioComId: Usuario = {
      ...novoUsuario,
      id: Date.now()
    };

    usuarios.push(usuarioComId);
    localStorage.setItem('usuarios_cadastrados', JSON.stringify(usuarios));

    this.iniciarSessao(usuarioComId);
    return true;
  }

  autenticar(email: string, senha: string): Usuario | null {
    const usuarios = this.getUsuariosCadastrados();
    const usuario = usuarios.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );

    if (usuario) {
      this.iniciarSessao(usuario);
      return usuario;
    }
    return null;
  }

  iniciarSessao(usuario: Usuario): void {
    const { senha, ...usuarioSemSenha } = usuario;
    localStorage.setItem('usuario_logado', JSON.stringify(usuarioSemSenha));
  }

  login(usuario: Usuario): void {
    this.iniciarSessao(usuario);
  }

  logout(): void {
    localStorage.removeItem('usuario_logado');
  }

  excluirConta(id: number): void {
    localStorage.removeItem(`salvos_${id}`);

    const usuarios = this.getUsuariosCadastrados();
    const listaAtualizada = usuarios.filter(u => u.id !== id);
    localStorage.setItem('usuarios_cadastrados', JSON.stringify(listaAtualizada));

    this.logout();
  }
}