import rateLimit from 'express-rate-limit';

const FILTROS_VALIDOS = {
  naoTravar: {
    label: 'Memória RAM',
    campos: ['ram']
  },

  muitoEspaco: {
    label: 'Armazenamento',
    campos: ['armazenamento']
  },

  placaVideo: {
    label: 'Placa de vídeo (GPU)',
    campos: ['gpu']
  },

  qualidadeImagem: {
    label: 'Qualidade de imagem',
    campos: ['qualidadeImagem']
  },

  boaBateria: {
    label: 'Bateria',
    campos: ['bateria']
  },

  processadorCPU: {
    label: 'Processador',
    campos: ['processador']
  },

  melhorCamera: {
    label: 'Qualidade das câmeras',
    campos: ['camera']
  },

  precoBaixo: {
    label: 'Preço baixo',
    campos: []
  }
};

const ROTULOS_ESPECIFICACOES = {
  ram: 'Memória RAM',
  armazenamento: 'Armazenamento',
  bateria: 'Bateria',
  processador: 'Processador',
  gpu: 'Placa de vídeo (GPU)',
  qualidadeImagem: 'Tela / qualidade de imagem',
  camera: 'Câmeras'
};

const MODELOS_GRATUITOS = new Set([
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3.5-super-vl:free',
  'nvidia/nemotron-3.5-lightning:free',
  'dots-studio/dots-3-note-preview:free'
]);

function textoSeguro(valor, maximo = 300) {
  return typeof valor === 'string'
    ? valor.trim().slice(0, maximo)
    : '';
}

function estaInformado(valor) {
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
    'não informado pela api',
    'nao informado pela api',
    'não informado no catálogo',
    'nao informado no catalogo',
    'informação indisponível',
    'informacao indisponivel',
    'dados indisponíveis',
    'dados indisponiveis',
    'n/a',
    'null',
    'undefined',
    '-'
  ];

  return !valoresAusentes.includes(texto);
}

function jsonDaResposta(texto) {
  if (typeof texto !== 'string' || !texto.trim()) {
    throw new Error('A resposta recebida está vazia.');
  }

  const textoLimpo = texto
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const inicio = textoLimpo.indexOf('{');
  const fim = textoLimpo.lastIndexOf('}');

  if (inicio < 0 || fim <= inicio) {
    throw new Error('A resposta não contém um objeto JSON válido.');
  }

  return JSON.parse(
    textoLimpo.slice(inicio, fim + 1)
  );
}

function extrairTextoResposta(dados) {
  // Compatibilidade com respostas da API Responses.
  if (typeof dados?.output_text === 'string') {
    return dados.output_text.trim();
  }

  const saida = Array.isArray(dados?.output)
    ? dados.output
    : [];

  for (const item of [...saida].reverse()) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) {
      continue;
    }

    const blocoTexto = item.content.find(bloco =>
      bloco?.type === 'output_text' &&
      typeof bloco.text === 'string'
    );

    if (blocoTexto) {
      return blocoTexto.text.trim();
    }
  }

  return '';
}

function validarResultado(resultado, ids, quantidadeCelulares) {
  if (
    !resultado ||
    !['concluida', 'inconclusiva'].includes(resultado.status) ||
    typeof resultado.resumo !== 'string' ||
    !Array.isArray(resultado.classificacao) ||
    !Array.isArray(resultado.observacoes)
  ) {
    return false;
  }

  if (resultado.status === 'inconclusiva') {
    return resultado.classificacao.length === 0;
  }

  if (!resultado.resumo.trim()) {
    return false;
  }

  if (resultado.classificacao.length !== quantidadeCelulares) {
    return false;
  }

  const idsRetornados = resultado.classificacao.map(
    item => item?.celularId
  );

  const idsUnicos =
    new Set(idsRetornados).size === idsRetornados.length;

  if (!idsUnicos) {
    return false;
  }

  const todosIncluidos = [...ids].every(
    id => idsRetornados.includes(id)
  );

  if (!todosIncluidos) {
    return false;
  }

  return resultado.classificacao.every(item =>
    Number.isSafeInteger(item?.celularId) &&
    ids.has(item.celularId) &&
    Number.isInteger(item?.posicao) &&
    item.posicao >= 1 &&
    item.posicao <= quantidadeCelulares &&
    typeof item?.justificativa === 'string' &&
    item.justificativa.trim().length > 0
  );
}

