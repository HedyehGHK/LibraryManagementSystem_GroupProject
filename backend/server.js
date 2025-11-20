const express = require("express");
const cors = require("cors");
const { initialize } = require("./db/connection");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend folder when UI is ready
app.use(express.static("frontend"));

// Routes
app.use("/api/books", require("./routes/books"));
app.use("/api/member", require("./routes/member"));
app.use("/api/loans", require("./routes/loans"));
app.use("/api/reports", require("./routes/reports"));

const PORT = 3000;

// Start Oracle + API server
initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} ✔`);
  });
});
