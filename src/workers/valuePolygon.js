/*
 * @Author: Kanata You 
 * @Date: 2021-03-09 22:11:20 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-23 21:35:44
 */

self.addEventListener('message', e => {
  const data = e.data;
  if (data.req === "gen") {
    const res = getValue(data.population, data.voronoiPolygons, data.polygonsCenters);
    self.postMessage(res);
  } else if (data.req === "evl") {
    const res = evaluateVoronoi(data.voronoiPolygons);
    self.postMessage(res);
  } else {
    self.postMessage({
      err:  1,
      req:  data
    });
  }
});

const evaluateVoronoi = (voronoiPolygons) => {
  const dvs = [];
  const stds = [];
  const cvs = [];
  let avrgNEdges = 0;

  voronoiPolygons.forEach(vp => {
    const after = vp.averVal;
    let k = 0;
    vp.values.forEach(v => {
      k += Math.pow(v - after);
    });
    avrgNEdges += vp.polygons.length;
    const dv = k / vp.values.length;
    dvs.push(dv);
    const std = Math.sqrt(dv);
    stds.push(std);
    const cv = std / after;
    cvs.push(cv);
  });
  avrgNEdges /= voronoiPolygons.length;

  const dv = dvs.reduce((sum, d) => sum + d) / dvs.length;
  const std = stds.reduce((sum, d) => sum + d) / stds.length;
  const cv = cvs.reduce((sum, d) => sum + d) / cvs.length;

  const areas = [];

  const cbs = voronoiPolygons.map(({ polygons: p, center }) => {
    const bs = [];
    let sum = 0;
    const triangles = [];
    for (let i = 0; i < p.length - 1; i++) {
      const b = (
        (p[i][0] - p[(i + 1) % p.length][0]) ** 2 +
        (p[i][1] - p[(i + 1) % p.length][1]) ** 2
      ) ** 0.5;
      sum += b;
      bs.push(b);
      const p1 = (
        (p[i][0] - center[0]) ** 2 + (p[i][1] - center[1]) ** 2
      ) ** 0.5;
      const p2 = (
        (p[(i + 1) % p.length][0] - center[0]) ** 2 + (p[(i + 1) % p.length][1] - center[1]) ** 2
      ) ** 0.5;
      triangles.push([(b + p1 + p2) / 2, b, p1, p2]);
    }
    const aver = sum / p.length;
    let std = 0;
    bs.forEach(b => {
      std += (b - aver) ** 2;
    });
    std = (std / bs.length) ** 0.5;
    const bsCv = std / aver;

    /* 计算面积 */
    let area = 0;
    triangles.forEach(trg => {
      const s = Math.sqrt(
        trg[0] * (trg[0] - trg[1]) * (trg[0] - trg[2]) * (trg[0] - trg[3])
      );
      area += s;
    });
    areas.push(area);

    return bsCv;
  });

  const stroke = cbs.reduce((prev, cur) => prev + cur) / cbs.length;

  let local = 0;
  let lc = 0;
  voronoiPolygons.forEach((vp, i) => {
    const neighbors = [];
    voronoiPolygons.forEach((v2, j) => {
      if (i === j) {
        return;
      }
      const p1 = vp.polygons;
      const p2 = v2.polygons;
      for (let a = 0; a < p1.length; a++) {
        for (let b = 0; b < p2.length; b++) {
          if (p1[a][0] === p2[b][0] && p1[a][1] === p2[b][1]) {
            neighbors.push(j);
            return;
          }
        }
      }
    });
    if (neighbors.length > 1) {
      let temp = 0;
      neighbors.forEach(a => {
        temp += (areas[a] / areas[i] - 1) ** 2;
      });
      local += Math.sqrt(temp / neighbors.length);
      lc += 1;
    }
  });
  local /= lc;

  return {
    dv, std, cv, avrgNEdges, stroke, local
  };
}


const getValue = (population, voronoiPolygons, polygonsCenters) => {
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
    voronoiPolygons[fromId].values.push(value);
    voronoiPolygons[fromId].center = [x, y];
  });

  voronoiPolygons.forEach(vp => {
    const averVal = vp.values.reduce((prev, cur) => prev + cur) / vp.values.length;
    vp.averVal = averVal;
  });

  return voronoiPolygons;
};
