"""
Shared pytest fixtures for FarmRisk backend tests.
"""
import pytest
from app.models.schemas import (
    AIAdvisoryRequest,
    CalendarDataInput,
    CalendarEventInput,
    CurrentWeatherInput,
    DailyForecastCorrectionInput,
    DailyWeatherInput,
    ForecastBlockInput,
    ForecastDataInput,
    ForecastLocationInput,
    HourlyWeatherInput,
    LightningInput,
    LocationInput,
    SoilMoistureBlockInput,
    SoilMoistureLocationInput,
    SoilMoistureRecordInput,
    WeatherDataInput,
)


def make_sm_record(date, percentile, w_frac, is_forecast):
    return SoilMoistureRecordInput(
        date=date, P_obs=5.0, Tmean=28.0, PE=6.0, P_eff=5.0,
        snowpack=0.0, w=12.0, E=0.5, R=0.1, G=0.0,
        w_frac=w_frac, sm_percentile=percentile, is_forecast=is_forecast,
    )


def make_forecast_day(date, tmax, tmin, pcp):
    return DailyForecastCorrectionInput(
        date=date,
        tmax_raw=tmax + 1, tmax_corrected=tmax,
        tmin_raw=tmin - 1, tmin_corrected=tmin,
        pcp_raw=pcp + 2, pcp_corrected=pcp,
    )


@pytest.fixture
def sample_request():
    return AIAdvisoryRequest(
        location=LocationInput(lat=22.72, lng=72.27, name="Dholka", displayName="Dholka, Ahmedabad, Gujarat, India"),
        cropId="cotton",
        calendarData=CalendarDataInput(
            success=True, state="Gujarat", district="Ahmedabad", districtCode="GJ001",
            calendar=[
                CalendarEventInput(
                    crop="Cotton", season="Kharif",
                    sowingPeriod="Jun–Jul", harvestingPeriod="Nov–Dec",
                    sowFromMon=6, sowToMon=7, harvFromMon=11, harvToMon=12,
                )
            ],
        ),
        weatherData=WeatherDataInput(
            latitude=22.72, longitude=72.27, elevation=18.0,
            timezone="Asia/Kolkata", timezoneAbbreviation="IST", utcOffsetSeconds=19800,
            current=CurrentWeatherInput(
                time="2026-07-06T14:00:00",
                temperature_2m=32.5, relative_humidity_2m=72.0,
                apparent_temperature=36.0, weather_code=61,
                pressure_msl=1005.0, surface_pressure=1004.0,
                wind_speed_10m=15.0, wind_direction_10m=220.0,
                wind_gusts_10m=25.0, precipitation=2.5,
                cloud_cover=75.0, icon="rainy",
                condition={"en": "Slight Rain", "hi": "हल्की बारिश", "mr": "हलका पाऊस", "ta": "இலேசான மழை", "gu": "હળવો વરસાદ"},
            ),
            hourly=HourlyWeatherInput(
                time=[f"2026-07-06T{h:02d}:00:00" for h in range(24)],
                temperature_2m=[32.0] * 24,
                precipitation_probability=[60.0] * 24,
                wind_speed_10m=[15.0] * 24,
                weather_code=[61] * 24,
                icon=["rainy"] * 24,
            ),
            daily=DailyWeatherInput(
                time=[f"2026-07-0{d}" for d in range(6, 10)],
                temperature_2m_max=[35.0, 34.0, 33.0, 36.0],
                temperature_2m_min=[24.0, 23.0, 22.0, 25.0],
                precipitation_sum=[5.0, 10.0, 0.0, 15.0],
            ),
            lightning=LightningInput(score=45.0, category="Moderate"),
        ),
        forecastData=ForecastDataInput(
            requested_lat=22.72, requested_lon=72.27, village_id=1001,
            forecast=ForecastBlockInput(
                success=True,
                location=ForecastLocationInput(lat=22.72, lon=72.27, elevation_m=18.0),
                grids_used=[],
                forecast_source="corrected_model",
                forecast=[
                    make_forecast_day(f"2026-07-{7 + i:02d}", 34.0 + i * 0.2, 23.0 + i * 0.1, 8.0 + i)
                    for i in range(10)
                ],
                runtime_seconds=1.2,
            ),
            soil_moisture=SoilMoistureBlockInput(
                success=True,
                location=SoilMoistureLocationInput(lat=22.72, lon=72.27),
                cold_start=False, days_computed=45, checkpoint_last_date="2026-07-05",
                soil_moisture=[
                    make_sm_record("2026-07-04", percentile=40.0, w_frac=0.30, is_forecast=0),
                    make_sm_record("2026-07-05", percentile=45.0, w_frac=0.33, is_forecast=0),
                    make_sm_record("2026-07-06", percentile=50.0, w_frac=0.36, is_forecast=1),
                    make_sm_record("2026-07-07", percentile=55.0, w_frac=0.39, is_forecast=1),
                    make_sm_record("2026-07-08", percentile=60.0, w_frac=0.42, is_forecast=1),
                    make_sm_record("2026-07-09", percentile=65.0, w_frac=0.45, is_forecast=1),
                ],
                runtime_seconds=0.8,
            ),
            cache_hit=False, total_runtime_seconds=2.0, cache_key=None,
        ),
        language="en",
    )
