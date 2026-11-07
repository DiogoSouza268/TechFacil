
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
  type EspecificacaoFacilito,
  type OrigemEspecificacaoFacilito,
  type DadoEspecificacaoFacilito
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
  cameraParcial?: boolean;
  cameraSemDados?: boolean;

  informacoesIncompletas?: string[];

  origemEspecificacoes?: Record<
    CampoEspecificacao,
    OrigemEspecificacaoFacilito
  >;
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

  // Impede que uma resposta antiga substitua uma comparação atualizada.
  private versaoComparacao = 0;

  // Controle da busca externa.
  resultadosApi: DispositivoApi[] = [];

  buscandoApi = false;
  buscandoDetalhesApi = false;

  erroBuscaApi = '';
  tempoEsperaApi = 0;
  mensagemBuscaApi = '';
  buscaApiRealizada = false;

  /*
   * Compatibilidade temporária com o home.html anterior.
   * A comparação não utiliza filtros nem preço.
   * Remova estes elementos quando atualizar o HTML.
   */
  filtros: {
    key: string;
    label: string;
    icone: string;
  }[] = [];

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
        'A capacidade é medida em mAh. Esse número permite comparar a quantidade de carga que a bateria armazena, mas não garante sozinho quanto tempo o celular ficará ligado.'
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

  get quantidadeCelularesValida(): boolean {
    return (
      this.listaComparacao.length >= 2 &&
      this.listaComparacao.length <= 3
    );
  }

  get podeSolicitarComparacaoFacilito(): boolean {
    return (
      !this.facilitoCarregando &&
      this.quantidadeCelularesValida
    );
  }

  /*
   * Compatibilidade temporária com o HTML antigo.
   * Não há seleção de filtros na comparação atual.
   */
  get quantidadeFiltrosSelecionados(): number {
    return 0;
  }

  get possuiFiltrosSelecionados(): boolean {
    return true;
  }

  get precosDaComparacaoValidos(): boolean {
    return true;
  }

  get informacoesSelecionadasIncompletas(): {
    celular: string;
    informacoes: string[];
  }[] {
    return [];
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

    const campos: CampoEspecificacao[] = [
      'ram',
      'armazenamento',
      'gpu',
      'qualidadeImagem',
      'bateria',
      'processador',
      'camera'
    ];

    const origens = {} as Record<
      CampoEspecificacao,
      OrigemEspecificacaoFacilito
    >;

    for (const campo of campos) {
      const origemAnterior =
        celular.origemEspecificacoes?.[campo];

      // Preserva a origem registrada, inclusive correções manuais.
      if (origemAnterior) {
        origens[campo] = origemAnterior;
        continue;
      }

      if (!this.temInformacao(preparado.specs[campo])) {
        origens[campo] = 'indisponivel';
        continue;
      }

      origens[campo] =
        preparado.origem === 'api'
          ? 'mobileapi'
          : 'catalogo';
    }

    preparado.origemEspecificacoes = origens;

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

  /*
   * Uma informação pode existir sem ser suficiente para uma
   * avaliação completa. Estes métodos identificam alguns casos
   * conhecidos sem atribuir qualidade ou nota ao aparelho.
   */

  private cameraTemApenasMegapixels(valor: string): boolean {
    const texto = valor.trim();

    if (!texto) {
      return false;
    }

    const possuiMegapixels = /\b\d+(?:[.,]\d+)?\s*MP\b/i.test(texto);

    if (!possuiMegapixels) {
      return false;
    }

    const termosAdicionais = [
      'OIS',
      'EIS',
      'estabilização',
      'estabilizacao',
      'abertura',
      'sensor',
      'ultrawide',
      'ultra-wide',
      'telefoto',
      'macro',
      'zoom',
      'HDR',
      'vídeo',
      'video'
    ];

    const possuiInformacaoAdicional = termosAdicionais.some(
      termo => texto.toLowerCase().includes(termo.toLowerCase())
    );

    return !possuiInformacaoAdicional;
  }

  private telaPossuiInformacaoParcial(valor: string): boolean {
    const texto = valor.trim();

    if (!texto) {
      return false;
    }

    const possuiPainel =
      /\b(amoled|oled|p-oled|ips|lcd|tft)\b/i.test(texto);

    const possuiResolucao =
      /\b(hd\+|hd|full\s*hd\+?|fhd\+?|qhd\+?|2k|4k|\d{3,4}\s*[x×]\s*\d{3,4})\b/i.test(texto);

    const possuiFrequencia =
      /\b\d{2,3}\s*hz\b/i.test(texto);

    // Informação parcial quando existe dado, mas falta algum
    // dos três elementos principais para caracterizar a tela.
    return !(
      possuiPainel &&
      possuiResolucao &&
      possuiFrequencia
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

    celular.informacoesIncompletas = informacoes;

    celular.processadorSemDados =
      !this.temInformacao(specs.processador);

    celular.gpuSemDados =
      !this.temInformacao(specs.gpu);

    celular.cameraSemDados =
      !this.temInformacao(specs.camera);

    celular.qualidadeImagemSemDados =
      !this.temInformacao(specs.qualidadeImagem);

    celular.cameraParcial =
      this.temInformacao(specs.camera) &&
      this.cameraTemApenasMegapixels(specs.camera);

    celular.qualidadeImagemParcial =
      this.temInformacao(specs.qualidadeImagem) &&
      this.telaPossuiInformacaoParcial(specs.qualidadeImagem);

    // A presença do nome do processador ou da GPU não significa,
    // por si só, que o dado seja incompleto.
    celular.processadorParcial = false;
    celular.gpuParcial = false;
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

    const campos: CampoEspecificacao[] = [
      'ram',
      'armazenamento',
      'gpu',
      'qualidadeImagem',
      'bateria',
      'processador',
      'camera'
    ];

    if (campos.includes(chave as CampoEspecificacao)) {
      celular.origemEspecificacoes ??= {} as Record<
        CampoEspecificacao,
        OrigemEspecificacaoFacilito
      >;

      celular.origemEspecificacoes[
        chave as CampoEspecificacao
      ] = 'usuario';
    }

    this.atualizarIndicadoresInformacao(celular);
  }

  /*
   * Compatibilidade temporária com o HTML anterior.
   * O preço não participa do pedido enviado ao Facilito.
   */
  atualizarPrecoLoja(
    celular: Celular,
    valor: number | null
  ): void {
    celular.precoLoja = this.normalizarPreco(valor);
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
  // COMPATIBILIDADE COM O HTML ANTERIOR
  // --------------------------------------------------

  toggleFiltro(_key: string): void {
    // A comparação atual não utiliza filtros.
  }

  filtroAtivo(_key: string): boolean {
    return false;
  }

  private obterCampoDoFiltro(
    _filtro: string
  ): CampoEspecificacao | null {
    return null;
  }

  private obterNomeDoFiltro(filtro: string): string {
    return filtro;
  }

  // --------------------------------------------------
  // MONTAGEM DO PEDIDO PARA O FACILITO.AI
  // --------------------------------------------------

  private montarEspecificacoesFacilito(
    celular: Celular
  ): Record<CampoEspecificacao, DadoEspecificacaoFacilito> {
    const campos: CampoEspecificacao[] = [
      'ram',
      'armazenamento',
      'gpu',
      'qualidadeImagem',
      'bateria',
      'processador',
      'camera'
    ];

    const especificacoes = {} as Record<
      CampoEspecificacao,
      DadoEspecificacaoFacilito
    >;

    for (const campo of campos) {
      const valor = celular.specs[campo] ?? '';

      const origemRegistrada =
        celular.origemEspecificacoes?.[campo];

      const fonte: OrigemEspecificacaoFacilito =
        origemRegistrada ??
        (
          !this.temInformacao(valor)
            ? 'indisponivel'
            : celular.origem === 'api'
              ? 'mobileapi'
              : 'catalogo'
        );

      especificacoes[campo] = {
        valor,
        fonte
      };
    }

    return especificacoes;
  }

  private montarPedidoFacilito(): PedidoFacilito {
    return {
      celulares: this.listaComparacao.map(celular => ({
        id: celular.id,
        especificacoes:
          this.montarEspecificacoesFacilito(celular)
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

      // Ignora respostas de comparações que já foram alteradas.
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
