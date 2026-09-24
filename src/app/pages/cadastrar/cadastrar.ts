import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-cadastrar',
  standalone: true,
  imports: [FormsModule, RouterLink], // RouterLink necessário para o link dos termos e tela de login
  templateUrl: './cadastrar.html',
  styleUrl: './cadastrar.css'
})
export class Cadastrar {

  private router = inject(Router);
  private location = inject(Location);

  nome: string = '';
  email: string = '';
  senha: string = '';
  confirmarSenha: string = '';
  aceitouTermos: boolean = false;

  voltar(): void {
    this.location.back();
  }

  cadastrar(): void {
    if (!this.nome || !this.email || !this.senha || !this.confirmarSenha) {
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

    // Lógica para registrar usuário no LocalStorage
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const emailExiste = usuarios.some((u: any) => u.email === this.email);

    if (emailExiste) {
      alert('Este e-mail já está cadastrado!');
      return;
    }

    const novoUsuario = {
      id: Date.now(),
      nome: this.nome,
      email: this.email,
      senha: this.senha
    };

    usuarios.push(novoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    alert('Conta criada com sucesso! Faça seu login.');
    this.router.navigate(['/login']);
  }
}