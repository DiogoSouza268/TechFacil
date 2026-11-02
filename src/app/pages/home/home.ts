
import { Component, inject, OnInit } from '@angular/core';
import { Menu } from '../../componentes/menu/menu';
import { FormsModule } from '@angular/forms';
import {
  CarouselSlide,
  Carrosel
} from '../../componentes/carrosel/carrosel';
import { CommonModule } from '@angular/common';
import { AlterarInfoComponent } from '../../componentes/alterar-info/alterar-info';
import { AvisoLogin } from '../../componentes/aviso-login/aviso-login';
import { Auth } from '../../services/auth';

import {
  CelularesApiService,
  DispositivoApi,
  DispositivoDetalhado
} from '../../services/celulares-api.service';

import { firstValueFrom } from 'rxjs';

import {
  FacilitoService,
  type PedidoFacilito,
  type ResultadoFacilito,
  type EspecificacaoFacilito
} from '../../services/facilito.service';


export interface Specs {
  armazenamento: string;
  ram: string;
  bateria: string;
  processador: string;
  gpu: string;
  qualidadeImagem: string;
  camera: string;
  imagem?: string;
}


export interface Celular {
  id: number;
  nome: string;
  precoLoja?: number | null;
  origem?: 'local' | 'api';
  imagem: string;
  specs: Specs;

  qualidadeImagemParcial?: boolean;
  qualidadeImagemSemDados?: boolean;
  processadorParcial?: boolean;
  processadorSemDados?: boolean;
  gpuParcial?: boolean;
  gpuSemDados?: boolean;
  cameraSemDados?: boolean;

  informacoesIncompletas?: string[];
}


type CampoEspecificacao = EspecificacaoFacilito;


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Menu,
    Carrosel,
    CommonModule,
    AlterarInfoComponent,
    FormsModule,
    AvisoLogin
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})


export class Home implements OnInit {

  authService = inject(Auth);

  private celularesApi = inject(CelularesApiService);
  private facilitoService = inject(FacilitoService);


  // Controle da interface.
  exibirAvisoModal = false;

  listaCelulares: Celular[] = [];
  listaComparacao: Celular[] = [];

  termoBusca = '';
  celularSelecionado: Celular | null = null;


  // Resultado do Facilito.AI.
  resultadoFacilito: ResultadoFacilito | null = null;

  facilitoCarregando = false;
  erroFacilito = '';

  // Identifica alterações feitas durante uma solicitação.
  private versaoComparacao = 0;


  // Controle da busca externa.
  resultadosApi: DispositivoApi[] = [];

  buscandoApi = false;
  buscandoDetalhesApi = false;

  erroBuscaApi = '';
  tempoEsperaApi = 0;
  mensagemBuscaApi = '';
  buscaApiRealizada = false;


  // Preferências disponíveis.
  filtros = [
    {
      key: 'naoTravar',
      label: 'Memória RAM',
      icone: '/img/projeto/memoria.svg'
    },
    {
      key: 'muitoEspaco',
      label: 'Armazenamento',
      icone: '/img/projeto/caixa.svg'
    },
    {
      key: 'placaVideo',
      label: 'Placa de vídeo (GPU)',
      icone: '/img/projeto/monitor.svg'
    },
    {
      key: 'qualidadeImagem',
      label: 'Qualidade de imagem',
      icone: '/img/projeto/imagem.svg'
    },
    {
      key: 'boaBateria',
      label: 'Bateria',
      icone: '/img/projeto/bateria.svg'
    },
    {
      key: 'processadorCPU',
      label: 'Processador',
      icone: '/img/projeto/raio.svg'
    },
    {
      key: 'melhorCamera',
      label: 'Qualidade das Câmeras',
      icone: '/img/projeto/camera.svg'
    },
    {
      key: 'precoBaixo',
      label: 'Preço baixo',
      icone: '/img/projeto/carteira.svg'
    }
  ];


  filtrosSelecionados: string[] = [];


