import { Component, inject, OnInit } from '@angular/core';
import { Menu } from '../../componentes/menu/menu';
import { FormsModule } from '@angular/forms';
import { CarouselSlide, Carrosel } from '../../componentes/carrosel/carrosel';
import { CommonModule } from '@angular/common';
import { AlterarInfoComponent } from '../../componentes/alterar-info/alterar-info';
import { AvisoLogin } from '../../componentes/aviso-login/aviso-login'; 
import { Auth } from '../../services/auth';

export interface Specs {
  armazenamento: string;
  ram: string;
  bateria: string;
  processador: string;
  gpu: string;
  qualidadeImagem: string;
  cincoG: string;
  camera?: string;
  imagem?: string;
}

export interface PontosFortes {
  naoTravar: number;         // Memória RAM
  muitoEspaco: number;       // Armazenamento
  placaVideo: number;        // GPU
  qualidadeImagem: number;   // Tela / Imagem
  boaBateria: number;        // Bateria
  processadorCPU: number;    // Processador
  cincoG: number;            // Conectividade 5G
  melhorCamera: number;      // Câmeras
  precoBaixo?: number;       // Custo-benefício
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
  imports: [Menu, Carrosel, CommonModule, AlterarInfoComponent, FormsModule, AvisoLogin],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  authService = inject(Auth);
  exibirAvisoModal: boolean = false;

  listaCelulares: Celular[] = [];
  listaComparacao: Celular[] = [];
  termoBusca: string = '';       
  celularSelecionado: Celular | null = null;

  // 🎯 Os 8 filtros solicitados + Custo Benefício
  filtros = [
    { key: 'naoTravar', label: '⚡ Memória RAM' },
    { key: 'muitoEspaco', label: '📦 Armazenamento' },
    { key: 'placaVideo', label: '🎮 Placa de vídeo (GPU)' },
    { key: 'qualidadeImagem', label: '📺 Qualidade de imagem' },
    { key: 'boaBateria', label: '🔋 Bateria' },
    { key: 'processadorCPU', label: '🧠 Processador' },
    { key: 'cincoG', label: '🚀 Conexão 5G' },
    { key: 'melhorCamera', label: '📸 Qualidade das Câmeras' },
    { key: 'precoBaixo', label: '💰 Preço baixo' }
  ];

  filtrosSelecionados: string[] = [];

  // 📖 Dicionário explicativo cobrindo os 8 pontos
  dicionarioTermos: Record<string, { titulo: string; explicacao: string }> = {
    ram: {
      titulo: 'Memória RAM',
      explicacao: 'É a memória de trabalho. Quanto maior a RAM (4GB, 8GB, 12GB), mais aplicativos você consegue abrir ao mesmo tempo sem o celular travar ou fechar sozinho.'
    },
    armazenamento: {
      titulo: 'Armazenamento',
      explicacao: 'Pense como uma grande gaveta: quanto maior (128GB, 256GB), mais fotos, vídeos e aplicativos cabem sem precisar apagar nada.'
    },
    gpu: {
      titulo: 'Placa de Vídeo (GPU)',
      explicacao: 'É o motor gráfico. Cuida dos jogos e das animações. Quanto maior a nota, mais lisinho o celular roda jogos pesados sem travar.'
    },
    qualidadeImagem: {
      titulo: 'Qualidade de Imagem',
      explicacao: 'Define a nitidez, o brilho e as cores do visor. Notas altas (telas AMOLED/OLED) entregam cores bem vivas, preto perfeito e ótima visibilidade até sob o sol forte.'
    },
    bateria: {
      titulo: 'Bateria',
      explicacao: 'Medida em mAh. Quanto maior o número (ex: 5000 mAh), mais tempo o celular dura longe da tomada durante o dia.'
    },
    processador: {
      titulo: 'Processador',
      explicacao: 'É o cérebro do celular. Um processador bom faz os jogos rodarem lisinhos e os aplicativos abrirem instantaneamente.'
    },
    cincoG: {
      titulo: 'Conexão 5G',
      explicacao: 'É a internet móvel super-rápida. Com 5G, você baixa arquivos gigantes em segundos e joga online sem lag. Sem ele, você navega na rede 4G tradicional.'
    },
    camera: {
      titulo: 'Qualidade das Câmeras',
      explicacao: 'Mede a qualidade real de fotos e vídeos (não só megapixels). Notas altas garantem fotos incríveis à noite e vídeos sem tremedeira.'
    }
  };

  termoExibido: { titulo: string; explicacao: string } | null = null;

  homeCarosel: CarouselSlide[] = [
    {
      image: "/img/projeto/celulares.jpg",
      title: 'Aprenda a escolher qual o melhor aparelho'
    },
    {
      image: "/img/projeto/familia-unida.jpg",
      title: 'O celular perfeito para todos os membros da família'
    },
    {
      image: "/img/projeto/hardware_smartphone.jpg",
      title: 'Venha aprender sobre as peças de um celular'
    }
  ];

  ngOnInit(): void {
    this.carregarCelulares();
  }

  async carregarCelulares(): Promise<void> {
    try {
      const resposta = await fetch('/data/celulares.json');
      this.listaCelulares = await resposta.json();
      this.listaCelulares.forEach(celular => this.recalcularNotas(celular));
    } catch (erro) {
      console.error('Erro ao carregar a lista de celulares:', erro);
    }
  }

