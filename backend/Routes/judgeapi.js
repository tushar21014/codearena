const express = require('express');
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
const fetchuser = require('../middleware/fetchuser');
const router = express.Router();
const User = require('../Models/User');
const Stub = require('../Models/Stubs');
const Question = require('../Models/Questions');
const csv = require('csv-parser');
const fs = require('fs');


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

// Get online users
router.get("/online", fetchuser, async (req, res) => {
  const userId = req.user;
  try {
    const response = await User.find({ isOnline: true, _id: { $ne: userId } });

    res.json(response).status(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// const uploadStubs = async (csvFilePath) => {
//   try {
//       const stubsData = [];

//       // Parse the CSV file
//       fs.createReadStream(csvFilePath)
//           .pipe(csv())
//           .on('data', (row) => {
//               stubsData.push(row);
//           })
//           .on('end', async () => {
//               console.log('CSV file successfully processed.');

//               for (const stub of stubsData) {
//                   const { question_id, cpp, python, java } = stub;

//                   // Find the question by question_id
//                   const question = await Question.findById(question_id);

//                   if (!question) {
//                       console.error(`Question not found for ID: ${question_id}`);
//                       continue;
//                   }

//                   // Create a new stub entry
//                   const newStub = new Stub({
//                       question: question._id,
//                       cpp,
//                       python,
//                       java,
//                   });

//                   await newStub.save();
//                   console.log(`Stub saved for question ID: ${question_id}`);
//               }

//               mongoose.connection.close();
//           });
//   } catch (error) {
//       console.error('Error uploading stubs:', error);
//   }
// };

// // Path to your CSV file
// const csvFilePath = 'C:\\Users\\tg210\\OneDrive\\Desktop\\Codes\\vips sem1\\CodeArena\\updatedStubs.csv';
// uploadStubs(csvFilePath);

module.exports = router;