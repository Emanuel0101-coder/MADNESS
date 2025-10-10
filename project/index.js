import express from "express";
import cors from "cors";
import mercadopago from "mercadopago";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Configure o Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_TOKEN || "SEU_TOKEN_AQUI",
});

app.post("/api/create_pix", async (req, res) => {
  const { valor, descricao } = req.body;

  try {
    const payment_data = {
      transaction_amount: Number(valor),
      description: descricao || "Ingresso Madness",
      payment_method_id: "pix",
      payer: {
        email: "comprador@exemplo.com",
      },
    };

    const payment = await mercadopago.payment.create(payment_data);

    res.json({
      qr_code: payment.body.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: payment.body.point_of_interaction.transaction_data.qr_code_base64,
    });
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    res.status(500).json({ error: "Erro ao gerar PIX", details: error.message });
  }
});

const PORT = 5173;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
