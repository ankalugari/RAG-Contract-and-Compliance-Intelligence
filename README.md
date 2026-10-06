# RAG Contract and Compliance Intelligence

An AI-based application for uploading contracts, asking questions, and performing compliance reviews using RAG and an LLM.

## Features

- Upload PDF, TXT, and Markdown contracts
- Automatic contract metadata extraction
- Ask questions about contracts
- RAG-based search
- Metadata filtering
- Chat history
- Long-term memory
- Compliance review
- Contract source references
- Edit contract metadata
- Delete contracts
- MySQL database storage

## Technologies Used

### Frontend

- React.js
- Vite
- JavaScript
- Ant Design
- Tailwind CSS

### Backend

- Node.js
- Express.js
- JavaScript
- Groq API
- RAG

### Database

- MySQL

### AI

- Groq LLM
- Embeddings
- Vector similarity search
- Retrieval-Augmented Generation (RAG)

## Project Structure

```text
contract-intelligence/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── MetadataEditor.jsx
│   │   │   └── Review.jsx
│   │   │
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── server/
    ├── index.js
    ├── llm.js
    ├── rag.js
    ├── metadata.js
    ├── db.js
    ├── metadata.test.js
    └── package.json
```

## Application Flow
```
Upload Contract
      ↓
Extract Text
      ↓
Create Embeddings
      ↓
Store Contract Chunks
      ↓
Extract Metadata
      ↓
Ask Questions
      ↓
Retrieve Relevant Chunks
      ↓
Apply Metadata Filters
      ↓
Send Context to Groq LLM
      ↓
Generate Answer
```

## RAG Flow
```
User Question
      ↓
Create Query Embedding
      ↓
Search Contract Chunks
      ↓
Find Relevant Chunks
      ↓
Send Context to Groq
      ↓
Generate Answer
```

## Memory
```
The application stores useful user information as long-term memory.

User Message
      ↓
Extract Useful Information
      ↓
Save Memory
      ↓
Store in MySQL
      ↓
Retrieve in Future Conversations

Chat history and long-term memory are stored separately.
```
## Metadata Filtering
```
Metadata filters can be used to narrow contract searches.

Available filters:

Contract Type
Party
Tag
Governing Law
Jurisdiction
Status
Effective Date
Expiration Date
Compliance Review
```

## The application checks contracts for:
```
Termination
Liability Cap
Indemnification
Confidentiality
Payment Terms
Renewal
Data Protection
Governing Law
Installation
1. Clone the Repository
git clone <your-repository-url>
cd contract-intelligence
2. Install Frontend Dependencies
cd client
npm install
3. Install Backend Dependencies
cd ../server
npm install
4. Configure Environment Variables

Create a .env file inside the server folder.

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b

DB_HOST=localhost
DB_USER=contract_user
DB_PASSWORD=your_database_password
DB_NAME=contract_intelligence
5. Start the Backend
cd server
npm start
6. Start the Frontend
```
## Open another terminal:

```
cd client
npm run dev
```
```
Open the URL shown by Vite in the terminal.

Tech Stack
React + Vite
      ↓
Ant Design + Tailwind CSS
      ↓
Node.js + Express
      ↓
Groq LLM + RAG
      ↓
MySQL
```
```
<img width="1017" height="245" alt="image" src="https://github.com/user-attachments/assets/690517c1-9e33-4b3a-ab6c-c0ff322a5468" />
<img width="1009" height="292" alt="image" src="https://github.com/user-attachments/assets/8c6e07ff-fa45-452d-b0cb-11c3070c1de6" />






