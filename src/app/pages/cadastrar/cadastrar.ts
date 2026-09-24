import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-cadastrar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadastrar.html',
  styleUrl: './cadastrar.css'
})
export class Cadastrar {
  authService = inject(Auth);
  router = inject(Router);

  nome: string = '';
  email: string = '';
  senha: string = '';
  confirmarSenha: string = '';
  aceitouTermos: boolean = false;

  cadastrar(): void {
    if (!this.nome.trim() || !this.email.trim() || !this.senha.trim()) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    if (!this.aceitouTermos) {
      alert('Você precisa aceitar os termos e condições para criar uma conta.');
      return;
    }

    const sucesso = this.authService.cadastrar({
      nome: this.nome,
      email: this.email,
      senha: this.senha
    });

    if (sucesso) {
      alert('Conta criada com sucesso!');
      this.router.navigate(['/home']);
    } else {
      alert('Este e-mail já está cadastrado.');
    }
  }

  voltar(): void {
    this.router.navigate(['/login']);
  }
}