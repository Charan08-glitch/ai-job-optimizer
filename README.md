# AI Job Application Optimizer with charan

AI Job Application Optimizer is a beginner-friendly full-stack project that compares a resume PDF against a job description and returns an AI-powered fit report.

The app extracts text from the uploaded resume, sends the resume plus job description to Gemini, and shows:

- Match Score
- Missing Skills
- Weak Areas
- Suggestions

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- File Uploads: Multer
- PDF Parsing: pdf-parse
- AI: Gemini API
- Validation: Zod

## Features

- Upload resume as PDF only
- Paste any job description
- Analyze resume relevance with Gemini
- Show structured results in a clean UI
- Handle loading and error states
- Beginner-friendly code and folder structure

## Project Structure

```text
my-app/
  client/
  server/
  package.json
```

## Setup

1. Install root dependencies:

```bash
npm install
```

2. Install frontend dependencies:

```bash
cd client
npm install
```

3. Install backend dependencies:

```bash
cd ../server
npm install
```

4. Create `server/.env` based on `server/.env.example`

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
```

## Run The Project

Start frontend and backend together from the root folder:

```bash
npm run dev
```

This starts:

- frontend on `http://localhost:5173`
- backend on `http://localhost:5000`

## Deploy For A Live Link

The easiest way to get one public live link for this project is to deploy it on Render.

1. Push this repo to GitHub
2. Go to Render and create a new Blueprint or Web Service from the repo
3. Render will use [render.yaml](/c:/Users/Admin/Desktop/React/my-app/render.yaml)
4. Add your `GEMINI_API_KEY` in the Render environment settings
5. Deploy

After deploy, Render gives you a live URL like:

```text
https://ai-resume-optimizer.onrender.com
```

In production, Express serves the React build, so the frontend and backend run from the same domain.

## API Endpoint

### `POST /analyze`

Accepts:

- `resume`: uploaded PDF file
- `jobDescription`: job description text

Returns:

```json
{
  "matchScore": 75,
  "missingSkills": ["Skill 1", "Skill 2"],
  "weakAreas": ["Weak area 1"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}
```

## Notes

- The frontend uses Vite proxy to communicate with the backend.
- The backend requests JSON output from Gemini and validates it using `zod`.
- `server/.env` is ignored by Git and should not be committed.

## GitHub Push Checklist

- Keep your real key only in `server/.env`
- Do not paste secrets into `server/.env.example`
- Commit `server/.env.example`, not `server/.env`

## License

This project is for learning and portfolio use.
