import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  authService = inject(Auth);
  router = inject(Router);
  route = inject(ActivatedRoute);

  email: string = '';
  senha: string = '';
  mensagemAviso: string = '';

  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.mensagemAviso =
        params['aviso'] === 'necessario-login'
          ? '🔒 Você precisa entrar ou criar uma conta para acessar essa página!'
          : '';
    });
  }

  
  entrarComoAnonimo(): void {
    this.router.navigate(['/home']);
  }

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

  
}