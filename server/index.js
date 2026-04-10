import { GoogleGenAI } from '@google/genai'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'
import path from 'path'
import pdfParse from 'pdf-parse'
import { fileURLToPath } from 'url'
import { z } from 'zod'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDistPath = path.join(__dirname, '..', 'client', 'dist')

app.use(cors())
app.use(express.json())

// Multer stores the uploaded file in memory so we can pass it directly to pdf-parse.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (request, file, callback) => {
    if (file.mimetype !== 'application/pdf') {
      callback(new Error('Only PDF files are allowed.'))
      return
    }

    callback(null, true)
  },
})

const analysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  missingSkills: z.array(z.string()),
  weakAreas: z.array(z.string()),
  suggestions: z.array(z.string()),
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const buildPrompt = (resumeText, jobDescription) => `
Resume Text:
${resumeText}

Job Description:
${jobDescription}

Instructions:
- Return valid JSON only.
- Return a match score between 0 and 100.
- Keep missingSkills focused on skills or keywords present in the job description but weak or absent in the resume.
- Keep weakAreas focused on resume gaps such as weak experience alignment, vague impact, or missing evidence.
- Keep suggestions action-oriented and easy to understand.
Output format:
{
  "matchScore": number,
  "missingSkills": string[],
  "weakAreas": string[],
  "suggestions": string[]
}
`.trim()

async function generateAnalysis(ai, resumeText, jobDescription) {
  const modelNames = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ]

  let lastError = null

  for (const modelName of modelNames) {
    try {
      const geminiResponse = await ai.models.generateContent({
        model: modelName,
        contents: buildPrompt(resumeText, jobDescription),
        config: {
          systemInstruction:
            'You are a resume analysis assistant. Compare the resume with the job description and return a fair, practical hiring-match analysis.',
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      })

      if (!geminiResponse.text?.trim()) {
        throw new Error('Gemini returned an empty response. Please try again.')
      }

      return analysisSchema.parse(JSON.parse(geminiResponse.text))
    } catch (error) {
      lastError = error

      const message = error.message || ''
      const isCapacityIssue =
        message.includes('503') ||
        message.includes('UNAVAILABLE') ||
        message.includes('high demand')

      if (!isCapacityIssue) {
        throw error
      }

      // Brief pause before trying the fallback model.
      await delay(900)
    }
  }

  throw lastError
}

app.get('/api/health', (request, response) => {
  response.json({ message: 'AI Job Application Optimizer API is running.' })
})

app.post('/analyze', upload.single('resume'), async (request, response) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return response.status(500).json({
        error: 'Missing GEMINI_API_KEY in server/.env.',
      })
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    if (!request.file) {
      return response.status(400).json({
        error: 'Please upload a resume PDF.',
      })
    }

    const jobDescription = request.body.jobDescription?.trim()

    if (!jobDescription) {
      return response.status(400).json({
        error: 'Please provide a job description.',
      })
    }

    // Extract plain text from the uploaded PDF buffer.
    const pdfData = await pdfParse(request.file.buffer)
    const resumeText = pdfData.text?.trim()

    if (!resumeText) {
      return response.status(400).json({
        error: 'Could not extract text from the PDF. Please try another resume file.',
      })
    }

    const parsedAnalysis = await generateAnalysis(ai, resumeText, jobDescription)

    return response.json(parsedAnalysis)
  } catch (error) {
    console.error('Analyze route error:', error)

    const message = error.message || ''
    const isCapacityIssue =
      message.includes('503') ||
      message.includes('UNAVAILABLE') ||
      message.includes('high demand')

    return response.status(isCapacityIssue ? 503 : 500).json({
      error: isCapacityIssue
        ? 'Gemini is temporarily overloaded right now. Please try again in a moment.'
        : error.message || 'Something went wrong while analyzing the resume.',
    })
  }
})

app.use((error, request, response, next) => {
  if (error instanceof multer.MulterError) {
    return response.status(400).json({
      error: error.message,
    })
  }

  if (error.message === 'Only PDF files are allowed.') {
    return response.status(400).json({
      error: error.message,
    })
  }

  return next(error)
})

// In production we serve the built React app from the same Express server.
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath))

  app.get(/^(?!\/analyze|\/api).*/, (request, response) => {
    response.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
