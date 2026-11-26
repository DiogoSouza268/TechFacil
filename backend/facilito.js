import rateLimit from 'express-rate-limit';

const CARACTERISTICAS = {
  ram: 'Memória RAM',
  armazenamento: 'Armazenamento',
  gpu: 'Placa de vídeo (GPU)',
  tela: 'Tela',
  bateria: 'Bateria',
  processador: 'Processador (CPU)',
  camera: 'Câmeras'
};

const ORIGENS_ESPECIFICACAO = {
  catalogo: 'Catálogo do TechFácil',
  usuario: 'Informação corrigida pelo usuário'
};

const MODELOS_GRATUITOS = new Set([
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3.5-super-vl:free',
  'nvidia/nemotron-3.5-lightning:free'
]);

function textoSeguro(valor, maximo = 300) {
  return typeof valor === 'string'
    ? valor.trim().slice(0, maximo)
    : '';
}

function normalizarEspecificacao(entrada) {
  const dado =
    entrada &&
    typeof entrada === 'object' &&
    !Array.isArray(entrada)
      ? entrada
      : {};

  const valor = textoSeguro(dado.valor);

  const fonte = Object.hasOwn(ORIGENS_ESPECIFICACAO, dado.fonte)
    ? dado.fonte
    : 'catalogo';

  return {
    valor,
    fonte: ORIGENS_ESPECIFICACAO[fonte]
  };
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

  return JSON.parse(textoLimpo.slice(inicio, fim + 1));
}

function extrairTextoResposta(dados) {
  if (typeof dados?.output_text === 'string') {
    return dados.output_text.trim();
  }

  const saida = Array.isArray(dados?.output) ? dados.output : [];

  for (const item of [...saida].reverse()) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) {
      continue;
    }

    const blocoTexto = item.content.find(
      bloco =>
        bloco?.type === 'output_text' && typeof bloco.text === 'string'
    );

    if (blocoTexto) {
      return blocoTexto.text.trim();
    }
  }

  return '';
}

function validarResultado(resultado, referencias, quantidadeCelulares) {
  if (
    !resultado ||
    resultado.status !== 'concluida' ||
    typeof resultado.resumo !== 'string' ||
    !Array.isArray(resultado.classificacao) ||
    !Array.isArray(resultado.observacoes)
  ) {
    return false;
  }

  if (!resultado.resumo.trim()) return false;

  if (resultado.classificacao.length !== quantidadeCelulares) {
    return false;
  }

  const referenciasRetornadas = resultado.classificacao.map(
    item => item?.celular
  );

  if (new Set(referenciasRetornadas).size !== referenciasRetornadas.length) {
    return false;
  }

  const todosIncluidos = [...referencias.keys()].every(referencia =>
    referenciasRetornadas.includes(referencia)
  );

  if (!todosIncluidos) return false;

  return resultado.classificacao.every(
    item =>
      typeof item?.celular === 'string' &&
      referencias.has(item.celular) &&
      Number.isInteger(item?.posicao) &&
      item.posicao >= 1 &&
      item.posicao <= quantidadeCelulares &&
      typeof item?.justificativa === 'string' &&
      item.justificativa.trim().length > 0
  );
}

