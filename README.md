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
GROQ_MODEL=openai/gpt-oss-120b
```

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

## Remember

- Restart the server after changing `.env`.
- If the server restarts, upload your file again.
- This is not legal advice.
