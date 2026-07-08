"""
Unit tests for AdvisoryEngine — correctness and reliability.

Run:  cd backend && .\\venv\\Scripts\\python.exe -m pytest tests/test_advisory_engine.py -v --tb=short

Tests:
  1.  Soil moisture prompt content — start/end/min/max all present with unambiguous labels
  2.  Valid soil trend (start→end) — passes semantic grounding
  3.  Invalid soil trend (min→max as temporal) — fails semantic grounding
  4.  Valid range description — not rejected as temporal claim
  5.  Sorted forecast rows — correct start/end dates and totals
  6.  Sorted soil moisture rows — correct start/end percentile and trend
  7.  Retry preserves original context — second prompt contains all factual context
  8.  Empty RAG chunks — raises InsufficientKnowledgeError, LLM not called
  9.  All LLM providers fail — raises AdvisoryGenerationError
  10. Single-asterisk highlighting — not rejected by validation
  11. Invalid structural markdown — headings/bullets/numbers/bold rejected
  12. Paragraph 1 recommendation — rejected
  13. Word count — below/within/above bounds
  14. Outlook ending — only three allowed sentences pass
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from app.llm.advisory_engine import (
    AdvisoryEngine,
    InsufficientKnowledgeError,
    AdvisoryGenerationError,
)
from app.services.context_builder import AdvisoryContextBuilder
from app.models.schemas import AdvisoryResponse
from tests.conftest import make_forecast_day, make_sm_record


builder = AdvisoryContextBuilder()
engine = AdvisoryEngine()

RAG_CHUNKS = [
    {
        "id": "chunk1",
        "score": 0.92,
        "content": "Cotton in Kharif requires balanced irrigation. Avoid waterlogging during boll formation.",
        "crop": "Cotton", "season": "Kharif", "state": "Gujarat",
        "page": 5, "source": "ICAR_cotton.pdf",
    }
]


def _get_ctx(sample_request):
    return builder.build(sample_request)


def _advisory(start="07/07/2026", end="16/07/2026", p2_ending="Favorable", p1_extra=""):
    """Construct a structurally valid two-paragraph advisory."""
    p1 = (
        f"From {start} to {end}, the region of Dholka, Ahmedabad, Gujarat is expected "
        f"to receive *82.4 mm* of cumulative rainfall characterised by *moderate rainfall* "
        f"with temperatures ranging from *23.7 °C* to *36.0 °C*. "
        f"Soil moisture shows an overall increasing trend from percentile *58.0* at the start "
        f"to *65.0* at the end of the forecast period, reaching a maximum percentile of *65.0*. "
        f"Lightning risk is *Moderate*, warranting precaution during field operations."
        + (" " + p1_extra if p1_extra else "")
    )
    p2 = (
        f"Based on ICAR guidelines, farmers growing Cotton should avoid spraying pesticides on rainy days "
        f"with high wind speeds. Irrigation should be suspended during showers and resumed during "
        f"dry breaks. Apply top-dressing nitrogen fertiliser in a dry break. Monitor for sucking "
        f"pests and blight given humid conditions; ensure drainage channels are clear. "
        f"Overall, the agricultural outlook for this period is {p2_ending}."
    )
    return f"{p1}\n\n{p2}"


# ============================================================
# TEST 1 — Soil moisture prompt content
# ============================================================

def test_sm_prompt_contains_all_four_values(sample_request):
    """Prompt must contain start, end, min, max percentile with unambiguous labels."""
    ctx = _get_ctx(sample_request)
    prompt = engine._build_prompt(ctx, RAG_CHUNKS)
    sm = ctx.soil_moisture_summary

    assert f"Forecast start percentile     : {sm.start_percentile:.1f}" in prompt
    assert f"Forecast end percentile       : {sm.end_percentile:.1f}" in prompt
    assert f"Forecast minimum percentile   : {sm.forecast_min_percentile:.1f}" in prompt
    assert f"Forecast maximum percentile   : {sm.forecast_max_percentile:.1f}" in prompt


# ============================================================
# TEST 2 — Valid soil trend (start→end) — should pass
# ============================================================

def test_valid_soil_trend_start_to_end(sample_request):
    ctx = _get_ctx(sample_request)
    sm = ctx.soil_moisture_summary
    text = (
        f"From 07/07/2026 to 16/07/2026, soil moisture is expected to increase from "
        f"{sm.start_percentile:.0f} at the start to {sm.end_percentile:.0f} at the end "
        f"of the forecast period, reaching a maximum percentile of {sm.forecast_max_percentile:.0f}.\n\n"
        f"Based on ICAR guidelines, farmers should manage irrigation accordingly. "
        f"Overall, the agricultural outlook for this period is Favorable."
    )
    sm_errors = engine._validate_soil_moisture_semantics(text, sm)
    assert not sm_errors, sm_errors


# ============================================================
# TEST 3 — Invalid soil trend (min→max as temporal) — must fail
# ============================================================

def test_invalid_soil_trend_min_to_max(sample_request):
    """
    SM: start=50, end=65, min=50, max=65 in fixture.
    Override to create an unambiguous min!=start, max!=end case.
    """
    from tests.conftest import make_sm_record
    records = [
        make_sm_record("2026-07-05", 45.0, 0.33, is_forecast=0),  # historical
        make_sm_record("2026-07-06", 58.0, 0.40, is_forecast=1),  # forecast start
        make_sm_record("2026-07-07", 70.0, 0.50, is_forecast=1),
        make_sm_record("2026-07-08", 88.0, 0.65, is_forecast=1),  # mid-period peak
        make_sm_record("2026-07-09", 82.0, 0.60, is_forecast=1),  # forecast end
    ]
    sm_block = sample_request.forecastData.soil_moisture.model_copy(update={"soil_moisture": records})
    fd = sample_request.forecastData.model_copy(update={"soil_moisture": sm_block})
    req = sample_request.model_copy(update={"forecastData": fd})
    ctx = builder.build(req)
    sm = ctx.soil_moisture_summary

    assert sm.start_percentile == 58.0
    assert sm.end_percentile == 82.0
    assert sm.forecast_max_percentile == 88.0

    # Advisory incorrectly states increased from min to max (58 → 88)
    bad_text = (
        f"From 07/07/2026 to 16/07/2026, soil moisture is expected to increase from "
        f"{sm.forecast_min_percentile:.0f} to {sm.forecast_max_percentile:.0f} during the period.\n\n"
        f"Recommendations here. Overall, the agricultural outlook for this period is Cautionary."
    )
    sm_errors = engine._validate_soil_moisture_semantics(bad_text, sm)
    assert sm_errors, "Expected a soil moisture semantic validation error"


# ============================================================
# TEST 4 — Valid range description — must NOT be rejected
# ============================================================

def test_valid_range_description_not_rejected(sample_request):
    """'ranging from X to Y' is a range description — not a temporal start→end claim."""
    ctx = _get_ctx(sample_request)
    sm = ctx.soil_moisture_summary
    # Only meaningful if min != start or max != end
    text = (
        f"Soil moisture percentiles are expected to range from "
        f"{sm.forecast_min_percentile:.0f} to {sm.forecast_max_percentile:.0f}, "
        f"with an overall increasing trend."
    )
    sm_errors = engine._validate_soil_moisture_semantics(text, sm)
    # "ranging from" should not be flagged as temporal
    assert not sm_errors, f"Unexpected errors: {sm_errors}"


# ============================================================
# TEST 5 — Sorted forecast rows
# ============================================================

def test_sorted_forecast_rows(sample_request):
    """Shuffled input rows must produce correct start/end dates and totals."""
    from tests.conftest import make_forecast_day
    days = [
        make_forecast_day("2026-07-10", 35.0, 24.0, 15.0),
        make_forecast_day("2026-07-08", 34.0, 23.0, 5.0),
        make_forecast_day("2026-07-09", 36.0, 25.0, 10.0),
        make_forecast_day("2026-07-07", 33.0, 22.0, 2.0),
    ]
    new_block = sample_request.forecastData.forecast.model_copy(update={"forecast": days})
    fd = sample_request.forecastData.model_copy(update={"forecast": new_block})
    req = sample_request.model_copy(update={"forecastData": fd})
    ctx = builder.build(req)

    assert ctx.forecast_summary.forecast_start_date == "2026-07-07"
    assert ctx.forecast_summary.forecast_end_date == "2026-07-10"
    assert ctx.forecast_summary.total_rainfall_mm == round(2.0 + 5.0 + 10.0 + 15.0, 2)


# ============================================================
# TEST 6 — Sorted soil moisture rows
# ============================================================

def test_sorted_soil_moisture_rows(sample_request):
    """Shuffled SM records must produce correct start_percentile, end_percentile, trend."""
    records = [
        make_sm_record("2026-07-09", 65.0, 0.45, is_forecast=1),
        make_sm_record("2026-07-06", 50.0, 0.36, is_forecast=1),  # start
        make_sm_record("2026-07-07", 55.0, 0.39, is_forecast=1),
        make_sm_record("2026-07-08", 60.0, 0.42, is_forecast=1),
        make_sm_record("2026-07-05", 45.0, 0.33, is_forecast=0),  # historical latest
    ]
    sm_block = sample_request.forecastData.soil_moisture.model_copy(update={"soil_moisture": records})
    fd = sample_request.forecastData.model_copy(update={"soil_moisture": sm_block})
    req = sample_request.model_copy(update={"forecastData": fd})
    ctx = builder.build(req)
    sm = ctx.soil_moisture_summary

    assert sm.start_percentile == 50.0      # earliest forecast row
    assert sm.end_percentile == 65.0         # latest forecast row
    assert sm.soil_moisture_trend == "increasing"
    assert sm.latest_sm_percentile == 45.0   # historical[-1] after sort


# ============================================================
# TEST 7 — Retry preserves original context
# ============================================================

@pytest.mark.asyncio
async def test_retry_preserves_original_context(sample_request):
    """Second prompt (on validation failure) must contain all original factual context."""
    ctx = _get_ctx(sample_request)

    captured_prompts = []

    # First call returns invalid output; second returns valid
    def make_response(text):
        async def _generate(prompt, temperature):
            captured_prompts.append(prompt)
            return text
        return _generate

    valid = _advisory()
    invalid = "Too short.\n\nOverall, the agricultural outlook for this period is Favorable."

    call_count = [0]
    async def side_effect(prompt, temperature):
        captured_prompts.append(prompt)
        call_count[0] += 1
        if call_count[0] == 1:
            return invalid
        return valid

    with patch("app.llm.advisory_engine.get_primary_provider") as mp, \
         patch("app.llm.advisory_engine.get_fallback_provider") as mf:
        mock_primary = AsyncMock()
        mock_primary.generate_text.side_effect = side_effect
        mp.return_value = mock_primary
        mf.return_value = None

        await engine.generate_advisory(context=ctx, rag_chunks=RAG_CHUNKS)

    assert len(captured_prompts) >= 2
    second_prompt = captured_prompts[1]
    # Second prompt must contain original base prompt context
    assert "LOCATION" in second_prompt
    assert "CORRECTED FORECAST SUMMARY" in second_prompt
    assert "SOIL MOISTURE SUMMARY" in second_prompt
    assert "RETRIEVED ICAR KNOWLEDGE" in second_prompt
    assert "HALLUCINATION RULES" in second_prompt
    assert "ICAR_cotton.pdf" in second_prompt or "chunk" in second_prompt.lower()


# ============================================================
# TEST 8 — Empty RAG chunks → InsufficientKnowledgeError
# ============================================================

@pytest.mark.asyncio
async def test_empty_rag_chunks_raises_insufficient_knowledge(sample_request):
    ctx = _get_ctx(sample_request)

    with patch("app.llm.advisory_engine.get_primary_provider") as mp:
        mock_primary = AsyncMock()
        mp.return_value = mock_primary

        with pytest.raises(InsufficientKnowledgeError):
            await engine.generate_advisory(context=ctx, rag_chunks=[])

        # LLM must NOT be called
        mock_primary.generate_text.assert_not_called()


# ============================================================
# TEST 9 — All LLM providers fail → AdvisoryGenerationError
# ============================================================

@pytest.mark.asyncio
async def test_all_providers_fail_raises_generation_error(sample_request):
    ctx = _get_ctx(sample_request)

    with patch("app.llm.advisory_engine.get_primary_provider") as mp, \
         patch("app.llm.advisory_engine.get_fallback_provider") as mf:
        mock_primary = AsyncMock()
        mock_primary.generate_text.side_effect = Exception("Primary down")
        mp.return_value = mock_primary
        mf.return_value = None  # no fallback

        with pytest.raises(AdvisoryGenerationError):
            await engine.generate_advisory(context=ctx, rag_chunks=RAG_CHUNKS)


# ============================================================
# TEST 10 — Single-asterisk highlighting is allowed
# ============================================================

def test_single_asterisk_highlighting_allowed(sample_request):
    ctx = _get_ctx(sample_request)
    text = (
        "From 07/07/2026 to 16/07/2026, *Groundnut* is expected to receive *131.1 mm* "
        "of rainfall with temperatures of *24.1 °C*. Conditions are *moderate*.\n\n"
        "Based on ICAR guidelines, farmers should follow recommended spacing. "
        "Overall, the agricultural outlook for this period is Cautionary."
    )
    errors = engine._validate(text, ctx)
    # No markdown errors expected — single asterisks are allowed
    markdown_errors = [e for e in errors if "asterisk" in e.lower() or "bold" in e.lower()]
    assert not markdown_errors, markdown_errors


# ============================================================
# TEST 11 — Invalid structural markdown is rejected
# ============================================================

def test_heading_rejected(sample_request):
    ctx = _get_ctx(sample_request)
    text = "# Weather Report\nFrom 07/07/2026 to 16/07/2026, rain expected.\n\nRecommend care. Overall, the agricultural outlook for this period is Favorable."
    errors = engine._validate(text, ctx)
    assert any("heading" in e.lower() or "#" in e for e in errors)


def test_bullet_list_rejected(sample_request):
    ctx = _get_ctx(sample_request)
    text = "From 07/07/2026 to 16/07/2026, rain expected.\n\n- irrigate\n- spray\nOverall, the agricultural outlook for this period is Cautionary."
    errors = engine._validate(text, ctx)
    assert any("bullet" in e.lower() for e in errors)


def test_numbered_list_rejected(sample_request):
    ctx = _get_ctx(sample_request)
    text = "From 07/07/2026 to 16/07/2026, rain expected.\n\n1. irrigate\n2. spray\nOverall, the agricultural outlook for this period is Cautionary."
    errors = engine._validate(text, ctx)
    assert any("numbered" in e.lower() for e in errors)


def test_double_bold_rejected(sample_request):
    ctx = _get_ctx(sample_request)
    text = "From 07/07/2026 to 16/07/2026, **heavy rain** expected.\n\nRecommendations. Overall, the agricultural outlook for this period is Favorable."
    errors = engine._validate(text, ctx)
    assert any("double-asterisk" in e.lower() or "**" in e for e in errors)


def test_code_block_rejected(sample_request):
    ctx = _get_ctx(sample_request)
    text = "From 07/07/2026 to 16/07/2026, rain.\n\n```\nsome code\n```\nOverall, the agricultural outlook for this period is Favorable."
    errors = engine._validate(text, ctx)
    assert any("code" in e.lower() for e in errors)


# ============================================================
# TEST 12 — Paragraph 1 recommendation language rejected
# ============================================================

def test_paragraph1_recommendation_rejected(sample_request):
    ctx = _get_ctx(sample_request)
    bad_p1 = (
        "From 07/07/2026 to 16/07/2026, moderate rainfall expected. "
        "Farmers should apply fertilizer during the forecast period."
    )
    p2 = "Based on ICAR. Overall, the agricultural outlook for this period is Favorable."
    text = f"{bad_p1}\n\n{p2}"
    errors = engine._validate(text, ctx)
    assert any("recommend" in e.lower() or "paragraph 1" in e.lower() for e in errors)


# ============================================================
# TEST 13 — Word count validation
# ============================================================

def test_word_count_below_minimum_rejected(sample_request):
    ctx = _get_ctx(sample_request)
    short = "From 07/07/2026 to 16/07/2026, brief.\n\nOverall, the agricultural outlook for this period is Favorable."
    errors = engine._validate(short, ctx)
    assert any("short" in e.lower() or "word" in e.lower() for e in errors)


def test_word_count_valid(sample_request):
    ctx = _get_ctx(sample_request)
    text = _advisory()
    errors = engine._validate(text, ctx)
    wc_errors = [e for e in errors if "word" in e.lower()]
    assert not wc_errors, wc_errors


def test_word_count_above_maximum_rejected(sample_request):
    ctx = _get_ctx(sample_request)
    long_text = (
        "From 07/07/2026 to 16/07/2026, " + ("very rainy conditions are expected. " * 25)
    ) + "\n\nOverall, the agricultural outlook for this period is Favorable."
    errors = engine._validate(long_text, ctx)
    assert any("long" in e.lower() or "word" in e.lower() for e in errors)


# ============================================================
# TEST 14 — Outlook ending validation
# ============================================================

@pytest.mark.parametrize("outlook", [
    "Overall, the agricultural outlook for this period is Favorable.",
    "Overall, the agricultural outlook for this period is Cautionary.",
    "Overall, the agricultural outlook for this period is Unfavorable.",
])
def test_valid_outlook_endings(sample_request, outlook):
    ctx = _get_ctx(sample_request)
    text = _advisory(p2_ending=outlook.split()[-1].rstrip("."))
    errors = engine._validate(text, ctx)
    outlook_errors = [e for e in errors if "outlook" in e.lower()]
    assert not outlook_errors, outlook_errors


def test_invalid_outlook_rejected(sample_request):
    ctx = _get_ctx(sample_request)
    text = _advisory().replace(
        "Overall, the agricultural outlook for this period is Favorable.",
        "Conditions look broadly acceptable."
    )
    errors = engine._validate(text, ctx)
    assert any("outlook" in e.lower() for e in errors)
