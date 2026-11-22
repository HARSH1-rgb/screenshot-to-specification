
# TalentLens — AI-Powered Interview Preparation

TalentLens is an AI-powered interview preparation platform designed to help students, freshers, and job seekers practice interviews, improve their communication, identify weaknesses, and prepare for real-world job opportunities.

It simulates interviews based on a selected role, experience level, interview type, and difficulty. Users receive AI-generated questions, performance evaluations, detailed feedback, and personalized recommendations to improve their interview skills.

🌐 **Live Demo:** https://talentlens-psi.vercel.app/

---

## Features

- **AI Mock Interviews** — Practice realistic interviews tailored to your selected job role.
- **Adaptive Questions** — Questions adapt based on your answers and interview progress.
- **Custom Interview Setup** — Choose your role, experience level, interview type, difficulty, and number of questions.
- **Answer Evaluation** — Get AI-powered feedback on your answers.
- **Performance Scoring** — Evaluate correctness, relevance, clarity, depth, and communication.
- **Detailed Interview Reports** — Review your overall performance, strengths, weaknesses, and improvement areas.
- **Personalized Learning Roadmap** — Receive recommendations to improve your skills based on your interview performance.
- **IQ Coach** — Interact with an AI coach to ask questions, learn concepts, and improve your preparation.
- **Resume Analyzer** — Compare your resume with a job description to identify matching skills, missing skills, and potential improvements.
- **Voice Support** — Use speech-to-text and text-to-speech features during interview practice.
- **Saved Reports** — Access your previous interview reports directly from your browser.
- **Responsive UI** — Designed to provide a clean experience across different screen sizes.

---

## Tech Stack

### Frontend
- React
- TypeScript
- TanStack Start
- TanStack Router
- Tailwind CSS v4
- shadcn/ui
- Radix UI
- Lucide Icons

### Backend & AI
- Server-side API routes
- Vercel Serverless Functions / deployment infrastructure
- Groq API
- AI SDK
- Zod for schema validation

### Development Tools
- Vite
- Bun
- ESLint
- Prettier
- Vitest

---

## AI Capabilities

TalentLens uses AI to power multiple features:

| Feature | Description |
|---|---|
| Mock Interview | Generates role-specific interview questions and follow-ups |
| Answer Evaluation | Analyzes answers and provides structured feedback |
| Interview Report | Generates a performance summary and personalized roadmap |
| IQ Coach | Provides conversational learning and interview guidance |
| Resume Analyzer | Compares a resume against a job description |

AI requests are processed through server-side API routes. API credentials are stored as environment variables and are not intended to be exposed to the client.

---

## Application Routes

| Route | Description |
|---|---|
| `/` | Landing page and overview of TalentLens |
| `/setup` | Configure your mock interview |
| `/interview` | Conduct the AI-powered interview |
| `/report` | View saved interview reports |
| `/report/:id` | View a specific interview report |
| `/coach` | Chat with the AI learning coach |
| `/resume` | Analyze your resume against a job description |

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/interview` | POST | Generates the next interview question based on interview context and answer history |
| `/api/evaluate` | POST | Evaluates an answer and returns scores, strengths, weaknesses, and feedback |
| `/api/report` | POST | Generates a final interview report and learning roadmap |
| `/api/coach` | POST | Powers the AI Coach conversational interface |
| `/api/resume` | POST | Analyzes resume content against a job description |

All AI endpoints are handled server-side, keeping API keys out of the browser.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Bun](https://bun.sh/)
- Git
- A Groq API key

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/TalentLens.git
cd TalentLens
```

**2. Install dependencies**

```bash
bun install
```

**3. Configure environment variables**

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key
```

Replace `your_groq_api_key` with your actual Groq API key.

**4. Start the development server**

```bash
bun run dev
```

The application should be available at:

```text
http://localhost:8080
```

---

## Deployment

TalentLens is deployed on Vercel.

To deploy your own instance:

1. Fork or clone the repository.
2. Import the project into [Vercel](https://vercel.com/).
3. Configure the required environment variables in your Vercel project settings.
4. Add your `GROQ_API_KEY`.
5. Deploy the application.

**Important:** Never commit your API keys or expose them in frontend code.

---

## Privacy & Data Storage

TalentLens does not require user registration or a traditional database.

- Active interview state is managed in the browser during the session.
- Interview reports and AI Coach chat history are stored locally in the browser.
- Resume content is processed for analysis and is not intentionally stored by the application.
- AI requests are sent to the configured AI provider for processing.
- Local browser storage data may be lost if browser storage is cleared.

Avoid submitting sensitive personal information, confidential documents, or private data.

---

## Project Structure

```text
TalentLens/
├── src/
│   ├── components/
│   │   ├── ai-elements/
│   │   ├── app/
│   │   └── ui/
│   ├── lib/
│   │   ├── ai/
│   │   └── interview/
│   ├── routes/
│   │   ├── api/
│   │   │   ├── coach.ts
│   │   │   ├── evaluate.ts
│   │   │   ├── interview.ts
│   │   │   ├── report.ts
│   │   │   └── resume.ts
│   │   ├── coach.tsx
│   │   ├── interview.tsx
│   │   ├── report.index.tsx
│   │   ├── report.$reportId.tsx
│   │   ├── resume.tsx
│   │   └── setup.tsx
│   └── ...
├── public/
├── .env.example
├── package.json
└── README.md
```

---

## Future Improvements

- User accounts and cloud-based report storage
- More interview categories and specialized question banks
- Advanced performance analytics
- Interview history and progress tracking
- Improved voice-based interview experience
- More personalized learning recommendations
- Additional AI model integrations

---

## Contributing

Contributions, suggestions, bug reports, and feature requests are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Commit and push your changes.
5. Open a pull request.

---

## Disclaimer

TalentLens is an interview preparation and learning tool. AI-generated questions, evaluations, scores, and recommendations are intended for educational purposes only and may not always be accurate or reflect the expectations of actual recruiters.

---

## Author

Developed as a project to explore AI-powered interview preparation, adaptive question generation, automated evaluation, and personalized learning experiences.

---

⭐ If you find TalentLens useful, consider starring the repository.
