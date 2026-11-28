import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { registrarRotaFacilito } from './facilito.js';
import pool from './db.js';

const app = express();
const port = Number(process.env.PORT || 3000);

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

const modelosFacilito = (process.env.OPENROUTER_MODELS || '')
  .split(',')
  .map(modelo => modelo.trim())
  .filter(Boolean);

const frontendOrigins = (
  process.env.FRONTEND_ORIGIN || 'http://localhost:4200'
)
  .split(',')
  .map(origem => origem.trim())
  .filter(Boolean);

app.disable('x-powered-by');

app.use(express.json({ limit: '20kb' }));
app.use(cors({ origin: frontendOrigins }));

// Limita as chamadas gerais ao backend.
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições. Aguarde um pouco e tente novamente.'
  }
}));

// Verifica se o backend está ativo.
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'techfacil-backend'
  });
});

function buscarRotulo(lista = [], ...rotulos) {
  const alvos = rotulos.map(r => r.toLowerCase());
  const item = lista.find(i => alvos.includes(i.rotulo?.toLowerCase()));
  return item ? item.valor : '';
}

function resumirCameraTraseira(rotulo = '', valor = '') {
  const mp = valor.split('|')[0].trim().replace(/(\d)(MP)\b/i, '$1 $2');
  const extras = [];
  const tipo = rotulo.toLowerCase();

  if (tipo.includes('ultrawide')) extras.push('ultrawide');
  else if (tipo.includes('macro')) extras.push('macro');
  else if (tipo.includes('auxiliary')) extras.push('auxiliar');

  const zoom = valor.match(/(\d+(?:[.,]\d+)?x)\s*(?:optical\s*zoom|zoom\s*óptico)/i);
  if (zoom) extras.push(`zoom ${zoom[1]}`);
  if (/\bOIS\b/i.test(valor)) extras.push('OIS');

  return extras.length ? `${mp} (${extras.join(', ')})` : mp;
}

function resumirCarregamento(valor = '', tipo = 'fio') {
  if (!valor) return '';

  const partes = valor
    .split('|')
    .map(p => p.trim())
    .filter(p => p && !/\breverse\b/i.test(p));

  if (!partes.length) return '';

  const potencia = partes.find(p => /\d+(?:[.,]\d+)?\s*W\b/i.test(p));
  const tempo = partes.find(p => /%/.test(p));

  const limpar = txt =>
    txt
      .replace(/\s*wireless\b/gi, '')
      .replace(/\bin\b/gi, 'em')
      .replace(/\s+/g, ' ')
      .trim();

  if (potencia) {
    return `${limpar(potencia)} ${tipo === 'fio' ? 'com fio' : 'sem fio'}`;
  }

  if (tempo) {
    return `${limpar(tempo)} (${tipo === 'fio' ? 'com fio' : 'sem fio'})`;
  }

  return `${limpar(partes[0])} ${tipo === 'fio' ? 'com fio' : 'sem fio'}`;
}

function montarSpecs(celular) {
  const dt = celular.detalhesTecnicos || {};
  const versaoBase = (celular.versoes && celular.versoes[0]) || {};

  const cameras = dt.camera || [];
  const ignorarCamera = new Set(['selfie', 'gravação de vídeo', 'aspectos']);
  const traseiras = cameras
    .filter(c => !ignorarCamera.has(c.rotulo?.toLowerCase() || ''))
    .map(c => resumirCameraTraseira(c.rotulo, c.valor))
    .filter(Boolean)
    .join(' + ');

  const selfie = buscarRotulo(cameras, 'Selfie').split('|')[0].trim();
  const video = buscarRotulo(cameras, 'Gravação de vídeo').replace(/\s*\|\s*/g, ' / ');
  const resumoCamera = traseiras
    ? `${traseiras} (traseiras)${selfie ? ` | ${selfie} (frontal)` : ''}${video ? ` | Vídeo: ${video}` : ''}`
    : '';

  const tamanhoTela = buscarRotulo(dt.tela, 'Tamanho').replace('polegadas', 'pol');
  const tipoTela = buscarRotulo(dt.tela, 'Tipo e fluidez').replace(/\s*\|\s*/g, ' / ');
  const resolucaoBrilho = buscarRotulo(dt.tela, 'Resolução e brilho').replace(/\s*\|\s*/g, ' | ');

  const resumoBateria = [
    buscarRotulo(dt.bateria, 'Capacidade'),
    resumirCarregamento(buscarRotulo(dt.bateria, 'Carregamento com fio', 'Carregamento'), 'fio'),
    resumirCarregamento(buscarRotulo(dt.bateria, 'Carregamento sem fio'), 'sem-fio')
  ].filter(Boolean).join(' | ');

  return {
    armazenamento: versaoBase.armazenamento || '',
    ram: versaoBase.ram || '',
    bateria: resumoBateria,
    processador: buscarRotulo(dt.processador, 'Chipset'),
    gpu: buscarRotulo(dt.processador, 'GPU'),
    tela: [tamanhoTela, tipoTela, resolucaoBrilho].filter(Boolean).join(' | '),
    camera: resumoCamera
  };
}

// Busca os celulares cadastrados no PostgreSQL.
app.get('/api/celulares', async (_req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id,
        nome,
        imagem,
        specs,
        detalhes_tecnicos AS "detalhesTecnicos",
        versoes
      FROM celulares
      ORDER BY id ASC
    `);

    const celulares = resultado.rows.map(celular => ({
      ...celular,
      specs: montarSpecs(celular)
    }));

    res.json(celulares);
    
  } catch (erro) {
    console.error('Erro ao buscar celulares:', erro);
    res.status(500).json({ erro: 'Não foi possível carregar o catálogo.' });
  }
});

// Registra a rota do Facilito.AI com OpenRouter.
registrarRotaFacilito(app, {
  apiKey: openRouterApiKey,
  modelos: modelosFacilito
});

// Tratamento geral de erros.
app.use((error, _req, res, _next) => {
  console.error('[backend]', error.message);

  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : 502;

  const message =
    error.name === 'TimeoutError' ||
    error.name === 'AbortError'
      ? 'A consulta demorou para responder. Tente novamente mais tarde.'
      : error.message || 'Não foi possível concluir a solicitação.';

  res.status(statusCode).json({
    error: message
  });
});

app.listen(port, () => {
  console.log(
    `TechFácil backend ativo em http://localhost:${port}`
  );

  console.log(
    `Origens Angular permitidas: ${frontendOrigins.join(', ')}`
  );

  if (!openRouterApiKey) {
    console.warn(
      'ATENÇÃO: configure OPENROUTER_API_KEY no arquivo .env.'
    );
  }

  if (modelosFacilito.length === 0) {
    console.warn(
      'ATENÇÃO: configure OPENROUTER_MODELS no arquivo .env.'
    );
  }
});