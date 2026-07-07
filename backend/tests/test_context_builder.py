"""
Unit tests for AdvisoryContextBuilder.
Run: cd backend && pytest tests/test_context_builder.py -v
"""
import pytest
from datetime import datetime
from app.services.context_builder import AdvisoryContextBuilder
from app.models.schemas import (
    AIAdvisoryRequest, CalendarDataInput, CalendarEventInput,
    ForecastBlockInput, ForecastLocationInput, SoilMoistureBlockInput,
    SoilMoistureLocationInput,
)
from tests.conftest import make_forecast_day, make_sm_record


builder = AdvisoryContextBuilder()


# ------------------------------------------------------------------
# 1. CROP RESOLUTION
# ------------------------------------------------------------------

def test_crop_name_resolved_from_calendar(sample_request):
    ctx = builder.build(sample_request)
    assert ctx.crop_context.crop_name == "Cotton"


def test_crop_general_id(sample_request):
    req = sample_request.model_copy(update={"cropId": "general"})
    ctx = builder.build(req)
    assert ctx.crop_context.crop_name == "General (All Crops)"


# ------------------------------------------------------------------
# 2. SEASON RESOLUTION
# ------------------------------------------------------------------

def test_season_from_calendar_entry(sample_request):
    ctx = builder.build(sample_request)
    assert ctx.crop_context.season == "Kharif"


def test_season_fallback_for_general(sample_request):
    req = sample_request.model_copy(update={"cropId": "general"})
    ctx = builder.build(req)
    month = datetime.now().month
    expected = "Kharif" if 6 <= month <= 10 else "Rabi"
    assert ctx.crop_context.season == expected


# ------------------------------------------------------------------
# 3. CROP STAGE ESTIMATION
# ------------------------------------------------------------------

def test_crop_stage_sowing_month(sample_request):
    # July is in sowing window Jun(6)–Jul(7)
    ctx = builder.build(sample_request)
    assert ctx.crop_context.crop_stage in ("sowing", "early establishment", "vegetative")


def test_crop_stage_unknown_when_no_months(sample_request):
    cal = CalendarDataInput(
        success=True, state="Gujarat", district="Ahmedabad",
        calendar=[CalendarEventInput(
            crop="Cotton", season="Kharif",
            sowingPeriod="Jun–Jul", harvestingPeriod="Nov–Dec",
            sowFromMon=None, sowToMon=None, harvFromMon=None, harvToMon=None,
        )],
    )
    req = sample_request.model_copy(update={"calendarData": cal})
    ctx = builder.build(req)
    assert ctx.crop_context.crop_stage == "unknown"


# ------------------------------------------------------------------
# 4. FORECAST START/END DATES
# ------------------------------------------------------------------

def test_forecast_start_end_dates(sample_request):
    ctx = builder.build(sample_request)
    assert ctx.forecast_summary is not None
    assert ctx.forecast_summary.forecast_start_date == "2026-07-07"
    assert ctx.forecast_summary.forecast_end_date == "2026-07-16"


# ------------------------------------------------------------------
# 5. TOTAL CORRECTED RAINFALL
# ------------------------------------------------------------------

def test_total_corrected_rainfall(sample_request):
    ctx = builder.build(sample_request)
    days = sample_request.forecastData.forecast.forecast
    expected = round(sum(d.pcp_corrected for d in days), 2)
    assert ctx.forecast_summary.total_rainfall_mm == expected


# ------------------------------------------------------------------
# 6. RAINY DAY COUNT
# ------------------------------------------------------------------

def test_rainy_day_count(sample_request):
    ctx = builder.build(sample_request)
    days = sample_request.forecastData.forecast.forecast
    expected_rainy = sum(1 for d in days if d.pcp_corrected >= 2.5)
    assert ctx.forecast_summary.rainy_days == expected_rainy


# ------------------------------------------------------------------
# 7. TEMPERATURE MIN/MAX
# ------------------------------------------------------------------

def test_temperature_min_max(sample_request):
    ctx = builder.build(sample_request)
    days = sample_request.forecastData.forecast.forecast
    assert ctx.forecast_summary.minimum_temperature_c == round(min(d.tmin_corrected for d in days), 1)
    assert ctx.forecast_summary.maximum_temperature_c == round(max(d.tmax_corrected for d in days), 1)


# ------------------------------------------------------------------
# 8. RAINFALL PATTERN CLASSIFICATION
# ------------------------------------------------------------------

