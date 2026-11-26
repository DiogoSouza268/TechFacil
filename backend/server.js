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

    res.json(resultado.rows);
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