  recalcularNotas(celular: Celular): void {
    const ramNum = this.extrairNumero(celular.specs.ram);
    const armNum = this.extrairNumero(celular.specs.armazenamento);
    const batNum = this.extrairNumero(celular.specs.bateria);
    const preco = celular.precoMedio;
    const tem5G = String(celular.specs.cincoG).toLowerCase().includes('sim');

    celular.pontosFortes = {
      // Calculados automaticamente
      naoTravar: ramNum >= 12 ? 10 : ramNum >= 8 ? 8 : ramNum >= 6 ? 6 : 4,
      muitoEspaco: armNum >= 512 ? 10 : armNum >= 256 ? 9 : armNum >= 128 ? 7 : 4,
      boaBateria: batNum >= 7000 ? 10 : batNum >= 6000 ? 9 : batNum >= 5000 ? 8 : 6,
      precoBaixo: preco <= 800 ? 10 : preco <= 1200 ? 8 : preco <= 2000 ? 6 : preco <= 4000 ? 4 : 2,
      cincoG: tem5G ? 10 : 3,

      // Lidos diretamente do JSON
      placaVideo: celular.pontosFortes?.placaVideo ?? 5,
      qualidadeImagem: celular.pontosFortes?.qualidadeImagem ?? 5,
      processadorCPU: celular.pontosFortes?.processadorCPU ?? 5,
      melhorCamera: celular.pontosFortes?.melhorCamera ?? 5
    };
  }

  private extrairNumero(valor: string | number): number {
    if (typeof valor === 'number') return valor;
    const match = String(valor).replace(',', '.').match(/[\d\.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  atualizarSpec(celular: Celular, chave: keyof Specs, novoValor: string | number): void {
    celular.specs[chave] = String(novoValor);
    this.recalcularNotas(celular);
  }

  get sugestoesBusca(): Celular[] {
    if (!this.termoBusca.trim()) return [];
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

    this.listaComparacao.push(structuredClone(this.celularSelecionado));
    this.termoBusca = '';
    this.celularSelecionado = null;
  }

  removerDaComparacao(index: number): void {
    this.listaComparacao.splice(index, 1);
  }

  irParaCelular(index: number): void {
    if (!this.listaComparacao[index]) {
      alert(`O slot ${index + 1} ainda está vazio! Adicione um celular primeiro.`);
      return;
    }

    const elemento = document.getElementById(`card-celular-${index}`);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }

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
    if (this.listaComparacao.length < 2 || this.filtrosSelecionados.length === 0) {
      return null;
    }

    let melhorCelular: Celular | null = null;
    let maiorPontuacao = -1;

    for (const celular of this.listaComparacao) {
      const pontuacao = this.calcularPontuacao(celular);

      if (pontuacao > maiorPontuacao) {
        maiorPontuacao = pontuacao;
        melhorCelular = celular;
      } else if (pontuacao === maiorPontuacao && melhorCelular) {
        if (celular.precoMedio < melhorCelular.precoMedio) {
          melhorCelular = celular;
        }
      }
    }

    if (!melhorCelular) return null;

    const motivos = this.filtros
      .filter(f => this.filtrosSelecionados.includes(f.key))
      .map(f => f.label.replace(/^[^\s]+\s/, '')); 

    return {
      celular: melhorCelular,
      pontos: maiorPontuacao,
      motivos: motivos
    };
  }

  salvarComparacao(): void {
    if (this.listaComparacao.length < 2) {
      alert('Adicione pelo menos 2 celulares para salvar uma comparação!');
      return;
    }

    if (this.filtrosSelecionados.length === 0) {
      alert('Selecione pelo menos um filtro de preferência para definir o vencedor antes de salvar!');
      return;
    }

    if (this.authService.usuarioLogado()) {
      const usuario = this.authService.getUsuario();

      if (usuario) {
        const chave = `salvos_${usuario.id}`;
        const salvosAnteriores = JSON.parse(localStorage.getItem(chave) || '[]');
        const vencedorObj = this.celularVencedor;

        const novaComparacao = {
          id: Date.now(),
          data: new Date().toLocaleDateString('pt-BR'),
          celulares: [...this.listaComparacao],
          filtros: this.filtros
            .filter(f => this.filtrosSelecionados.includes(f.key))
            .map(f => f.label),
          vencedor: vencedorObj ? {
            nome: vencedorObj.celular.nome,
            imagem: vencedorObj.celular.imagem,
            pontos: vencedorObj.pontos,
            motivos: vencedorObj.motivos
          } : null
        };

        salvosAnteriores.push(novaComparacao);
        localStorage.setItem(chave, JSON.stringify(salvosAnteriores));

        alert('Comparação com vencedor salva com sucesso!');
      }
    } else {
      this.exibirAvisoModal = true;
    }
  }

  fecharModal(): void {
    this.exibirAvisoModal = false;
  }

  abrirDicionario(termoKey: string): void {
    if (this.dicionarioTermos[termoKey]) {
      this.termoExibido = this.dicionarioTermos[termoKey];
      
      const elemento = document.getElementById('infoFacil');
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  fecharDicionario(): void {
    this.termoExibido = null;
  }
}