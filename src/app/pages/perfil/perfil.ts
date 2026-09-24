import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Menu } from '../../componentes/menu/menu';
import { Auth, Usuario } from '../../services/auth';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, Menu],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  authService = inject(Auth);
  router = inject(Router);

  nome: string = '';
  email: string = '';
  senha: string = '';

  get estaLogado(): boolean {
    return this.authService.usuarioLogado();
  }

  ngOnInit(): void {
    if (this.estaLogado) {
      const usuario = this.authService.getUsuario();
      if (usuario) {
        this.nome = usuario.nome || '';
        this.email = usuario.email || '';
        this.senha = '12345678';
      }
    }
  }

  atualizarDados(): void {
    if (!this.nome.trim() || !this.email.trim()) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    const usuarioAtual = this.authService.getUsuario();
    if (usuarioAtual) {
      const usuarioAtualizado: Usuario = {
        ...usuarioAtual,
        nome: this.nome,
        email: this.email
      };

      this.authService.login(usuarioAtualizado);
      alert('Dados do perfil atualizados com sucesso!');
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  excluirConta(): void {
    if (confirm('⚠️ TEM CERTEZA? Sua conta e todas as suas comparações salvas serão apagadas para sempre!')) {
      const usuario = this.authService.getUsuario();
      
      if (usuario) {
        this.authService.excluirConta(usuario.id);
        alert('Sua conta foi excluída com sucesso.');
        this.router.navigate(['/home']);
      }
    }
  }

}