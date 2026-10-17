import { Component, inject, OnInit } from '@angular/core';
import { Menu } from '../../componentes/menu/menu';
import { FormsModule } from '@angular/forms';
import { CarouselSlide, Carrosel } from '../../componentes/carrosel/carrosel';
import { CommonModule } from '@angular/common';
import { AlterarInfoComponent } from '../../componentes/alterar-info/alterar-info';
import { AvisoLogin } from '../../componentes/aviso-login/aviso-login'; 
import { Auth } from '../../services/auth';
import {
  CelularesApiService,
  DispositivoApi,
  DispositivoDetalhado
} from '../../services/celulares-api.service';

export interface Specs {
  armazenamento: string;
  ram: string;
  bateria: string;
  processador: string;
  gpu: string;
  qualidadeImagem: string;
  camera?: string;
  imagem?: string;
}

export interface PontosFortes {
  naoTravar: number;         
  muitoEspaco: number;       
  placaVideo: number;        
  qualidadeImagem: number;   
  boaBateria: number;        
  processadorCPU: number;    
  melhorCamera: number;     
  precoBaixo?: number;       
}

export interface Celular {
  id: number;
  nome: string;
  precoLoja?: number | null;
  origem?: 'local' | 'api';
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

  // Serviço que consulta o backend
  private celularesApi = inject(CelularesApiService);

  exibirAvisoModal: boolean = false;

  listaCelulares: Celular[] = [];
  listaComparacao: Celular[] = [];
  termoBusca: string = '';
  celularSelecionado: Celular | null = null;

  // Controle da busca externa
  resultadosApi: DispositivoApi[] = [];
  buscandoApi = false;
  buscandoDetalhesApi = false;
  erroBuscaApi = '';
  tempoEsperaApi = 0;
  mensagemBuscaApi = '';
  buscaApiRealizada = false;

  filtros = [
    { key: 'naoTravar', label: 'Memória RAM', icone: '/img/projeto/memoria.svg'},
    { key: 'muitoEspaco', label: 'Armazenamento', icone: '/img/projeto/caixa.svg' },
    { key: 'placaVideo', label: 'Placa de vídeo (GPU)' , icone: '/img/projeto/monitor.svg' },
    { key: 'qualidadeImagem', label: 'Qualidade de imagem' , icone: '/img/projeto/imagem.svg' },
    { key: 'boaBateria', label: 'Bateria' , icone: '/img/projeto/bateria.svg' },
    { key: 'processadorCPU', label: 'Processador' , icone: '/img/projeto/raio.svg'},
    { key: 'melhorCamera', label: 'Qualidade das Câmeras' , icone: '/img/projeto/camera.svg' },
    { key: 'precoBaixo', label: 'Preço baixo' , icone: '/img/projeto/carteira.svg'}
  ];

