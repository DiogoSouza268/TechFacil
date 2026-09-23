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
      elemento.scrollIntoView({ behavior: 'smooth', block: 'nearest' , inline: 'start' });
    }
  }

  
  filtros = [
    { key: 'naoTravar', label: '⚡ Não travar' },
    { key: 'boaBateria', label: '🔋 Boa bateria' },
    { key: 'melhorCamera', label: '📸 Melhor câmera' },
    { key: 'muitoEspaco', label: '📦 Muito espaço para fotos' },
    { key: 'telaGrande', label: '📺 Tela grande' },
    { key: 'precoBaixo', label: '💰 Preço baixo' }
  ];

  filtrosSelecionados: string[] = [];

  toggleFiltro(key: string): void {
    const index = this.filtrosSelecionados.indexOf(key);
    if (index > -1) {
      this.filtrosSelecionados.splice(index, 1); 
    } else {
      this.filtrosSelecionados.push(key); 
    }
  }

  filtroAtivo(key: string): boolean {
    return this.filtrosSelecionados.includes(key);
  }

  calcularPontuacao(celular: Celular): number {
    if (this.filtrosSelecionados.length === 0) return 0;

    let total = 0;
    for (const key of this.filtrosSelecionados) {
      const chavePontos = key as keyof PontosFortes;
      if (celular.pontosFortes && celular.pontosFortes[chavePontos] !== undefined) {
        total += celular.pontosFortes[chavePontos];
      }
    }
    return total;
  }

  get celularVencedor(): { celular: Celular; pontos: number; motivos: string[] } | null {
    if (this.listaComparacao.length === 0) return null;

    let melhorCelular: Celular | null = null;
    let maiorPontuacao = -1;

    for (const celular of this.listaComparacao) {
      const pontuacao = this.calcularPontuacao(celular);
      if (pontuacao > maiorPontuacao) {
        maiorPontuacao = pontuacao;
        melhorCelular = celular;
      }
    }

    if (!melhorCelular) return null;

    const motivos = this.filtros
      .filter(f => this.filtrosSelecionados.includes(f.key))
      .map(f => f.label.replace(/^[^\s]+\s/, '')); // Remove o emoji para o texto ficar limpo

    return {
      celular: melhorCelular,
      pontos: maiorPontuacao,
      motivos: motivos
    };
  }

}
