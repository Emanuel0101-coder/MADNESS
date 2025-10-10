// Função para gerar Payload PIX BR Code (EMV/BCB PIX)
export type BuildBRCodeParams = {
  pixKey: "118.554.049-07";         // chave PIX dinâmica
  amount?: "40.00";        // valor em reais, opcional
  merchantName: "EMANUEL AUGUSTO DE ALMEIDA";
  merchantCity: "GUARATUBA";
  txid: string;           // identificador único da transação
};

// Gera o Payload BR Code
export function buildBRCode({
  pixKey,
  amount,
  merchantName,
  merchantCity,
  txid,
}: BuildBRCodeParams) {

  function truncateToBytes(str: string, maxBytes: number): string {
    const enc = new TextEncoder();
    let result = '';
    for (const ch of str) {
      const candidate = result + ch;
      if (enc.encode(candidate).length > maxBytes) break;
      result = candidate;
    }
    return result;
  }

  function format(id: string, value: string) {
    const length = value.length.toString().padStart(2, '0');
    return id + length + value;
  }

  const merchantNameSafe = truncateToBytes(merchantName, 25);
  const merchantCitySafe = truncateToBytes(merchantCity, 15);

  const payload = [
    format('00', '01'), // Payload Format Indicator
    format('26', [
      format('00', 'BR.GOV.BCB.PIX'),
      format('01', pixKey),
      txid ? format('02', txid) : '',
    ].join('')),
    format('52', '0000'), // Merchant Category Code
    format('53', '986'),  // Currency (BRL)
    amount ? format('54', amount) : '', // Valor, opcional
    format('58', 'BR'),   // Country Code
    format('59', merchantNameSafe),
    format('60', merchantCitySafe),
    format('62', txid ? format('05', txid) : ''), // Additional Data Field Template
  ].join('');

  const fullPayload = payload + '6304' + getCRC16(payload + '6304');
  return fullPayload;
}

// Cálculo do CRC16-CCITT (obrigatório)
function getCRC16(payload: string) {
  const bytes = new TextEncoder().encode(payload);
  let crc = 0xffff;
  const poly = 0x1021;

  for (const b of bytes) {
    crc ^= (b << 8);
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ poly) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}
