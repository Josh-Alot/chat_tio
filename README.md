# 👴 Vovô Bala Tensa — Bot de Discord

Um bot humorístico que entende qualquer pedido, promete ajudar e nunca faz nada — sempre dando uma desculpa no estilo do Vovô Bala Tensa.

## O que você vai precisar

- **Node.js 18 ou superior** instalado (https://nodejs.org)
- Uma **chave da API da Anthropic** (https://console.anthropic.com → API Keys)
- Um **bot criado no Discord** (passos abaixo)

---

## Passo 1 — Criar o bot no Discord

1. Acesse https://discord.com/developers/applications e clique em **New Application**. Dê o nome "Vovô Bala Tensa".
2. No menu lateral, vá em **Bot**.
3. Em **Privileged Gateway Intents**, ative o **MESSAGE CONTENT INTENT** (obrigatório para o bot ler as mensagens). Salve.
4. Clique em **Reset Token** e copie o token gerado — é o seu `DISCORD_TOKEN`. (Guarde com cuidado; ele dá controle total do bot.)

## Passo 2 — Convidar o bot pro seu servidor

1. No menu lateral, vá em **OAuth2 → URL Generator**.
2. Em **Scopes**, marque `bot`.
3. Em **Bot Permissions**, marque pelo menos: `Send Messages`, `Read Message History`, `View Channels`.
4. Copie a URL gerada no rodapé, abra no navegador e escolha o servidor onde quer adicionar o bot.

## Passo 3 — Configurar o projeto

1. Abra um terminal nesta pasta (`vovo-bot`).
2. Instale as dependências:
   ```
   npm install
   ```
3. Copie o arquivo de exemplo de variáveis:
   ```
   cp .env.example .env
   ```
   (No Windows: `copy .env.example .env`)
4. Abra o `.env` e preencha o `DISCORD_TOKEN` e o `ANTHROPIC_API_KEY`.

## Passo 4 — Rodar

```
npm start
```

Se aparecer "Vovô Bala Tensa online..." no terminal, está funcionando.

---

## Como usar no Discord

O bot responde de duas formas:

- **Mencionando ele:** `@Vovô Bala Tensa me ajuda a estudar pra prova`
- **Com o prefixo:** `!vovo conserta meu PC pra mim`

E ele vai... ó, ele vai ver o que dá pra fazer. 😏

---

## Personalizar

- **Desculpas e personalidade:** edite o arquivo `persona.js`. Toda a lista de desculpas e a descrição do estilo estão lá.
- **Prefixo de comando:** mude a constante `PREFIX` no `index.js`.
- **Tamanho da memória:** ajuste `MAX_TURNS` no `index.js` (quantos turnos ele lembra por canal).
- **Modelo:** o `index.js` usa `claude-sonnet-4-6` (rápido e barato). Dá pra trocar por outro modelo da API se quiser.

## Observações

- A memória é guardada **na RAM**, então reinicia quando o bot reinicia. Pra algo persistente, use um banco de dados (SQLite, Redis, etc.).
- Para o bot ficar online 24h, hospede em um serviço como Railway, Render, Fly.io ou uma VPS.
- Por ser uma paródia de uma pessoa pública, mantenha o enquadramento de humor claro e não use o bot pra se passar pela pessoa real de forma enganosa.
