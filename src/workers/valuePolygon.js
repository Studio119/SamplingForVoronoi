/*
 * @Author: Kanata You 
 * @Date: 2021-03-09 22:11:20 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-14 20:14:22
 */

self.addEventListener('message', e => {
  const data = e.data;
  const res = valueVoronoi(data.data, data.voronoiPolygons, data.polygonsCenters, data.population);
  self.postMessage(res);
});

const valueVoronoi = (data, voronoiPolygons, polygonsCenters, population) => {
  const values = voronoiPolygons.map(_ => []);
  population.forEach(d => {
    const { x, y, value } = d;
    const possible = voronoiPolygons.map((p, i) => ({ list: p, id: i })).map(p => {
      const dist_2 = (
        polygonsCenters[p.id].x - x
      ) ** 2 + (
        polygonsCenters[p.id].y - y
      ) ** 2;
      return {
        id: p.id,
        w:  dist_2
      };
    });
    const fromId = possible.sort((a, b) => a.w - b.w)[0].id;
    values[fromId].push(value);
  });

  const stds = [];
  let temp = 0;

  const contrast = values.map((value, i) => {
    const before = data[i];
    const after = value.reduce((sum, d) => sum + d) / value.length;
    let k = 0;
    value.forEach(v => {
      k += Math.pow(v - after, 2);
    });
    k = Math.sqrt(k / value.length);
    stds.push(k);
    temp += after;
    return [before, after];
  });

  const std = stds.reduce((sum, d) => sum + d) / stds.length;
  temp /= stds.length;
  const cv = std / temp;

  const linear = contrast.map(c => Math.abs(c[1] - c[0])).reduce((sum, c) => {
    return sum + c;
  }) / contrast.length;

  const square = contrast.map(c => Math.pow(c[1] - c[0], 2)).reduce((sum, c) => {
    return sum + c;
  }) / contrast.length;

  const cbs = voronoiPolygons.map(p => {
    const bs = [];
    let sum = 0;
    for (let i = 0; i < p.length; i++) {
      const b = (
        (p[i][0] - p[(i + 1) % p.length][0]) ** 2 +
        (p[i][1] - p[(i + 1) % p.length][1]) ** 2
      ) ** 0.5;
      sum += b;
      bs.push(b);
    }
    const aver = sum / p.length;
    let std = 0;
    bs.forEach(b => {
      std += (b - aver) ** 2;
    });
    std = (std / bs.length) ** 0.5;
    const bsCv = std / aver;

    return bsCv;
  });

  const stroke = cbs.reduce((prev, cur) => prev + cur) / cbs.length;

  return {
    linear, square, std, cv, stroke
  };
}
