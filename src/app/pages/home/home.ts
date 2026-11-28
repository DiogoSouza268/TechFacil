import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
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
  tela: string;
  camera: string;
  imagem?: string;
}

export interface DetalheTecnico {
  rotulo: string;
  valor: string;
}

export interface DetalhesTecnicos {
  tela?: DetalheTecnico[];
  camera?: DetalheTecnico[];
  processador?: DetalheTecnico[];
  bateria?: DetalheTecnico[];
}

interface LinkLojaPesquisa {
  nome: string;
  url: string;
}

export interface VersaoCelular {
  armazenamento: string;
  ram: string;
}

export interface Celular {
  id: number;
  nome: string;
  versoes?: VersaoCelular[];
  precoLoja?: number | null;
  imagem: string;
  specs: Specs;
  detalhesTecnicos?: DetalhesTecnicos;
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
    RouterLink,
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
export class Home implements OnInit, OnDestroy {
  authService = inject(Auth);
  private facilitoService = inject(FacilitoService);

  // Controle da interface.
  exibirAvisoModal = false;

  listaCelulares: Celular[] = [];
  listaComparacao: Celular[] = [];

  termoBusca = '';
  celularSelecionado: Celular | null = null;
  mensagemBusca = '';

  // Resultado do Facilito.AI.
  resultadoFacilito: ResultadoFacilito | null = null;

  facilitoCarregando = false;
  erroFacilito = '';
  mensagemFacilitoAtual = '';

  private intervaloMensagensFacilito: ReturnType<typeof setInterval> | null = null;
  private indiceMensagemFacilito = 0;

  private readonly mensagensFacilito: string[] = [
    'Gostei das suas escolhas! 😊',
    'Você é nota 10 por pesquisar antes de escolher!',
    'Vamos analisar cada detalhe juntos!',
    'Estou comparando os aparelhos com atenção!',
    'Cada detalhe conta para fazer uma boa escolha!',
    'Já estou organizando as informações para você!'
  ];

  // Impede que uma resposta antiga substitua uma comparação atualizada.
  private versaoComparacao = 0;

