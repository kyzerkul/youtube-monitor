# YouTube Channel Monitor

A full-stack application that monitors YouTube channels for new videos, generates articles from video transcripts using AI, and automatically publishes them to WordPress.

## Features

- Monitor multiple YouTube channels via RSS feeds
- Organize channels into projects
- Extract transcripts from YouTube videos
- Generate articles using AI (Mistral, with support for OpenAI and Claude)
- Publish articles to WordPress using the REST API
- Support for both English and French article generation

## Tech Stack

### Backend
- Node.js + Express
- Supabase (PostgreSQL)
- YouTube transcript extraction
- Mistral AI integration (with hooks for OpenAI and Claude)
- WordPress REST API integration

### Frontend
- React with React Router
- React Query for data fetching
- TailwindCSS for styling
- Axios for API communication

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Supabase account
- WordPress site with application password enabled
- Mistral AI API key (optional: OpenAI or Claude API keys)

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Configure your environment variables:
   - Set your Supabase URL and key
   - Add your Mistral API key
   - Configure JWT secret
   - Set other optional variables

5. Setup Supabase database:
   - Create a new Supabase project
   - Run the SQL script in `server/scripts/schema.sql` in the Supabase SQL editor

6. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   ```

4. Start the React app:
   ```
   npm start
   ```

## Usage

1. **Login**: Use the credentials configured in your environment variables
2. **Create a Project**: Set up a new monitoring project
3. **Add WordPress Site**: Connect your WordPress site using application password
4. **Add YouTube Channels**: Enter YouTube channel IDs to monitor
5. **Configure LLM Settings**: Set up your AI generation preferences
6. **Monitor Videos**: The system will check for new videos every hour (configurable)
7. **Generate Articles**: Articles are generated automatically from video transcripts
8. **Publish Articles**: Publish generated articles to WordPress

## Project Structure

```
youtube-monitor/
├── client/                # React frontend
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # UI components
│       ├── contexts/      # React contexts
│       ├── pages/         # Page components
│       ├── services/      # API client services
│       └── utils/         # Helper functions
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   ├── config/            # Configuration files
│   └── scripts/           # DB migration scripts
└── README.md              # Project documentation
```

## Environment Variables

### Backend (.env)

```
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CRON_SCHEDULE="0 * * * *"
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:3001/api
```

## Workflow

1. The application periodically checks YouTube channel RSS feeds for new videos
2. When new videos are found (published within the last 48 hours), they are added to the database
3. For each new video, the transcript is extracted
4. The AI generates an article based on the transcript in the requested language
5. Articles can be published to WordPress automatically or manually
6. All operations are logged and can be monitored through the dashboard

## Extending the Application

- **Add New LLM Providers**: Extend the LLM service with additional providers
- **Custom Article Templates**: Modify the prompts used for article generation
- **Additional WordPress Features**: Add support for more WordPress features (categories, tags, etc.)
- **Analytics Dashboard**: Add statistics and performance metrics
