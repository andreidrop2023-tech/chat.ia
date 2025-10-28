import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

// Cria o cliente OpenAI usando variável de ambiente
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // <-- nome correto
});

// Rota de teste
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      reply: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error: error.message });
  }
});

// Teste simples para ver se a chave está sendo lida
app.get("/check", (req, res) => {
  if (process.env.OPENAI_API_KEY) {
    res.send("✅ OPENAI_API_KEY encontrada!");
  } else {
    res.send("❌ OPENAI_API_KEY não encontrada!");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
