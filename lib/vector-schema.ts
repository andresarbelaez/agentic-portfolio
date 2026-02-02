/**
 * Schema for RAG vector store (ChromaDB or pgvector).
 * Ingest pipeline stores chunks with these fields; the chat route queries by embedding similarity.
 */
export type EmbeddingChunk = {
  id: string;
  content: string;
  embedding: number[];
  source?: "resume" | "project";
  projectId?: string;
};

/** Metadata returned with search results for building context and citations */
export type SearchResult = EmbeddingChunk & {
  similarity?: number;
};
