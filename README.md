# Visume AI

**An intelligent resume optimization tool powered by AI and NLP, and Multisource verification by AI Agents.**

**Goal Tracker - https://www.notion.so/289a33133a3a80f8a630d2edf775009e?v=289a33133a3a8016834f000c66b9daf6**

## 🚀 Overview

**Visume AI** is a web application that analyzes and enhances resumes to increase their chances of passing Applicant Tracking Systems (ATS). By leveraging AI and NLP, it assesses resumes against job descriptions, providing actionable insights and recommendations for improvement.

## 🧩 Features

- **ATS Compatibility Analysis**: Evaluates how well a resume aligns with ATS algorithms.
- **Keyword Optimization**: Identifies missing keywords and suggests additions to match job descriptions.
- **End-to-End Authentication**: Authentication flow uses Clerk for secure and encrypted authentication. 
- **Formatting Recommendations**: Advises on formatting changes to improve readability and ATS parsing.
- **AI Agents**: To verify all the contained information.
- **Real-Time Feedback**: Provides instant suggestions as users upload their resumes.
- **Multi-Format Support**: Accepts resumes in various formats, including PDF and DOCX.
- **LinkedIn Verification**: Verifies resume information against the LinkedIn profile PDF.

## ⚙️ Tech Stack

- **Frontend**: NextJS 15 with App Router, TypeScript, Tailwind CSS, Shadcn
- **Backend**: Node.js, Express.js, MongoDB, Mangoose
- **AI/NLP**: OpenAI GPT, Langchain, Langgraph, Langsmith
- **Database**: MongoDB
- **Authentication**: Clerk
- **File Parsing**: pdf-parse, mammoth.js
- **Storage**: AWS S3 Bucket
  
## 🛠️ Installation

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/MeetDesaii/Visume-AI-Dev.git
   cd Visume-AI-Dev

2. **Install Dependencies**

   ```bash
   pnpm i
   ```

3. **Environment Variables**

   Create a `.env.development` file in both the `apps/api` directory with the following variables:

   ```env
    NODE_ENV=development

    # Server Configuration
    PORT=4000
    HOST=localhost
    FRONTEND_URL=http://localhost:3000
    
    # Database
    MONGODB_URI=" "
    
    # Redis (Optional - for caching and rate limiting)
    REDIS_URL=redis://localhost:6379
    # REDIS_PASSWORD=
    
    # Clerk Authentication (Required)
    CLERK_PUBLISHABLE_KEY=" "
    CLERK_SECRET_KEY=" "
    CLERK_WEBHOOK_SECRET=" "
    
    # OpenAI API (Required)
    OPENAI_API_KEY=" "
    LANGSMITH_TRACING=true
    LANGSMITH_ENDPOINT=https://api.smith.langchain.com
    LANGSMITH_API_KEY=
    LANGSMITH_PROJECT=
   
    # Email Configuration (Optional - for notifications)
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=visumeai@gmail.com
    SMTP_PASS=" "
    EMAIL_FROM="Visume AI <noreply@visume.ai>"
    
    # Logging
    LOG_DIR=logs
    LOG_LEVEL=debug
   ```
   
   Create a `.env` file in both the `apps/web` directory with the following variables:
  
   ```env
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
    
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" "
    CLERK_SECRET_KEY=" "
     
    NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
   ```

4. **Run the Application**

   ```bash
   pnpm dev
   ```

   The application should now be running at [http://localhost:3000](http://localhost:3000).
