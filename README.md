# Contract and Compliance Intelligence

Upload a contract and ask questions about it. The app answers from the contract and shows where the answer came from. It can also check the contract for risky or missing points.

## How it works

**1. Upload**

- You upload a PDF or text file.
- The text is cut into small pieces.
- Each piece is saved with numbers that show its meaning.

**2. Ask a question**

- Your question is matched with the 5 closest pieces.
- The AI (Groq) reads only those pieces and writes the answer.
- If the answer is not in the contract, it says "Not found in the contract."

**3. Review**

- The app checks 8 important points, like termination, payment and data protection.
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

The frontend and API are deployed separately: Netlify hosts the Vite page, and Render runs the Express server.

**1. Deploy the API on Render**

- Push this repository to GitHub.
- In Render, choose **New** -> **Blueprint**, connect the repository, and apply the settings in `render.yaml`.
- Add your Groq API key as the `GROQ_API_KEY` environment variable for the `contract-intelligence-api` service. Keep it in Render's environment settings; do not put it in the frontend.
- Wait for the service to deploy, then copy its public URL, such as `https://contract-intelligence-api.onrender.com`.

**2. Deploy the page on Netlify**

- Import the same GitHub repository as a new Netlify site. The root `netlify.toml` configures the Vite build and publish directory.
- In the site's environment variables, add `VITE_API_URL` with the Render URL followed by `/api`, for example `https://contract-intelligence-api.onrender.com/api`.
- Trigger a new deploy so Vite includes that API URL in the built page.

After both deploys finish, open the Netlify URL and upload the contract again. Documents are kept in server memory and disappear when the API restarts.

## Remember

- Restart the server after changing `.env`.
- If the server restarts, upload your file again.
- This is not legal advice.
