import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateQRCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { lote_id, quantidade } = await req.json();

    if (!lote_id || !quantidade || quantidade < 1) {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: lote, error: loteError } = await supabase
      .from('lotes')
      .select('*, eventos(*)')
      .eq('id', lote_id)
      .single();

    if (loteError || !lote) {
      return new Response(
        JSON.stringify({ error: 'Lote não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const disponivel = lote.quantidade_total - lote.quantidade_vendida;
    if (quantidade > disponivel) {
      return new Response(
        JSON.stringify({ error: 'Ingressos insuficientes' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const ingressos = [];
    for (let i = 0; i < quantidade; i++) {
      const codigo_qr = generateQRCode();
      const { data: ingresso, error: ingressoError } = await supabase
        .from('ingressos')
        .insert({
          evento_id: lote.evento_id,
          lote_id: lote_id,
          comprador_id: user.id,
          codigo_qr: codigo_qr,
          valor_pago: lote.preco,
          status: 'confirmado',
        })
        .select()
        .single();

      if (ingressoError) {
        throw new Error('Erro ao criar ingresso');
      }
      ingressos.push(ingresso);
    }

    await supabase
      .from('lotes')
      .update({ quantidade_vendida: lote.quantidade_vendida + quantidade })
      .eq('id', lote_id);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .ticket { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #e5e7eb; }
          .qr-code { background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 15px 0; border-radius: 8px; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Seus Ingressos</h1>
          </div>
          <div class="content">
            <p>Olá ${profile?.nome || 'Cliente'},</p>
            <p>Sua compra foi confirmada com sucesso! Abaixo estão os detalhes dos seus ingressos:</p>
            
            <div class="info">
              <span class="label">Evento:</span> ${lote.eventos.titulo}
            </div>
            <div class="info">
              <span class="label">Data:</span> ${new Date(lote.eventos.data_evento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div class="info">
              <span class="label">Local:</span> ${lote.eventos.local}
            </div>
            <div class="info">
              <span class="label">Lote:</span> ${lote.nome}
            </div>
            
            ${ingressos.map((ing, idx) => `
              <div class="ticket">
                <h3>Ingresso ${idx + 1}</h3>
                <div class="qr-code">${ing.codigo_qr}</div>
                <p style="text-align: center; color: #6b7280; font-size: 14px;">Apresente este código na entrada do evento</p>
              </div>
            `).join('')}
            
            <div class="info" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
              <span class="label">Total Pago:</span> R$ ${(Number(lote.preco) * quantidade).toFixed(2)}
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Guarde este email com segurança. Você precisará apresentar o QR Code na entrada do evento.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ingressos <onboarding@resend.dev>',
        to: [user.email],
        subject: `Seus ingressos para ${lote.eventos.titulo}`,
        html: emailHtml,
      }),
    });

    return new Response(
      JSON.stringify({ success: true, ingressos }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar compra' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});