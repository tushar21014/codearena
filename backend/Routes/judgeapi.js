const express = require('express');
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
const router = express.Router();
app.use(express.json());

app.use(bodyParser.json());
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_HEADERS = {
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": process.env.RAPID_API_KEY, // Replace with your RapidAPI key
};

router.post("/execute", async (req, res) => {
  const { language_id, source_code, stdin } = req.body;

  try {
    const submission = await axios.post(
      `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      { language_id, source_code, stdin },
      { headers: JUDGE0_HEADERS }
    );

    res.json(submission.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;