  // Dicionário de termos.
  dicionarioTermos: Record<
    string,
    { titulo: string; explicacao: string }
  > = {

    ram: {
      titulo: 'Memória RAM',
      explicacao:
        'É a memória de trabalho. Quanto maior a RAM (4GB, 8GB, 12GB), mais aplicativos você consegue abrir ao mesmo tempo sem o celular travar ou fechar sozinho.'
    },

    armazenamento: {
      titulo: 'Armazenamento',
      explicacao:
        'Pense como uma grande gaveta: quanto maior (128GB, 256GB), mais fotos, vídeos e aplicativos cabem sem precisar apagar nada.'
    },

    gpu: {
      titulo: 'Placa de Vídeo (GPU)',
      explicacao:
        'É responsável pelos gráficos dos jogos e pelas animações. Uma boa GPU ajuda a executar jogos e aplicativos com gráficos exigentes.'
    },

    qualidadeImagem: {
      titulo: 'Qualidade de Imagem',
      explicacao:
        'Está relacionada à nitidez, ao brilho, às cores e à definição da tela do celular.'
    },

    bateria: {
      titulo: 'Bateria',
      explicacao:
        'Medida em mAh. Quanto maior a capacidade, maior pode ser o tempo de uso longe da tomada. A duração também depende de outros fatores.'
    },

    processador: {
      titulo: 'Processador',
      explicacao:
        'É responsável por executar as tarefas do celular, desde abrir aplicativos até realizar atividades mais exigentes.'
    },

    camera: {
      titulo: 'Qualidade das Câmeras',
      explicacao:
        'A qualidade das fotos e dos vídeos depende de diversos fatores, não apenas da quantidade de megapixels.'
    }
  };


  termoExibido: {
    titulo: string;
    explicacao: string;
  } | null = null;


  // Carrossel da página.
  homeCarosel: CarouselSlide[] = [
    {
      image: '/img/projeto/celulares.jpg',
      title: 'Aprenda a escolher qual o melhor aparelho'
    },
    {
      image: '/img/projeto/familia-unida.jpg',
      title: 'O celular perfeito para todos os membros da família'
    },
    {
      image: '/img/projeto/hardware_smartphone.jpg',
      title: 'Venha aprender sobre as peças de um celular'
    }
  ];


  // --------------------------------------------------
  // VALIDAÇÕES DA COMPARAÇÃO
  // --------------------------------------------------

  get quantidadeFiltrosSelecionados(): number {
    return this.filtrosSelecionados.length;
  }


  get possuiFiltrosSelecionados(): boolean {
    return this.filtrosSelecionados.length > 0;
  }


  get quantidadeCelularesValida(): boolean {
    return (
      this.listaComparacao.length >= 2 &&
      this.listaComparacao.length <= 3
    );
  }


  // O preço somente é obrigatório quando selecionado.
  get precosDaComparacaoValidos(): boolean {

    if (!this.filtroAtivo('precoBaixo')) {
      return true;
    }

    return (
      this.listaComparacao.length > 0 &&
      this.listaComparacao.every(celular =>
        this.precoValido(celular.precoLoja)
      )
    );
  }


  get podeSolicitarComparacaoFacilito(): boolean {

    return (
      !this.facilitoCarregando &&
      this.possuiFiltrosSelecionados &&
      this.quantidadeCelularesValida &&
      this.precosDaComparacaoValidos
    );
  }


  // Informações ausentes somente nos critérios escolhidos.
  get informacoesSelecionadasIncompletas(): {
    celular: string;
    informacoes: string[];
  }[] {

    return this.listaComparacao
      .map(celular => {

        const informacoes: string[] = [];

        for (const filtro of this.filtrosSelecionados) {

          if (filtro === 'precoBaixo') {

            if (!this.precoValido(celular.precoLoja)) {
              informacoes.push('Preço');
            }

            continue;
          }

          const campo = this.obterCampoDoFiltro(filtro);

          if (
            campo &&
            !this.temInformacao(celular.specs[campo])
          ) {
            informacoes.push(
              this.obterNomeDoFiltro(filtro)
            );
          }
        }

        return {
          celular: celular.nome,
          informacoes
        };
      })
      .filter(item => item.informacoes.length > 0);
  }


  // --------------------------------------------------
  // CONTROLE DO RESULTADO
  // --------------------------------------------------

  invalidarResultadoFacilito(): void {

    this.versaoComparacao++;

    this.resultadoFacilito = null;
    this.erroFacilito = '';
    this.facilitoCarregando = false;
  }


