# TechFácil 📱

**Celular certo, sem complicação!**

O TechFácil é uma aplicação desenvolvida para ajudar pessoas a escolherem o celular ideal de acordo com suas necessidades. A plataforma permite comparar aparelhos, consultar especificações técnicas e receber uma análise em linguagem simples realizada pelo **Facilito.AI**.

O objetivo é tornar a escolha de um smartphone mais fácil e acessível, inclusive para pessoas que não possuem conhecimentos sobre hardware.

## ✨ Funcionalidades

- **Comparação de celulares:** permite selecionar de 2 a 3 aparelhos para comparação.
- **Facilito.AI:** realiza análises das especificações e apresenta uma classificação dos aparelhos.
- **Classificação inteligente:** apresenta os celulares em primeiro, segundo e terceiro lugar, permitindo empates quando necessário.
- **Informações em linguagem simples:** explica as diferenças entre os aparelhos sem exigir conhecimentos técnicos.
- **Edição de especificações:** permite corrigir informações dos celulares, como memória RAM, armazenamento, bateria e outros componentes.
- **Busca de celulares:** permite pesquisar aparelhos adicionais utilizando a MobileAPI.
- **Catálogo próprio:** disponibiliza celulares cadastrados localmente em um arquivo JSON.
- **Busca em lojas:** oferece links de pesquisa de produtos no Mercado Livre, Shopee, Amazon e Magazine Luiza.
- **Comparações salvas:** permite que usuários autenticados salvem suas comparações para consultar posteriormente.
- **Dicionário de termos:** apresenta explicações simples sobre componentes e características dos smartphones.
- **Interface responsiva:** permite acessar a aplicação em diferentes tamanhos de tela.

## 🤖 Facilito.AI

O Facilito.AI é o assistente responsável por analisar as características dos celulares selecionados.

A análise considera sete aspectos:

1. Memória RAM;
2. Armazenamento;
3. Processador (CPU);
4. Placa de vídeo (GPU);
5. Qualidade da tela;
6. Bateria;
7. Câmeras.

A classificação considera o conjunto das informações disponíveis, sem utilizar notas ou pesos fixos.

### Regras da comparação

- A análise não considera preço ou marca como critérios de classificação.
- Informações ausentes não são automaticamente tratadas como pontos negativos.
- O assistente não deve inventar especificações ou resultados de benchmarks.
- A capacidade da bateria, medida em mAh, não garante sozinha a autonomia do aparelho.
- A quantidade de megapixels não determina, isoladamente, a qualidade das câmeras.
- A avaliação da tela considera painel, resolução e frequência quando essas informações estão disponíveis.
- Empates são permitidos quando não existe uma vantagem suficientemente clara entre os aparelhos.

O projeto utiliza modelos de inteligência artificial disponibilizados pelo **OpenRouter**, priorizando modelos gratuitos.

## 🛠️ Tecnologias utilizadas

### Frontend
- Angular
- TypeScript
- HTML5
- CSS3
- RxJS

### Backend
- Node.js
- Express
- JavaScript
- dotenv
- CORS
- express-rate-limit

### Serviços externos
- OpenRouter: acesso aos modelos de inteligência artificial.
- MobileAPI: consulta de informações adicionais sobre dispositivos.

### Armazenamento
- Arquivo JSON para o catálogo local de celulares.
- LocalStorage do navegador para armazenar comparações salvas.

## 📂 Organização do projeto

A estrutura principal do projeto está organizada da seguinte forma:

```text
TechFacil/
│
├── backend/
│   ├── server.js
│   ├── facilito.js
│   ├── package.json
│   └── .env
│
├── public/
│   ├── data/
│   │   └── celulares.json
│   │
│   └── img/
│       ├── projeto/
│       ├── motorola/
│       ├── samsung/
│       └── ...
│
├── src/
│   └── app/
│       ├── componentes/
│       ├── pages/
│       │   └── home/
│       │       ├── home.ts
│       │       ├── home.html
│       │       └── home.css
│       │
│       └── services/
│           ├── auth.ts
│           ├── celulares-api.service.ts
│           └── facilito.service.ts
│
├── angular.json
├── package.json
└── README.md
```

*Essa árvore apresenta os principais arquivos e pastas conhecidos do projeto. Outros arquivos e componentes podem existir na aplicação.*

