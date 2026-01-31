import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(
  cors({
    origin: true
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const port = Number.parseInt(process.env.PORT ?? "4000", 10) || 4000;
app.listen(port, () => {
  console.log(`api listening on ${port}`);
});
