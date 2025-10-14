// api/create_pix.js
import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_TOKEN, 
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { valor, descricao } = req.body;

  try {
    const payment_data = {
      transaction_amount: Number(valor),
      description: descricao || "Ingresso Madness",
      payment_method_id: "pix",
      payer: {
        email: "comprador@exemplo.com", // pode ser dinâmico depois
      },
    };

    const payment = await mercadopago.payment.create(payment_data);

    return res.status(200).json({
      qr_code: payment.body.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: payment.body.point_of_interaction.transaction_data.qr_code_base64,
    });
  } catch (error) {
    console.error("Erro ao gerar PIX:", error);
    return res.status(500).json({ error: "Erro ao gerar PIX", details: error.message });
  }
}
