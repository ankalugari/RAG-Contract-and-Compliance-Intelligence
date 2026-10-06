# Contract and Compliance Intelligence

Upload a contract and ask questions about it. The app answers from the contract and shows where the answer came from. It can also check the contract for risky or missing points.

## How it works

**1. Upload and index**

- You upload a PDF or text file.
- Contract type, parties, dates, governing law, jurisdiction, status, and tags are extracted when possible.
- The text is divided into overlapping passages and embedded for semantic search.
- Extracted metadata is editable in the **Contract metadata** panel. Extraction failures do not block upload.

**2. Ask a question**

- Search the selected contract or all uploaded contracts, with optional metadata and effective-date filters.
- Your question is matched with the 5 closest passages that satisfy the filters.
- The AI (Groq) reads only those pieces and writes the answer.
- If the answer is not in the contract, it says "Not found in the contract."

**3. Review**

- The app checks 8 important points, like termination, payment and data protection, in the selected contract.
- The AI marks each one as present or missing, with low, medium or high risk.

## Run it

Open two terminals.

**Server**

```bash
cd server
npm install
cp .env.example .env
```

Put your key in `.env`:

```
GROQ_API_KEY=your_key_here
```

The default Groq model is `openai/gpt-oss-20b`.

Then run:

```bash
node index.js
```

**Page**

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Deploy

The frontend and API deploy together as one Vercel project using Vercel Services. Push this repository to GitHub and import it into Vercel. Keep the project root set to the repository root so Vercel reads `vercel.json`; it builds `client/` and `server/` as services and routes `/api/*` to Express, with all other paths going to the Vite frontend.

Add these environment variables in the Vercel project settings for each environment you plan to deploy (Production, Preview, and Development):

- `GROQ_API_KEY`: your Groq API key. Keep it server-side; do not prefix it with `VITE_`.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`: connection details for a MySQL database reachable from Vercel.

The database must be provisioned separately and have the application's tables set up. Both app services share one Vercel deployment and URL, but MySQL remains an external dependency. The embedding model is downloaded and loaded by the API at runtime, so a cold start can take longer than serving the frontend. `render.yaml` remains available for deploying the same app on Render instead.

Chat transcripts are kept in API memory for the browser session, separately for each contract or all-contract search, and retain the latest 10 exchanges. Use **Clear memory** to remove a transcript; transcripts are also lost when the API restarts.

## Remember

- Restart the server after changing `.env`.
- If the server restarts, upload your file again.
- This is not legal advice.
