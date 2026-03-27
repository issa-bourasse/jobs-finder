const mongoose = require('mongoose');


const JobSechema = new mongoose.Schema({
    title: String,
    company_name: String,
    description: String,
    location: String,
})


const Job = mongoose.model('Job', JobSechema)
module.exports = Job