function respostaInconclusiva(resumo, observacoes = []) {
  return {
    status: 'inconclusiva',
    resumo,
    classificacao: [],
    observacoes,
    fontes: []
  };
}

function criarPrompt(filtros, celularesParaIA) {
  return `
Você é o Facilito, assistente de comparação de celulares do TechFácil.

Sua tarefa é ajudar uma pessoa leiga a entender qual dos celulares apresentados atende melhor às preferências selecionadas.

Responda em português brasileiro, com linguagem simples, respeitosa e direta.

FILTROS ESCOLHIDOS PELO USUÁRIO:
${JSON.stringify(filtros)}

CELULARES E INFORMAÇÕES DISPONÍVEIS:
${JSON.stringify(celularesParaIA)}

REGRAS OBRIGATÓRIAS:

1. Compare os celulares usando EXCLUSIVAMENTE os filtros escolhidos pelo usuário.

2. Todos os filtros selecionados têm importância equivalente. Não invente pesos, notas ou pontuações.

3. Não considere características que não estejam entre os filtros selecionados.

4. O preço só pode influenciar a classificação se "precoBaixo" estiver entre os filtros escolhidos.

5. Quando o preço estiver disponível, ele representa o valor informado pelo usuário na loja. Não substitua esse valor.

6. Os valores de RAM e armazenamento foram informados ou corrigidos pelo usuário. Considere exatamente os valores recebidos.

7. ATENÇÃO: os dados recebidos são a única fonte permitida para esta comparação. Não use conhecimento geral para completar especificações ausentes. Não invente processadores, GPUs, câmeras, telas, baterias, benchmarks ou características.

8. Se algum dos celulares não possuir informação suficiente para avaliar um dos filtros selecionados, retorne status "inconclusiva", com classificacao vazia, e explique em observacoes qual informação está faltando.

9. Não confunda versões diferentes de um mesmo aparelho. Não suponha que dois celulares tenham desempenho semelhante sem dados que sustentem essa conclusão.

10. Se os dados forem suficientes para uma comparação justa, retorne status "concluida" e inclua todos os celulares exatamente uma vez.

11. Utilize somente os IDs recebidos. Nunca invente IDs.

12. A posição deve ser 1, 2 ou 3, conforme a quantidade de celulares. Em caso de empate real, use a mesma posição para os aparelhos empatados e mantenha a classificação competitiva. Exemplo: 1, 1, 3.

13. Não force um vencedor quando as informações não permitirem uma conclusão justa.

14. Explique cada posição em uma a três frases simples. Relacione a justificativa diretamente aos filtros escolhidos.

15. Não exponha notas, pontuações, cálculos internos ou termos técnicos desnecessários.

16. Não afirme que pesquisou na internet ou consultou fontes externas.

17. Não inclua Markdown, comentários ou texto antes/depois do JSON.

FORMATO OBRIGATÓRIO DA RESPOSTA:

{
  "status": "concluida",
  "resumo": "Explicação simples do resultado.",
  "classificacao": [
    {
      "celularId": 123,
      "posicao": 1,
      "justificativa": "Explicação simples da posição."
    }
  ],
  "observacoes": []
}

Quando não for possível comparar com segurança, utilize:

{
  "status": "inconclusiva",
  "resumo": "Não há informações suficientes para uma comparação confiável.",
  "classificacao": [],
  "observacoes": [
    "Explique quais informações estão faltando."
  ]
}
`.trim();
}

