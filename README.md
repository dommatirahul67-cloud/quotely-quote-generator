# Quotely – Quote Generator

A full-stack Quote Generator application built using React, Node.js, Express, and Supabase. It allows users to explore quotes and maintain quote history and favorites.

## Features

- Generate and explore quotes
- Browse available quotes
- Save and view quote history
- Manage favorite quotes
- Supabase database integration
- Fallback support using a public Quotes API

## Tech Stack

**Frontend**
- React
- Vite
- HTML
- CSS
- JavaScript

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- Supabase

## Project Structure

```text
quote-generator/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── supabase.js
│   ├── quotes.json
│   └── seed.js
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- A Supabase project
- Git

### 1. Clone the repository

```bash
git clone https://github.com/dommatirahul67-cloud/quotely-quote-generator.git
cd quotely-quote-generator
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder and configure the required environment variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Use your own Supabase credentials. Never publish secret keys.

Start the backend using the start script defined in `backend/package.json`.

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## Environment Variables

Configure the required environment variables before running the backend. Keep `.env` files and secret keys out of version control.

## Future Improvements

- Deploy the frontend and backend
- Improve the user interface
- Add more quote categories and filtering options
- Enhance the user experience

## Author

**Rahul Dommati**

GitHub: [@dommatirahul67-cloud](https://github.com/dommatirahul67-cloud)
