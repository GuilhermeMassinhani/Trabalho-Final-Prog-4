// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000; // porta diferente do frontend

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());

// Conexão com MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no banco:", err);
    return;
  }
  console.log("Conectado ao banco MySQL!");
});

// Rota de login
app.post("/login", (req, res) => {
  const { nome, senha } = req.body; // manter igual ao frontend

  if (!nome || !senha) {
    return res.status(400).json({ message: "Usuário e senha são obrigatórios" });
  }

  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [nome, senha],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Erro no servidor" });
      }

      if (results.length > 0) {
        res.json({ message: "Login bem-sucedido!" });
      } else {
        res.status(401).json({ message: "Usuário ou senha incorretos" });
      }
    }
  );
});

// Start do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
