# FarmRisk Backend

This is the backend service for FarmRisk, a multilingual agro-meteorological decision support platform. It is built using **FastAPI** and integrates Open-Meteo forecasts, Supabase pgvector retrievals (RAG), and Gemini/Groq LLMs to generate crop-specific agricultural advisories.

---

## Directory Structure

```
backend/
├── app/                      # Main application package
│   ├── api/                  # API routers (FastAPI endpoints)
│   │   ├── advisory.py       # Handles /api/advisory (orchestrating generation & translation)
│   │   └── location.py       # Handles /api/location (location utilities)
│   │
│   ├── core/                 # Core system modules
│   │   ├── caching.py        # In-memory spatial & translation cache manager
│   │   ├── config.py         # Global application configurations & environment loading
│   │   └── logging.py        # Structured logging configuration
│   │
│   ├── database/             # Database and vector storage layer
│   │   ├── client.py         # Supabase client singleton initialization
│   │   └── pgvector.py       # Wrapper for pgvector RPC similarity search
│   │
│   ├── llm/                  # Large Language Model services
│   │   ├── advisory_engine.py# Core advisory prompt synthesis and generation
│   │   └── providers.py      # LLM clients for Gemini and Groq (JSON/Text generation)
│   │
│   ├── models/               # Data validation schemas (Pydantic)
│   │   └── schemas.py        # Request, Response, and Location models
│   │
│   ├── rag/                  # Retrieval-Augmented Generation
│   │   └── retriever.py      # Supabase pgvector query retriever for scientific guidelines
│   │
│   ├── services/             # External services and utility classes
│   │   ├── location.py       # Nominatim reverse geocoding
│   │   ├── season.py         # Month-based agricultural season resolver (Kharif/Rabi)
│   │   ├── translation.py    # Multi-language translation pipeline
│   │   └── weather.py        # Open-Meteo 10-day forecast integration & risk rules
│   │
│   └── main.py               # FastAPI entry point & lifespan events
│
├── config/                   # Static JSON configuration files
│   ├── crops.json            # Supported crops configuration
│   └── states.json           # Standardized Indian States configuration
│
├── data/                     # Data directory (scientific guides, JSON extracts)
│
├── pipeline/                 # Data parsing, chunking, and index uploading scripts
│   ├── 02_parse.py           # Parse raw ICAR guides into JSON
│   ├── 03_validate.py        # Validate guidelines format
│   ├── 04_chunk.py           # Text chunking for vector database
│   ├── 05_embed_upload.py    # Embed text chunks and upload to Supabase pgvector
│   └── run_all.py            # Master script to run the pipeline
│
├── rag/                      # RAG data extraction script
│   └── extract.py            # Extract content text from PDFs
│
├── .env                      # Local environment variable configuration
├── requirements.txt          # Python dependencies
└── venv/                     # Python virtual environment
```

---

## Core Components

### 1. API Endpoints (`app/api/`)
* **Advisory (`advisory.py`)**: Receives farmer coordinate location, crop, target language, and crop stage. It resolves the coordinates into village/district boundaries, retrieves the 10-day weather forecast, performs semantic vector search for ICAR guidelines, triggers Gemini/Groq to generate the summary, caches results, and runs translation.
* **Location (`location.py`)**: Provides endpoints for searching or geocoding locations.

### 2. LLM Advisory Engine (`app/llm/`)
* **Advisory Engine (`advisory_engine.py`)**: Synthesizes the weather forecast context, risk alerts, and scientific guidelines into a prompt. It enforces strict two-paragraph output constraints, plain text styling, word count range (120-180 words), and structural partitions (expected weather in paragraph 1, recommendations in paragraph 2 ending with outlook).
* **LLM Providers (`providers.py`)**: Integrates with the official `google-genai` SDK and the `groq` SDK, implementing retry/backoff wrappers for transient error tolerance, supporting JSON and plain-text output formats.

### 3. Translation Pipeline (`app/services/translation.py`)
* Extracts the generated `advisory_summary` and calls the translation provider.
* Prompt rules enforce the strict preservation of double-newline paragraph breaks (`\n\n`), sentence order, wording, and meaning without rephrasing or summarizing.

### 4. Database Layer (`app/database/`)
* **Client (`client.py`)**: Centralized Supabase REST client initialization using service role keys.
* **PgVector Store (`pgvector.py`)**: Clean abstraction for executing custom Postgres RPCs to perform HNSW-indexed semantic searches directly against the vector database.

### 5. RAG Retriever (`app/rag/`)
* Performs a metadata-filtered vector similarity search on the Supabase pgvector `advisories` table based on selected crop, state, and resolved agricultural season to retrieve precise scientific guidelines.

### 5. Weather Service (`app/services/weather.py`)
* Connects to the Open-Meteo Forecast API.
* Runs local rule-based evaluations for extreme temperatures, high winds, or heavy rainfall to output alert flags.
* Generates a stable forecast hash used for temporal caching.

---

## Supabase Setup

1. **Create a Supabase Project**: Create a new project in the Supabase dashboard.
2. **Enable pgvector**: Run the following SQL in the SQL Editor to enable the vector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. **Create the Table**: Run the following SQL to create the vector storage table:
   ```sql
   CREATE TABLE advisories (
     id text PRIMARY KEY,
     content text NOT NULL,
     embedding vector(384) NOT NULL,
     crop text,
     state text,
     season text,
     source text,
     page integer,
     metadata jsonb,
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   -- HNSW index for fast similarity search
   CREATE INDEX ON advisories USING hnsw (embedding vector_cosine_ops);

   -- Composite B-tree index for fast metadata filtering
   CREATE INDEX idx_advisories_metadata ON advisories (crop, state, season);
   ```
4. **Create the Search Function (RPC)**:
   ```sql
   CREATE OR REPLACE FUNCTION match_advisories (
     query_embedding vector(384),
     match_threshold float,
     match_count int,
     p_crop text,
     p_state text,
     p_season text
   )
   RETURNS TABLE (
     id text,
     content text,
     crop text,
     state text,
     season text,
     source text,
     page integer,
     similarity float
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       a.id,
       a.content,
       a.crop,
       a.state,
       a.season,
       a.source,
       a.page,
       1 - (a.embedding <=> query_embedding) AS similarity
     FROM advisories a
     WHERE LOWER(a.crop) = LOWER(p_crop)
       AND (p_state IS NULL OR LOWER(a.state) = LOWER(p_state))
       AND (p_season IS NULL OR LOWER(a.season) = LOWER(p_season))
       AND 1 - (a.embedding <=> query_embedding) > match_threshold
     ORDER BY a.embedding <=> query_embedding
     LIMIT match_count;
   END;
   $$;
   ```
5. **Set Environment Variables**: Update `.env` with your Supabase URL and Service Role Key.
6. **Upload Embeddings**: Run the `05_embed_upload.py` script.

---

## Running the Backend

1. **Activate the Virtual Environment**:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Start the Development Server**:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
