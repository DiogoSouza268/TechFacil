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

function buscarRotulo(lista = [], rotulo) {
  const item = lista.find(
    i => i.rotulo?.toLowerCase() === rotulo.toLowerCase()
  );
  return item ? item.valor : '';
}

function montarSpecs(celular) {
  const dt = celular.detalhesTecnicos || {};
  const versaoBase = (celular.versoes && celular.versoes[0]) || {};
  const specsSalvas = celular.specs || {};

  const cameras = dt.camera || [];
  const traseiras = cameras
    .filter(c => {
      const r = c.rotulo?.toLowerCase() || '';
      return r !== 'selfie' && r !== 'gravação de vídeo';
    })
    .map(c => c.valor.split('|')[0].trim())
    .join(' + ');

  const selfie = buscarRotulo(cameras, 'Selfie').split('|')[0].trim();
  const resumoCamera = traseiras
    ? `${traseiras} (traseiras)${selfie ? ` | ${selfie} (frontal)` : ''}`
    : '';

  const tamanhoTela = buscarRotulo(dt.tela, 'Tamanho').replace('polegadas', 'pol');
  const tipoTela = buscarRotulo(dt.tela, 'Tipo e fluidez').replace('|', '/');

  return {
    armazenamento: specsSalvas.armazenamento || versaoBase.armazenamento || '',
    ram: specsSalvas.ram || versaoBase.ram || '',
    bateria: specsSalvas.bateria || buscarRotulo(dt.bateria, 'Capacidade'),
    processador: specsSalvas.processador || buscarRotulo(dt.processador, 'Chipset'),
    gpu: specsSalvas.gpu || buscarRotulo(dt.processador, 'GPU'),
    tela: specsSalvas.tela || [tamanhoTela, tipoTela].filter(Boolean).join(' '),
    camera: specsSalvas.camera || resumoCamera
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