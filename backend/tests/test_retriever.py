"""
Unit tests for AdvisoryRetriever (3-stage retrieval, dedup, top_k).
Run: cd backend && pytest tests/test_retriever.py -v
"""
import pytest
from unittest.mock import MagicMock, patch
from app.rag.retriever import AdvisoryRetriever, RetrievalContext


def make_chunk(id_, score=0.9, crop="Cotton", state="Gujarat", season="Kharif"):
    return {
        "id": id_, "similarity": score, "content": f"Content for chunk {id_}",
        "crop": crop, "state": state, "season": season,
        "page": 1, "source": "ICAR_bulletin.pdf",
    }


def make_retriever(search_side_effect):
    """Build a retriever with a mocked PgVectorStore and SentenceTransformer."""
    with patch("app.rag.retriever.SentenceTransformer") as MockST, \
         patch("app.rag.retriever.PgVectorStore") as MockStore:
        mock_model = MagicMock()
        mock_model.encode.return_value = MagicMock(tolist=lambda: [0.1] * 384)
        MockST.return_value = mock_model

        mock_store = MagicMock()
        mock_store.similarity_search.side_effect = search_side_effect
        MockStore.return_value = mock_store

        ret = AdvisoryRetriever()
        ret.store = mock_store
        ret.model = mock_model
        return ret


def ctx():
    return RetrievalContext(
        crop_stage="vegetative", rainfall_pattern="Moderate rainfall",
        total_rainfall_mm=75.0, min_temp_c=23.0, max_temp_c=35.0,
        soil_moisture_trend="increasing", soil_moisture_percentile_avg=60.0,
        lightning_category="Moderate",
    )


# ------------------------------------------------------------------
# 1. Stage 1 returns top_k — stages 2 & 3 not called
# ------------------------------------------------------------------

def test_stage1_fills_top_k():
    chunks = [make_chunk(i) for i in range(1, 6)]

    calls = []
    def side_effect(vec, meta, k):
        calls.append(meta)
        if meta.get("state") == "Gujarat":
            return chunks
        return []

    ret = make_retriever(side_effect)
    results = ret.retrieve("Cotton", "Gujarat", "Kharif", ctx(), top_k=5)
    assert len(results) == 5
    # Only one call (stage 1 satisfied)
    assert len(calls) == 1


# ------------------------------------------------------------------
# 2. Stage 1 returns < top_k → Stage 2 triggered
# ------------------------------------------------------------------

def test_stage2_triggered_when_stage1_insufficient():
    stage1_chunks = [make_chunk(1), make_chunk(2)]
    stage2_chunks = [make_chunk(3), make_chunk(4), make_chunk(5)]

    calls = []
    def side_effect(vec, meta, k):
        calls.append(meta)
        if meta.get("state") == "Gujarat":
            return stage1_chunks
        if meta.get("state") is None and meta.get("season") == "Kharif":
            return stage2_chunks
        return []

    ret = make_retriever(side_effect)
    results = ret.retrieve("Cotton", "Gujarat", "Kharif", ctx(), top_k=5)
    assert len(results) == 5
    assert len(calls) == 2


# ------------------------------------------------------------------
# 3. Stage 2 still < top_k → Stage 3 triggered
# ------------------------------------------------------------------

def test_stage3_triggered_when_stage2_insufficient():
    calls = []
    def side_effect(vec, meta, k):
        calls.append(meta)
        if meta.get("state") == "Gujarat":
            return [make_chunk(1)]
        if meta.get("state") is None and meta.get("season") is not None:
            return [make_chunk(2)]
        if meta.get("state") is None and meta.get("season") is None:
            return [make_chunk(3), make_chunk(4), make_chunk(5)]
        return []

    ret = make_retriever(side_effect)
    results = ret.retrieve("Cotton", "Gujarat", "Kharif", ctx(), top_k=5)
    assert len(results) == 5
    assert len(calls) == 3


# ------------------------------------------------------------------
# 4. Deduplication — same id not added twice
# ------------------------------------------------------------------

def test_deduplication():
    duplicate = make_chunk(99)

    def side_effect(vec, meta, k):
        return [duplicate, duplicate, make_chunk(1)]

    ret = make_retriever(side_effect)
    results = ret.retrieve("Cotton", "Gujarat", "Kharif", ctx(), top_k=5)
    ids = [r["id"] for r in results]
    assert len(ids) == len(set(ids)), "Duplicate chunk ids found"


# ------------------------------------------------------------------
# 5. Zero results across all stages → empty list
# ------------------------------------------------------------------

def test_zero_results_returns_empty_list():
    ret = make_retriever(lambda *a, **kw: [])
    results = ret.retrieve("Cotton", "Gujarat", "Kharif", ctx(), top_k=5)
    assert results == []


# ------------------------------------------------------------------
# 6. Results never exceed top_k
# ------------------------------------------------------------------

def test_results_never_exceed_top_k():
    chunks = [make_chunk(i) for i in range(1, 20)]
    ret = make_retriever(lambda *a, **kw: chunks)
    results = ret.retrieve("Cotton", "Gujarat", "Kharif", ctx(), top_k=5)
    assert len(results) <= 5
