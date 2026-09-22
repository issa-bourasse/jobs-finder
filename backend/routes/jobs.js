const express = require('express');
const job = require('../models/job');

const API_URL = 'https://serpapi.com/search.json?engine=google_jobs';
// Set SERPAPI_KEY in your .env file. Never commit the real key.
const API_KEY = process.env.SERPAPI_KEY;

const router = express.Router();

router.get('/jobs', async (req, res) => {
    const query = req.query.query;
    const location = req.query.location;
    const url = `${API_URL}&q=${query}&location=${location}&google_domain=google.com&hl=en&gl=us&api_key=${API_KEY}`;
    try {
        const respond = await fetch(url);
        const data = await respond.json();
        const jobResults = data.jobs_results || [];

        // Save each job to MongoDB (upsert to avoid duplicates)
        const savePromises = jobResults.map((j) =>
            job.findOneAndUpdate(
                { title: j.title, company_name: j.company_name, location: j.location },
                { title: j.title, company_name: j.company_name, location: j.location, description: j.description },
                { upsert: true, new: true }
            )
        );
        await Promise.all(savePromises);

        res.json({ jobs_results: jobResults });
    } catch (err) {
        console.error('Job fetch error:', err);
        res.status(500).json({ error: 'error fetching jobs', details: err.message });
    }
});

//get all 
router.get('/all-jobs', async (req, res) => {
    try{
        const allJobs = await job.find({});
        res.json({ jobs: allJobs });
    } catch (err) {
        console.error('Error fetching all jobs:', err);
        res.status(500).json({ error: 'Error fetching all jobs', details: err.message });

    }
})



module.exports = router;