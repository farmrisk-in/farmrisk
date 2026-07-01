const fs = require("fs");
const csv = require("csv-parser");
const format = require("fast-csv").format;
const axios = require("axios");

const INPUT_FILE = "District_Avg_Crop_Area.csv";
const OUTPUT_FILE = "clean_districts_with_coords.csv";

// Helper function to handle strict rate-limiting (1.5s to be absolutely safe from IP bans)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Clean up known spelling anomalies inside the raw CSV to improve API matching
function sanitizeDistrictName(name) {
  return name
    .trim()
    .replace(/_|-/g, " ")
    .replace(/\bDist\b|\bDistrict\b/gi, "") // Strip redundant words
    .trim();
}

async function startGeocoding() {
  const rows = [];

  // 1. Read raw CSV into memory
  console.log("Reading raw agricultural CSV file...");
  fs.createReadStream(INPUT_FILE)
    .pipe(csv())
    .on("data", (data) => rows.push(data))
    .on("end", async () => {
      console.log(`Loaded ${rows.length} rows. Initializing geocoder...`);

      const writeStream = fs.createWriteStream(OUTPUT_FILE);
      const csvStream = format({ headers: true });
      csvStream.pipe(writeStream);

      // 2. Process each row sequentially
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rawDistrict = row.DistName;
        const rawState = row.StateName;

        const cleanDistrict = sanitizeDistrictName(rawDistrict);

        // Use your app's structured parameter approach: force standard jsonv2 and isolate the country to India
        console.log(
          `[${i + 1}/${rows.length}] Resolving: ${cleanDistrict}, ${rawState}`,
        );

        try {
          const response = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
              params: {
                q: `${cleanDistrict}, ${rawState}`,
                format: "jsonv2", // Upgraded to v2 to get clean object parsing structures
                countrycodes: "in", // Restricts search coordinates natively to India boundaries
                addressdetails: 1,
                limit: 1,
              },
              headers: {
                "User-Agent": "farmrisk-dashboard-geocoder/1.0",
                Accept: "application/json",
              },
            },
          );

          if (response.data && response.data.length > 0) {
            const result = response.data[0];

            // Explicitly cast strings to floating-point numbers immediately to avoid native string concats or NaN errors
            const parsedLat = parseFloat(result.lat);
            const parsedLng = parseFloat(result.lon);

            if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
              row.lat = parsedLat.toFixed(4);
              row.lng = parsedLng.toFixed(4);
              console.log(
                `    Matched: ${result.display_name} -> (${row.lat}, ${row.lng})`,
              );
            } else {
              throw new Error(
                "API returned invalid float text coordinate parameters.",
              );
            }
          } else {
            // FALLBACK ATTEMPT: Try searching only the state center point if the district text matching fails
            console.warn(
              `    ⚠️ Direct match failed. Attempting state fallback for: ${rawState}`,
            );

            const fallbackResponse = await axios.get(
              "https://nominatim.openstreetmap.org/search",
              {
                params: {
                  q: `${rawState}, India`,
                  format: "jsonv2",
                  countrycodes: "in",
                  limit: 1,
                },
                headers: { "User-Agent": "farmrisk-dashboard-geocoder/1.0" },
              },
            );

            if (fallbackResponse.data && fallbackResponse.data.length > 0) {
              row.lat = parseFloat(fallbackResponse.data[0].lat).toFixed(4);
              row.lng = parseFloat(fallbackResponse.data[0].lon).toFixed(4);
              console.log(
                `    ⚠️ State Fallback applied -> (${row.lat}, ${row.lng})`,
              );
            } else {
              row.lat = "20.5937"; // Absolute master fallback center of India coordinates
              row.lng = "78.9629";
              console.error(
                `    ❌ Total match failure. Applying default India center coordinate rules.`,
              );
            }
          }
        } catch (error) {
          console.error(
            `    ❌ Runtime error handling row [${cleanDistrict}]:`,
            error.message,
          );
          row.lat = "20.5937";
          row.lng = "78.9629";
        }

        // Output modified parameters directly back to data stream lines
        csvStream.write(row);

        // Enforce a strict sleep timeout between async loops to satisfy OSM's legal usage policy
        await delay(1500);
      }

      csvStream.end();
      console.log(
        `\n🎉 Processing complete! Executed output saved at: ${OUTPUT_FILE}`,
      );
    });
}

startGeocoding();
