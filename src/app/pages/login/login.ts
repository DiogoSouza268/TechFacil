import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  authService = inject(Auth);
  router = inject(Router);

  email: string = '';
  senha: string = '';

  fazerLogin(): void {
    if (!this.email.trim() || !this.senha.trim()) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    const usuario = this.authService.autenticar(this.email, this.senha);

    if (usuario) {
      alert(`Bem-vindo(a) de volta, ${usuario.nome}!`);
      this.router.navigate(['/home']);
    } else {
      alert('E-mail ou senha incorretos.');
    }
  }

  esqueciSenha(): void {
    alert('Em breve! A recuperação de senha estará disponível em atualizações futuras.');
  }
}