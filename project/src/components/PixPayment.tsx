import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Loader } from 'lucide-react';

interface PixPaymentProps {
  amount: number;
  eventName: string;
  loteId: string;
  quantidade: number;
  email: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function PixPayment({ amount, eventName, loteId, quantidade, email, onSuccess, onClose }: PixPaymentProps) {
  const [qrImage, setQrImage] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    generatePixPayment();
  }, []);

  async function generatePixPayment() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gerar-pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: amount,
          descricao: `Ingresso ${eventName} - Lote ${loteId}`,
          email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPaymentId(result.payment_id);
        setQrCode(result.qr_code);
        setQrImage(`data:image/png;base64,${result.qr_code_base64}`);
      } else {
        setError(result.error || 'Erro ao gerar QR Code PIX');
      }
    } catch (err) {
      setError('Erro ao conectar com servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyPixCode() {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Erro ao copiar código PIX');
    }
  }

  async function checkPaymentStatus() {
    if (!paymentId) return;

    setChecking(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/verificar-pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: paymentId,
          lote_id: loteId,
          quantidade,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'approved') {
        onSuccess();
      } else if (response.ok && result.status === 'pending') {
        alert('Pagamento ainda não foi detectado. Por favor, aguarde alguns instantes e tente novamente.');
      } else {
        alert(result.error || 'Erro ao verificar pagamento');
      }
    } catch {
      alert('Erro ao verificar pagamento');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full my-8 shadow-xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Pagamento via PIX</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-center">{error}</p>
              <button
                onClick={generatePixPayment}
                className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Tentar Novamente
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Gerando QR Code PIX...</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Evento</p>
                <p className="text-lg font-semibold text-gray-900 mb-4">{eventName}</p>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Valor total</p>
                  <p className="text-3xl font-bold text-blue-600">R$ {amount.toFixed(2)}</p>
                </div>
              </div>

              {qrImage && (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                    <img src={qrImage} alt="QR Code PIX" className="w-64 h-64" />
                  </div>

                  <p className="text-sm text-gray-600 text-center mb-4">
                    Escaneie o QR Code com o app do seu banco ou copie o código abaixo
                  </p>

                  <button
                    onClick={handleCopyPixCode}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium mb-4"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Código copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copiar código PIX
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Após realizar o pagamento, clique em "Já Paguei" para verificar e confirmar sua compra.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={checkPaymentStatus}
                  disabled={checking}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Verificando pagamento...
                    </>
                  ) : (
                    'Já Paguei - Verificar Pagamento'
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
