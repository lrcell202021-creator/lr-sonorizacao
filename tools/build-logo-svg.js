/* Gera assets/logo-lr.svg e assets/favicon.svg a partir da geometria do
   logotipo original (tools/logo-lr-original.png).

   As coordenadas abaixo foram medidas pixel a pixel nesse PNG, no
   sistema de coordenadas dele (831x456). O desenho e as proporções são os do
   logotipo; apenas as cores foram adaptadas à identidade do site.

   Uso:  node tools/build-logo-svg.js
*/

const fs = require("fs");
const path = require("path");

const COLORS = {
  black: "#171717",
  white: "#FFFFFF",
};

// ---------------------------------------------------------------- geometria

// "L": haste vertical + pé horizontal, um único polígono.
const L = { x0: 21, x1: 97, top: 22, footTop: 369, footRight: 389, bottom: 425 };

/* "R": contorno único, no sentido horário a partir do canto superior esquerdo.
   Cada trecho é uma reta ("line") ou uma curva suave ("curve") interpolada
   pelos pontos medidos. O "R" é aberto à esquerda, como no original. */
const R_SEGMENTS = [
  { type: "line", pts: [[365, 26], [578, 26]] },
  {
    type: "curve",
    pts: [
      [578, 26], [600, 29], [620, 34], [640, 42], [660, 54], [680, 74],
      [690, 88], [696, 100], [700, 110], [703, 120], [706, 140], [706, 160],
      [704, 180], [698, 200], [691, 215], [685, 225], [677, 235], [667, 245],
      [654, 255], [637, 265], [617, 275], [601, 290],
    ],
  },
  {
    type: "curve",
    pts: [
      [601, 290], [615, 305], [628, 320], [641, 335], [655, 350], [670, 365],
      [688, 380], [708, 395], [732, 410], [767, 425], [809, 434],
    ],
  },
  { type: "line", pts: [[809, 434], [790, 439], [735, 439], [701, 436]] },
  {
    type: "curve",
    pts: [
      [701, 436], [664, 425], [633, 410], [611, 395], [594, 380], [579, 365],
      [566, 350], [554, 335], [542, 320], [530, 305], [518, 290], [506, 275],
      [498, 265], [490, 255], [482, 245], [474, 238],
    ],
  },
  { type: "line", pts: [[474, 238], [474, 226], [566, 226]] },
  {
    type: "curve",
    pts: [
      [566, 226], [612, 215], [630, 200], [641, 180], [646, 160], [643, 140],
      [636, 120], [628, 110], [617, 100], [601, 92], [586, 88], [578, 86],
    ],
  },
  { type: "line", pts: [[578, 86], [365, 86]] },
];

// ------------------------------------------------------------------ helpers

const VIEW = { x: 21, y: 22, w: 788, h: 417 }; // bbox de todo o desenho

const num = (v) => {
  const r = Math.round(v * 100) / 100;
  return String(r);
};

function makeMapper({ ox, oy, scale }) {
  return (p) => [(p[0] - ox) * scale, (p[1] - oy) * scale];
}

// Catmull-Rom -> Bézier cúbica, para curvas suaves passando pelos pontos.
function curveToBezier(pts) {
  const out = [];
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    out.push(`C${num(c1[0])} ${num(c1[1])} ${num(c2[0])} ${num(c2[1])} ${num(p2[0])} ${num(p2[1])}`);
  }
  return out.join("");
}

function buildRPath(map) {
  let d = "";
  R_SEGMENTS.forEach((seg, i) => {
    const pts = seg.pts.map(map);
    if (i === 0) d += `M${num(pts[0][0])} ${num(pts[0][1])}`;
    if (seg.type === "line") {
      pts.slice(1).forEach((q) => { d += `L${num(q[0])} ${num(q[1])}`; });
    } else {
      d += curveToBezier(pts);
    }
  });
  return d + "Z";
}

function buildLPath(map) {
  const pts = [
    [L.x0, L.top], [L.x1, L.top], [L.x1, L.footTop],
    [L.footRight, L.footTop], [L.footRight, L.bottom], [L.x0, L.bottom],
  ].map(map);
  return "M" + pts.map((q) => `${num(q[0])} ${num(q[1])}`).join("L") + "Z";
}

// ------------------------------------------------------------------- saídas

const outDir = path.join(__dirname, "..", "assets");

// 1) Logotipo para o cabeçalho (fundo claro): só as letras "LR", sem waveform.
// A sombra 3D vive no SVG (feDropShadow). O viewBox ganha uma margem só para
// a sombra não ser cortada; o desenho em si não muda de proporção.
{
  const map = makeMapper({ ox: VIEW.x, oy: VIEW.y, scale: 1 });
  const pad = { l: 10, t: 8, r: 22, b: 20 };
  const vbW = VIEW.w + pad.l + pad.r;
  const vbH = VIEW.h + pad.t + pad.b;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" role="img" aria-label="LR Sonorização">
  <title>LR Sonorização</title>
  <defs>
    <filter id="soft-3d" x="-6%" y="-8%" width="118%" height="124%" color-interpolation-filters="sRGB">
      <feDropShadow dx="7" dy="10" stdDeviation="6" flood-color="${COLORS.black}" flood-opacity=".2"/>
    </filter>
  </defs>
  <g transform="translate(${pad.l} ${pad.t})" filter="url(#soft-3d)">
    <path fill="${COLORS.black}" d="${buildLPath(map)}"/>
    <path fill="${COLORS.black}" d="${buildRPath(map)}"/>
  </g>
</svg>
`;
  fs.writeFileSync(path.join(outDir, "logo-lr.svg"), svg, "utf8");
  console.log("gerado: assets/logo-lr.svg");
}

// 2) Favicon quadrado (fundo escuro, como o logotipo original): letras brancas.
{
  const size = 64;
  const pad = 4;
  const scale = (size - pad * 2) / VIEW.w;
  const drawH = VIEW.h * scale;
  const offY = (size - drawH) / 2;
  const map = (p) => [(p[0] - VIEW.x) * scale + pad, (p[1] - VIEW.y) * scale + offY];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="LR Sonorização">
  <title>LR Sonorização</title>
  <rect width="${size}" height="${size}" fill="${COLORS.black}"/>
  <path fill="${COLORS.white}" d="${buildLPath(map)}"/>
  <path fill="${COLORS.white}" d="${buildRPath(map)}"/>
</svg>
`;
  fs.writeFileSync(path.join(outDir, "favicon.svg"), svg, "utf8");
  console.log("gerado: assets/favicon.svg");
}

console.log(`viewBox do logotipo: 0 0 ${VIEW.w} ${VIEW.h}  (proporção ${(VIEW.w / VIEW.h).toFixed(4)})`);
