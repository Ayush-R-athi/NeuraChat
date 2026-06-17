<h1 align="center">
  NeuraChat 🤖
</h1>

<p align="center">
  <strong>A MERN-based ChatGPT replica implemented from scratch using OpenAI and Groq APIs.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</p>

---

## 📖 Project Overview

**NeuraChat** is a highly responsive, full-stack chatbot application designed to replicate the core experience of ChatGPT. Built using the **MERN** stack (MongoDB, Express, React, Node.js), it integrates seamlessly with modern AI models through **Groq**, **OpenAI**, and **Google GenAI** SDKs. The app implements **Server-Sent Events (SSE)** to provide real-time, streaming text generation, offering a smooth and intuitive user experience.

## ✨ Key Features

- **Real-Time Streaming Responses**: Implements Server-Sent Events (SSE) for word-by-word streaming of AI responses, reducing perceived latency.
- **Thread Management**: Users can create, view, rename, and delete conversation threads, just like ChatGPT.
- **Secure Authentication**: Built-in user registration and login system utilizing bcrypt for password hashing and JSON Web Tokens (JWT) for secure session management.
- **Markdown & Syntax Highlighting**: Fully supports rendering Markdown responses, including properly highlighted code blocks using `react-markdown` and `highlight.js`.
- **Model Flexibility**: Backend routing set up to communicate with large language models, primarily utilizing **Groq** (`llama-3.3-70b-versatile`) for blazing fast inferences, with options for OpenAI.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (via Vite)
- **Styling & UI**: React Spinners, Sonner for toast notifications.
- **Content Rendering**: React Markdown, Rehype Highlight, Remark GFM.
- **State Management & Routing**: Standard React Hooks.

### Backend
- **Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT, bcryptjs
- **AI Integrations**: Groq SDK, OpenAI SDK, Google GenAI SDK.

## 🏗️ System Architecture & Workflow

### High-Level Architecture

```mermaid
graph TD;
    Client[React Frontend] -->|REST API & SSE| Server[Express + Node.js Backend];
    Server -->|JWT Auth & Data Queries| DB[(MongoDB)];
    Server -->|API Requests| Groq[Groq AI Models];
    Server -->|API Requests| OpenAI[OpenAI Models];
```

### Chat Streaming Workflow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as React Client
    participant Backend as Express Server
    participant LLM as Groq / OpenAI API
    participant DB as MongoDB

    User->>Frontend: Types a prompt
    Frontend->>Backend: POST /chat/stream (ThreadId, Message)
    Backend->>DB: Fetch/Create Thread
    Backend->>Frontend: Set Headers (text/event-stream)
    Backend->>LLM: Send Chat Messages payload
    LLM-->>Backend: Stream chunks of text
    loop Over Chunks
        Backend-->>Frontend: Write Data Chunk (SSE)
        Frontend-->>User: Update UI incrementally
    end
    Backend->>DB: Save complete Assistant reply
    Backend-->>Frontend: Stream Done signal
```

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas cluster)
- API Keys for **Groq** and/or **OpenAI**

### 1. Clone the repository
```bash
git clone <repository-url>
cd NeuraChat
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and configure environment variables.

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory:
```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key # Optional based on usage
```

Start the backend server:
```bash
npm run dev
```
*(Server will start on http://localhost:8080)*

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, install dependencies, and start the Vite dev server.

```bash
cd Frontend
npm install
```

Start the frontend application:
```bash
npm run dev
```
*(Frontend will be available at http://localhost:5173)*

## 🤝 Contributing

Contributions are always welcome! Feel free to fork the repository, open a pull request, or submit issues if you find any bugs or have feature requests.