export function registrarRotaFacilito(app, { apiKey, modelos }) {
  const limiteFacilito = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: 'O Facilito recebeu muitas solicitações. Aguarde alguns minutos e tente novamente.'
    }
  });

  app.post(
    '/api/facilito/comparar',
    limiteFacilito,
    async (req, res) => {
      try {
        if (!apiKey) {
          return res.status(500).json({
            error: 'A configuração do serviço de comparação está incompleta.'
          });
        }

        if (!Array.isArray(modelos) || modelos.length === 0) {
          return res.status(500).json({
            error: 'Nenhum modelo gratuito foi configurado para o Facilito.'
          });
        }

        // Proteção: todos os modelos precisam terminar em :free.
        // Assim, nenhum modelo pago poderá ser utilizado.
        const possuiModeloNaoPermitido = modelos.some(
          modelo => !MODELOS_GRATUITOS.has(modelo)
        );

        if (possuiModeloNaoPermitido) {
          console.error(
            '[Facilito.AI] A lista contém um modelo que não possui o sufixo :free.'
          );

          return res.status(500).json({
            error: 'A configuração dos modelos gratuitos é inválida.'
          });
        }

        const filtrosRecebidos = req.body?.filtros;
        const aparelhosRecebidos = req.body?.celulares;

        if (
          !Array.isArray(filtrosRecebidos) ||
          filtrosRecebidos.length < 1
        ) {
          return res.status(400).json({
            error: 'Selecione pelo menos um filtro de preferência.'
          });
        }

        if (
          !Array.isArray(aparelhosRecebidos) ||
          aparelhosRecebidos.length < 2 ||
          aparelhosRecebidos.length > 3
        ) {
          return res.status(400).json({
            error: 'Selecione entre dois e três celulares para comparar.'
          });
        }

        // Valida os filtros.
        const filtrosVistos = new Set();
        const filtros = [];

        for (const filtro of filtrosRecebidos) {
          const key = typeof filtro?.key === 'string'
            ? filtro.key
            : '';

          if (!Object.hasOwn(FILTROS_VALIDOS, key)) {
            return res.status(400).json({
              error: 'Um dos filtros selecionados não é reconhecido.'
            });
          }

          if (filtrosVistos.has(key)) {
            return res.status(400).json({
              error: 'Há filtros duplicados na solicitação.'
            });
          }

          filtrosVistos.add(key);

          filtros.push({
            key,
            label: FILTROS_VALIDOS[key].label
          });
        }

        // Valida os celulares.
        const ids = new Set();
        const celulares = [];

        for (const aparelho of aparelhosRecebidos) {
          if (
            !Number.isSafeInteger(aparelho?.id) ||
            aparelho.id <= 0
          ) {
            return res.status(400).json({
              error: 'Um dos celulares possui um identificador inválido.'
            });
          }

          if (ids.has(aparelho.id)) {
            return res.status(400).json({
              error: 'A comparação contém celulares duplicados.'
            });
          }

          ids.add(aparelho.id);

          const nome = textoSeguro(aparelho.nome, 120);

          if (!nome) {
            return res.status(400).json({
              error: 'Um dos celulares está sem nome.'
            });
          }

          if (!['local', 'api'].includes(aparelho.origem)) {
            return res.status(400).json({
              error: 'A origem de um dos celulares é inválida.'
            });
          }

          if (
            typeof aparelho.precoLoja !== 'number' ||
            !Number.isFinite(aparelho.precoLoja) ||
            aparelho.precoLoja <= 0 ||
            aparelho.precoLoja > 1000000
          ) {
            return res.status(400).json({
              error: 'Informe um preço válido para todos os celulares.'
            });
          }

          const entrada =
            aparelho.especificacoes &&
            typeof aparelho.especificacoes === 'object'
              ? aparelho.especificacoes
              : {};

          celulares.push({
            id: aparelho.id,
            nome,
            origem: aparelho.origem,
            precoLoja: aparelho.precoLoja,
            especificacoes: {
              ram: textoSeguro(entrada.ram),
              armazenamento: textoSeguro(entrada.armazenamento),
              bateria: textoSeguro(entrada.bateria),
              processador: textoSeguro(entrada.processador),
              gpu: textoSeguro(entrada.gpu),
              qualidadeImagem: textoSeguro(entrada.qualidadeImagem),
              camera: textoSeguro(entrada.camera)
            }
          });
        }

        // Verifica se todos os filtros escolhidos possuem dados.
        // Isso evita gastar uma chamada de IA quando já sabemos
        // que não há informações suficientes.
        const camposSelecionados = new Set();

        for (const filtro of filtros) {
          for (const campo of FILTROS_VALIDOS[filtro.key].campos) {
            camposSelecionados.add(campo);
          }
        }

        const informacoesAusentes = [];

        for (const celular of celulares) {
          for (const campo of camposSelecionados) {
            const valor = celular.especificacoes[campo];

            if (!estaInformado(valor)) {
              const rotulo = ROTULOS_ESPECIFICACOES[campo];

              informacoesAusentes.push(
                `${celular.nome}: ${rotulo}`
              );
            }
          }
        }

        if (informacoesAusentes.length > 0) {
          return res.json(
            respostaInconclusiva(
              'Não há informações suficientes para comparar todos os celulares pelos critérios escolhidos.',
              [
                `Informações que precisam ser preenchidas: ${informacoesAusentes.join('; ')}.`
              ]
            )
          );
        }

        // Envia à IA apenas os dados relacionados aos filtros ativos.
        const considerarPreco = filtrosVistos.has('precoBaixo');

        const celularesParaIA = celulares.map(celular => {
          const caracteristicas = {};

          for (const filtro of filtros) {
            for (const campo of FILTROS_VALIDOS[filtro.key].campos) {
              caracteristicas[ROTULOS_ESPECIFICACOES[campo]] =
                celular.especificacoes[campo];
            }
          }

          const dados = {
            id: celular.id,
            nome: celular.nome,
            caracteristicas
          };

          if (considerarPreco) {
            dados.precoLoja = celular.precoLoja;
          }

          return dados;
        });

        const prompt = criarPrompt(
          filtros,
          celularesParaIA
        );

        // Chamada única ao OpenRouter.
        // O próprio OpenRouter tenta os modelos em ordem quando
        // um deles apresenta erro, indisponibilidade ou limite.
        const response = await fetch(
          'https://openrouter.ai/api/v1/responses',
          {
            method: 'POST',

            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'X-Title': 'TechFacil'
            },

            body: JSON.stringify({
              models: modelos,
              input: prompt
            }),

            signal: AbortSignal.timeout(90000)
          }
        );

        const dadosResposta = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          console.error('[OpenRouter]', {
            status: response.status,
            erro: dadosResposta?.error || dadosResposta
          });

          if (response.status === 401 || response.status === 403) {
            return res.status(502).json({
              error: 'O serviço de comparação não conseguiu autenticar. Verifique a configuração e tente novamente.'
            });
          }

          if (response.status === 429) {
            return res.status(503).json({
              error: 'Os modelos gratuitos estão temporariamente ocupados ou atingiram seus limites. Tente novamente mais tarde.'
            });
          }

          return res.status(502).json({
            error: 'Não foi possível concluir a comparação neste momento. Tente novamente mais tarde.'
          });
        }

        const texto = extrairTextoResposta(dadosResposta);

        if (!texto) {
          console.error(
            '[Facilito.AI] O OpenRouter devolveu uma resposta vazia.'
          );

          return res.status(502).json({
            error: 'O Facilito não conseguiu gerar uma resposta válida. Tente novamente.'
          });
        }

        let resultado;

        try {
          resultado = jsonDaResposta(texto);
        } catch (erro) {
          console.error(
            '[Facilito.AI] Resposta JSON inválida:',
            erro.message
          );

          return res.status(502).json({
            error: 'O Facilito recebeu uma resposta que não pôde ser validada. Tente novamente.'
          });
        }

        if (
          !validarResultado(
            resultado,
            ids,
            celulares.length
          )
        ) {
          console.error(
            '[Facilito.AI] O resultado recebido não passou pela validação.'
          );

          return res.status(502).json({
            error: 'O Facilito não conseguiu validar a comparação. Tente novamente.'
          });
        }

        const resposta = {
          status: resultado.status,
          resumo: textoSeguro(resultado.resumo, 1800),
          classificacao: [],
          observacoes: resultado.observacoes
            .filter(item => typeof item === 'string')
            .map(item => textoSeguro(item, 500))
            .filter(Boolean)
            .slice(0, 8),
          fontes: []
        };

        if (resposta.status === 'inconclusiva') {
          if (resposta.observacoes.length === 0) {
            resposta.observacoes.push(
              'As informações disponíveis não permitem uma classificação confiável.'
            );
          }

          return res.json(resposta);
        }

        resposta.classificacao = resultado.classificacao.map(item => ({
          celularId: item.celularId,
          posicao: item.posicao,
          justificativa: textoSeguro(item.justificativa, 900)
        }));

        return res.json(resposta);

      } catch (erro) {
        console.error(
          '[Facilito.AI] Falha na avaliação:',
          erro?.message || erro
        );

        if (
          erro.name === 'TimeoutError' ||
          erro.name === 'AbortError'
        ) {
          return res.status(504).json({
            error: 'O Facilito demorou para responder. Tente novamente mais tarde.'
          });
        }

        return res.status(502).json({
          error: 'Não foi possível concluir a avaliação do Facilito. Verifique a conexão e tente novamente.'
        });
      }
    }
  );
}