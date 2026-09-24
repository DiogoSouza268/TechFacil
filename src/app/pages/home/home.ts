import { Component, inject, OnInit } from '@angular/core';
import { Menu } from '../../componentes/menu/menu';
import { FormsModule } from '@angular/forms';
import { CarouselSlide , Carrosel} from '../../componentes/carrosel/carrosel';
import { CommonModule } from '@angular/common';
import { AlterarInfoComponent } from '../../componentes/alterar-info/alterar-info';
import { AvisoLogin } from '../../componentes/aviso-login/aviso-login'; 
import { Auth } from '../../services/auth';

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
  imports: [Menu, Carrosel, CommonModule, AlterarInfoComponent, FormsModule, AvisoLogin],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home implements OnInit {

  authService = inject(Auth);

  exibirAvisoModal: boolean = false;

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
    } 
    else {
      this.exibirAvisoModal = true;
    }
  }

  fecharModal(): void {
    this.exibirAvisoModal = false;
  }

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
      this.listaCelulares.forEach(celular => this.recalcularNotas(celular));
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

    this.listaComparacao.push(structuredClone(this.celularSelecionado));
    this.termoBusca = '';
    this.celularSelecionado = null;
  }

  removerDaComparacao(index: number): void {
    this.listaComparacao.splice(index, 1);
  }

  recalcularNotas(celular: Celular): void {
  // Extrai apenas os valores numéricos das especificações
  const ramNum = this.extrairNumero(celular.specs.ram);
  const armNum = this.extrairNumero(celular.specs.armazenamento);
  const batNum = this.extrairNumero(celular.specs.bateria);
  const telaNum = this.extrairNumero(celular.specs.tela);
  const preco = celular.precoMedio;

  celular.pontosFortes = {
    // ⚙️ CALCULADOS AUTOMATICAMENTE (por serem 100% numéricos)
    // ⚡ NÃO TRAVAR (baseado na RAM):
    // >= 12GB -> Nota 10 (Excelente para multitarefa/jogos pesados)
    // >= 8GB  -> Nota 8  (Muito bom)
    // >= 6GB  -> Nota 6  (Intermediário)
    // < 6GB   -> Nota 4  (Básico, pode travar com muitos apps)
    naoTravar: ramNum >= 12 ? 10 : ramNum >= 8 ? 8 : ramNum >= 6 ? 6 : 4,

    // 🔋 BOA BATERIA (baseado na capacidade em mAh):
    // >= 7000 mAh -> Nota 10 (Super bateria, dura até 2-3 dias)
    // >= 6000 mAh -> Nota 9  (Duração excelente)
    // >= 5000 mAh -> Nota 8  (Padrão atual de mercado, dura 1 dia)
    // < 5000 mAh  -> Nota 6  (Bateria moderada/pequena)
    boaBateria: batNum >= 7000 ? 10 : batNum >= 6000 ? 9 : batNum >= 5000 ? 8 : 6,

    // 📦 MUITO ESPAÇO (baseado no Armazenamento em GB):
    // >= 512GB -> Nota 10 (Espaço de sobra para anos)
    // >= 256GB -> Nota 9  (Ótimo armazenamento)
    // >= 128GB -> Nota 7  (Suficiente para uso comum)
    // < 128GB  -> Nota 4  (Pouco espaço, enche rápido)
    muitoEspaco: armNum >= 512 ? 10 : armNum >= 256 ? 9 : armNum >= 128 ? 7 : 4,

    // 📺 TELA GRANDE (baseado nas polegadas):
    // >= 6.8" -> Nota 10 (Tela gigante)
    // >= 6.6" -> Nota 8  (Tela média-grande)
    // >= 6.4" -> Nota 7  (Tamanho padrão)
    // < 6.4"  -> Nota 5  (Tela compacta)
    telaGrande: telaNum >= 6.8 ? 10 : telaNum >= 6.6 ? 8 : telaNum >= 6.4 ? 7 : 5,

    // 💰 PREÇO BAIXO (quanto menor o preço em R$, maior a nota):
    // Até R$ 800,00   -> Nota 10 (Super em conta)
    // Até R$ 1200,00  -> Nota 8  (Bom custo-benefício)
    // Até R$ 2000,00  -> Nota 6  (Preço intermediário)
    // Até R$ 4000,00  -> Nota 4  (Preço alto)
    // Acima de R$ 4000 -> Nota 2  (Preço premium/caro)
    precoBaixo: preco <= 800 ? 10 : preco <= 1200 ? 8 : preco <= 2000 ? 6 : preco <= 4000 ? 4 : 2,

    
    // 🎯 MANTIDOS DO JSON (para termos textuais/qualitativos)
    // Pega a nota que você definiu manualmente no JSON (ou usa 7 como padrão se não existir)
    // 📸 MELHOR CÂMERA:
    // Mantém o valor que veio do JSON (se houver) ou define 5 como padrão
    melhorCamera: celular.pontosFortes?.melhorCamera ?? 5

    // Exemplo se quiser adicionar um filtro de jogos/GPU no futuro:
    // rodarJogos: celular.pontosFortes?.rodarJogos ?? 5
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
      }

      else if (pontuacao === maiorPontuacao && melhorCelular) {
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


  dicionarioTermos: Record<string, { titulo: string; explicacao: string }> = {
    armazenamento: {
      titulo: 'Armazenamento',
      explicacao: 'Pense como uma grande gaveta: quanto maior (128GB, 256GB), MAIS FOTOS, VÍDEOS E APPS CABEM, sem precisar apagar nada.'
    },
    ram: {
      titulo: 'Memória RAM',
      explicacao: 'É a memória de trabalho. Quanto maior a RAM (4GB, 8GB, 12GB), mais aplicativos você consegue abrir ao mesmo tempo sem o celular travar ou fechar sozinho.'
    },
    bateria: {
      titulo: 'Bateria',
      explicacao: 'Medida em mAh. Quanto maior o número (ex: 5000 mAh), mais tempo o celular dura longe da tomada durante o dia.'
    },
    processador: {
      titulo: 'Processador',
      explicacao: 'É o "cérebro" do celular. Um processador bom faz os jogos rodarem lisinhos e os aplicativos abrirem instantaneamente.'
    }
  };

  termoExibido: { titulo: string; explicacao: string } | null = null;

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
