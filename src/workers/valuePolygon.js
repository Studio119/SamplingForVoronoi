/*
 * @Author: Kanata You 
 * @Date: 2021-03-09 22:11:20 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-09 23:26:39
 */

self.addEventListener('message', e => {
  const data = e.data;
  const res = valueVoronoi(data.data, data.voronoiPolygons, data.population);
  self.postMessage(res);
});

const valueVoronoi = (data, voronoiPolygons, population) => {
  const values = voronoiPolygons.map(_ => []);
  population.forEach(d => {
    const { x, y, value } = d;
    for (let i = 0; i < voronoiPolygons.length; i++) {
      const xs = voronoiPolygons[i].map(d => d[0]);
      const ys = voronoiPolygons[i].map(d => d[1]);
      if (x < Math.min(...xs) || x > Math.max(...xs) || y < Math.min(...ys) || y > Math.max(...ys)) {
        continue;
      }
      const polygon = voronoiPolygons[i];
      let inside = false;
      for (let j = 0, k = polygon.length - 1; j < polygon.length; k = j++) {
        const [x1, y1] = polygon[j];
        const [x2, y2] = polygon[k];
        const intersect = (
          ((y1 > y) ^ (y2 > y)) && (
            (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1)
          )
        );
        if (intersect) {
          inside = !inside;
        }
      }
      if (inside) {
        values[i].push(value);
        return;
      }
    }
  });

  const stds = [];

  const contrast = values.map((value, i) => {
    const before = data[i];
    const after = value.reduce((sum, d) => sum + d) / value.length;
    let k = 0;
    value.forEach(v => {
      k += Math.pow(v - after, 2);
    });
    k = Math.sqrt(k / value.length);
    stds.push(k);
    return [before, after];
  });

  const std = stds.reduce((sum, d) => sum + d) / stds.length;

  const linear = contrast.map(c => Math.abs(c[1] - c[0])).reduce((sum, c) => {
    return sum + c;
  }) / contrast.length;

  const square = contrast.map(c => Math.pow(c[1] - c[0], 2)).reduce((sum, c) => {
    return sum + c;
  }) / contrast.length;

  return {
    linear, square, std
  };
}
