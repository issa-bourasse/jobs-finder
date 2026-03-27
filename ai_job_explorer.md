# 🚀 Full Stack App Exercise --- AI Job Explorer

## 🧩 Project Overview

AI Job Explorer is a web application that allows users to search for
jobs using a real external API.

------------------------------------------------------------------------

## 🎯 Objective

Build a full-stack application (MERN-style) that: - Uses an external API
to fetch job data - Displays results to users - Demonstrates real-world
architecture

------------------------------------------------------------------------

## 💡 Idea

Users can: - Search for jobs (e.g. "React Developer") - View job
listings from a real API - Interact with live external data

------------------------------------------------------------------------

## 🧠 How It Works

User → Frontend → Backend → External API → Backend → Frontend → UI

------------------------------------------------------------------------

## 🏗️ Architecture

### 🔵 Frontend (React)

-   Search input
-   Display job results
-   Communicates with backend

### 🟢 Backend (Node.js + Express)

-   Receives search requests
-   Calls external API
-   Returns data to frontend

### 🌐 External API

-   Example: Remotive Jobs API
-   Provides real job listings

------------------------------------------------------------------------

## 📁 Project Structure

project/ │ ├── backend/ ├── frontend/

------------------------------------------------------------------------

## 🔗 Main Feature

### 🔍 Job Search

-   User enters keyword
-   App fetches jobs from API
-   Displays job title and company

------------------------------------------------------------------------

## 📱 UI Requirements

-   Input field (search)
-   Button (search)
-   List of jobs:
    -   Title
    -   Company name

------------------------------------------------------------------------

## 🧪 Example Flow

1.  User types "React"
2.  Clicks search
3.  Backend requests API
4.  Results returned and displayed

------------------------------------------------------------------------

## 🎯 Learning Goals

-   Understand how to use external APIs
-   Learn frontend ↔ backend communication
-   Build real-world data-driven apps
-   Handle asynchronous data

------------------------------------------------------------------------

## 🔥 Future Enhancements

-   Save jobs (MongoDB)
-   Add authentication (JWT)
-   Dockerize the app
-   Add CI/CD pipeline
-   Deploy to production

------------------------------------------------------------------------

## 💬 Final Note

"Real applications don't just store data --- they connect to other
services."
