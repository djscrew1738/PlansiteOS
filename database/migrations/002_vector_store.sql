-- ============================================================================
-- PlansiteOS Database Schema v3.1
-- Migration: 002_vector_store.sql
-- Description: Vector store metadata and embeddings tracking for AI Assistant
-- ============================================================================

BEGIN;

-- ============================================================================
-- Vector Documents Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS vector_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source references
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    estimate_id UUID REFERENCES cost_estimates(id) ON DELETE CASCADE,

    -- Document info
    source_type VARCHAR(50) NOT NULL,  -- 'blueprint', 'fixture', 'room', 'estimate', 'conversation'
    source_id UUID,
    content_hash VARCHAR(64),  -- SHA-256 hash for deduplication

    -- Text content
    text_content TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    chunk_total INTEGER DEFAULT 1,

    -- Embedding metadata
    embedding_model VARCHAR(100) DEFAULT 'all-MiniLM-L6-v2',
    embedding_dimension INTEGER DEFAULT 384,
    faiss_index_id BIGINT,  -- ID in FAISS index

    -- Metadata for filtering
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(source_type, source_id, chunk_index)
);

CREATE INDEX idx_vector_documents_blueprint_id ON vector_documents(blueprint_id);
CREATE INDEX idx_vector_documents_project_id ON vector_documents(project_id);
CREATE INDEX idx_vector_documents_source_type ON vector_documents(source_type);
CREATE INDEX idx_vector_documents_content_hash ON vector_documents(content_hash);
CREATE INDEX idx_vector_documents_faiss_index_id ON vector_documents(faiss_index_id);
CREATE INDEX idx_vector_documents_metadata ON vector_documents USING GIN(metadata);

CREATE TRIGGER update_vector_documents_updated_at
    BEFORE UPDATE ON vector_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE vector_documents IS 'Metadata for documents indexed in FAISS vector store';

-- ============================================================================
-- Vector Search Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS vector_search_log (
    id BIGSERIAL PRIMARY KEY,

    -- Search parameters
    query_text TEXT NOT NULL,
    query_embedding_model VARCHAR(100),
    top_k INTEGER,
    similarity_threshold DECIMAL(5, 4),

    -- Filters applied
    filter_project_id UUID,
    filter_blueprint_id UUID,
    filter_source_types VARCHAR[],

    -- Results
    result_count INTEGER,
    result_ids UUID[],
    result_scores DECIMAL[],

    -- Performance
    search_time_ms INTEGER,

    -- Context
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    correlation_id VARCHAR(100),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vector_search_log_created_at ON vector_search_log(created_at DESC);
CREATE INDEX idx_vector_search_log_conversation_id ON vector_search_log(conversation_id);
CREATE INDEX idx_vector_search_log_correlation_id ON vector_search_log(correlation_id);

COMMENT ON TABLE vector_search_log IS 'Log of vector similarity searches for analytics';

-- ============================================================================
-- Knowledge Base Articles Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),  -- 'plumbing_codes', 'materials', 'installation', 'troubleshooting'
    subcategory VARCHAR(100),

    -- Content
    content TEXT NOT NULL,
    summary TEXT,

    -- Source
    source_url TEXT,
    source_name VARCHAR(255),
    source_date DATE,

    -- Versioning
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,

    -- Tags for filtering
    tags VARCHAR[] DEFAULT '{}',

    -- Vector store link
    is_indexed BOOLEAN DEFAULT false,
    last_indexed_at TIMESTAMP WITH TIME ZONE,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_knowledge_articles_category ON knowledge_articles(category);
CREATE INDEX idx_knowledge_articles_is_current ON knowledge_articles(is_current);
CREATE INDEX idx_knowledge_articles_is_indexed ON knowledge_articles(is_indexed);
CREATE INDEX idx_knowledge_articles_tags ON knowledge_articles USING GIN(tags);

CREATE TRIGGER update_knowledge_articles_updated_at
    BEFORE UPDATE ON knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE knowledge_articles IS 'Knowledge base articles for RAG context';

-- ============================================================================
-- Seed Knowledge Articles (Basic Plumbing Codes)
-- ============================================================================

