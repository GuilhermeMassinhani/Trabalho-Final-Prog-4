import React, { useState } from "react";

const Login: React.FC = () => {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5173/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, senha }),
      });

      const data = await response.json();
      setMensagem(data.message);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setMensagem("Erro no servidor");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full p-2 mb-3 border rounded-md"
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full p-2 mb-3 border rounded-md"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
        >
          Entrar
        </button>

        {mensagem && (
          <p className="text-center mt-3 text-sm text-gray-700">{mensagem}</p>
        )}
      </form>
    </div>
  );
};

export default Login;
