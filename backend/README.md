# Backend inicial do TechFácil

Este backend guarda a chave da MobileAPI.dev fora do Angular e disponibiliza duas rotas:

- `GET /api/devices/search?name=Galaxy%20A07&manufacturer=Samsung&limit=5&page=1`
- `GET /api/devices/:id` — para consultar detalhes completos, por exemplo `/api/devices/12125`
- `GET /health` — verifica se o servidor está ativo.

## Requisitos

- Node.js 20 ou superior.
- Chave ativa da MobileAPI.dev.

## Instalação

1. Extraia o ZIP e renomeie a pasta `techfacil-backend` para `backend`. Coloque-a na raiz do projeto, no mesmo nível de `src`, `public`, `package.json` e `angular.json`.
2. Abra o terminal dentro da pasta `backend`.
3. Execute `npm install`.
4. Copie `.env.example` para um arquivo chamado `.env`.
5. Abra `.env` e substitua `COLOQUE_SUA_CHAVE_AQUI` pela sua chave real. Não compartilhe nem publique esse arquivo.
6. Execute `npm run dev`.
7. Abra `http://localhost:3000/health` no navegador. A resposta esperada é `{"status":"ok","service":"techfacil-backend"}`.
8. Teste a busca em `http://localhost:3000/api/devices/search?name=Galaxy%20A07&manufacturer=Samsung&limit=5&page=1`.

## Notas de segurança e uso

- O `.gitignore` exclui `.env` e `node_modules`.
- O backend não devolve `image_b64`/`logo_b64`, pois o frontend pode utilizar `image_url`.
- A cache em memória dura uma hora, com limite de 100 itens, para reduzir consultas repetidas à API externa.
- `limit` da busca local foi limitado a 10 para não puxar resultados desnecessários enquanto a conta tem uma cota mensal pequena.
- Antes de publicar, configure `FRONTEND_ORIGIN` com a origem exata do seu frontend hospedado. Hospede o backend em um serviço de servidor e mantenha a chave somente nas variáveis de ambiente desse serviço.
- A cache em memória desaparece quando o backend reinicia. Em produção, considere uma cache persistente se necessário.
