import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu } from '../../componentes/menu/menu';
import { AvisoLogin } from '../../componentes/aviso-login/aviso-login';
import { AuthService } from '../../services/auth';
import { Comparacoes, ComparacaoSalva } from '../../services/comparacoes';


@Component({
  selector: 'app-salvos',
  standalone: true,
  imports: [CommonModule, Menu, AvisoLogin],
  templateUrl: './salvos.html',
  styleUrl: './salvos.css'
})

export class Salvos implements OnInit {
  authService = inject(AuthService);
  comparacoesService = inject(Comparacoes);

  listaSalvas: ComparacaoSalva[] = [];

  ngOnInit(): void {
    if (this.authService.usuarioLogado()) {
      this.listaSalvas = this.comparacoesService.obterComparacoesSalvas();
    }
  }
}