## 📱 Catálogo de celulares

Os celulares cadastrados localmente ficam no arquivo:

```text
public/data/celulares.json
```

Cada aparelho é representado por um objeto JSON.

Exemplo de estrutura:

```json
{
  "id": 15,
  "nome": "Nome do celular",
  "imagem": "/img/marca/modelo.png",
  "specs": {
    "armazenamento": "128GB",
    "ram": "8GB",
    "bateria": "5000 mAh",
    "processador": "Nome do processador",
    "gpu": "Nome da GPU",
    "qualidadeImagem": "6.7 pol AMOLED FHD+ 120Hz",
    "camera": "50 MP OIS + 8 MP ultrawide"
  }
}
```

Para adicionar novos aparelhos, é necessário:

- Utilizar um ID exclusivo.
- Informar o nome completo do aparelho.
- Adicionar a imagem correspondente.
- Preencher as especificações disponíveis.
- Utilizar "Não informado" quando uma informação não estiver disponível.

As imagens devem ser adicionadas à pasta pública correspondente, respeitando o caminho informado no JSON.

## 🚀 Como executar o projeto localmente

### Requisitos

Antes de executar o projeto, instale:

- Node.js;
- npm;
- Angular CLI (pode ser utilizado pelo `npx`).

### 1. Clonar o repositório

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do projeto:

```bash
cd TechFacil
```

### 2. Instalar as dependências do Angular

Na pasta principal do projeto, execute:

```bash
npm install
```

### 3. Executar o frontend

Ainda na pasta principal:

```bash
npx ng serve
```

A aplicação ficará disponível em:

```text
http://localhost:4200
```

### 4. Configurar o backend

Abra outro terminal e acesse a pasta:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` dentro da pasta `backend`:

```env
PORT=3000

MOBILEAPI_API_KEY=sua_chave_mobileapi

OPENROUTER_API_KEY=sua_chave_openrouter

OPENROUTER_MODELS=nvidia/nemotron-3.5-lightning:free,nvidia/nemotron-3.5-super-vl:free,nvidia/nemotron-3-ultra-550b-a55b:free
```

Substitua os valores das chaves pelas suas credenciais.

**Importante:** o arquivo `.env` contém informações secretas e não deve ser enviado ao GitHub.

### 5. Executar o backend

Dentro da pasta `backend`, execute:

```bash
node server.js
```

O backend estará disponível em:

```text
http://localhost:3000
```

A rota de verificação de funcionamento é:

```text
http://localhost:3000/health
```

A rota utilizada pelo Facilito.AI é:

```text
POST /api/facilito/comparar
```

## 🔐 Segurança e configurações

- As chaves da OpenRouter e da MobileAPI devem permanecer exclusivamente no backend.
- O arquivo `.env` não deve ser publicado no repositório.
- O backend utiliza CORS para controlar quais origens podem acessar a API.
- O Express possui limitação de requisições para reduzir solicitações excessivas.
- As configurações de produção devem utilizar os endereços públicos dos serviços.

## ☁️ Publicação

O projeto está preparado conceitualmente para ser publicado utilizando serviços de hospedagem como a Vercel.

A arquitetura de publicação prevista utiliza:

- Um projeto para hospedar o frontend Angular.
- Um projeto para hospedar o backend Node.js/Express.
- Comunicação entre os dois projetos por meio de requisições HTTPS.

A publicação exige configurar os endereços públicos da API, o CORS e as variáveis de ambiente no painel de hospedagem.

**A implantação em produção ainda precisa ser configurada e validada.**

## 💾 Comparações salvas

As comparações concluídas podem ser salvas pelos usuários autenticados.

Atualmente, o projeto utiliza o LocalStorage do navegador para armazenar essas informações. Isso significa que os dados ficam associados ao navegador utilizado e não são sincronizados automaticamente entre dispositivos.

## 🎯 Objetivo do projeto

O TechFácil busca simplificar a escolha de smartphones, transformando informações técnicas em explicações acessíveis.

Com o auxílio do Facilito.AI, a plataforma procura ajudar o usuário a entender as diferenças entre os aparelhos e tomar uma decisão mais consciente, sem precisar dominar os termos técnicos do mercado de tecnologia.

**TechFácil — Celular certo, sem complicação!**