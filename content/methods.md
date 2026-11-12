# FarmRisk Methods

## Root-zone soil moisture

FarmRisk reports root-zone soil moisture, not surface soil moisture. Surface soil moisture describes only the top 2–5 cm. It dries within hours of strong sun and wets after any light shower. Crop roots draw water from much deeper. The root zone is what decides whether a crop is short of water, so that is what FarmRisk tracks.

**Model.** We use the one-layer “leaky bucket” model developed at the NOAA Climate Prediction Center (Huang et al. 1996; van den Dool et al. 2003; Fan and van den Dool 2004). It treats the soil as a single store of water. In the original model this store is a 1.6 m column holding at most 760 mm. In FarmRisk the maximum storage is calibrated for each grid cell, between 150 and 1200 mm (see Calibration below). Each day the model adds rain, snowmelt and irrigation. It then removes evaporation, runoff and drainage:

`w(t+1) = w(t) + P_eff − E − R − G`

**Evaporation (E)** is potential evapotranspiration scaled by how full the soil is (w / 760 mm). A wet soil evaporates at the full rate. A dry soil evaporates less. Potential evapotranspiration is the FAO-56 Penman–Monteith reference value (Allen et al. 1998). It is computed from daily maximum and minimum temperature using the FAO-56 method for limited data. Solar radiation comes from the daily temperature range. Humidity comes from the minimum temperature. Wind speed is set to 2 m/s.

**Crop.** The farmer also selects the crop. Reference evapotranspiration is then multiplied by that crop’s FAO-56 crop coefficient (Kc). Kc follows the FAO-56 seasonal curve. It is low at sowing, rises to a peak in mid-season and falls towards harvest. The peak and late-season values are adjusted for local humidity and wind (FAO-56 Eqs. 62 and 65). Outside the growing season, Kc is 0.20 for bare soil. Stage lengths and Kc values come from FAO-56 Tables 11 and 12, using Indian entries where listed.

**Runoff (R)** has two parts. Surface runoff rises sharply as the soil fills. A small base flow drains slowly. Below 0 °C, precipitation is stored as snow and melts at 2.5 mm per °C per day. Each run starts from a half-full soil column and discards the first year as spin-up.

**Irrigation.** An irrigated field does not depend on rain alone. So the farmer can enter the date they last irrigated, and the model adds one irrigation event on that day. Irrigation is not added automatically on any other day. The event follows the demand approach of the VIC-WUR (Droppers et al. 2020) and H08 (Hanasaki et al. 2008) models, with FAO-56 thresholds (Allen et al. 1998). On the reported day, the model checks how much of the root zone’s water the crop has used. The root zone is taken as the top 1.0 m. Its plant-available water is a fixed share of the calibrated storage, about 150 mm when storage is 760 mm. Water is added only if the crop has used up its readily available water. This is the point where a crop starts to feel stress. The threshold is lower on hot, dry days, because the crop stresses sooner. The event refills the root zone towards field capacity, not to saturation. It is limited by the irrigation method’s efficiency and by how much a well and pump can deliver in a day. Water lost during application stays in the soil and leaves through runoff and drainage, as in VIC-WUR. By default the model assumes flood irrigation, 60% application efficiency and at most 60 mm per event.

**Calibration.** Five parameters are calibrated separately for each 0.25° grid cell over India. They are the maximum water storage (150–1200 mm), the surface runoff scaling and shape, the base flow rate and the snowmelt rate. The target is reconstructed root-zone soil moisture for India, based on SMAP satellite observations from 2015 onward (Chuphal et al. 2026). Model and target are compared as standardized daily anomalies. So the model is tuned to get the timing and strength of wet and dry spells right, rather than the absolute amount of water. The objective combines rank correlation and error, (1 − Spearman ρ) + RMSE of the anomalies. It is minimised with differential evolution (Storn and Price 1997). Calibration runs use IMD historical forcing, reference evapotranspiration and no irrigation. Over the full period (1981-2024), the median Spearman ρ is 0.71 and the median RMSE is 0.75 standard deviations. Over the SMAP era (2015 onward), the median ρ is 0.75, with an interquartile range of 0.65–0.81. The median RMSE in this period is 0.77 and the median anomaly bias is −0.014. In the SMAP era, 89% of grid cells reach ρ ≥ 0.5 and 64% reach ρ ≥ 0.7. Skill is lowest in the Himalaya and the northeast. The median calibrated storage is 280 mm, with an interquartile range of 231–338 mm.

**Input data.** The model runs for the exact location the farmer selects. Past days use IMD daily gridded rainfall and temperature at 0.25°, interpolated to that location. The next 15 days use FarmRisk’s bias-corrected forecast, called for the same location. The calibrated parameters are also interpolated from the surrounding grid cells. Forecast rain is fed through the model, so expected rain is already reflected in the soil moisture forecast.

