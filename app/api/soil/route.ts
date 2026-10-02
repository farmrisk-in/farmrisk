import { NextResponse } from 'next/server';
import { fromFile } from 'geotiff';
import path from 'path';
import fs from 'fs';

const WRB_TO_SOIL: Record<number, { wrb: string; soil_type: string; note: string }> = {
    0: { wrb: "Acrisols", soil_type: "Red Soil", note: "Acidic and highly weathered; red-yellow soils" },
    1: { wrb: "Albeluvisols", soil_type: "Loam Soil", note: "Temperate group; rare in India" },
    2: { wrb: "Alisols", soil_type: "Red Soil", note: "Acidic with high aluminium" },
    3: { wrb: "Andosols", soil_type: "Forest & Mountain Soil", note: "Volcanic origin; very limited in India" },
    4: { wrb: "Arenosols", soil_type: "Desert (Arid) Soil", note: "Sandy; Thar dunes and coastal sands" },
    5: { wrb: "Calcisols", soil_type: "Desert (Arid) Soil", note: "Calcareous; dry western India" },
    6: { wrb: "Cambisols", soil_type: "Loam Soil", note: "Young medium-textured soils" },
    7: { wrb: "Chernozems", soil_type: "Loam Soil", note: "Dark humus-rich loam; not Regur" },
    8: { wrb: "Cryosols", soil_type: "Forest & Mountain Soil", note: "Permafrost; high Himalaya and Ladakh" },
    9: { wrb: "Durisols", soil_type: "Desert (Arid) Soil", note: "Silica-cemented hardpan" },
    10: { wrb: "Ferralsols", soil_type: "Laterite Soil", note: "Iron and aluminium rich; deeply weathered" },
    11: { wrb: "Fluvisols", soil_type: "Alluvial Soil", note: "River and delta deposits" },
    12: { wrb: "Gleysols", soil_type: "Peaty & Marshy Soil", note: "Waterlogged; deltas and terai" },
    13: { wrb: "Gypsisols", soil_type: "Desert (Arid) Soil", note: "Gypsum-rich" },
    14: { wrb: "Histosols", soil_type: "Peaty & Marshy Soil", note: "Organic peat soils" },
    15: { wrb: "Kastanozems", soil_type: "Other (Loam + Desert)", note: "Semi-arid steppe soil; calcareous loam" },
    16: { wrb: "Leptosols", soil_type: "Forest & Mountain Soil", note: "Shallow and stony; hills and plateau edges" },
    17: { wrb: "Lixisols", soil_type: "Red Soil", note: "Typical Deccan red soils" },
    18: { wrb: "Luvisols", soil_type: "Loam Soil", note: "Clay-enriched subsoil; older alluvium and red loams" },
    19: { wrb: "Nitisols", soil_type: "Red Soil", note: "Deep well-structured red clay" },
    20: { wrb: "Phaeozems", soil_type: "Loam Soil", note: "Dark fertile loam; Himalayan foothills" },
    21: { wrb: "Planosols", soil_type: "Other (Sandy Loam + Clay)", note: "Light topsoil over dense clay subsoil" },
    22: { wrb: "Plinthosols", soil_type: "Laterite Soil", note: "Plinthite layer that hardens on exposure" },
    23: { wrb: "Podzols", soil_type: "Forest & Mountain Soil", note: "Acidic sandy forest soil" },
    24: { wrb: "Regosols", soil_type: "Sandy Loam", note: "Weakly developed coarse soils" },
    25: { wrb: "Solonchaks", soil_type: "Saline Soil", note: "High soluble salts" },
    26: { wrb: "Solonetz", soil_type: "Alkaline Soil", note: "Sodic; high exchangeable sodium" },
    27: { wrb: "Stagnosols", soil_type: "Clay Soil", note: "Perched water from dense clay layer" },
    28: { wrb: "Umbrisols", soil_type: "Forest & Mountain Soil", note: "Acidic humus-rich upland soil" },
    29: { wrb: "Vertisols", soil_type: "Black Cotton Soil", note: "Swell-shrink clays of the Deccan" },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');

    if (!latStr || !lonStr) {
      return NextResponse.json({ error: "Missing lat or lon" }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const tifPath = path.join(process.cwd(), 'data', 'india_wrb2006_mostprobable.tif');
    
    if (!fs.existsSync(tifPath)) {
        return NextResponse.json({ error: "Soil data file not found on server" }, { status: 500 });
    }

    const tiff = await fromFile(tifPath);
    const image = await tiff.getImage();
    const [minX, minY, maxX, maxY] = image.getBoundingBox();
    const [resX, resY] = image.getResolution();

    if (lon < minX || lon > maxX || lat < minY || lat > maxY) {
      return NextResponse.json({ error: "Coordinates outside India" }, { status: 400 });
    }

    const px = Math.floor((lon - minX) / resX);
    const py = Math.floor((lat - maxY) / resY);

    const rasters = await image.readRasters({ window: [px, py, px + 1, py + 1] });
    const code = rasters[0][0] as number;

    const nodata = (image.getFileDirectory() as any).GDAL_NODATA;
    if (nodata !== undefined && code === parseFloat(nodata)) {
        return NextResponse.json({ error: "No soil data (water body or nodata)" }, { status: 404 });
    }

    if (!(code in WRB_TO_SOIL)) {
        return NextResponse.json({ error: `Unknown WRB code ${code}` }, { status: 500 });
    }

    return NextResponse.json({
      lat,
      lon,
      code,
      ...WRB_TO_SOIL[code]
    });

  } catch (error: any) {
    console.error("Soil API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
