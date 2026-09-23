import { Component, OnInit } from '@angular/core';
import { Menu } from '../../componentes/menu/menu';
import { FormsModule } from '@angular/forms';
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
  imports: [Menu, Carrosel, CommonModule, AlterarInfoComponent, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home implements OnInit {

  listaCelulares: Celular[] = [];
  listaComparacao: Celular[] = [];

  termoBusca: string = '';              
  celularSelecionado: Celular | null = null;

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

  get sugestoesBusca(): Celular[] {
    if (!this.termoBusca.trim()) {
      return [];
    }
    return this.listaCelulares.filter(c => 
      c.nome.toLowerCase().includes(this.termoBusca.toLowerCase())
    );
  }

  selecionarSugestao(celular: Celular): void {
    this.termoBusca = celular.nome;
    this.celularSelecionado = celular;
  }

  adicionarAComparacao(): void {
    if (!this.celularSelecionado) {
      alert('Por favor, selecione um celular da lista de sugestões.');
      return;
    }

    if (this.listaComparacao.length >= 3) {
      alert('Você já atingiu o limite de 3 celulares para comparar.');
      return;
    }

    const jaExiste = this.listaComparacao.some(c => c.id === this.celularSelecionado?.id);
    if (jaExiste) {
      alert('Este celular já está na sua lista de comparação.');
      return;
    }

    this.listaComparacao.push({ ...this.celularSelecionado });
    this.termoBusca = '';
    this.celularSelecionado = null;
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

  irParaCelular(index: number): void {
    if (!this.listaComparacao[index]) {
      alert(`O slot ${index + 1} ainda está vazio! Adicione um celular primeiro.`);
      return;
    }

    const elemento = document.getElementById(`card-celular-${index}`);

    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

}