@pytest.mark.parametrize("total,expected_contains", [
    (2.0, "Dry"),
    (12.0, "Mostly dry"),
    (35.0, "Intermittent"),
    (75.0, "Moderate"),
    (130.0, "Widespread"),
    (250.0, "Heavy"),
])
def test_rainfall_pattern(sample_request, total, expected_contains):
    # Replace forecast with uniform rain to hit pattern thresholds
    n = 10
    pcp_per_day = total / n
    days = [make_forecast_day(f"2026-07-{7 + i:02d}", 34.0, 23.0, pcp_per_day) for i in range(n)]
    new_block = sample_request.forecastData.forecast.model_copy(update={"forecast": days})
    new_fd = sample_request.forecastData.model_copy(update={"forecast": new_block})
    req = sample_request.model_copy(update={"forecastData": new_fd})
    ctx = builder.build(req)
    assert expected_contains.lower() in ctx.forecast_summary.rainfall_pattern.lower()


# ------------------------------------------------------------------
# 9. SOIL MOISTURE: forecast-only filtering
# ------------------------------------------------------------------

def test_soil_moisture_uses_forecast_rows_only(sample_request):
    ctx = builder.build(sample_request)
    assert ctx.soil_moisture_summary is not None
    # Forecast rows have percentiles 50, 55, 60, 65
    assert ctx.soil_moisture_summary.forecast_min_percentile == 50.0
    assert ctx.soil_moisture_summary.forecast_max_percentile == 65.0


# ------------------------------------------------------------------
# 10. SOIL MOISTURE TREND
# ------------------------------------------------------------------

def test_soil_moisture_trend_increasing(sample_request):
    ctx = builder.build(sample_request)
    assert ctx.soil_moisture_summary.soil_moisture_trend == "increasing"


def test_soil_moisture_trend_decreasing(sample_request):
    records = [
        make_sm_record("2026-07-06", 70.0, 0.50, 1),
        make_sm_record("2026-07-07", 55.0, 0.40, 1),
        make_sm_record("2026-07-08", 40.0, 0.30, 1),
    ]
    sm_block = sample_request.forecastData.soil_moisture.model_copy(update={"soil_moisture": records})
    fd = sample_request.forecastData.model_copy(update={"soil_moisture": sm_block})
    req = sample_request.model_copy(update={"forecastData": fd})
    ctx = builder.build(req)
    assert ctx.soil_moisture_summary.soil_moisture_trend == "decreasing"


def test_soil_moisture_trend_stable(sample_request):
    records = [
        make_sm_record("2026-07-06", 52.0, 0.38, 1),
        make_sm_record("2026-07-07", 53.0, 0.39, 1),
        make_sm_record("2026-07-08", 51.0, 0.37, 1),
    ]
    sm_block = sample_request.forecastData.soil_moisture.model_copy(update={"soil_moisture": records})
    fd = sample_request.forecastData.model_copy(update={"soil_moisture": sm_block})
    req = sample_request.model_copy(update={"forecastData": fd})
    ctx = builder.build(req)
    assert ctx.soil_moisture_summary.soil_moisture_trend == "stable"


# ------------------------------------------------------------------
# 11. LIGHTNING SUMMARY
# ------------------------------------------------------------------

def test_lightning_summary_populated(sample_request):
    ctx = builder.build(sample_request)
    assert ctx.lightning_summary is not None
    assert ctx.lightning_summary.score == 45.0
    assert ctx.lightning_summary.category == "Moderate"


# ------------------------------------------------------------------
# 12. MISSING SOIL MOISTURE
# ------------------------------------------------------------------

def test_missing_soil_moisture(sample_request):
    sm_block = sample_request.forecastData.soil_moisture.model_copy(
        update={"success": False, "soil_moisture": []}
    )
    fd = sample_request.forecastData.model_copy(update={"soil_moisture": sm_block})
    req = sample_request.model_copy(update={"forecastData": fd})
    ctx = builder.build(req)
    assert ctx.soil_moisture_summary is None
    assert ctx.availability.soil_moisture_available is False


# ------------------------------------------------------------------
# 13. MISSING LIGHTNING
# ------------------------------------------------------------------

def test_missing_lightning(sample_request):
    from app.models.schemas import WeatherDataInput
    wd = sample_request.weatherData.model_copy(update={"lightning": None})
    req = sample_request.model_copy(update={"weatherData": wd})
    ctx = builder.build(req)
    assert ctx.lightning_summary is None
    assert ctx.availability.lightning_available is False


# ------------------------------------------------------------------
# 14. CORRECTED FORECAST UNAVAILABLE
# ------------------------------------------------------------------

def test_corrected_forecast_unavailable(sample_request):
    fb = sample_request.forecastData.forecast.model_copy(
        update={"success": False, "forecast": []}
    )
    fd = sample_request.forecastData.model_copy(update={"forecast": fb})
    req = sample_request.model_copy(update={"forecastData": fd})
    ctx = builder.build(req)
    assert ctx.forecast_summary is None
    assert ctx.availability.corrected_forecast_available is False
