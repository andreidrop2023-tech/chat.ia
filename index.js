import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// 🔹 Rota de verificação (usada pela Meta)
app.get("/webhook", (req, res) => {
  const verify_token = "meu_token_secreto"; // Mude se quiser
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === verify_token) {
    console.log("Webhook verificado com sucesso!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 🔹 Rota principal: recebe mensagens e responde com GPT
app.post("/webhook", async (req, res) => {
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return res.sendStatus(200);

  const from = message.from;
  const text = message.text?.body;

  if (text) {
    try {
      // 🔸 1. Envia o texto para o GPT
      const gptResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: text }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const reply = gptResponse.data.choices[0].message.content;

      // 🔸 2. Envia a resposta para o WhatsApp
      await axios.post(
        `https://graph.facebook.com/v21.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          type: "text",
          text: { body: reply },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.META_TOKEN}`,
          },
        }
      );

      console.log("✅ Mensagem enviada com sucesso!");
    } catch (error) {
      console.error("❌ Erro:", error.response?.data || error.message);
    }
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 Servidor rodando na porta 3000"));