  // Guarda a última combinação de celulares que recebeu uma resposta válida.
  private assinaturaUltimaComparacao: string | null = null;

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
    tela: {
      titulo: 'Tela',
      explicacao:
        'Aqui você encontra informações sobre a tela do celular: tamanho, tipo de painel, resolução, frequência de atualização, brilho máximo e proteção. Esses detalhes ajudam a entender a nitidez, a fluidez e a visibilidade no sol.'
    },
    bateria: {
      titulo: 'Bateria',
      explicacao:
        'Indica a capacidade de energia em mAh e a velocidade de carregamento em watts (W). Quanto maior a capacidade e a potência de recarga, mais prático tende a ser o uso no dia a dia.'
    },
    processador: {
      titulo: 'Processador',
      explicacao:
        'É o cérebro do celular. Ele executa os aplicativos, jogos e tarefas do sistema com maior ou menor rapidez.'
    },
    camera: {
      titulo: 'Câmeras',
      explicacao:
        'Mostra as lentes traseiras e frontal do aparelho. Recursos como estabilização (OIS) e abertura maior ajudam a tirar fotos mais nítidas, inclusive à noite.'
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
  // VERSÕES DE ARMAZENAMENTO E RAM
  // --------------------------------------------------

  opcoesArmazenamento(celular: Celular): string[] {
    return [
      ...new Set((celular.versoes ?? []).map(versao => versao.armazenamento))
    ];
  }

  opcoesRam(celular: Celular): string[] {
    return [
      ...new Set((celular.versoes ?? []).map(versao => versao.ram))
    ];
  }

  private aplicarVersaoCelular(
    celular: Celular,
    versao: VersaoCelular
  ): void {
    if (celular.specs.armazenamento !== versao.armazenamento) {
      this.atualizarSpec(celular, 'armazenamento', versao.armazenamento);
    }

    if (celular.specs.ram !== versao.ram) {
      this.atualizarSpec(celular, 'ram', versao.ram);
    }
  }

  selecionarArmazenamento(celular: Celular, armazenamento: string): void {
    const versoes = celular.versoes ?? [];

    const versao =
      versoes.find(
        item =>
          item.armazenamento === armazenamento &&
          item.ram === celular.specs.ram
      ) ?? versoes.find(item => item.armazenamento === armazenamento);

    if (!versao) return;

    this.aplicarVersaoCelular(celular, versao);
  }

  selecionarRam(celular: Celular, ram: string): void {
    const versoes = celular.versoes ?? [];

    const versao =
      versoes.find(
        item =>
          item.ram === ram &&
          item.armazenamento === celular.specs.armazenamento
      ) ?? versoes.find(item => item.ram === ram);

    if (!versao) return;

    this.aplicarVersaoCelular(celular, versao);
  }

  private incluirVersaoInicial(celular: Celular): VersaoCelular[] {
    const versoes = (celular.versoes ?? []).map(versao => ({
      armazenamento: versao.armazenamento.trim(),
      ram: versao.ram.trim()
    }));

    const armazenamento = celular.specs?.armazenamento?.trim() ?? '';
    const ram = celular.specs?.ram?.trim() ?? '';

    if (!armazenamento || !ram) {
      return versoes;
    }

    const jaExiste = versoes.some(
      versao =>
        versao.armazenamento === armazenamento && versao.ram === ram
    );

    if (!jaExiste) {
      versoes.unshift({ armazenamento, ram });
    }

    return versoes;
  }

  // --------------------------------------------------
  // VALIDAÇÕES DA COMPARAÇÃO
  // --------------------------------------------------

  get quantidadeCelularesValida(): boolean {
    return (
      this.listaComparacao.length >= 2 &&
      this.listaComparacao.length <= 3
    );
  }

  get comparacaoJaAnalisada(): boolean {
    return (
      this.assinaturaUltimaComparacao !== null &&
      this.assinaturaUltimaComparacao === this.obterAssinaturaComparacao()
    );
  }

  get podeSolicitarComparacaoFacilito(): boolean {
    return (
      !this.facilitoCarregando &&
      this.quantidadeCelularesValida &&
      !this.comparacaoJaAnalisada
    );
  }

  private obterAssinaturaComparacao(): string {
    return this.listaComparacao
      .map(celular => celular.id)
      .sort((a, b) => a - b)
      .join('|');
  }

  // --------------------------------------------------
  // CONTROLE DO RESULTADO
  // --------------------------------------------------

  invalidarResultadoFacilito(): void {
    this.pararMensagensFacilito();
    this.versaoComparacao++;
    this.resultadoFacilito = null;
    this.erroFacilito = '';
    this.facilitoCarregando = false;
  }

  private iniciarMensagensFacilito(): void {
    this.pararMensagensFacilito();

    this.indiceMensagemFacilito = 0;
    this.mensagemFacilitoAtual = this.mensagensFacilito[0];

    this.intervaloMensagensFacilito = setInterval(() => {
      this.indiceMensagemFacilito =
        (this.indiceMensagemFacilito + 1) % this.mensagensFacilito.length;

      this.mensagemFacilitoAtual =
        this.mensagensFacilito[this.indiceMensagemFacilito];
    }, 3000);
  }

  private pararMensagensFacilito(): void {
    if (this.intervaloMensagensFacilito !== null) {
      clearInterval(this.intervaloMensagensFacilito);
      this.intervaloMensagensFacilito = null;
    }

    this.mensagemFacilitoAtual = '';
    this.indiceMensagemFacilito = 0;
  }

  ngOnDestroy(): void {
    this.versaoComparacao++;
    this.pararMensagensFacilito();
  }

  ngOnInit(): void {
    this.carregarCelulares();
  }

  // --------------------------------------------------
  // CARREGAMENTO DO CATÁLOGO
  // --------------------------------------------------

  async carregarCelulares(): Promise<void> {
    try {
      const resposta = await fetch(`${environment.apiUrl}/celulares`);

      if (!resposta.ok) {
        throw new Error('Não foi possível carregar o catálogo de celulares.');
      }

      const celulares: Celular[] = await resposta.json();

      this.listaCelulares = celulares.map(celular =>
        this.prepararCelular(celular)
      );
    } catch (erro) {
      console.error('Erro ao carregar a lista de celulares:', erro);
      this.listaCelulares = [];
    }
  }

  private prepararCelular(celular: Celular): Celular {
    const preparado: Celular = {
      ...celular,
      versoes: this.incluirVersaoInicial(celular),
      detalhesTecnicos: celular.detalhesTecnicos ?? {},
      specs: {
        armazenamento: celular.specs?.armazenamento ?? '',
        ram: celular.specs?.ram ?? '',
        bateria: celular.specs?.bateria ?? '',
        processador: celular.specs?.processador ?? '',
        gpu: celular.specs?.gpu ?? '',
        tela: celular.specs?.tela ?? '',
        camera: celular.specs?.camera ?? '',
        imagem: celular.specs?.imagem
      }
    };

    const campos: CampoEspecificacao[] = [
      'ram',
      'armazenamento',
      'gpu',
      'tela',
      'bateria',
      'processador',
      'camera'
    ];

    const origens = {} as Record<
      CampoEspecificacao,
      OrigemEspecificacaoFacilito
    >;

    for (const campo of campos) {
      origens[campo] =
        celular.origemEspecificacoes?.[campo] ?? 'catalogo';
    }

    preparado.origemEspecificacoes = origens;

    return preparado;
  }

  montarLinksLojas(celular: Celular): LinkLojaPesquisa[] {
    const nome = celular.nome?.trim() ?? '';
    const armazenamento = celular.specs?.armazenamento?.trim() ?? '';
    const ramOriginal = celular.specs?.ram?.trim() ?? '';

    const ram = ramOriginal
      ? /\bram\b/i.test(ramOriginal)
        ? ramOriginal
        : `${ramOriginal} RAM`
      : '';

    const termoPesquisa = [nome, armazenamento, ram]
      .filter(valor => valor.length > 0)
      .join(' ')
      .trim();

    if (!termoPesquisa) {
      return [];
    }

    const pesquisaCodificada = encodeURIComponent(termoPesquisa);

    const pesquisaSlug = termoPesquisa
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return [
      {
        nome: 'Mercado Livre',
        url: `https://lista.mercadolivre.com.br/${pesquisaSlug}`
      },
      {
        nome: 'Shopee',
        url: `https://shopee.com.br/search?keyword=${pesquisaCodificada}`
      },
      {
        nome: 'Amazon',
        url: `https://www.amazon.com.br/s?k=${pesquisaCodificada}`
      },
      {
        nome: 'Magazine Luiza',
        url: `https://www.magazineluiza.com.br/busca/${pesquisaCodificada.replace(/%20/g, '+')}/`
      }
    ];
  }

  // --------------------------------------------------
  // BUSCA E ADIÇÃO DE CELULARES DO CATÁLOGO
  // --------------------------------------------------

  aoAlterarBusca(): void {
    const termoAtual = this.termoBusca.trim();

    if (
      this.celularSelecionado &&
      termoAtual !== this.celularSelecionado.nome
    ) {
      this.celularSelecionado = null;
    }

    this.mensagemBusca = '';
  }

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

    this.celularSelecionado = this.prepararCelular(
      structuredClone(celular)
    );

    this.mensagemBusca =
      'Celular selecionado. Clique em Adicionar para incluí-lo na comparação.';
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

    const jaExiste = this.listaComparacao.some(
      celular => celular.id === this.celularSelecionado?.id
    );

    if (jaExiste) {
      alert('Este celular já está na sua lista de comparação.');
      return;
    }

    const novoCelular = this.prepararCelular(
      structuredClone(this.celularSelecionado)
    );

    this.listaComparacao.push(novoCelular);
    this.invalidarResultadoFacilito();

    this.termoBusca = '';
    this.celularSelecionado = null;
    this.mensagemBusca = '';
  }

