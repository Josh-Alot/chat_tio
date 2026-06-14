// index.js — Bot do Vovô Bala Tensa para Discord
require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const Anthropic = require("@anthropic-ai/sdk");
const { buildSystemPrompt, EXCUSE_LIST } = require("./persona");

// --- Clientes ---
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // intent privilegiada — ative no painel do bot
  ],
  partials: [Partials.Channel],
});

// --- Memória curta por canal (pra ele variar as desculpas) ---
const histories = new Map(); // channelId -> [{role, content}, ...]
const MAX_TURNS = 8; // últimos 8 pares de mensagens

function getHistory(channelId) {
  if (!histories.has(channelId)) histories.set(channelId, []);
  return histories.get(channelId);
}

// Prefixo opcional pra acionar o bot, além de @mencionar
const PREFIX = "!vovo";

// --- Sorteio de desculpas com cooldown por canal (anti-repetição) ---
const offered = new Map(); // channelId -> índices oferecidos recentemente
const COOLDOWN = 25; // não re-oferecer os últimos ~25 índices
const PER_TURN = 14; // quantas desculpas mandar por mensagem

function pickExcuses(channelId) {
  const recent = offered.get(channelId) || [];
  let pool = [...EXCUSE_LIST.keys()].filter((i) => !recent.includes(i));
  if (pool.length < PER_TURN) pool = [...EXCUSE_LIST.keys()]; // reseta quando a lista esgota
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, PER_TURN);
  offered.set(channelId, [...recent, ...picked].slice(-COOLDOWN));
  return picked.map((i) => EXCUSE_LIST[i]);
}

// --- Heurísticas determinísticas: lê sinais da mensagem e vira "dica" pro prompt ---
const XINGAMENTOS = [
  "idiota", "burro", "lixo", "trouxa", "imbecil",
  "otario", "otário", "vagabundo", "merda", "arrombado", "fdp",
];

function detectHints(text, message) {
  const hints = [];
  const t = text.toLowerCase();
  const soLetras = text.replace(/[^A-Za-zÀ-ÿ]/g, "");

  if (soLetras.length >= 8 && soLetras === soLetras.toUpperCase())
    hints.push("Está GRITANDO (caps lock): responda com calma superior e debochada.");
  if ((text.match(/[!?]/g) || []).length >= 3)
    hints.push("Está exaltado: trate como gente alterada, sem perder a pose.");
  if (text.length > 300)
    hints.push("Mensagem enorme: responda curto e desdenhoso, reclame do tamanho.");
  else if (text.length < 15)
    hints.push("Mensagem curtinha: pode encher linguiça e enrolar.");
  if (XINGAMENTOS.some((x) => t.includes(x)))
    hints.push("Te xingaram: vitimismo + superioridade, sem revidar na mesma baixaria.");
  if (/\bcaio\b/.test(t))
    hints.push('Te chamaram de "Caio": aja com extrema agressividade, no tom do exemplo "Agressivo".');
  if (/\b(adm|adeyeme|klonesias)\b/.test(t))
    hints.push('Citaram o admin (Klonesias, apelidos "adm"/"adeyeme"): pode citá-lo nominalmente ou não, conforme a piada.');
  const outros = message.mentions.users.filter((u) => u.id !== client.user.id).size;
  if (outros > 0)
    hints.push("Marcaram outra pessoa: você pode jogar um contra o outro.");

  return hints;
}

// --- Reações de emoji conforme o tom (roda em paralelo com a resposta) ---
async function reactToTone(message, hints) {
  try {
    const txt = hints.join(" ");
    if (/Caio|xingaram|GRITANDO|exaltado/.test(txt)) await message.react("😏");
    else if (/enorme/.test(txt)) await message.react("😴");
    else if (/admin/.test(txt)) await message.react("👀");
    else if (Math.random() < 0.2) await message.react("👴");
  } catch {
    /* sem permissão de reagir no canal, ignora */
  }
}

client.once("ready", () => {
  console.log(`Vovô Bala Tensa online como ${client.user.tag}. Bemza <3`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // ignora outros bots

  const mentioned = message.mentions.has(client.user);
  const hasPrefix = message.content.toLowerCase().startsWith(PREFIX);
  if (!mentioned && !hasPrefix) return; // só responde se chamado

  // Extrai o pedido limpo (sem a menção / prefixo)
  let pedido = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .trim();
  if (hasPrefix) pedido = pedido.slice(PREFIX.length).trim();
  if (!pedido) pedido = "fala um oi aí, Vovô";

  const history = getHistory(message.channel.id);
  history.push({ role: "user", content: pedido });

  try {
    await message.channel.sendTyping();

    const hints = detectHints(pedido, message);
    reactToTone(message, hints); // não dá await: não atrasa a resposta

    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: buildSystemPrompt(pickExcuses(message.channel.id), hints),
      messages: history,
    });

    const texto = resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim() || "Esqueci o que ia falar, netinho. Bemza <3";

    history.push({ role: "assistant", content: texto });

    // Mantém a memória curta
    while (history.length > MAX_TURNS * 2) history.shift();

    await message.reply(texto);
  } catch (err) {
    console.error(err);
    await message.reply(
      "Rapaziada, infelizmente a internet não tá cooperando nem fufu aqui com a API! 😅"
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
