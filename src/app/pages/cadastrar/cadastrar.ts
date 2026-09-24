import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-cadastrar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './cadastrar.html',
  styleUrl: './cadastrar.css'
})
export class Cadastrar {

  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(Auth);

  nome: string = '';
  email: string = '';
  senha: string = '';
  confirmarSenha: string = '';
  aceitouTermos: boolean = false;

  voltar(): void {
    this.location.back();
  }

  cadastrar(): void {
    if (!this.nome.trim() || !this.email.trim() || !this.senha.trim() || !this.confirmarSenha.trim()) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      alert('As senhas não coincidem!');
      return;
    }

    if (!this.aceitouTermos) {
      alert('Você precisa aceitar os Termos e Condições para criar sua conta.');
      return;
    }

    const cadastradoComSucesso = this.authService.cadastrar({
      nome: this.nome,
      email: this.email,
      senha: this.senha
    });

    if (cadastradoComSucesso) {
      alert('Conta criada com sucesso! Seja bem-vindo(a).');
      this.router.navigate(['/home']);
    } else {
      alert('Este e-mail já está cadastrado!');
    }
  }
}