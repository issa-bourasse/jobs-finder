const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jobRoutes = require('./routes/jobs');

const app = express();
app.use(cors());
app.use(express.json());

// &q=Barista&location=Austin,+Texas,+United+States&google_domain=google.com&hl=en&gl=us&api_key=
// const query = 'Barista';
// const location = 'Austin, Texas, United States';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jobsearch';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))  
    .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (_req, res) => {
    res.send('Hello World!');
});


app.use('/', jobRoutes);



app.listen(3000, () => {
  console.log('Server is running on port 3000');
});