  filtrosSelecionados: string[] = [];

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

  
  aoAlterarBusca(): void {
    const termoAtual = this.termoBusca.trim();

    if (
      this.celularSelecionado &&
      termoAtual !== this.celularSelecionado.nome
    ) {
      this.celularSelecionado = null;
    }

    this.resultadosApi = [];
    this.erroBuscaApi = '';
    this.mensagemBuscaApi = '';
    this.buscaApiRealizada = false;
  }

  
buscarNaApi(): void {
  const nome = this.termoBusca.trim();

  if (nome.length < 2) {
    this.erroBuscaApi = 'Digite pelo menos 2 caracteres para pesquisar.';
    return;
  }

  
  this.celularSelecionado = null;
  this.resultadosApi = [];
  this.erroBuscaApi = '';
  this.mensagemBuscaApi = '';
  this.buscaApiRealizada = false;
  this.buscandoApi = true;


  this.celularesApi.buscarPorNome(nome).subscribe({
    next: (resposta) => {
      const encontrados = resposta.devices.filter(
        dispositivo =>
          !dispositivo.device_type ||
          dispositivo.device_type.toLowerCase() === 'phone'
      );

      this.resultadosApi = encontrados.filter(dispositivo => {
        const nomeApi = this.normalizarNome(
          this.nomeCompletoApi(dispositivo)
        );

        return !this.listaCelulares.some(
          celular => this.normalizarNome(celular.nome) === nomeApi
        );
      });

      this.buscandoApi = false;
      this.buscaApiRealizada = true;

      if (encontrados.length === 0) {
        this.mensagemBuscaApi = 'Nenhum celular encontrado para essa pesquisa.';
      } else if (this.resultadosApi.length === 0) {
        this.mensagemBuscaApi =
          'Os modelos encontrados já estão no catálogo local.';
      }
    },
    
    error: (erro) => {
      console.error('Erro ao pesquisar celulares na API:', erro);

      this.resultadosApi = [];
      this.mensagemBuscaApi = '';
      this.buscandoApi = false;
      this.buscaApiRealizada = true;

      this.erroBuscaApi =
        erro.error?.error || 'Não foi possível pesquisar os celulares.';

      const correspondencia = this.erroBuscaApi.match(
        /Aguarde\s+(\d+(?:[.,]\d+)?)\s+segundos?/i
      );

      if (correspondencia) {
        this.iniciarContagemRegressiva(
          Math.ceil(Number(correspondencia[1].replace(',', '.')))
        );
      }
    }

  });
  
}

iniciarContagemRegressiva(segundos: number): void {
  this.tempoEsperaApi = Math.max(0, segundos);

  const contar = () => {
    setTimeout(() => {
      if (this.tempoEsperaApi > 0) {
        this.tempoEsperaApi--;
      }

      if (this.tempoEsperaApi > 0) {
        contar();
      }
    }, 1000);
  };

  if (this.tempoEsperaApi > 0) {
    contar();
  }
}

nomeCompletoApi(dispositivo: DispositivoApi): string {
  const marca = dispositivo.manufacturer_name?.trim() || '';
  const nome = dispositivo.name.trim();

  if (!marca) return nome;

  if (
    this.normalizarNome(nome).startsWith(this.normalizarNome(marca))
  ) {
    return nome;
  }

  return `${marca} ${nome}`;
}

private normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

selecionarResultadoApi(dispositivo: DispositivoApi): void {
    if (this.listaComparacao.length >= 3) {
      alert('Você já atingiu o limite de 3 celulares para comparar.');
      return;
    }

    const idLocal = 1_000_000 + dispositivo.id;

    if (this.listaComparacao.some(celular => celular.id === idLocal)) {
      alert('Este celular já está na sua lista de comparação.');
      return;
    }

    this.buscandoDetalhesApi = true;
    this.erroBuscaApi = '';
    this.mensagemBuscaApi = '';

    this.celularesApi.buscarDetalhes(dispositivo.id).subscribe({
      next: (detalhes) => {
        const celular = this.converterDispositivoApi(detalhes);

        this.recalcularNotas(celular);
        this.celularSelecionado = celular;
        this.termoBusca = celular.nome;
        this.resultadosApi = [];
        this.mensagemBuscaApi =
          'Celular selecionado. Clique em Adicionar para incluí-lo na comparação.';
        this.buscandoDetalhesApi = false;
      },
      error: (erro) => {
        console.error('Erro ao buscar detalhes do celular:', erro);
        this.erroBuscaApi =
          erro.error?.error ||
          'Não foi possível carregar os detalhes desse celular.';
        this.buscandoDetalhesApi = false;
      }
    });
  }

  
    private converterDispositivoApi(d: DispositivoDetalhado): Celular {
      const capacidadeRam = this.obterRamGb(d);
      const capacidadeArmazenamento = this.obterArmazenamentoGb(d);

      const chipsetOriginal = d.platform?.chipset || '';
      const hardwareOriginal = d.hardware || '';

      const processador =
        chipsetOriginal
          .split(/Processor clock:|Number of cores:|GPU:/i)[0]
          .trim() ||
        hardwareOriginal
          .replace(
            /^(?:\s*\d+(?:[.,]\d+)?\s*(?:GB|MB|TB)\s*)+RAM\s*,?\s*/i,
            ''
          )
          .trim() ||
        'Não informado pela API';

      const gpu =
        d.platform?.gpu?.trim() ||
        chipsetOriginal.match(/GPU:\s*(.+)$/i)?.[1]?.trim() ||
        'Não informado pela API';

      const tela = [
        d.display?.type,
        d.display?.size,
        d.display?.resolution
      ]
        .filter((valor): valor is string => Boolean(valor?.trim()))
        .join(' — ') ||
        d.screen_resolution ||
        'Não informado pela API';

      const bateriaOriginal =
        d.battery?.type || d.battery_capacity || '';

      const bateria =
        bateriaOriginal.match(/[\d.,]+\s*mAh/i)?.[0] ||
        bateriaOriginal ||
        'Não informado pela API';

      const cameras = [
        d.main_camera?.modules ? `Traseira: ${d.main_camera.modules}` : '',
        d.selfie_camera?.modules ? `Frontal: ${d.selfie_camera.modules}` : ''
      ].filter(Boolean).join(' | ');

      const celular: Celular = {
        id: 1_000_000 + d.id,
        nome: this.nomeCompletoApi(d),
        precoLoja: null,
        origem: 'api',
        imagem: d.image_url || '/img/projeto/celulares.jpg',

        specs: {
          armazenamento: capacidadeArmazenamento !== null
            ? `${capacidadeArmazenamento}GB`
            : 'Não informado pela API',

          ram: capacidadeRam !== null
            ? `${capacidadeRam}GB`
            : 'Não informado pela API',

          bateria,
          processador,
          gpu,
          qualidadeImagem: tela,
          camera: cameras
        },

        pontosFortes: {
          naoTravar: 0,
          muitoEspaco: 0,
          placaVideo: 5,
          qualidadeImagem: 5,
          boaBateria: 0,
          processadorCPU: 5,
          melhorCamera: 5,
          precoBaixo: 0
        }
      };

      return celular;
    }

