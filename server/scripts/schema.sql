-- Clear existing tables (if needed)
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS youtube_channels;
DROP TABLE IF EXISTS wordpress_sites;
DROP TABLE IF EXISTS llm_settings;
DROP TABLE IF EXISTS projects;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE wordpress_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  username TEXT NOT NULL,
  application_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE youtube_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  rss_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES youtube_channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_id TEXT NOT NULL UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  transcript TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  wordpress_post_id INTEGER,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE llm_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mistral',
  model_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster queries
CREATE INDEX videos_channel_id_idx ON videos(channel_id);
CREATE INDEX videos_processed_idx ON videos(processed);
CREATE INDEX articles_video_id_idx ON articles(video_id);
CREATE INDEX articles_language_idx ON articles(language);
CREATE INDEX youtube_channels_project_id_idx ON youtube_channels(project_id);
CREATE INDEX wordpress_sites_project_id_idx ON wordpress_sites(project_id);
CREATE INDEX llm_settings_project_id_idx ON llm_settings(project_id);
