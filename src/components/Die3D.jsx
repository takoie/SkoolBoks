import { useLayoutEffect, useRef, useState } from "react";
import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  Euler,
  Float32BufferAttribute,
  HemisphereLight,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";

export const THROW_MS = 1150;
// Fractions of THROW_MS at which the die touches the ground: one landing and
// two smaller bounces. Callers use them to time sounds.
export const IMPACTS = [0.4, 0.72, 0.92];

// The die rests slightly turned so neighbouring faces stay visible and it
// reads as a solid object rather than a flat tile.
const REST_TILT = new Quaternion().setFromEuler(new Euler(0.2, -0.3, 0));
const CAMERA_Z = 4;
const TAU = Math.PI * 2;
const DIE_SCALE = 0.74;
const HIGHLIGHT_BODY = "#facc15";
const HIGHLIGHT_INK = "#1e1b4b";
const PULSE_MS = 900;

/* ---------- easing + keyframe sampling (units are roughly die heights) ---------- */

function bezier(x1, y1, x2, y2) {
  const sample = (a, b, c, t) => ((a * t + b) * t + c) * t;
  const ax = 3 * x1 - 3 * x2 + 1, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const dx = sample(ax, bx, cx, t) - x;
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(dx) < 1e-5 || slope === 0) break;
      t -= dx / slope;
    }
    return sample(ay, by, cy, t);
  };
}

const LINEAR = (t) => t;
const ACCEL = bezier(0.55, 0, 1, 0.45); // falling
const DECEL = bezier(0, 0.55, 0.45, 1); // rising off a bounce
const EASE_OUT = bezier(0.25, 0.6, 0.4, 1);
const EASE_IN_OUT = bezier(0.42, 0, 0.58, 1);
const SPIN = bezier(0.2, 0.65, 0.3, 1);

// frames: [{ o: offset 0..1, v: value, e: easing of the segment that starts here }]
function track(frames, p) {
  for (let i = 0; i < frames.length - 1; i += 1) {
    const a = frames[i];
    const b = frames[i + 1];
    if (p <= b.o) {
      const local = (p - a.o) / (b.o - a.o);
      return a.v + (b.v - a.v) * (a.e ?? LINEAR)(local);
    }
  }
  return frames[frames.length - 1].v;
}

const HEIGHT_FRAMES = [
  { o: 0, v: 1.6, e: ACCEL },
  { o: 0.4, v: 0, e: DECEL },
  { o: 0.56, v: 0.42, e: ACCEL },
  { o: 0.72, v: 0, e: DECEL },
  { o: 0.82, v: 0.13, e: ACCEL },
  { o: 0.92, v: 0, e: LINEAR },
  { o: 1, v: 0 },
];

/* ---------- d10 geometry ---------- */

/**
 * A pentagonal trapezohedron: the ten-sided die. Five kite faces meet at the
 * top apex, five at the bottom, and opposite faces sum to 9 so every digit
 * 0-9 has exactly one face.
 *
 * Returns the geometry (one material group per face) plus, per face, the
 * outward normal and the in-plane "up" (toward the face's own apex) that the
 * landing orientation needs.
 */