    private obterRamGb(d: DispositivoDetalhado): number | null {
      const memoria = d.memory?.internal || '';

      let textoRam =
        memoria.match(/RAM\s*:\s*(.+)$/i)?.[1] ||
        memoria.match(/(\d+(?:[.,]\d+)?\s*(?:GB|MB|TB))\s*RAM/i)?.[1] ||
        d.hardware?.match(
          /((?:\d+(?:[.,]\d+)?\s*(?:GB|MB|TB)\s*)+)RAM/i
        )?.[1] ||
        '';

      const capacidades = this.lerCapacidadesGb(textoRam);
      return capacidades.length ? Math.min(...capacidades) : null;
    }

    private obterArmazenamentoGb(
      d: DispositivoDetalhado
    ): number | null {
      const opcoes = this.lerCapacidadesGb(d.storage || '');

      if (opcoes.length) {
        return Math.min(...opcoes);
      }

      const memoria = d.memory?.internal || '';
      const antesDaRam = memoria.split(/\bRAM\b/i)[0];
      const capacidades = this.lerCapacidadesGb(antesDaRam);

      // Em formatos como "32GB 2GB RAM", o último valor
      // antes de RAM pode ser a memória RAM, não o armazenamento.
      if (
        capacidades.length > 1 &&
        /\bRAM\b/i.test(memoria) &&
        !/RAM\s*:/i.test(memoria)
      ) {
        const valoresOriginais = this.lerCapacidadesGbNaOrdem(antesDaRam);
        valoresOriginais.pop();

        return valoresOriginais.length
          ? Math.min(...valoresOriginais)
          : null;
      }

      return capacidades.length ? Math.min(...capacidades) : null;
    }

    private lerCapacidadesGb(texto: string): number[] {
      return [...new Set(this.lerCapacidadesGbNaOrdem(texto))]
        .sort((a, b) => a - b);
    }

    private lerCapacidadesGbNaOrdem(texto: string): number[] {
      const capacidades: number[] = [];
      const regex = /(\d+(?:[.,]\d+)?)\s*(TB|GB|MB)/gi;

      for (const resultado of texto.matchAll(regex)) {
        let valor = Number(resultado[1].replace(',', '.'));
        const unidade = resultado[2].toUpperCase();

        if (unidade === 'TB') valor *= 1024;
        if (unidade === 'MB') valor /= 1024;

        if (Number.isFinite(valor) && valor > 0) {
          capacidades.push(Number(valor.toFixed(2)));
        }
      }

      return capacidades;
    }

  
  celularEstaEmpatado(celularId: number): boolean {
    return this.celularesEmpatados.some(
      celular => celular.id === celularId
    );
  }

  recalcularNotas(celular: Celular): void {
    const ramNum = this.extrairNumero(celular.specs.ram);
    const armNum = this.extrairNumero(celular.specs.armazenamento);
    const batNum = this.extrairNumero(celular.specs.bateria);

    celular.pontosFortes = {
      
      naoTravar: ramNum > 0
        ? ramNum < 2 ? 1
        : ramNum < 3 ? 2
        : ramNum < 4 ? 3
        : ramNum < 6 ? 4
        : ramNum < 8 ? 5
        : ramNum < 10 ? 6
        : ramNum < 12 ? 7
        : ramNum < 16 ? 8
        : ramNum < 24 ? 9
        : 10
        : 0,


      
      muitoEspaco: armNum > 0
        ? armNum < 16 ? 1
        : armNum < 32 ? 2
        : armNum < 64 ? 3
        : armNum < 128 ? 4
        : armNum < 192 ? 5
        : armNum < 256 ? 6
        : armNum < 384 ? 7
        : armNum < 512 ? 8
        : armNum < 1024 ? 9
        : 10
        : 0,


      
      boaBateria: batNum > 0
        ? batNum < 2000 ? 1
        : batNum < 2500 ? 2
        : batNum < 3000 ? 3
        : batNum < 3500 ? 4
        : batNum < 4000 ? 5
        : batNum < 4500 ? 6
        : batNum < 5000 ? 7
        : batNum < 5500 ? 8
        : batNum < 6000 ? 9
        : 10
        : 0,


      
      precoBaixo: celular.precoLoja != null &&
                  Number.isFinite(celular.precoLoja) &&
                  celular.precoLoja > 0
        ? celular.precoLoja <= 800 ? 10
        : celular.precoLoja <= 1200 ? 8
        : celular.precoLoja <= 2000 ? 6
        : celular.precoLoja <= 4000 ? 4
        : 2
        : 0,


      placaVideo: this.temInformacao(celular.specs.gpu)
        ? celular.pontosFortes?.placaVideo ?? 5
        : 0,

      qualidadeImagem: this.temInformacao(celular.specs.qualidadeImagem)
        ? celular.pontosFortes?.qualidadeImagem ?? 5
        : 0,

      processadorCPU: this.temInformacao(celular.specs.processador)
        ? celular.pontosFortes?.processadorCPU ?? 5
        : 0,

      melhorCamera: this.temInformacao(celular.specs.camera)
        ? celular.pontosFortes?.melhorCamera ?? 5
        : 0
    };
  }

