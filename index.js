import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ✅ VERIFICAÇÃO DO WEBHOOK (necessário para Meta)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ RECEBE MENSAGENS DO WHATSAPP E RESPONDE COM OPENAI
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (messages && messages[0]) {
      const msg = messages[0];
      const from = msg.from;
      const text = msg.text?.body;

      console.log("📩 Mensagem recebida:", text);

      // Gera resposta com OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: text }],
      });

      const resposta = completion.choices[0].message.content;
      console.log("🤖 Resposta:", resposta);

      // Envia resposta pelo WhatsApp Cloud API
      await fetch(
        "https://graph.facebook.com/v19.0/885804834608431/messages",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            text: { body: resposta },
          }),
        }
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Erro:", error);
    res.sendStatus(500);
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
);
