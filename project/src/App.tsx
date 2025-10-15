import { useState } from "react";
import "./index.css";

function App() {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [email, setEmail] = useState("");
  const [resposta, setResposta] = useState("");

  const gerarPix = async () => {
    try {
      // 🔹 Corrige URL — remove barras extras e usa URL relativa em dev
      const base = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
      const url = base ? `${base}/api/gerar-pix` : `/api/gerar-pix`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: Number(valor),
          descricao,
          email,
        }),
      });

      // 🔹 Checa se a resposta é JSON válida
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Resposta inesperada do servidor: ${text.slice(0, 100)}`);
      }

      const data = await response.json();
      setResposta(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error(err);
      setResposta("Erro ao gerar PIX: " + err.message);
    }
  };

  return (
    <div className="container">
      <h1>Gerar PIX</h1>
      <input
        type="number"
        placeholder="Valor"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      <input
        type="text"
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={gerarPix}>Gerar PIX</button>
      <pre>{resposta}</pre>
    </div>
  );
}

export default App;