INSERT INTO knowledge_articles (title, category, subcategory, content, summary, tags) VALUES
(
    'Minimum Fixture Requirements - Residential',
    'plumbing_codes',
    'fixtures',
    'Residential dwelling units require the following minimum plumbing fixtures per the International Plumbing Code (IPC):

    - One water closet (toilet) per dwelling unit
    - One lavatory (bathroom sink) per dwelling unit
    - One bathtub or shower per dwelling unit
    - One kitchen sink per dwelling unit
    - One automatic clothes washer connection per dwelling unit (where laundry facilities are provided)

    Additional requirements based on number of bedrooms:
    - 1-2 bedrooms: 1 full bathroom minimum
    - 3-4 bedrooms: 2 full bathrooms recommended
    - 5+ bedrooms: Additional bathrooms may be required by local codes',
    'Minimum residential plumbing fixture requirements per IPC',
    ARRAY['ipc', 'residential', 'fixtures', 'code']
),
(
    'Water Heater Installation Requirements',
    'plumbing_codes',
    'water_heaters',
    'Water heater installation must comply with the following requirements:

    1. LOCATION:
       - Must be accessible for service and replacement
       - Cannot be installed in sleeping rooms or bathrooms without proper enclosure
       - Minimum clearances must be maintained per manufacturer specifications

    2. SAFETY DEVICES:
       - Temperature and Pressure (T&P) relief valve required
       - T&P discharge pipe must terminate within 6 inches of floor or approved drain
       - Cannot be threaded, plugged, or reduced in size

    3. SEISMIC STRAPPING (where required):
       - Two straps minimum for units over 50 gallons
       - Upper strap within top 1/3 of unit
       - Lower strap within bottom 1/3 of unit

    4. EXPANSION TANKS:
       - Required when backflow preventer is installed
       - Must be sized properly for system volume',
    'Water heater installation code requirements including safety devices',
    ARRAY['water_heater', 'installation', 'code', 'safety']
),
(
    'Pipe Sizing Guidelines',
    'plumbing_codes',
    'pipe_sizing',
    'Water supply pipe sizing is based on fixture unit calculations:

    FIXTURE UNITS (COMMON FIXTURES):
    - Toilet (tank type): 2.5 FU
    - Lavatory: 1 FU
    - Bathtub: 2 FU
    - Shower: 2 FU
    - Kitchen sink: 1.5 FU
    - Dishwasher: 1.5 FU
    - Washing machine: 2 FU

    MINIMUM PIPE SIZES:
    - Building supply: 3/4" minimum
    - Individual fixtures: 1/2" minimum (except toilet which requires 3/8")
    - Water heater inlet: Same as building supply

    VELOCITY LIMITS:
    - Maximum 8 fps for cold water
    - Maximum 5 fps for hot water (to reduce noise)',
    'Pipe sizing guidelines based on fixture units',
    ARRAY['pipe_sizing', 'fixture_units', 'code']
),
(
    'Drain Waste Vent (DWV) Sizing',
    'plumbing_codes',
    'dwv',
    'Drain Waste Vent sizing requirements:

    DRAIN FIXTURE UNITS (DFU):
    - Toilet: 4 DFU
    - Lavatory: 1 DFU
    - Bathtub/Shower: 2 DFU
    - Kitchen sink: 2 DFU
    - Dishwasher: 2 DFU
    - Washing machine: 3 DFU
    - Floor drain: 2 DFU

    MINIMUM DRAIN SIZES:
    - Toilet: 3" minimum
    - Lavatory: 1-1/4" minimum
    - Bathtub/Shower: 1-1/2" minimum
    - Kitchen sink: 1-1/2" minimum
    - Building drain: 4" minimum for up to 180 DFU

    VENT SIZING:
    - Individual vents: Same size as trap arm (min 1-1/4")
    - Vent stack: Based on DFU and developed length',
    'DWV pipe sizing based on drainage fixture units',
    ARRAY['dwv', 'drainage', 'venting', 'code']
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Functions for Vector Store Management
-- ============================================================================

-- Function to get documents needing indexing
CREATE OR REPLACE FUNCTION get_documents_for_indexing(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    source_type VARCHAR,
    text_content TEXT,
    blueprint_id UUID,
    project_id UUID,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vd.id,
        vd.source_type,
        vd.text_content,
        vd.blueprint_id,
        vd.project_id,
        vd.metadata
    FROM vector_documents vd
    WHERE vd.faiss_index_id IS NULL
    ORDER BY vd.created_at
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update FAISS index IDs after indexing
CREATE OR REPLACE FUNCTION update_faiss_index_ids(
    p_doc_ids UUID[],
    p_faiss_ids BIGINT[]
)
RETURNS VOID AS $$
BEGIN
    FOR i IN 1..array_length(p_doc_ids, 1) LOOP
        UPDATE vector_documents
        SET faiss_index_id = p_faiss_ids[i],
            updated_at = NOW()
        WHERE id = p_doc_ids[i];
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get document by FAISS index ID
CREATE OR REPLACE FUNCTION get_document_by_faiss_id(p_faiss_id BIGINT)
RETURNS TABLE (
    id UUID,
    source_type VARCHAR,
    source_id UUID,
    text_content TEXT,
    blueprint_id UUID,
    project_id UUID,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vd.id,
        vd.source_type,
        vd.source_id,
        vd.text_content,
        vd.blueprint_id,
        vd.project_id,
        vd.metadata
    FROM vector_documents vd
    WHERE vd.faiss_index_id = p_faiss_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create vector document from blueprint
CREATE OR REPLACE FUNCTION create_blueprint_vector_document(
    p_blueprint_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_doc_id UUID;
    v_text TEXT;
    v_project_id UUID;
BEGIN
    -- Get blueprint text content
    SELECT
        b.project_id,
        COALESCE(b.file_name, '') || E'\n' ||
        COALESCE(p.name, '') || E'\n' ||
        COALESCE(p.description, '') || E'\n' ||
        'Fixtures: ' || COALESCE(b.total_fixtures::TEXT, '0') || E'\n' ||
        'Rooms: ' || COALESCE(b.total_rooms::TEXT, '0')
    INTO v_project_id, v_text
    FROM blueprints b
    LEFT JOIN projects p ON p.id = b.project_id
    WHERE b.id = p_blueprint_id;

    -- Insert vector document
    INSERT INTO vector_documents (
        blueprint_id,
        project_id,
        source_type,
        source_id,
        text_content,
        content_hash,
        metadata
    ) VALUES (
        p_blueprint_id,
        v_project_id,
        'blueprint',
        p_blueprint_id,
        v_text,
        encode(sha256(v_text::bytea), 'hex'),
        jsonb_build_object('type', 'blueprint_summary')
    )
    ON CONFLICT (source_type, source_id, chunk_index) DO UPDATE
    SET text_content = EXCLUDED.text_content,
        content_hash = EXCLUDED.content_hash,
        updated_at = NOW()
    RETURNING id INTO v_doc_id;

    RETURN v_doc_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