  ngOnInit(): void {
    this.carregarCelulares();
  }


  // --------------------------------------------------
  // CARREGAMENTO DO CATÁLOGO
  // --------------------------------------------------

  async carregarCelulares(): Promise<void> {

    try {

      const resposta = await fetch('/data/celulares.json');

      if (!resposta.ok) {
        throw new Error(
          'Não foi possível carregar o catálogo de celulares.'
        );
      }

      const celulares: Celular[] = await resposta.json();

      this.listaCelulares = celulares.map(celular =>
        this.prepararCelular(celular)
      );

    } catch (erro) {

      console.error(
        'Erro ao carregar a lista de celulares:',
        erro
      );

      this.listaCelulares = [];
    }
  }


  private prepararCelular(celular: Celular): Celular {

    const preparado: Celular = {
      ...celular,

      origem: celular.origem ?? 'local',

      precoLoja: this.normalizarPreco(
        celular.precoLoja
      ),

      specs: {
        armazenamento: celular.specs?.armazenamento ?? '',
        ram: celular.specs?.ram ?? '',
        bateria: celular.specs?.bateria ?? '',
        processador: celular.specs?.processador ?? '',
        gpu: celular.specs?.gpu ?? '',
        qualidadeImagem: celular.specs?.qualidadeImagem ?? '',
        camera: celular.specs?.camera ?? '',
        imagem: celular.specs?.imagem
      }
    };

    this.atualizarIndicadoresInformacao(preparado);

    return preparado;
  }


  // --------------------------------------------------
  // VERIFICAÇÃO DE INFORMAÇÕES
  // --------------------------------------------------

  private temInformacao(valor?: string | null): boolean {

    if (typeof valor !== 'string') {
      return false;
    }

    const texto = valor.trim().toLowerCase();

    if (!texto) {
      return false;
    }

    const valoresAusentes = [
      'não informado',
      'nao informado',
      'não disponível',
      'nao disponivel',
      'indisponível',
      'indisponivel',
      'desconhecido',
      'sem informação',
      'sem informacao',
      'n/a',
      'null',
      'undefined',
      '-'
    ];

    return !valoresAusentes.some(
      ausente =>
        texto === ausente ||
        texto.startsWith(`${ausente} pela api`)
    );
  }


  private atualizarIndicadoresInformacao(
    celular: Celular
  ): void {

    const specs = celular.specs;
    const informacoes: string[] = [];

    if (!this.temInformacao(specs.ram)) {
      informacoes.push('Memória RAM');
    }

    if (!this.temInformacao(specs.armazenamento)) {
      informacoes.push('Armazenamento');
    }

    if (!this.temInformacao(specs.bateria)) {
      informacoes.push('Bateria');
    }

    if (!this.temInformacao(specs.processador)) {
      informacoes.push('Processador');
    }

    if (!this.temInformacao(specs.gpu)) {
      informacoes.push('Placa de vídeo');
    }

    if (!this.temInformacao(specs.qualidadeImagem)) {
      informacoes.push('Qualidade de imagem');
    }

    if (!this.temInformacao(specs.camera)) {
      informacoes.push('Câmeras');
    }

    if (
      this.filtroAtivo('precoBaixo') &&
      !this.precoValido(celular.precoLoja)
    ) {
      informacoes.push('Preço');
    }

    celular.informacoesIncompletas = informacoes;

    // Indicadores utilizados pelo HTML.
    celular.processadorSemDados =
      !this.temInformacao(specs.processador);

    celular.gpuSemDados =
      !this.temInformacao(specs.gpu);

    celular.cameraSemDados =
      !this.temInformacao(specs.camera);

    celular.qualidadeImagemSemDados =
      !this.temInformacao(specs.qualidadeImagem);

    // Não classificamos dados parciais como baixa qualidade.
    celular.processadorParcial = false;
    celular.gpuParcial = false;
    celular.qualidadeImagemParcial = false;
  }


  private precoValido(
    valor: number | null | undefined
  ): boolean {

    return (
      typeof valor === 'number' &&
      Number.isFinite(valor) &&
      valor > 0
    );
  }