**From water to a category.** Millimetres of water are hard to compare across places. A dry day in Kerala holds more water than a wet day in Rajasthan. So each day’s value is converted to a percentile of that grid cell’s own history for the same time of year, over 1981-Present. A percentile of 20 means the soil is drier than on 80% of comparable past days. The percentile is then shown as one of 11 classes.

| Class | Percentile | Shown in Hindi as |
| :---- | :---- | :---- |
| Exceptional Wet | 98–100 | हद से ज़्यादा |
| Extreme Wet | 95–98 | बहुत ज़्यादा |
| Severe Wet | 90–95 | काफ़ी ज़्यादा |
| Moderate Wet | 80–90 | ज़्यादा |
| Abnormally Wet | 70–80 | सामान्य से थोड़ी ज़्यादा |
| Normal | 30–70 | सामान्य |
| Abnormally Dry | 20–30 | सामान्य से थोड़ी कम |
| Moderate Dry | 10–20 | कम |
| Severe Dry | 5–10 | काफ़ी कम |
| Extreme Dry | 2–5 | बहुत कम |
| Exceptional Dry | 0–2 | बेहद कम |

The lower bound of each range is excluded and the upper bound included. For example, Normal is above 30 and up to 70.

**When it runs.** The model runs on demand, each time a location is selected. It returns today’s class and the next 15 days for that point.

**Why root zone matters for irrigation.** Irrigation advice in FarmRisk is triggered by the root-zone percentile, not by the surface. A dry surface after one hot afternoon does not trigger irrigation. A drop into Abnormally Dry or lower in the root zone does.

### Limitations

* **One soil setting for irrigation.** Storage capacity is calibrated for each grid cell. But the irrigation trigger assumes a medium-to-deep clayey soil and a 1.0 m root depth everywhere. Sandy soils drain faster and hold less water. Soil Health Card or soil texture data could refine this later.
* **Only the last reported irrigation.** The model includes one irrigation, on the date the farmer enters. Earlier irrigations are not included. If the model finds the soil not yet stressed on that date, it adds no water. The depth is estimated, not measured, and assumes flood irrigation.
* **Calibrated against a reconstruction.** The target is reconstructed satellite soil moisture, which has its own errors. Calibration matches the timing of wet and dry spells, not the absolute water content.
* **One deep layer, slow response.** The model has a single deep soil store. It changes more slowly than the top 30 cm. Seedlings and shallow-rooted crops can feel dryness a few days before the class changes.
* **Estimated weather inputs.** Wind is fixed and sunshine is estimated from temperature. Evaporation may be off on very windy or very cloudy days.
* **Area, not field.** Inputs come from 25 km grids interpolated to the farm. The result shows the condition around the farm. It cannot show differences between neighbouring fields.

### References

* Allen, R.G., Pereira, L.S., Raes, D. and Smith, M. (1998). Crop evapotranspiration. FAO Irrigation and Drainage Paper 56.
* Droppers, B., Franssen, W.H.P., van Vliet, M.T.H., Nijssen, B. and Ludwig, F. (2020). Simulating human impacts on global water resources using VIC-5. Geoscientific Model Development, 13, 5029–5052.
* Fan, Y. and van den Dool, H. (2004). Climate Prediction Center global monthly soil moisture data set at 0.5° resolution for 1948 to present. Journal of Geophysical Research, 109, D10102.
* Hanasaki, N., Kanae, S., Oki, T., Masuda, K., Motoya, K., Shirakawa, N., Shen, Y. and Tanaka, K. (2008). An integrated model for the assessment of global water resources, Parts 1 and 2. Hydrology and Earth System Sciences, 12, 1007–1025 and 1027–1037.
* Huang, J., van den Dool, H.M. and Georgakakos, K.P. (1996). Analysis of model-calculated soil moisture over the United States (1931–1993) and applications to long-range temperature forecasts. Journal of Climate, 9, 1350–1362.
* Storn, R. and Price, K. (1997). Differential evolution: a simple and efficient heuristic for global optimization over continuous spaces. Journal of Global Optimization, 11, 341–359.
* van den Dool, H., Huang, J. and Fan, Y. (2003). Performance and analysis of the constructed analogue method applied to U.S. soil moisture over 1981–2001. Journal of Geophysical Research, 108(D16), 8617.
* Chuphal, D. S., Abhishek, Kushwaha, A. P., Vangala, G., & Mishra, V. (2026). Development of Gridded Root-Zone Soil Moisture Product for India, 1981–2024. Scientific Data, 13(1), 560.
