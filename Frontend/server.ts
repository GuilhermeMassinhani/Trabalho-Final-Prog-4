import express from "express";
import cors from "cors";
import { Pool } from "pg";

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// Configuração do PostgreSQL
const pool = new Pool({
  user: "postgres",      // seu usuário do Postgres
  host: "localhost",
  database: "meubanco",  // nome do banco
  password: "sua_senha", // senha do postgres
  port: 5432,
});

// Rota de login
app.post("/login", async (req, res) => {
  const { nome, senha } = req.body;

  if (!nome || !senha) {
    return res.status(400).json({ message: "Preencha todos os campos" });
  }

  try {
    await pool.query(
      "INSERT INTO usuarios (nome, senha) VALUES ($1, $2)",
      [nome, senha]
    );
    res.json({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao inserir usuário:", error);
    res.status(500).json({ message: "Erro no servidor" });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