  removerDaComparacao(index: number): void {
    if (index < 0 || index >= this.listaComparacao.length) {
      return;
    }

    this.listaComparacao.splice(index, 1);
    this.invalidarResultadoFacilito();
  }

  irParaCelular(index: number): void {
    if (!this.listaComparacao[index]) {
      alert(`O slot ${index + 1} ainda está vazio! Adicione um celular primeiro.`);
      return;
    }

    const elemento = document.getElementById(`card-celular-${index}`);

    elemento?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start'
    });
  }

  // --------------------------------------------------
  // INFORMAÇÕES DA CLASSIFICAÇÃO
  // --------------------------------------------------

  obterPosicaoFacilito(celularId: number): number | null {
    if (this.resultadoFacilito?.status !== 'concluida') {
      return null;
    }

    const resultado = this.resultadoFacilito.classificacao.find(
      item => item.celularId === celularId
    );

    return resultado?.posicao ?? null;
  }

  celularEstaEmpatado(celularId: number): boolean {
    if (this.resultadoFacilito?.status !== 'concluida') {
      return false;
    }

    const posicao = this.obterPosicaoFacilito(celularId);

    if (posicao === null) {
      return false;
    }

    return (
      this.resultadoFacilito.classificacao.filter(
        item => item.posicao === posicao
      ).length > 1
    );
  }

  obterJustificativaFacilito(celularId: number): string {
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
  // EDIÇÃO DE VERSÃO / ESPECIFICAÇÕES
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
      'tela',
      'bateria',
      'processador',
      'camera'
    ];

    if (campos.includes(chave as CampoEspecificacao)) {
      celular.origemEspecificacoes ??= {} as Record<
        CampoEspecificacao,
        OrigemEspecificacaoFacilito
      >;

      celular.origemEspecificacoes[chave as CampoEspecificacao] = 'usuario';
    }
  }

  // --------------------------------------------------
  // MONTAGEM DO PEDIDO PARA O FACILITO.AI
  // --------------------------------------------------

  private montarTextoDetalhesFacilito(
    celular: Celular,
    campo: CampoEspecificacao
  ): string {
    switch (campo) {
      case 'tela':
        return (celular.detalhesTecnicos?.tela ?? [])
          .map(detalhe => `${detalhe.rotulo}: ${detalhe.valor}`)
          .join('; ');

      case 'processador':
        return (celular.detalhesTecnicos?.processador ?? [])
          .map(detalhe => `${detalhe.rotulo}: ${detalhe.valor}`)
          .join('; ');

      case 'bateria':
        return (celular.detalhesTecnicos?.bateria ?? [])
          .map(detalhe => `${detalhe.rotulo}: ${detalhe.valor}`)
          .join('; ');

      case 'camera':
        return (celular.detalhesTecnicos?.camera ?? [])
          .map(detalhe => `${detalhe.rotulo}: ${detalhe.valor}`)
          .join('; ');

      default:
        return '';
    }
  }

  private montarValorCompletoFacilito(
    celular: Celular,
    campo: CampoEspecificacao,
    valorOriginal: string
  ): string {
    const detalhes = this.montarTextoDetalhesFacilito(celular, campo);

    if (!detalhes) {
      return valorOriginal;
    }

    return [valorOriginal.trim(), `Detalhes técnicos: ${detalhes}`]
      .filter(parte => parte.length > 0)
      .join('. ');
  }

  private montarEspecificacoesFacilito(
    celular: Celular
  ): Record<CampoEspecificacao, DadoEspecificacaoFacilito> {
    const campos: CampoEspecificacao[] = [
      'ram',
      'armazenamento',
      'gpu',
      'tela',
      'bateria',
      'processador',
      'camera'
    ];

    const especificacoes = {} as Record<
      CampoEspecificacao,
      DadoEspecificacaoFacilito
    >;

    for (const campo of campos) {
      const valorOriginal = celular.specs[campo] ?? '';
      const valor = this.montarValorCompletoFacilito(
        celular,
        campo,
        valorOriginal
      );

      especificacoes[campo] = {
        valor,
        fonte: celular.origemEspecificacoes?.[campo] ?? 'catalogo'
      };
    }

    return especificacoes;
  }

  private montarPedidoFacilito(): PedidoFacilito {
    return {
      celulares: this.listaComparacao.map(celular => ({
        id: celular.id,
        especificacoes: this.montarEspecificacoesFacilito(celular)
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
      this.erroFacilito = 'Adicione pelo menos dois celulares para comparar.';
      return;
    }

    if (this.listaComparacao.length > 3) {
      this.erroFacilito = 'Você pode comparar no máximo três celulares por vez.';
      return;
    }

    const assinaturaSolicitacao = this.obterAssinaturaComparacao();

    if (assinaturaSolicitacao === this.assinaturaUltimaComparacao) {
      this.erroFacilito =
        'Você já analisou esses aparelhos. Adicione ou remova um celular para fazer uma nova comparação.';
      return;
    }

    this.invalidarResultadoFacilito();

    const versaoSolicitacao = this.versaoComparacao;

    this.facilitoCarregando = true;
    this.erroFacilito = '';
    this.iniciarMensagensFacilito();

    const pedido = this.montarPedidoFacilito();

    try {
      const resultado = await firstValueFrom(
        this.facilitoService.comparar(pedido)
      );

      if (versaoSolicitacao !== this.versaoComparacao) {
        return;
      }

      if (
        !resultado ||
        resultado.status !== 'concluida' ||
        typeof resultado.resumo !== 'string' ||
        !Array.isArray(resultado.classificacao) ||
        !Array.isArray(resultado.observacoes) ||
        !Array.isArray(resultado.fontes)
      ) {
        throw new Error('O resultado recebido não possui o formato esperado.');
      }

      const idsSelecionados = this.listaComparacao.map(celular => celular.id);
      const classificacao = resultado.classificacao;
      const idsRecebidos = classificacao.map(item => item.celularId);

      const idsUnicos =
        new Set(idsRecebidos).size === idsRecebidos.length;

      const todosOsAparelhosIncluidos =
        idsSelecionados.length === classificacao.length &&
        idsSelecionados.every(id => idsRecebidos.includes(id));

      const posicoesValidas = classificacao.every(
        item =>
          idsSelecionados.includes(item.celularId) &&
          Number.isInteger(item.posicao) &&
          item.posicao >= 1 &&
          item.posicao <= this.listaComparacao.length &&
          typeof item.justificativa === 'string' &&
          item.justificativa.trim().length > 0
      );

      if (!idsUnicos || !todosOsAparelhosIncluidos || !posicoesValidas) {
        throw new Error('Não foi possível validar a classificação recebida.');
      }

      this.resultadoFacilito = resultado;
      this.assinaturaUltimaComparacao = assinaturaSolicitacao;
    } catch (erro: unknown) {
      if (versaoSolicitacao !== this.versaoComparacao) {
        return;
      }

      const erroHttp = erro as {
        error?: { error?: unknown; message?: unknown };
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
      if (versaoSolicitacao === this.versaoComparacao) {
        this.facilitoCarregando = false;
        this.pararMensagensFacilito();
      }
    }
  }

  // --------------------------------------------------
  // SALVAMENTO DAS COMPARAÇÕES
  // --------------------------------------------------

  salvarComparacao(): void {
    if (!this.quantidadeCelularesValida) {
      alert('Adicione dois ou três celulares antes de salvar.');
      return;
    }

    if (this.resultadoFacilito?.status !== 'concluida') {
      alert('Faça uma comparação concluída com o Facilito.AI antes de salvar.');
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
      const dadosSalvos = localStorage.getItem(chave);
      salvosAnteriores = dadosSalvos ? JSON.parse(dadosSalvos) : [];

      if (!Array.isArray(salvosAnteriores)) {
        salvosAnteriores = [];
      }
    } catch (erro) {
      console.error('Erro ao ler as comparações salvas:', erro);
      alert('Não foi possível acessar suas comparações salvas.');
      return;
    }

    const novaComparacao = {
      id: Date.now(),
      data: new Date().toISOString(),
      celulares: structuredClone(this.listaComparacao),
      resultadoFacilito: structuredClone(this.resultadoFacilito)
    };

    salvosAnteriores.push(novaComparacao);

    try {
      localStorage.setItem(chave, JSON.stringify(salvosAnteriores));
      alert('Comparação salva com sucesso!');
    } catch (erro) {
      console.error('Erro ao salvar a comparação:', erro);
      alert('Não foi possível salvar a comparação. Tente novamente.');
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

    this.termoExibido = this.dicionarioTermos[termoKey];

    const elemento = document.getElementById('infoFacil');

    elemento?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });

    setTimeout(() => {
      const elemento = document.getElementById('infoFacil');
      if (elemento) {
        elemento.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 80);
  }

  fecharDicionario(): void {
    this.termoExibido = null;
  }
}