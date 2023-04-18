const express = require("express");
var cors = require("cors");
const { events } = require("./kafka");

const app = express();

app.use(express.static("dist"));
app.use(cors());

app.get("/api/alerts", (_req, res) => {
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  events.on("alert", (alert) => {
    res.write(`data: ${JSON.stringify(alert)}\n\n`);
  });
});

app.get("/health", (_req, res) => {
  res.send({ ok: "ok" });
});

app.listen(process.env.PORT || 8080, () =>
  console.log(`Listening on port ${process.env.PORT || 8080}!`)
);