function criarPrompt(celularesParaIA) {
  return `
Você é o Facilito do TechFácil. Compare os celulares em português brasileiro usando linguagem bem simples, voltada para pessoas leigas que não entendem termos técnicos.

DADOS:
${JSON.stringify(celularesParaIA)}

REGRAS:
- Compare RAM, armazenamento, CPU, GPU, tela, bateria e câmeras. Avalie o conjunto, sem notas ou pesos fixos. Ignore preço e marca.
- Sempre que citar algo técnico, traduza o benefício para o dia a dia (ex.: mais fluidez ao abrir apps, tela mais nítida, mais espaço para fotos).
- Use apenas as informações fornecidas. Não invente especificações ou benchmarks.
- Bateria: compare capacidade em mAh e potência de carregamento, sem presumir autonomia exata em horas.
- Tela: considere painel, resolução e taxa de atualização (Hz).
- Câmeras: megapixels e quantidade de sensores sozinhos não comprovam qualidade fotográfica.
- Classifique todos os aparelhos. Permita empates usando posições competitivas (ex.: dois em 1º e o próximo em 3º).
- Inclua cada referência exatamente uma vez na classificação.
- Resumo: até 3 linhas. Justificativas: até 2 linhas cada.
- Seja objetivo e não repita informações.

Retorne somente JSON válido, sem Markdown:
{
  "status": "concluida",
  "resumo": "Resumo direto da comparação.",
  "classificacao": [
    {
      "celular": "Celular 1",
      "posicao": 1,
      "justificativa": "Justificativa simples."
    }
  ],
  "observacoes": []
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
      error:
        'O Facilito recebeu muitas solicitações. Aguarde alguns minutos e tente novamente.'
    }
  });

  app.post('/api/facilito/comparar', limiteFacilito, async (req, res) => {
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

      const modelosNormalizados = modelos.map(modelo =>
        typeof modelo === 'string' ? modelo.trim() : ''
      );

      if (modelosNormalizados.some(modelo => !modelo)) {
        return res.status(500).json({
          error: 'A configuração dos modelos gratuitos é inválida.'
        });
      }

      const possuiModeloNaoPermitido = modelosNormalizados.some(
        modelo => !MODELOS_GRATUITOS.has(modelo)
      );

      if (possuiModeloNaoPermitido) {
        console.error(
          '[Facilito.AI] A lista contém um modelo não permitido.'
        );

        return res.status(500).json({
          error: 'A configuração dos modelos gratuitos é inválida.'
        });
      }

      const modelosParaEnviar = [...new Set(modelosNormalizados)].slice(0, 3);

      console.log(
        '[Facilito.AI] Modelos enviados ao OpenRouter:',
        modelosParaEnviar
      );

      const aparelhosRecebidos = req.body?.celulares;

      if (
        !Array.isArray(aparelhosRecebidos) ||
        aparelhosRecebidos.length < 2 ||
        aparelhosRecebidos.length > 3
      ) {
        return res.status(400).json({
          error: 'Selecione entre dois e três celulares para comparar.'
        });
      }

      const ids = new Set();
      const celulares = [];

      for (const aparelho of aparelhosRecebidos) {
        if (!Number.isSafeInteger(aparelho?.id) || aparelho.id <= 0) {
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

        const entrada =
          aparelho.especificacoes &&
          typeof aparelho.especificacoes === 'object' &&
          !Array.isArray(aparelho.especificacoes)
            ? aparelho.especificacoes
            : {};

        const especificacoes = {};

        for (const campo of Object.keys(CARACTERISTICAS)) {
          const spec = normalizarEspecificacao(entrada[campo]);

          // Trava de segurança caso algum campo tenha faltado no cadastro do banco/JSON.
          if (!spec.valor) {
            console.warn(
              `[Facilito.AI] Celular ID ${aparelho.id} está sem o campo "${campo}" preenchido.`
            );
            return res.status(400).json({
              error: `O campo "${CARACTERISTICAS[campo]}" de um dos celulares não está preenchido.`
            });
          }

          especificacoes[campo] = spec;
        }

        celulares.push({
          id: aparelho.id,
          especificacoes
        });
      }

      const referencias = new Map();

      const celularesParaIA = celulares.map((celular, indice) => {
        const referencia = `Celular ${indice + 1}`;
        referencias.set(referencia, celular.id);

        const caracteristicas = {};

        for (const [campo, rotulo] of Object.entries(CARACTERISTICAS)) {
          const dado = celular.especificacoes[campo];

          caracteristicas[rotulo] = {
            v: dado.valor,
            ...(dado.fonte === 'Informação corrigida pelo usuário'
              ? { u: true }
              : {})
          };
        }

        return {
          referencia,
          dados: caracteristicas
        };
      });

      const prompt = criarPrompt(celularesParaIA);

      const response = await fetch('https://openrouter.ai/api/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'TechFacil'
        },
        body: JSON.stringify({
          models: modelosParaEnviar,
          input: prompt
        }),
        signal: AbortSignal.timeout(60000)
      });

      const dadosResposta = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('[OpenRouter]', {
          status: response.status,
          erro: dadosResposta?.error || dadosResposta
        });

        if (response.status === 401 || response.status === 403) {
          return res.status(502).json({
            error:
              'O serviço de comparação não conseguiu autenticar. Verifique a configuração e tente novamente.'
          });
        }

        if (response.status === 429) {
          return res.status(503).json({
            error:
              'Os modelos gratuitos estão temporariamente ocupados ou atingiram seus limites. Tente novamente mais tarde.'
          });
        }

        return res.status(502).json({
          error:
            'Não foi possível concluir a comparação neste momento. Tente novamente mais tarde.'
        });
      }

      const texto = extrairTextoResposta(dadosResposta);

      if (!texto) {
        console.error(
          '[Facilito.AI] O OpenRouter devolveu uma resposta vazia.'
        );

        return res.status(502).json({
          error:
            'O Facilito não conseguiu gerar uma resposta válida. Tente novamente.'
        });
      }

      let resultado;

      try {
        resultado = jsonDaResposta(texto);
      } catch (erro) {
        console.error('[Facilito.AI] Resposta JSON inválida:', erro.message);

        return res.status(502).json({
          error:
            'O Facilito recebeu uma resposta que não pôde ser validada. Tente novamente.'
        });
      }

      if (!validarResultado(resultado, referencias, celulares.length)) {
        console.error(
          '[Facilito.AI] O resultado recebido não passou pela validação.'
        );

        return res.status(502).json({
          error: 'O Facilito não conseguiu validar a comparação. Tente novamente.'
        });
      }

      const observacoes = resultado.observacoes
        .filter(item => typeof item === 'string')
        .map(item => textoSeguro(item, 500))
        .filter(Boolean)
        .slice(0, 8);

      const resposta = {
        status: 'concluida',
        resumo: textoSeguro(resultado.resumo, 1800),
        classificacao: resultado.classificacao.map(item => ({
          celularId: referencias.get(item.celular),
          posicao: item.posicao,
          justificativa: textoSeguro(item.justificativa, 900)
        })),
        observacoes,
        fontes: []
      };

      return res.json(resposta);
    } catch (erro) {
      console.error(
        '[Facilito.AI] Falha na avaliação:',
        erro?.message || erro
      );

      if (erro?.name === 'TimeoutError' || erro?.name === 'AbortError') {
        return res.status(504).json({
          error: 'O Facilito demorou para responder. Tente novamente mais tarde.'
        });
      }

      return res.status(502).json({
        error:
          'Não foi possível concluir a avaliação do Facilito. Verifique a conexão e tente novamente.'
      });
    }
  });
}