  private normalizarPreco(
    valor: number | null | undefined
  ): number | null {

    return this.precoValido(valor)
      ? valor!
      : null;
  }


  // --------------------------------------------------
  // BUSCA DE CELULARES
  // --------------------------------------------------

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
      this.erroBuscaApi =
        'Digite pelo menos 2 caracteres para pesquisar.';
      return;
    }

    this.celularSelecionado = null;
    this.resultadosApi = [];
    this.erroBuscaApi = '';
    this.mensagemBuscaApi = '';
    this.buscaApiRealizada = false;
    this.buscandoApi = true;

    this.celularesApi.buscarPorNome(nome).subscribe({

      next: resposta => {

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
            celular =>
              this.normalizarNome(celular.nome) === nomeApi
          );
        });

        this.buscandoApi = false;
        this.buscaApiRealizada = true;

        if (encontrados.length === 0) {

          this.mensagemBuscaApi =
            'Nenhum celular encontrado para essa pesquisa.';

        } else if (this.resultadosApi.length === 0) {

          this.mensagemBuscaApi =
            'Os modelos encontrados já estão no catálogo local.';
        }
      },

      error: erro => {

        console.error(
          'Erro ao pesquisar celulares na API:',
          erro
        );

        this.resultadosApi = [];
        this.mensagemBuscaApi = '';
        this.buscandoApi = false;
        this.buscaApiRealizada = true;

        this.erroBuscaApi =
          erro.error?.error ||
          'Não foi possível pesquisar os celulares.';

        const correspondencia = this.erroBuscaApi.match(
          /Aguarde\s+(\d+(?:[.,]\d+)?)\s+segundos?/i
        );

        if (correspondencia) {
          this.iniciarContagemRegressiva(
            Math.ceil(
              Number(
                correspondencia[1].replace(',', '.')
              )
            )
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

    if (!marca) {
      return nome;
    }

    if (
      this.normalizarNome(nome).startsWith(
        this.normalizarNome(marca)
      )
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


  // --------------------------------------------------
  // SELEÇÃO DE RESULTADOS DA API
  // --------------------------------------------------

  selecionarResultadoApi(
    dispositivo: DispositivoApi
  ): void {

    if (this.listaComparacao.length >= 3) {
      alert(
        'Você já atingiu o limite de 3 celulares para comparar.'
      );
      return;
    }

    const idLocal = 1_000_000 + dispositivo.id;

    if (
      this.listaComparacao.some(
        celular => celular.id === idLocal
      )
    ) {
      alert(
        'Este celular já está na sua lista de comparação.'
      );
      return;
    }

    this.buscandoDetalhesApi = true;
    this.erroBuscaApi = '';
    this.mensagemBuscaApi = '';

    this.celularesApi.buscarDetalhes(dispositivo.id).subscribe({

      next: detalhes => {

        const celular = this.converterDispositivoApi(detalhes);

        this.celularSelecionado = celular;
        this.termoBusca = celular.nome;
        this.resultadosApi = [];

        this.mensagemBuscaApi =
          'Celular selecionado. Clique em Adicionar para incluí-lo na comparação.';

        this.buscandoDetalhesApi = false;
      },

      error: erro => {

        console.error(
          'Erro ao buscar detalhes do celular:',
          erro
        );

        this.erroBuscaApi =
          erro.error?.error ||
          'Não foi possível carregar os detalhes desse celular.';

        this.buscandoDetalhesApi = false;
      }
    });
  }


  private converterDispositivoApi(
    d: DispositivoDetalhado
  ): Celular {

    const capacidadeRam = this.obterRamGb(d);
    const capacidadeArmazenamento =
      this.obterArmazenamentoGb(d);

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
      .filter(
        (valor): valor is string => Boolean(valor?.trim())
      )
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
      d.main_camera?.modules
        ? `Traseira: ${d.main_camera.modules}`
        : '',

      d.selfie_camera?.modules
        ? `Frontal: ${d.selfie_camera.modules}`
        : ''
    ]
      .filter(Boolean)
      .join(' | ') ||

      'Não informado pela API';


    const celular: Celular = {

      id: 1_000_000 + d.id,
      nome: this.nomeCompletoApi(d),
      precoLoja: null,
      origem: 'api',

      imagem:
        d.image_url || '/img/projeto/celulares.jpg',

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
      }
    };

    return this.prepararCelular(celular);
  }


  private obterRamGb(
    d: DispositivoDetalhado
  ): number | null {

    const memoria = d.memory?.internal || '';

    const textoRam =
      memoria.match(/RAM\s*:\s*(.+)$/i)?.[1] ||

      memoria.match(
        /(\d+(?:[.,]\d+)?\s*(?:GB|MB|TB))\s*RAM/i
      )?.[1] ||

      d.hardware?.match(
        /((?:\d+(?:[.,]\d+)?\s*(?:GB|MB|TB)\s*)+)RAM/i
      )?.[1] ||

      '';

    const capacidades =
      this.lerCapacidadesGb(textoRam);

    return capacidades.length
      ? Math.min(...capacidades)
      : null;
  }


  private obterArmazenamentoGb(
    d: DispositivoDetalhado
  ): number | null {

    const opcoes =
      this.lerCapacidadesGb(d.storage || '');

    if (opcoes.length) {
      return Math.min(...opcoes);
    }

    const memoria = d.memory?.internal || '';
    const antesDaRam = memoria.split(/\bRAM\b/i)[0];

    const capacidades =
      this.lerCapacidadesGb(antesDaRam);

    if (
      capacidades.length > 1 &&
      /\bRAM\b/i.test(memoria) &&
      !/RAM\s*:/i.test(memoria)
    ) {

      const valoresOriginais =
        this.lerCapacidadesGbNaOrdem(antesDaRam);

      valoresOriginais.pop();

      return valoresOriginais.length
        ? Math.min(...valoresOriginais)
        : null;
    }

    return capacidades.length
      ? Math.min(...capacidades)
      : null;
  }


  private lerCapacidadesGb(texto: string): number[] {

    return [
      ...new Set(
        this.lerCapacidadesGbNaOrdem(texto)
      )
    ].sort((a, b) => a - b);
  }


  private lerCapacidadesGbNaOrdem(
    texto: string
  ): number[] {

    const capacidades: number[] = [];

    const regex = /(\d+(?:[.,]\d+)?)\s*(TB|GB|MB)/gi;

    for (const resultado of texto.matchAll(regex)) {

      let valor = Number(
        resultado[1].replace(',', '.')
      );

      const unidade = resultado[2].toUpperCase();

      if (unidade === 'TB') {
        valor *= 1024;
      }

      if (unidade === 'MB') {
        valor /= 1024;
      }

      if (Number.isFinite(valor) && valor > 0) {
        capacidades.push(
          Number(valor.toFixed(2))
        );
      }
    }

    return capacidades;
  }


  // --------------------------------------------------
  // INFORMAÇÕES DA CLASSIFICAÇÃO
  // --------------------------------------------------

  obterPosicaoFacilito(
    celularId: number
  ): number | null {

    if (this.resultadoFacilito?.status !== 'concluida') {
      return null;
    }

    const resultado =
      this.resultadoFacilito.classificacao.find(
        item => item.celularId === celularId
      );

    return resultado?.posicao ?? null;
  }


  celularEstaEmpatado(celularId: number): boolean {

    if (this.resultadoFacilito?.status !== 'concluida') {
      return false;
    }

    const posicao =
      this.obterPosicaoFacilito(celularId);

    if (posicao === null) {
      return false;
    }

    return (
      this.resultadoFacilito.classificacao.filter(
        item => item.posicao === posicao
      ).length > 1
    );
  }


  obterJustificativaFacilito(
    celularId: number
  ): string {

    if (this.resultadoFacilito?.status !== 'concluida') {
      return '';
    }

    return (
      this.resultadoFacilito.classificacao.find(
        item => item.celularId === celularId
      )?.justificativa ?? ''
    );
  }


  obterNomeCelular(celularId: number): string {

    const celular = this.listaComparacao.find(
      item => item.id === celularId
    );

    return celular?.nome ?? 'Celular não identificado';
  }


  // --------------------------------------------------
  // EDIÇÃO DE INFORMAÇÕES
  // --------------------------------------------------

  atualizarSpec(
    celular: Celular,
    chave: keyof Specs,
    novoValor: string | number
  ): void {

    this.invalidarResultadoFacilito();

    celular.specs[chave] = String(novoValor);

    this.atualizarIndicadoresInformacao(celular);
  }


  atualizarPrecoLoja(
    celular: Celular,
    valor: number | null
  ): void {

    this.invalidarResultadoFacilito();

    celular.precoLoja = this.normalizarPreco(valor);

    this.atualizarIndicadoresInformacao(celular);
  }


  // --------------------------------------------------
  // SUGESTÕES E ADIÇÃO DE CELULARES
  // --------------------------------------------------

  get sugestoesBusca(): Celular[] {

    if (!this.termoBusca.trim()) {
      return [];
    }

    const termo = this.termoBusca.toLowerCase();

    return this.listaCelulares.filter(celular =>
      celular.nome.toLowerCase().includes(termo)
    );
  }


  selecionarSugestao(celular: Celular): void {

    this.termoBusca = celular.nome;

    this.celularSelecionado =
      this.prepararCelular(
        structuredClone(celular)
      );

    this.resultadosApi = [];
    this.erroBuscaApi = '';

    this.mensagemBuscaApi =
      'Celular selecionado. Clique em Adicionar para incluí-lo na comparação.';

    this.buscaApiRealizada = false;
  }


  adicionarAComparacao(): void {

    if (!this.celularSelecionado) {
      alert(
        'Por favor, selecione um celular da lista de sugestões.'
      );
      return;
    }

    if (this.listaComparacao.length >= 3) {
      alert(
        'Você já atingiu o limite de 3 celulares para comparar.'
      );
      return;
    }

    const jaExiste = this.listaComparacao.some(
      celular =>
        celular.id === this.celularSelecionado?.id
    );

    if (jaExiste) {
      alert(
        'Este celular já está na sua lista de comparação.'
      );
      return;
    }

    const novoCelular = this.prepararCelular(
      structuredClone(this.celularSelecionado)
    );

    this.listaComparacao.push(novoCelular);

    this.invalidarResultadoFacilito();

    this.termoBusca = '';
    this.celularSelecionado = null;
    this.mensagemBuscaApi = '';
    this.erroBuscaApi = '';
    this.resultadosApi = [];
    this.buscaApiRealizada = false;
  }


  removerDaComparacao(index: number): void {

    if (
      index < 0 ||
      index >= this.listaComparacao.length
    ) {
      return;
    }

    this.listaComparacao.splice(index, 1);

    this.invalidarResultadoFacilito();

    this.listaComparacao.forEach(celular =>
      this.atualizarIndicadoresInformacao(celular)
    );
  }


  irParaCelular(index: number): void {

    if (!this.listaComparacao[index]) {
      alert(
        `O slot ${index + 1} ainda está vazio! Adicione um celular primeiro.`
      );
      return;
    }

    const elemento = document.getElementById(
      `card-celular-${index}`
    );

    elemento?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start'
    });
  }


  // --------------------------------------------------
  // FILTROS
  // --------------------------------------------------

  toggleFiltro(key: string): void {

    const filtroExiste = this.filtros.some(
      filtro => filtro.key === key
    );

    if (!filtroExiste) {
      return;
    }

    const index =
      this.filtrosSelecionados.indexOf(key);

    if (index > -1) {
      this.filtrosSelecionados.splice(index, 1);
    } else {
      this.filtrosSelecionados.push(key);
    }

    this.invalidarResultadoFacilito();

    this.listaComparacao.forEach(celular =>
      this.atualizarIndicadoresInformacao(celular)
    );
  }


  filtroAtivo(key: string): boolean {
    return this.filtrosSelecionados.includes(key);
  }


  private obterCampoDoFiltro(
    filtro: string
  ): CampoEspecificacao | null {

    const campos: Record<string, CampoEspecificacao> = {

      naoTravar: 'ram',

      muitoEspaco: 'armazenamento',

      placaVideo: 'gpu',

      qualidadeImagem: 'qualidadeImagem',

      boaBateria: 'bateria',

      processadorCPU: 'processador',

      melhorCamera: 'camera'
    };

    return campos[filtro] ?? null;
  }


  private obterNomeDoFiltro(filtro: string): string {

    return this.filtros.find(
      item => item.key === filtro
    )?.label ?? filtro;
  }


  // --------------------------------------------------
  // MONTAGEM DO PEDIDO PARA O FACILITO.AI
  // --------------------------------------------------

  private montarEspecificacoesSelecionadas(
    celular: Celular
  ): Partial<Record<CampoEspecificacao, string>> {

    const especificacoes:
      Partial<Record<CampoEspecificacao, string>> = {};

    for (const filtro of this.filtrosSelecionados) {

      const campo = this.obterCampoDoFiltro(filtro);

      if (!campo) {
        continue;
      }

      especificacoes[campo] =
        celular.specs[campo] ?? '';
    }

    return especificacoes;
  }


  private montarPedidoFacilito(): PedidoFacilito {

    return {

      filtros: this.filtros
        .filter(filtro =>
          this.filtroAtivo(filtro.key)
        )
        .map(filtro => ({
          key: filtro.key,
          label: filtro.label
        })),

      celulares: this.listaComparacao.map(celular => ({

        id: celular.id,
        nome: celular.nome,
        origem: celular.origem ?? 'local',

        precoLoja: this.filtroAtivo('precoBaixo')
          ? celular.precoLoja ?? null
          : null,

        especificacoes:
          this.montarEspecificacoesSelecionadas(celular)

      }))
    };
  }


  // --------------------------------------------------
  // COMPARAÇÃO COM O FACILITO.AI
  // --------------------------------------------------

  async analisarComFacilito(): Promise<void> {

    if (this.facilitoCarregando) {
      return;
    }

    if (!this.possuiFiltrosSelecionados) {
      this.erroFacilito =
        'Selecione pelo menos uma preferência para continuar.';
      return;
    }

    if (this.listaComparacao.length < 2) {
      this.erroFacilito =
        'Adicione pelo menos dois celulares para comparar.';
      return;
    }

    if (this.listaComparacao.length > 3) {
      this.erroFacilito =
        'Você pode comparar no máximo três celulares por vez.';
      return;
    }

    // Preço é obrigatório somente quando selecionado.
    if (!this.precosDaComparacaoValidos) {
      this.erroFacilito =
        'Informe um preço válido para todos os celulares, pois você selecionou a preferência Preço baixo.';
      return;
    }


    // Invalida qualquer resultado anterior.
    this.invalidarResultadoFacilito();

    const versaoSolicitacao =
      this.versaoComparacao;

    this.facilitoCarregando = true;
    this.erroFacilito = '';


    const pedido = this.montarPedidoFacilito();


    try {

      const resultado = await firstValueFrom(
        this.facilitoService.comparar(pedido)
      );


      // Não aceita uma resposta de uma comparação antiga.
      if (
        versaoSolicitacao !== this.versaoComparacao
      ) {
        return;
      }


      if (
        !resultado ||
        typeof resultado.resumo !== 'string' ||
        !Array.isArray(resultado.classificacao) ||
        !Array.isArray(resultado.observacoes) ||
        !Array.isArray(resultado.fontes)
      ) {
        throw new Error(
          'O resultado recebido não possui o formato esperado.'
        );
      }


      // Resultado inconclusivo não pode ser salvo.
      if (resultado.status === 'inconclusiva') {
        this.resultadoFacilito = resultado;
        return;
      }


      if (resultado.status !== 'concluida') {
        throw new Error(
          'Não foi possível confirmar a conclusão da avaliação.'
        );
      }


      const idsSelecionados =
        this.listaComparacao.map(
          celular => celular.id
        );

      const classificacao =
        resultado.classificacao;

      const idsRecebidos = classificacao.map(
        item => item.celularId
      );

      const idsUnicos =
        new Set(idsRecebidos).size ===
        idsRecebidos.length;

      const todosOsAparelhosIncluidos =
        idsSelecionados.length === classificacao.length &&
        idsSelecionados.every(
          id => idsRecebidos.includes(id)
        );


      // Posições iguais são permitidas para empates.
      const posicoesValidas =
        classificacao.every(item =>

          idsSelecionados.includes(item.celularId) &&

          Number.isInteger(item.posicao) &&

          item.posicao >= 1 &&

          item.posicao <= this.listaComparacao.length &&

          typeof item.justificativa === 'string' &&

          item.justificativa.trim().length > 0
        );


      if (
        !idsUnicos ||
        !todosOsAparelhosIncluidos ||
        !posicoesValidas
      ) {
        throw new Error(
          'Não foi possível validar a classificação recebida.'
        );
      }


      this.resultadoFacilito = resultado;

    } catch (erro: unknown) {

      if (
        versaoSolicitacao !== this.versaoComparacao
      ) {
        return;
      }

      const erroHttp = erro as {
        error?: {
          error?: unknown;
          message?: unknown;
        };
        message?: unknown;
      };

      const mensagemServidor =
        typeof erroHttp.error?.error === 'string'
          ? erroHttp.error.error

          : typeof erroHttp.error?.message === 'string'
            ? erroHttp.error.message

            : typeof erroHttp.message === 'string'
              ? erroHttp.message
              : '';

      this.erroFacilito =
        mensagemServidor ||
        'Não consegui concluir a comparação. Tente novamente.';

    } finally {

      if (
        versaoSolicitacao === this.versaoComparacao
      ) {
        this.facilitoCarregando = false;
      }
    }
  }


  // --------------------------------------------------
  // SALVAMENTO DAS COMPARAÇÕES
  // --------------------------------------------------

  salvarComparacao(): void {

    if (!this.quantidadeCelularesValida) {
      alert(
        'Adicione dois ou três celulares antes de salvar.'
      );
      return;
    }

    if (!this.possuiFiltrosSelecionados) {
      alert(
        'Selecione pelo menos uma preferência antes de salvar.'
      );
      return;
    }

    if (!this.precosDaComparacaoValidos) {
      alert(
        'Informe um preço válido para todos os celulares antes de salvar, pois a preferência Preço baixo foi selecionada.'
      );
      return;
    }

    if (this.resultadoFacilito?.status !== 'concluida') {
      alert(
        'Faça uma comparação concluída com o Facilito.AI antes de salvar.'
      );
      return;
    }

    if (!this.authService.usuarioLogado()) {
      this.exibirAvisoModal = true;
      return;
    }

    const usuario = this.authService.getUsuario();

    if (!usuario) {
      this.exibirAvisoModal = true;
      return;
    }


    const chave = `salvos_${usuario.id}`;

    let salvosAnteriores: any[] = [];


    try {

      const dadosSalvos =
        localStorage.getItem(chave);

      salvosAnteriores = dadosSalvos
        ? JSON.parse(dadosSalvos)
        : [];

      if (!Array.isArray(salvosAnteriores)) {
        salvosAnteriores = [];
      }

    } catch (erro) {

      console.error(
        'Erro ao ler as comparações salvas:',
        erro
      );

      alert(
        'Não foi possível acessar suas comparações salvas.'
      );

      return;
    }


    const novaComparacao = {

      id: Date.now(),

      data: new Date().toISOString(),

      celulares: structuredClone(
        this.listaComparacao
      ),

      filtros: this.filtros
        .filter(filtro =>
          this.filtroAtivo(filtro.key)
        )
        .map(filtro => filtro.label),

      resultadoFacilito: structuredClone(
        this.resultadoFacilito
      )
    };


    salvosAnteriores.push(novaComparacao);


    try {

      localStorage.setItem(
        chave,
        JSON.stringify(salvosAnteriores)
      );

      alert('Comparação salva com sucesso!');

    } catch (erro) {

      console.error(
        'Erro ao salvar a comparação:',
        erro
      );

      alert(
        'Não foi possível salvar a comparação. Tente novamente.'
      );
    }
  }


  // --------------------------------------------------
  // MODAL E DICIONÁRIO
  // --------------------------------------------------

  fecharModal(): void {
    this.exibirAvisoModal = false;
  }


  abrirDicionario(termoKey: string): void {

    if (!this.dicionarioTermos[termoKey]) {
      return;
    }

    this.termoExibido =
      this.dicionarioTermos[termoKey];

    const elemento =
      document.getElementById('infoFacil');

    elemento?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }


  fecharDicionario(): void {
    this.termoExibido = null;
  }

}
