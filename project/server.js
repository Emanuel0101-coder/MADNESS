// server.js
import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Payment } from "mercadopago";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// --- CONFIGURAÇÕES INICIAIS ---
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- MERCADOPAGO ---
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_TOKEN,
});
const paymentInstance = new Payment(client);

// --- ROTAS BACKEND ---
app.post("/api/gerar-pix", async (req, res) => {
  try {
    const { valor, descricao, email } = req.body;

    if (!valor) return res.status(400).json({ error: "Valor inválido" });

    const payment = await paymentInstance.create({
      body: {
        transaction_amount: Number(valor),
        description: descricao || "Ingresso Madness",
        payment_method_id: "pix",
        payer: { email: email || "comprador@exemplo.com" },
      },
    });

    res.status(200).json({
      payment_id: payment.id,
      qr_code: payment.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: payment.point_of_interaction.transaction_data.qr_code_base64,
    });
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    res.status(500).json({ error: "Erro ao gerar PIX", details: error.message });
  }
});

// --- SERVE FRONTEND BUILDADO ---
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// --- START SERVER ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
