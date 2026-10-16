import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.MOBILEAPI_API_KEY;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
const mobileApiBaseUrl = 'https://api.mobileapi.dev';

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(cors({ origin: frontendOrigin }));

// Limita as chamadas ao nosso backend. A cache abaixo evita gastar créditos
// da MobileAPI.dev quando uma mesma pesquisa é repetida.
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde um pouco e tente novamente.' }
}));

const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const CACHE_MAX_ITEMS = 100;


let mobileApiBlockedUntil = 0;

function getMobileApiWaitSeconds() {
  return Math.max(
    0,
    Math.ceil((mobileApiBlockedUntil - Date.now()) / 1000)
  );
}


function getCached(key) {
  const item = cache.get(key);
  if (!item) return undefined;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return item.value;
}

function setCached(key, value) {
  if (cache.size >= CACHE_MAX_ITEMS) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

// A API externa inclui image_b64, que pode deixar as respostas enormes.
// O frontend só precisa da image_url, então removemos image_b64 daqui.
function removeLargeBase64Images(payload) {
  if (Array.isArray(payload)) {
    return payload.map(removeLargeBase64Images);
  }
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const copy = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'image_b64' || key === 'logo_b64') continue;
    copy[key] = removeLargeBase64Images(value);
  }
  return copy;
}

async function callMobileApi(path, query = {}) {

  
  const waitSeconds = getMobileApiWaitSeconds();

  if (waitSeconds > 0) {
    const error = new Error(
      `A pesquisa está temporariamente limitada. Aguarde ${waitSeconds} segundos e tente novamente.`
    );
    error.statusCode = 429;
    throw error;
  }


  if (!apiKey) {
    const error = new Error('A chave MOBILEAPI_API_KEY não foi configurada no backend.');
    error.statusCode = 500;
    throw error;
  }

  const url = new URL(path, mobileApiBaseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Token ${apiKey}`,
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(15000)
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
  console.error('[MobileAPI.dev]', {
    status: response.status,
    body
  });

  let message;

  if (response.status === 401) {
    message = 'A MobileAPI.dev recusou a chave configurada no backend.';
  } else if (response.status === 429) {
    const retryAfter = Number(body?.retry_after);
    const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter
      : 5;

    mobileApiBlockedUntil = Math.max(
      mobileApiBlockedUntil,
      Date.now() + waitSeconds * 1000
    );

    message = `A pesquisa está temporariamente limitada. Aguarde ${Math.ceil(waitSeconds)} segundos e tente novamente.`;

  } else {
    message = `A MobileAPI.dev respondeu com status ${response.status}.`;
  }

  const error = new Error(message);
  error.statusCode = response.status === 401 ? 502 : response.status === 429 ? 429 : 502;
  throw error;
  }
    

  return removeLargeBase64Images(body);
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'techfacil-backend' });
});

// Exemplo: /api/devices/search?name=Galaxy%20A07&manufacturer=Samsung&limit=5&page=1
app.get('/api/devices/search', async (req, res, next) => {
  try {
    const name = String(req.query.name || '').trim();
    const manufacturer = String(req.query.manufacturer || '').trim();
    const page = Number.parseInt(String(req.query.page || '1'), 10);
    const limit = Number.parseInt(String(req.query.limit || '5'), 10);
    const exact = req.query.exact === 'true' ? 'true' : undefined;

    if (name.length < 2) {
      return res.status(400).json({ error: 'Informe pelo menos 2 caracteres no nome do celular.' });
    }
    if (name.length > 80 || manufacturer.length > 60) {
      return res.status(400).json({ error: 'O termo de pesquisa é muito longo.' });
    }
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ error: 'O parâmetro page deve ser um inteiro maior que zero.' });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
      return res.status(400).json({ error: 'O parâmetro limit deve ser um inteiro entre 1 e 10.' });
    }

    const query = { name, manufacturer, page, limit, exact };
    const cacheKey = `search:${new URLSearchParams(Object.entries(query).filter(([, v]) => v)).toString()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const result = await callMobileApi('/devices/search/', query);
    setCached(cacheKey, result);
    return res.json({ ...result, cached: false });
  } catch (error) {
    next(error);
  }
});

// Exemplo: /api/devices/12125
// Use esta rota apenas ao precisar de detalhes completos de um aparelho.
app.get('/api/devices/:id', async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1 || String(id) !== req.params.id) {
      return res.status(400).json({ error: 'O ID do aparelho deve ser um inteiro positivo.' });
    }

    const cacheKey = `device:${id}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const result = await callMobileApi(`/devices/${id}/`);
    setCached(cacheKey, result);
    return res.json({ ...result, cached: false });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error('[backend]', error.message);
  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 502;
  const message = error.name === 'TimeoutError' || error.name === 'AbortError'
    ? 'A MobileAPI.dev demorou para responder. Tente novamente mais tarde.'
    : error.message || 'Não foi possível consultar a API de celulares.';
  res.status(statusCode).json({ error: message });
});

app.listen(port, () => {
  console.log(`TechFácil backend ativo em http://localhost:${port}`);
  console.log(`Origem Angular permitida: ${frontendOrigin}`);
  if (!apiKey) {
    console.warn('ATENÇÃO: configure MOBILEAPI_API_KEY no arquivo .env.');
  }
});
