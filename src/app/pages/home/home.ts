import { Component, OnInit } from '@angular/core';
import { Menu } from '../../componentes/menu/menu';
import { CarouselSlide , Carrosel} from '../../componentes/carrosel/carrosel';
import { CommonModule } from '@angular/common';
import { AlterarInfoComponent } from '../../componentes/alterar-info/alterar-info';


export interface Specs {
  armazenamento: string;
  ram: string;
  bateria: string;
  processador: string;
  tela: string;
}

export interface PontosFortes {
  naoTravar: number;
  boaBateria: number;
  melhorCamera: number;
  muitoEspaco: number;
  telaGrande: number;
  precoBaixo: number;
}

export interface Celular {
  id: number;
  nome: string;
  precoMedio: number;
  imagem: string;
  specs: Specs;
  pontosFortes: PontosFortes;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Menu, Carrosel, CommonModule, AlterarInfoComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  listaCelulares: Celular[] = [];

  ngOnInit(): void {
    this.carregarCelulares();
  }

  async carregarCelulares(): Promise<void> {
    try {
      const resposta = await fetch('/data/celulares.json');
      this.listaCelulares = await resposta.json();
    } catch (erro) {
      console.error('Erro ao carregar a lista de celulares:', erro);
    }
  }

  recalcularNotas(celular: Celular): void {
    console.log('Dados atualizados para o celular:', celular.nome);
  }

  abrirDicionario(termo: string): void {
    console.log('Abrir explicação para:', termo);
  }

  homeCarosel: CarouselSlide[] = [
    {
      image: "/img/projeto/celulares.jpg",
      title: 'Aprenda a escolher qual o melhor aparelho'
    },
    {
      image: "/img/projeto/familia-unida.jpg",
      title: 'O celular perfeito para todos os membros da familia'
    },
    {
      image: "/img/projeto/hardware_smartphone.jpg",
      title: 'Venha aprender sobre as peças de um celular'
    }
  ];

}
