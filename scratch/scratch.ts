import { fromFile } from 'geotiff';

async function getSoil(lat: number, lon: number) {
  const tiff = await fromFile('india_wrb2006_mostprobable.tif');
  const image = await tiff.getImage();
  const bbox = image.getBoundingBox();
  const res = image.getResolution();
  
  const [minX, minY, maxX, maxY] = bbox;
  const [resX, resY] = res;

  if (lon < minX || lon > maxX || lat < minY || lat > maxY) {
    throw new Error("Out of bounds");
  }

  const px = Math.floor((lon - minX) / resX);
  const py = Math.floor((lat - maxY) / resY);

  const rasters = await image.readRasters({ window: [px, py, px + 1, py + 1] });
  const val = rasters[0][0];
  console.log(`Value at ${lat}, ${lon}:`, val);
}

getSoil(22.30, 73.18);