  private temInformacao(valor?: string): boolean {
    return Boolean(
      valor?.trim() &&
      !valor.toLowerCase().includes('não informado')
    );
  }
  
  private extrairNumero(valor: string | number): number {
    if (typeof valor === 'number') return valor;

    const texto = String(valor).trim().replace(',', '.');

    const match = texto.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)?/i);

    if (!match) return 0;

    const numero = Number(match[1]);
    const unidade = (match[2] || '').toUpperCase();

    if (unidade === 'TB') return numero * 1024;
    if (unidade === 'MB') return numero / 1024;

    return numero;
  }


  atualizarSpec(celular: Celular, chave: keyof Specs, novoValor: string | number): void {
    celular.specs[chave] = String(novoValor);
    this.recalcularNotas(celular);
  }

  
  atualizarPrecoLoja(
    celular: Celular,
    valor: number | null
  ): void {
    celular.precoLoja =
      valor !== null && Number.isFinite(valor) && valor > 0
        ? valor
        : null;

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
    this.celularSelecionado = structuredClone(celular);
    this.resultadosApi = [];
    this.erroBuscaApi = '';
    this.mensagemBuscaApi =
    'Celular selecionado. Clique em Adicionar para incluí-lo na comparação.';
    this.buscaApiRealizada = false;
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
    this.mensagemBuscaApi = '';
    this.erroBuscaApi = '';
    this.resultadosApi = [];
    this.buscaApiRealizada = false;
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

    const algumPrecoAusente = this.listaComparacao.some(
      c => c.precoLoja == null || c.precoLoja <= 0
    );

    for (const key of this.filtrosSelecionados) {
      // Se algum preço estiver ausente, não considera o critério de preço.
      if (key === 'precoBaixo' && algumPrecoAusente) {
        continue;
      }

      const chavePontos = key as keyof PontosFortes;
      const pontos = celular.pontosFortes?.[chavePontos];

      if (pontos !== undefined) {
        total += pontos;
      }
    }

    return total;
  }

get celularesEmpatados(): Celular[] {
  if (
    this.filtrosSelecionados.length === 0 ||
    this.listaComparacao.length < 2
  ) {
    return [];
  }

  const pontuacoes = this.listaComparacao.map(celular => ({
    celular,
    pontos: this.calcularPontuacao(celular)
  }));

  const maiorPontuacao = Math.max(
    ...pontuacoes.map(item => item.pontos)
  );

  return pontuacoes
    .filter(item => item.pontos === maiorPontuacao)
    .map(item => item.celular)
    .filter((celular, _, lista) => lista.length > 1);
}
  
  
get celularVencedor(): {
    celular: Celular;
    pontos: number;
    motivos: string[];
  } | null {
    // Sem filtros, não existe campeão.
    if (this.filtrosSelecionados.length === 0) {
      return null;
    }

    // Com menos de dois celulares, não existe comparação.
    if (this.listaComparacao.length < 2) {
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
    }

    if (!melhorCelular) return null;
    if (this.celularesEmpatados.length > 1) {
      return null;
    }

    const algumPrecoAusente = this.listaComparacao.some(
      c => c.precoLoja == null || c.precoLoja <= 0
    );

    const motivos = this.filtros
      .filter(f =>
        this.filtrosSelecionados.includes(f.key) &&
        !(f.key === 'precoBaixo' && algumPrecoAusente)
      )
      .map(f => f.label);

    return {
      celular: melhorCelular,
      pontos: maiorPontuacao,
      motivos
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