function buildD10() {
  const apex = 1;
  const radius = 0.86;
  // Planarity of the kite faces fixes the ring height from the apex height.
  const c = Math.cos(Math.PI / 5);
  const ring = (apex * (1 - c)) / (1 + c);

  const top = new Vector3(0, apex, 0);
  const bottom = new Vector3(0, -apex, 0);
  const upper = (k) => {
    const a = (TAU / 5) * k;
    return new Vector3(radius * Math.cos(a), ring, radius * Math.sin(a));
  };
  const lower = (k) => {
    const a = (TAU / 5) * k + Math.PI / 5;
    return new Vector3(radius * Math.cos(a), -ring, radius * Math.sin(a));
  };

  // Each face: kite corners in cycle order, plus the polar apex it points to.
  const defs = [];
  for (let k = 0; k < 5; k += 1) {
    defs.push({ verts: [top, upper(k), lower(k), upper(k + 1)], pole: top });
  }
  for (let k = 0; k < 5; k += 1) {
    defs.push({ verts: [bottom, lower(k), upper(k + 1), lower(k + 1)], pole: bottom });
  }

  const positions = [];
  const uvs = [];
  const faces = [];
  const geometry = new BufferGeometry();

  defs.forEach((def, index) => {
    const centroid = new Vector3();
    def.verts.forEach((v) => centroid.add(v));
    centroid.multiplyScalar(1 / def.verts.length);

    let [a, b, c2, d] = def.verts;
    const normal = new Vector3()
      .subVectors(b, a)
      .cross(new Vector3().subVectors(c2, a))
      .normalize();
    // Keep triangles counter-clockwise when seen from outside.
    if (normal.dot(centroid) < 0) {
      normal.negate();
      [b, d] = [d, b];
    }

    const up = new Vector3()
      .subVectors(def.pole, centroid)
      .addScaledVector(normal, -def.pole.clone().sub(centroid).dot(normal))
      .normalize();
    const right = new Vector3().crossVectors(up, normal).normalize();

    const local = [a, b, c2, d].map((v) => {
      const rel = new Vector3().subVectors(v, centroid);
      return { u: rel.dot(right), v: rel.dot(up) };
    });
    const span = Math.max(...local.flatMap((p) => [Math.abs(p.u), Math.abs(p.v)])) * 2.1;
    const uvOf = (p) => [0.5 + p.u / span, 0.5 + p.v / span];

    const order = [
      [a, 0], [b, 1], [c2, 2],
      [a, 0], [c2, 2], [d, 3],
    ];
    order.forEach(([vert, li]) => {
      positions.push(vert.x, vert.y, vert.z);
      uvs.push(...uvOf(local[li]));
    });
    geometry.addGroup(index * 6, 6, index);

    const width = Math.max(...local.map((p) => Math.abs(p.u))) * 2;
    faces.push({ normal, up, right, widthFrac: width / span });
  });

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.scale(DIE_SCALE, DIE_SCALE, DIE_SCALE);

  // Digit on each face: upper faces 0,2,4,6,8; the face opposite upper k is
  // lower (k + 2) % 5 and carries 9 minus that digit.
  const digits = new Array(10);
  for (let k = 0; k < 5; k += 1) {
    digits[k] = k * 2;
    digits[5 + ((k + 2) % 5)] = 9 - k * 2;
  }

  return { geometry, faces, digits };
}

