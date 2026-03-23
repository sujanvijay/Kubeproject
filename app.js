const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

let tasks = [];

// ✅ API routes FIRST
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  console.log("BODY:", req.body);
  tasks.push({ task: req.body.task });
  res.json({ message: "Task Added" });
});

app.delete("/tasks/:id", (req, res) => {
  tasks.splice(req.params.id, 1);
  res.json({ message: "Task Deleted" });
});

// ✅ Serve HTML AFTER routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running");
});
