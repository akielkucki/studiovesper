// GLSL for the hero's night-water surface.
// Pass 1 (SIM):   height-field wave equation in a half-float texture (R = height, G = velocity).
// Pass 2 (DROP):  pushes pointer strokes, raindrops and puddle rings into the height field.
// Pass 3 (RENDER): shades dark water over a faint layout grid, plus the liquid-metal puddle CTA.

export const MAX_DROPS = 8

export const VERT = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

export const SIM = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uDamping;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 s = texture(uState, vUv);
  float avg = (
    texture(uState, vUv - vec2(uTexel.x, 0.0)).r +
    texture(uState, vUv + vec2(uTexel.x, 0.0)).r +
    texture(uState, vUv - vec2(0.0, uTexel.y)).r +
    texture(uState, vUv + vec2(0.0, uTexel.y)).r
  ) * 0.25;
  s.g += (avg - s.r) * 2.0;
  s.g *= uDamping;
  s.r += s.g;
  s.r *= 0.9985;
  fragColor = s;
}`

export const DROP = /* glsl */ `#version 300 es
precision highp float;
#define MAX_DROPS ${MAX_DROPS}
uniform sampler2D uState;
uniform vec2 uSize;
uniform int uCount;
uniform vec4 uA[MAX_DROPS]; // segment: ax ay bx by  |  ring: cx cy rx ry   (cells)
uniform vec4 uB[MAX_DROPS]; // radius, strength, mode (0 segment, 1 ring), unused
in vec2 vUv;
out vec4 fragColor;

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec4 s = texture(uState, vUv);
  vec2 p = vUv * uSize;
  for (int i = 0; i < MAX_DROPS; i++) {
    if (i >= uCount) break;
    vec4 a = uA[i];
    vec4 b = uB[i];
    float d = b.z < 0.5
      ? sdSegment(p, a.xy, a.zw)
      : abs(length((p - a.xy) / a.zw) - 1.0) * min(a.z, a.w);
    float k = max(0.0, 1.0 - d / b.x);
    k = 0.5 - 0.5 * cos(k * 3.14159265);
    s.r += k * b.y;
  }
  fragColor = s;
}`

export const RENDER = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uState;
uniform vec2 uRes;          // canvas px
uniform float uDpr;         // canvas px per CSS px
uniform vec2 uSimTexel;
uniform float uHasSim;
uniform float uTime;
uniform vec3 uLight;        // cursor light: xy canvas px, z strength
uniform vec4 uPuddle;       // centre xy, radii zw (canvas px)
uniform vec3 uPuddleState;  // grow, hover, press
uniform vec2 uLean;         // pull toward the cursor (canvas px)
uniform vec4 uText;         // headline block: x0 y0 x1 y1 (canvas px)
uniform float uReveal;
uniform float uDim;
uniform float uGrid;        // grid cell (canvas px)
uniform vec4 uTune;         // ripple slope, swell slope, caustics, grid alpha

in vec2 vUv;
out vec4 fragColor;

const vec3 V = vec3(0.0, 0.0, 1.0);

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Value noise with analytic derivatives (after Inigo Quilez).
vec3 noised(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  float k1 = b - a;
  float k2 = c - a;
  float k4 = a - b - c + d;
  return vec3(a + k1 * u.x + k2 * u.y + k4 * u.x * u.y, du * vec2(k1 + k4 * u.y, k2 + k4 * u.x));
}

float band(float x, float w) {
  float k = x / w;
  return exp(-k * k);
}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float boxMask(vec2 p, vec4 r, float feather) {
  vec2 lo = smoothstep(r.xy - feather, r.xy, p);
  vec2 hi = 1.0 - smoothstep(r.zw, r.zw + feather, p);
  return lo.x * lo.y * hi.x * hi.y;
}

vec2 puddleRadii() {
  vec2 r = uPuddle.zw * uPuddleState.x * (1.0 + 0.05 * uPuddleState.y - 0.035 * uPuddleState.z);
  return max(r, vec2(1.0));
}

// Signed field of the puddle, roughly in units of its radius; negative inside.
float puddleField(vec2 p, float t) {
  vec2 radii = puddleRadii();
  vec2 center = uPuddle.xy + uLean * 0.3;
  vec2 rel = p - center;
  float ang = atan(rel.y, rel.x);
  float wob = 0.048 * sin(2.0 * ang + t * 0.37 + 0.6)
            + 0.030 * sin(3.0 * ang - t * 0.29 + 1.9)
            + 0.016 * sin(5.0 * ang + t * 0.61 + 2.7)
            + 0.008 * sin(8.0 * ang - t * 0.93 + 0.4);
  float bulge = 0.0;
  float lean = length(uLean);
  if (lean > 0.5) {
    float la = atan(uLean.y, uLean.x);
    bulge = min(lean / radii.x, 0.14) * pow(max(cos(ang - la), 0.0), 3.0);
  }
  float field = length(rel / radii) - (1.0 + wob + bulge);

  // Two beads drift around the rim; now and then one touches it and is drawn back in.
  float r0 = min(radii.x, radii.y);
  float grown = smoothstep(0.7, 1.0, uPuddleState.x);
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float a = 0.9 + fi * 2.6 + t * (0.045 + 0.025 * fi);
    float dist = 1.27 + 0.12 * sin(t * (0.23 + 0.09 * fi) + fi * 2.0);
    vec2 sc = center + vec2(cos(a) * radii.x, sin(a) * radii.y) * dist;
    float sr = mix(-0.2, 0.075 + 0.03 * fi, grown);
    field = smin(field, length(p - sc) / r0 - sr, 0.12);
  }
  return field;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 css = fc / uDpr;
  float t = uTime;

  // Surface slope: simulated ripples plus a slow ambient swell.
  vec2 slope = vec2(0.0);
  float lap = 0.0;
  if (uHasSim > 0.5) {
    vec2 uv = fc / uRes;
    float c = texture(uState, uv).r;
    float l = texture(uState, uv - vec2(uSimTexel.x, 0.0)).r;
    float r = texture(uState, uv + vec2(uSimTexel.x, 0.0)).r;
    float d = texture(uState, uv - vec2(0.0, uSimTexel.y)).r;
    float u = texture(uState, uv + vec2(0.0, uSimTexel.y)).r;
    slope = vec2(r - l, u - d) * uTune.x;
    lap = l + r + d + u - 4.0 * c;
  }
  vec2 p = css / 380.0;
  vec3 n1 = noised(p + vec2(t * 0.04, -t * 0.027));
  vec3 n2 = noised(p * 2.3 + vec2(-t * 0.052, t * 0.045) + n1.yz * 0.3);
  vec3 n3 = noised(p * 5.2 + vec2(t * 0.08, t * 0.066));
  vec2 s = slope + (n1.yz * 0.55 + n2.yz * 0.3 + n3.yz * 0.15) * uTune.y;
  vec3 N = normalize(vec3(-s, 1.0));

  // Keep highlights quiet behind the headline so the type stays crisp.
  float calm = 1.0 - 0.82 * boxMask(fc, uText, 90.0 * uDpr);

  // Floor: a faint layout grid, bent by refraction.
  vec2 g = (fc - s * 30.0 * uDpr) / uGrid;
  vec2 fw = max(fwidth(g), vec2(1e-4));
  vec2 dl = abs(fract(g + 0.5) - 0.5) / fw;
  float line = 1.0 - smoothstep(0.0, 1.1 * uDpr, min(dl.x, dl.y));
  float floorPatch = smoothstep(0.3, 0.8, n1.x);
  float caustic = max(-lap, 0.0) * uTune.z;

  vec3 col = vec3(0.021 + 0.02 * vUv.y);
  col += line * (uTune.w * (0.45 + 0.55 * floorPatch) + caustic * 0.5);
  col += caustic * 0.06 * calm;

  // Light: a fixed evening star, and a soft lamp that follows the cursor.
  vec3 Ls = normalize(vec3(0.42, 0.56, 1.0));
  vec3 Hs = normalize(Ls + V);
  vec2 toL = (uLight.xy - fc) / uDpr;
  vec3 Hp = normalize(normalize(vec3(toL, 260.0)) + V);
  float star = pow(max(dot(N, Hs), 0.0), 380.0);
  float lamp = pow(max(dot(N, Hp), 0.0), 520.0) * uLight.z;
  float sheen = (1.0 - N.z) * (0.4 + 0.6 * vUv.y);
  col += (star * 0.95 + lamp * 0.4 + sheen * 0.9) * calm;

  // The puddle.
  vec2 radii = puddleRadii();
  float coarse = length((fc - uPuddle.xy) / radii);
  float dpx;
  vec2 outward = vec2(0.0);
  if (coarse < 1.9) {
    float f = puddleField(fc, t);
    vec2 grad = vec2(puddleField(fc + vec2(1.0, 0.0), t) - f, puddleField(fc + vec2(0.0, 1.0), t) - f);
    float glen = max(length(grad), 1e-6);
    dpx = f / glen;
    outward = grad / glen;
  } else {
    dpx = (coarse - 1.0) * min(radii.x, radii.y);
  }
  float grown = step(0.001, uPuddleState.x);
  float mask = clamp(0.5 - dpx, 0.0, 1.0) * grown;

  if (mask > 0.0) {
    // Liquid metal: a thin rounded lip, and a viewer close enough that the reflection drifts across it.
    float din = max(-dpx, 0.0);
    float te = clamp(din / (15.0 * uDpr), 0.0, 1.0);
    float lip = (1.0 - te) * (1.0 - te) * 2.2;
    vec3 Np = normalize(vec3(outward * lip - s * 0.55, 1.0));
    vec3 Vp = normalize(vec3((uPuddle.xy - fc) / (max(radii.x, radii.y) * 3.2), 1.0));
    vec3 R = reflect(-Vp, Np);
    float up = clamp(R.z, 0.0, 1.0);
    float m = mix(0.2, 0.93, smoothstep(0.25, 0.96, up));
    m += band(dot(R.xy, vec2(-0.6, 0.8)) - 0.26, 0.2) * 0.1;   // key light, upper left
    m -= band(dot(R.xy, vec2(0.71, -0.71)) - 0.3, 0.18) * 0.1; // shade, lower right
    m += pow(max(dot(Np, Hs), 0.0), 260.0) * 0.8;
    m += pow(max(dot(Np, Hp), 0.0), 320.0) * 0.35 * uLight.z;
    float rim = 1.0 - smoothstep(0.0, 1.6 * uDpr, din);
    m = mix(m, 0.86, rim * 0.5);
    col = mix(col, vec3(clamp(m, 0.0, 1.0)), mask);
  }
  col += exp(-max(dpx, 0.0) / (80.0 * uDpr)) * 0.05 * uPuddleState.x * (1.0 - mask);

  vec2 vq = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  col *= mix(1.0, 0.7, smoothstep(0.4, 1.1, length(vq)));
  col *= uReveal * (1.0 - 0.65 * uDim);
  col += (hash12(fc + fract(t * 0.61) * 173.0) - 0.5) / 255.0;
  fragColor = vec4(col, 1.0);
}`