/* ---------- textures ---------- */

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function paintFace(text, widthFrac, highlight = false) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d");

  // The face that landed is painted gold with dark ink so it stands apart
  // from the indigo faces around it.
  g.fillStyle = highlight ? HIGHLIGHT_BODY : cssVar("--color-primary", "#4f46e5");
  g.fillRect(0, 0, size, size);
  const sheen = g.createLinearGradient(0, 0, size, size);
  sheen.addColorStop(0, "rgba(255,255,255,0.2)");
  sheen.addColorStop(1, "rgba(0,0,0,0.14)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, size, size);

  if (text !== null && text !== undefined) {
    // The kite is narrow, so the numeral is sized from its width.
    const px = Math.min(size * 0.5, size * widthFrac * 0.78);
    g.fillStyle = highlight ? HIGHLIGHT_INK : "#ffffff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `800 ${px}px ${cssVar("--font-heading", "sans-serif")}`;
    g.fillText(String(text), size / 2, size / 2 + px * 0.04);
    // 6 and 9 look the same upside down on a tumbling die: underline them.
    if (text === 6 || text === 9) {
      g.fillRect(size / 2 - px * 0.2, size / 2 + px * 0.5, px * 0.4, px * 0.07);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function paintShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.65)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

/* ---------- component ---------- */

/**
 * A real-time 3D ten-sided die (digits 0-9) that is thrown in from the side,
 * tumbles, bounces twice and lands with `request.digit` facing forward.
 *
 * `request` is `{ key, digit }`; a new key starts a new throw and `null`
 * resets the die. The stage height comes from the `--die` CSS variable on an
 * ancestor, so the parent decides how big the die is on its display.
 */
function Die3D({ request, onImpact, onLand }) {
  const stageRef = useRef(null);
  const three = useRef(null);
  const callbacks = useRef({ onImpact, onLand });
  callbacks.current = { onImpact, onLand };
  const [fallback, setFallback] = useState(false);

  const key = request?.key;
  const digit = request?.digit;

  // Scene setup. The canvas is transparent so the stage background shows.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFallback(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0.14, CAMERA_Z);

    scene.add(new AmbientLight(0xffffff, 0.9));
    scene.add(new HemisphereLight(0xffffff, 0x6366f1, 0.9));
    const keyLight = new DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(-2.5, 3.5, 5);
    scene.add(keyLight);

    const { geometry, faces, digits } = buildD10();
    const materials = faces.map(
      () => new MeshStandardMaterial({ roughness: 0.32, metalness: 0.05, flatShading: true })
    );
    const die = new Mesh(geometry, materials);
    scene.add(die);

    const shadowTexture = paintShadow();
    const shadow = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
    );
    shadow.position.set(0, -0.68, -0.4);
    scene.add(shadow);

    const state = {
      renderer,
      scene,
      camera,
      die,
      shadow,
      faces,
      digits,
      materials,
      textures: [],
      halfWidth: 2,
      frame: 0,
      throwing: false,
    };
    three.current = state;

    // The face that stands in for "no digit yet" before the first throw.
    const IDLE_FACE = 0;

    state.paint = (label) => {
      state.stopPulse();
      state.highlighted = -1;
      state.textures.forEach((t) => t.dispose());
      state.textures = materials.map((m, i) => {
        const text = i === IDLE_FACE && label === "?" ? "?" : digits[i];
        const texture = paintFace(text, faces[i].widthFrac);
        m.map = texture;
        m.needsUpdate = true;
        return texture;
      });
    };

    state.setFace = (i, highlight) => {
      state.textures[i]?.dispose();
      const texture = paintFace(digits[i], faces[i].widthFrac, highlight);
      materials[i].map = texture;
      materials[i].needsUpdate = true;
      state.textures[i] = texture;
    };

    state.stopPulse = () => {
      cancelAnimationFrame(state.pulseFrame);
      materials.forEach((m) => {
        m.emissiveIntensity = 0;
      });
    };

    state.clearHighlight = () => {
      state.stopPulse();
      if (state.highlighted >= 0) {
        state.setFace(state.highlighted, false);
        state.highlighted = -1;
      }
    };

    // Mark the landed face: gold paint, plus a few quick blinks of light.
    state.highlight = (i, animate) => {
      state.setFace(i, true);
      state.highlighted = i;
      const m = materials[i];
      m.emissive.set(HIGHLIGHT_BODY);
      m.emissiveIntensity = 0;
      if (!animate) {
        state.draw();
        return;
      }
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / PULSE_MS, 1);
        m.emissiveIntensity = 0.75 * Math.sin(p * Math.PI * 3) ** 2 * (1 - p);
        state.draw();
        if (p < 1) state.pulseFrame = requestAnimationFrame(tick);
      };
      state.pulseFrame = requestAnimationFrame(tick);
    };

    // Orientation that puts `faceIndex` toward the camera with its numeral
    // upright, then adds the resting tilt.
    state.restQuaternion = (faceIndex) => {
      const f = faces[faceIndex];
      const basis = new Matrix4().makeBasis(f.right, f.up, f.normal).transpose();
      const align = new Quaternion().setFromRotationMatrix(basis);
      return REST_TILT.clone().multiply(align);
    };

    state.pose = (x, y, quaternion) => {
      die.position.set(x, y, 0);
      die.quaternion.copy(quaternion);
      const lift = Math.max(y, 0);
      shadow.position.x = x;
      shadow.scale.set(1.0 / (1 + lift * 0.55), 0.24 / (1 + lift * 0.4), 1);
      shadow.material.opacity = 0.5 / (1 + lift * 1.6);
    };

    state.draw = () => renderer.render(scene, camera);

    state.paint("?");
    state.pose(0, 0, state.restQuaternion(IDLE_FACE));

    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      state.halfWidth = Math.tan((camera.fov * Math.PI) / 360) * CAMERA_Z * camera.aspect;
      state.draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);

    // Re-paint once the heading font is available so digits don't use a
    // fallback face on the very first frame.
    document.fonts
      ?.load(`800 64px ${cssVar("--font-heading", "sans-serif")}`)
      .then(() => {
        if (three.current !== state) return;
        state.paint(state.idle ? "?" : "digits");
        state.draw();
      })
      .catch(() => {});
    state.idle = true;

    return () => {
      observer.disconnect();
      cancelAnimationFrame(state.frame);
      cancelAnimationFrame(state.pulseFrame);
      state.textures.forEach((t) => t.dispose());
      shadowTexture.dispose();
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      shadow.geometry.dispose();
      shadow.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      three.current = null;
    };
  }, []);

  // One throw per key; `null` resets the die.
  useLayoutEffect(() => {
    if (fallback) {
      if (key == null) return undefined;
      const t = setTimeout(() => callbacks.current.onLand?.(), 500);
      return () => clearTimeout(t);
    }

    const s = three.current;
    if (!s) return undefined;

    if (key == null) {
      s.throwing = false;
      s.idle = true;
      s.paint("?");
      s.pose(0, 0, s.restQuaternion(0));
      s.draw();
      return undefined;
    }

    if (s.idle) {
      s.idle = false;
      s.paint("digits");
    }
    s.clearHighlight();

    const faceIndex = s.digits.indexOf(digit);
    const target = s.restQuaternion(faceIndex);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      s.pose(0, 0, target);
      s.highlight(faceIndex, false);
      callbacks.current.onLand?.();
      return undefined;
    }

    const side = Math.random() < 0.5 ? -1 : 1;
    const startX = side * (s.halfWidth + 1.1);
    // Extra tumble: rotate about a skewed axis by an angle that eases to 0, so
    // the die always ends exactly on `target`.
    const axis = new Vector3(1, -0.65 * side, 0.4).normalize();
    const spinFrames = [
      { o: 0, v: TAU * 3 * side, e: SPIN },
      { o: 0.62, v: TAU * 0.36 * side, e: EASE_OUT },
      { o: 1, v: 0 },
    ];
    const xFrames = [
      { o: 0, v: startX, e: EASE_OUT },
      { o: 0.7, v: -side * 0.26, e: EASE_IN_OUT },
      { o: 0.88, v: side * 0.05, e: EASE_OUT },
      { o: 1, v: 0 },
    ];

    const extra = new Quaternion();
    const poseAt = (p) => {
      extra.setFromAxisAngle(axis, track(spinFrames, p));
      s.pose(track(xFrames, p), track(HEIGHT_FRAMES, p), extra.multiply(target));
    };

    s.throwing = true;
    const start = performance.now();
    const impactsLeft = [...IMPACTS];
    let impactIndex = 0;
    let cancelled = false;

    const step = (now) => {
      if (cancelled) return;
      const p = Math.min((now - start) / THROW_MS, 1);
      poseAt(p);
      s.draw();

      while (impactsLeft.length && p >= impactsLeft[0]) {
        impactsLeft.shift();
        callbacks.current.onImpact?.(impactIndex);
        impactIndex += 1;
      }

      if (p < 1) {
        s.frame = requestAnimationFrame(step);
      } else {
        s.throwing = false;
        s.highlight(faceIndex, true);
        callbacks.current.onLand?.();
      }
    };
    // Show the first frame before paint so the die never flashes at rest.
    poseAt(0);
    s.draw();
    s.frame = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(s.frame);
      s.stopPulse();
    };
  }, [key, digit, fallback]);

  return (
    <div ref={stageRef} className="die-stage" aria-hidden="true">
      {fallback && <div className="die-fallback">{digit ?? "?"}</div>}
    </div>
  );
}

export default Die3D;
