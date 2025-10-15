import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Payment } from "mercadopago";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🧠 Inicializa Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_TOKEN,
});

// 📍 Define a rota da API antes do static/fallback
app.post("/api/gerar-pix", async (req, res) => {
  try {
    const { valor, descricao, email } = req.body;

    if (!valor || isNaN(valor)) {
      return res.status(400).json({ error: "Valor inválido" });
    }

    const payment = new Payment(client);
    const body = {
      transaction_amount: Number(valor),
      description: descricao || "Compra MADNESS",
      payment_method_id: "pix",
      payer: { email },
    };

    const response = await payment.create({ body });
    res.json({
      status: response.status,
      qr_code: response.point_of_interaction.transaction_data.qr_code,
      qr_base64:
        response.point_of_interaction.transaction_data.qr_code_base64,
    });
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    res.status(500).json({ error: "Falha ao gerar PIX" });
  }
});

// 🧭 Configura caminho estático (frontend build)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

// ⚙️ Fallback SPA (mantido após a rota)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
