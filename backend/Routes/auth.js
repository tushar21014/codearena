const express = require('express');
const User = require('../Models/User');
const app = express();
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../Models/User');
const Signature = 'Tushar'
app.use(express.json());
const fetchuser = require('../middleware/fetchuser');
const { json } = require('body-parser');
const nodemailer = require('nodemailer');


// To Create A user
router.post('/createuser', [
  body('email', 'Please enter a valid email').isEmail(),
  body('password', 'Password length should be minimum 5 letters').isLength({ min: 5 }),
  // body('phone').isMobilePhone,
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors)
    return res.status(400).json({ errors: errors.array() });
  }

  const saltRounds = await bcrypt.genSalt(10);
  let secPass = await bcrypt.hash(req.body.password, saltRounds)

  try {
    await User.create({
      username: req.body.username,
      email: req.body.email,
      password: secPass,
    })


    res.json({ success: true })
    console.log("Account Created")


  } catch (error) {
    console.log(error)
    res.json({ success: false })
  }

});



// To login the user

router.post('/login', [
  body('email', 'Please enter a valid email').isEmail(),
  body('password', 'Password length should be minimum 5 letters').isLength({ min: 5 }),
], async (req, res) => {


  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors)
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body
  try {

    const user = await User.findOne({ email });
    // console.log(user);
    if (!user) {
      return res.status(400).json({ errors: "Login with correct credentials" });
    }

    if (!user.password) {
      return res.status(400).json({ errors: "Password not found" });
    }

    const pwdCompare = await bcrypt.compare(password, user.password)
    if (!pwdCompare) {
      return res.status(402).json({ errors: "Login with correct credentials" })
    }


    const data = {
      userr: {
        id: user._id
      }
    }

    // console.log(data);

    const authToken = jwt.sign(data, Signature)
    console.log(user._id)
    res.json({ success: true, authToken: authToken, id : user._id })
    console.log("Logged in SuccessFully")


  } catch (error) {
    console.log(error)
    res.json({ success: false })
  }

});


router.post('/google_signup', async (req, res) => {
  try {
    const userData = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.phone,
      datetime: new Date(),
      uid: req.body.id
    };
    const found = await User.findOne({ email: userData.email });

    // console.log(data);
    if (found) {
      const data = {
        userr: {
          id: found._id
        }
      }

      if (userData.uid) { // Add this check to make sure uid is present in userData
        const authToken = jwt.sign(data, Signature);
        // console.log(authToken);
        console.log("Logged in Successfully");
        res.json({ success: true, authToken: authToken }); // Send the response after the user data has been saved to the database

      }
    }
    else {

      // Insert the user data into your database
      // const main = db.collection('users').insertOne(userData)
      db.collection('users').insertOne(userData, (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error saving user to database');
        } else {
          const insertedId = result.insertedId;
          const data = {
            userr: {
              id: insertedId
            }
          }
          // console.log(data);
          const authToken = jwt.sign(data, Signature);
          // console.log(result);
          res.json({ success: true, authToken: authToken }); // Send the response after the user data has been saved to the database
        }
      });
    }


  } catch (error) {
    console.log("Error at Google Signup", error);
    res.status(400).json({ error: 'Unexpected error occurred' });
  }
});

// Route to get user details
router.post('/getuser', fetchuser, async (req, res) => {

  try {

    let userId = req.user;
    // console.log(userId)
    const user = await User.findById(userId).select("-pass")
    res.send(user)

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})


// Sending a Link to user email to reset password
router.post('/sendLink', async (req, res) => {
  const email = req.body.email;

  if (!email) {
    res.status(401).json({ status: 401, message: "Enter your email" });
  }
  else {

    try {
      const ans = await User.findOne({ "email": email });
      if (ans) {
        const token = jwt.sign({ _id: ans.id }, Signature, {
          expiresIn: '300s'
        });
        console.log(token);
        res.status(200).json(ans);

        const setUserToken = await User.findByIdAndUpdate({ _id: ans.id }, { verify_token: token }, { new: true })


        // Set up a nodemailer SMTP transporter with your email credentials
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          port: 25,
          secure: false,
          auth: {
            user: 'tg21014@gmail.com',
            pass: 'hvvy mshh bqig ewwt'
          }
        });

        const message = {
          from: 'Zomaggy',
          to: email,
          subject: 'Password Reset Link',
          text: `Click the following link to reset your password: 
          http://localhost:3000/ResetPassword/${ans.id}/${token}`,
          html: `<body>
          <div class='parentpass'>
          <div class='passcont' style="padding: 10px 30px 10px 30px;background: beige;">
          <p>Dear ${ans.name} <br>
          We just received a request to reset your password. This link will take you to the password reset page, and you can proceed from there.
          If you did not attempt to reset your password, please ignore this email. No changes will be made to your login information.
          Click the following link to reset your password:</p>
          <a href="http://localhost:3000/ResetPassword/${ans.id}/${token}"> Reset Password</a><br> 
          <b><p>Note: This link is valid for only 5 minutes</p></b></body> <br></div>
          </div>
          Thank You`
        };


        // Send the email with nodemailer
        transporter.sendMail(message, (error, info) => {
          if (error) {
            console.error(error);
            res.status(500).json({ message: 'Error sending email' });
          } else {
            console.log('Email sent: ', info.response);
            res.status(200).json(ans);
          }
        });

        console.log(setUserToken);


      }
      else {
        res.status(401).send({ "message": "User not found", "success": false });
      }

    } catch (error) {
      console.error(error);
    }
  }
})

// Route to change password
router.put('/changePass/:id/:token', async (req, res) => {
  try {
    const { id, token } = req.params;

    // Check for valid user and token
    const validUser = await User.findOne({ _id: id, verify_token: token });

    if (!validUser) {
      res.status(401).send({ message: 'Invalid User or Token' });
      return;
    }

    // Verify token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, Signature);
    } catch (error) {
      res.status(401).send({ message: 'Authentication failed!' });
      return;
    }

    const { pass } = req.body;
    const saltRounds = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(pass, saltRounds);

    const response = await User.findByIdAndUpdate(id, { pass: secPass });

    if (response) {
      res.status(200).send({ message: 'Password Changed successfully' });
      console.log('Password Changed Successfully');
    } else {
      res.status(500).send({ message: 'Error while changing password' });
      console.log('Problem while changing pass');
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;