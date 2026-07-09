const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer'); // ADDED THIS
const fs = require('fs');
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }
});

const boardingFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pet_type: { type: String, required: true },
  breed: { type: String, required: true },
  gender: { type: String, required: true },
  age: { type: String, required: true },
  neutered_spayed: { type: String},
  color: { type: String, required: true },
  weight: { type: String},
  parent_name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  id_proof: { type: String, required: true},
  referred_by: { type: String},
  emergency_contact_name: { type: String},
  emergency_phone: { type: String},
  vet_name: { type: String},
  vet_contact: { type: String},
  vet_address: { type: String},
  morning: { type: String},
  afternoon: { type: String},
  evening: { type: String},
  night: { type: String},
  anti_rabies_given_date: { type: Date, required: true},
  anti_rabies_due_date: { type: Date, required: true },
  nine_in_one_given_date: { type: Date, required: true },
  nine_in_one_due_date: { type: Date, required: true },
  canine_corona_given_date: { type: Date, required: true },
  canine_corona_due_date: { type: Date, required: true },
  kennel_cough_given_date: { type: Date, required: true },
  kennel_cough_due_date: { type: Date, required: true },
  deworming_given_date: { type: Date, required: true },
  deworming_due_date: { type: Date, required: true },
  anti_rabies_proof: { type: String, required: true},
  nine_in_one_proof: { type: String, required: true},
  canine_corona_proof: { type: String, required: true},
  kennel_cough_proof: { type: String, required: true},
  deworming_proof: { type: String, required: true},
  food_allergies: { type: String},
  major_surgery: { type: String },
  special_needs: { type: String },
  attacks: { type: String }
});

const User = mongoose.model('User', userSchema);
const BoardingForm = mongoose.model('BoardingForm', boardingFormSchema);

const app = express();
const port = process.env.PORT || 3000;

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    // Date.now() alone can collide when several files upload in the same
    // millisecond (this form sends up to 6 at once) — add a random suffix
    // so simultaneous uploads never overwrite each other.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit per file
  }
});

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log(err));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => res.render('signup'));

app.post('/signup', async (req, res) => {
  const { username, phone, password, confirmPassword } = req.body;
  if (password !== confirmPassword) return res.status(400).send("Passwords do not match");

  try {
    const newUser = new User({ username, phone, password });
    await newUser.save();
    res.redirect('/signin');
  } catch (err) {
    res.status(500).send('Error creating user.');
  }
});

app.get('/signin', (req, res) => res.render('signin'));

app.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || password != user.password) return res.status(401).send("Invalid credentials");
    req.session.userId = user._id;
    res.redirect('/welcome');
  } catch (err) {
    res.status(500).send("Error signing in.");
  }
});

app.get('/welcome', (req, res) => {
  if (req.session.userId) res.render('welcome');
  else res.redirect('/signin');
});

const fileUploadFields = upload.fields([
  { name: 'id_proof', maxCount: 1 },
  { name: 'anti_rabies_proof', maxCount: 1 },
  { name: 'nine_in_one_proof', maxCount: 1 },
  { name: 'canine_corona_proof', maxCount: 1 },
  { name: 'kennel_cough_proof', maxCount: 1 },
  { name: 'deworming_proof', maxCount: 1 }
]);

// UPDATED BOARDING ROUTE FOR AJAX AND EMAIL
app.post('/boarding', fileUploadFields, async (req, res) => {
  const formData = req.body;

  // Array of all the required file fields
  const requiredFiles = [
      'id_proof',
      'anti_rabies_proof',
      'nine_in_one_proof',
      'canine_corona_proof',
      'kennel_cough_proof',
      'deworming_proof'
  ];

  // Loop through and attach the saved file paths to our formData
  for (const field of requiredFiles) {
      if (req.files && req.files[field] && req.files[field][0]) {
          formData[field] = '/uploads/' + req.files[field][0].filename;
      } else {
          // If any file is missing, reject the form and tell the user which one
          return res.status(400).json({
              success: false,
              message: `Missing required file upload: ${field.replace(/_/g, ' ')}`
          });
      }
  }

  try {
    const newBoardingForm = new BoardingForm(formData);
    await newBoardingForm.save();

    // Draft the Email HTML
    const mailOptions = {
        from: `"Pet Me Maa Boarding" <${process.env.EMAIL_USER}>`,
        to: formData.email,
        subject: `Boarding Registration Confirmed for ${formData.name}! 🐾`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
                <h2 style="color: #4A90E2;">Hello ${formData.parent_name},</h2>
                <p>Thank you for trusting us with your furry family member! We have successfully received the boarding registration for <strong>${formData.name}</strong> (${formData.pet_type}).</p>

                <h3 style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">Application Summary</h3>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li><strong>Pet Name:</strong> ${formData.name}</li>
                    <li><strong>Pet Type:</strong> ${formData.pet_type}</li>
                    <li><strong>Breed:</strong> ${formData.breed}</li>
                    <li><strong>Age:</strong> ${formData.age}</li>
                    <li><strong>Emergency Contact:</strong> ${formData.emergency_contact_name || 'N/A'} (${formData.emergency_phone || 'N/A'})</li>
                </ul>

                <p>Our team is reviewing the vaccination records and medical info you provided. We will contact you at <strong>${formData.phone}</strong> if we need any additional details before your drop-off date.</p>

                <p>If you have any immediate questions, simply reply to this email.</p>
                <br>
                <p>Warm wags,<br><strong>The Pet Me Maa Team</strong></p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending confirmation email: ", error);
        } else {
            console.log("Confirmation email sent: " + info.response);
        }
    });

    res.json({ success: true, message: 'Form submitted successfully' });

  } catch (err) {
    console.error('Error submitting boarding form:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.message);
  // Send JSON instead of plain text so our frontend can read it!
  res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));