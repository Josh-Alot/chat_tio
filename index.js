// index.js — Bot do Vovô Bala Tensa para Discord
require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const Anthropic = require("@anthropic-ai/sdk");
const { SYSTEM_PROMPT } = require("./persona");

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

    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
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
