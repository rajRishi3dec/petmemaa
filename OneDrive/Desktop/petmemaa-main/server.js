const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();




// Routes
// const authRoutes = require('./routes/auth');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }
});

const boardingFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  breed: { type: String, required: true },
  gender: { type: String, required: true },
  age: { type: String, required: true },
  neutered_spayed: { type: String, required: true },
  color: { type: String, required: true },
  weight: { type: String, required: true },
  parent_name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  id_proof: { type: String, required: true },
  referred_by: { type: String, required: true },
  emergency_contact_name: { type: String, required: true },
  emergency_phone: { type: String, required: true },
  vet_name: { type: String, required: true },
  vet_contact: { type: String, required: true },
  vet_address: { type: String, required: true },
  morning: { type: String, required: true },
  afternoon: { type: String, required: true },
  evening: { type: String, required: true },
  night: { type: String, required: true },
  anti_rabies_given_date: { type: Date, required: true },
  anti_rabies_due_date: { type: Date, required: true },
  nine_in_one_given_date: { type: Date, required: true },
  nine_in_one_due_date: { type: Date, required: true },
  canine_corona_given_date: { type: Date, required: true },
  canine_corona_due_date: { type: Date, required: true },
  kennel_cough_given_date: { type: Date, required: true },
  kennel_cough_due_date: { type: Date, required: true },
  deworming_given_date: { type: Date, required: true },
  deworming_due_date: { type: Date, required: true },
  food_allergies: { type: String, required: true },
  major_surgery: { type: String },
  special_needs: { type: String },
  attacks: { type: String }
});

const User = mongoose.model('User', userSchema);
const BoardingForm = mongoose.model('BoardingForm', boardingFormSchema);

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
}));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route to render signup page
app.get('/', (req, res) => {
  res.render('signup'); // Assuming signup.ejs is in views directory
});

// Route to handle signup form submission
app.post('/signup', async (req, res) => {
  const { username, phone, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  try {
    // Create new user
    const newUser = new User({
      username,
      phone,
      password // Store hashed password
    });

    // Save user to database
    await newUser.save();

    console.log('User created successfully');
    res.redirect('/signin'); // Redirect to signin page after successful signup
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).send('Error creating user. Please try again.');
  }
});

// Route to render signin page
app.get('/signin', (req, res) => {
  res.render('signin'); // Assuming signin.ejs is in views directory
});

// Route to handle signin form submission
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await User.findOne({ username });

    // Check if user exists
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).send("Invalid credentials");
    }

    if (password != user.password) {
      console.log('Incorrect password for user:', username);
      return res.status(401).send("Invalid credentials");
    }

    req.session.userId = user._id;

    res.redirect('/welcome');
  } catch (err) {
    console.error("Error signing in:", err);
    res.status(500).send("Error signing in. Please try again.");
  }
});

// Route to render home page
app.get('/welcome', (req, res) => {
  if (req.session.userId) {
    res.render('welcome'); // Assuming welcome.ejs is in views directory
  } else {
    res.redirect('/signin'); // Redirect to signin if not authenticated
  }
});

// Route to handle boarding form submission

app.post('/boarding', async (req, res) => {
  const formData = req.body;

  try {
    const newBoardingForm = new BoardingForm(formData);
    await newBoardingForm.save();

    console.log('Boarding form submitted successfully');
    res.redirect('/welcome');
  } catch (err) {
    console.error('Error submitting boarding form:', err);
    res.status(500).send('Error submitting form. Please try again.');
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

