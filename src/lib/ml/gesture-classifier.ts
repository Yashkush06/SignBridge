/**
 * Gesture Classifier — classifies hand landmarks into ASL signs.
 *
 * Uses geometric rules on the 21 MediaPipe hand landmarks to
 * detect ASL alphabet letters and common signs.
 *
 * Landmark indices:
 *   0: WRIST
 *   1-4: THUMB (CMC, MCP, IP, TIP)
 *   5-8: INDEX (MCP, PIP, DIP, TIP)
 *   9-12: MIDDLE (MCP, PIP, DIP, TIP)
 *   13-16: RING (MCP, PIP, DIP, TIP)
 *   17-20: PINKY (MCP, PIP, DIP, TIP)
 */

import type { HandLandmark, DetectableSign } from "./types";

interface ClassificationResult {
  sign: DetectableSign;
  confidence: number;
}

// ─── Geometry helpers ───

/** 2D distance between two landmarks */
function dist2D(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** 3D distance between two landmarks */
function dist3D(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/** Angle (in degrees) at point B formed by points A-B-C */
function angleDeg(a: HandLandmark, b: HandLandmark, c: HandLandmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2);
  if (magBA === 0 || magBC === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

// ─── Finger analysis ───

interface FingerAnalysis {
  extended: boolean;    // tip is above PIP and relatively straight
  curled: boolean;      // tip is near MCP or below it — finger is folded
  curlRatio: number;    // 0 = fully curled, 1 = fully extended
  tipToPalm: number;    // distance from tip to palm center
  pipAngle: number;     // angle at PIP joint (straighter = more extended)
}

/** Compute the palm center from the MCP joints */
function getPalmCenter(lm: HandLandmark[]): HandLandmark {
  const mcps = [lm[0], lm[5], lm[9], lm[13], lm[17]];
  const cx = mcps.reduce((s, p) => s + p.x, 0) / mcps.length;
  const cy = mcps.reduce((s, p) => s + p.y, 0) / mcps.length;
  const cz = mcps.reduce((s, p) => s + p.z, 0) / mcps.length;
  return { x: cx, y: cy, z: cz };
}

/** Analyze a single finger */
function analyzeFinger(
  lm: HandLandmark[],
  mcpIdx: number,
  pipIdx: number,
  dipIdx: number,
  tipIdx: number,
  palmCenter: HandLandmark
): FingerAnalysis {
  const mcp = lm[mcpIdx];
  const pip = lm[pipIdx];
  const dip = lm[dipIdx];
  const tip = lm[tipIdx];

  // PIP angle — how bent is the finger at the middle joint
  const pipAngle = angleDeg(mcp, pip, dip);

  // Curl ratio: distance(mcp→tip) / distance(mcp→pip + pip→dip + dip→tip)
  const chainLen = dist2D(mcp, pip) + dist2D(pip, dip) + dist2D(dip, tip);
  const directLen = dist2D(mcp, tip);
  const curlRatio = chainLen > 0 ? directLen / chainLen : 0;

  // Extended: tip is above PIP (lower y), and finger is fairly straight
  const extended = tip.y < pip.y && curlRatio > 0.75;

  // Curled: tip is near or below MCP, ratio is low
  const curled = curlRatio < 0.55;

  // Tip to palm center distance
  const tipToPalm = dist2D(tip, palmCenter);

  return { extended, curled, curlRatio, tipToPalm, pipAngle };
}

/** Full thumb analysis (thumb has different geometry) */
interface ThumbAnalysis {
  extended: boolean;
  abducted: boolean;        // thumb is far from index (spread out)
  acrossPalm: boolean;      // thumb tip is under/across the fingers
  tipToIndexMcp: number;    // distance from thumb tip to index MCP
  tipToMiddleMcp: number;
  tipToRingMcp: number;
  tipToPinkyMcp: number;
  tipToIndexTip: number;
  tipToMiddleTip: number;
  tipY: number;
  curlRatio: number;
}

function analyzeThumb(lm: HandLandmark[], palmCenter: HandLandmark): ThumbAnalysis {
  const cmc = lm[1];
  const mcp = lm[2];
  const ip = lm[3];
  const tip = lm[4];
  const indexMcp = lm[5];
  const middleMcp = lm[9];

  const chainLen = dist2D(cmc, mcp) + dist2D(mcp, ip) + dist2D(ip, tip);
  const directLen = dist2D(cmc, tip);
  const curlRatio = chainLen > 0 ? directLen / chainLen : 0;

  const tipToIndexMcp = dist2D(tip, lm[5]);
  const tipToMiddleMcp = dist2D(tip, lm[9]);
  const tipToRingMcp = dist2D(tip, lm[13]);
  const tipToPinkyMcp = dist2D(tip, lm[17]);

  const extended = curlRatio > 0.75 && tipToIndexMcp > 0.08;
  const abducted = tipToIndexMcp > 0.12;

  // Thumb across palm: tip is between index and pinky x-coordinates
  // and y is near or below MCP level
  const acrossPalm = tip.y > mcp.y && tipToIndexMcp < 0.1;

  return {
    extended,
    abducted,
    acrossPalm,
    tipToIndexMcp,
    tipToMiddleMcp,
    tipToRingMcp,
    tipToPinkyMcp,
    tipToIndexTip: dist2D(tip, lm[8]),
    tipToMiddleTip: dist2D(tip, lm[12]),
    tipY: tip.y,
    curlRatio,
  };
}

/**
 * Classify hand landmarks into an ASL sign.
 * Comprehensive rule-based classifier for the full ASL alphabet (A-Z).
 */
export function classifyGesture(landmarks: HandLandmark[]): ClassificationResult {
  if (!landmarks || landmarks.length < 21) {
    return { sign: "Unknown", confidence: 0 };
  }

  const lm = landmarks;
  const palmCenter = getPalmCenter(lm);

  const indexF = analyzeFinger(lm, 5, 6, 7, 8, palmCenter);
  const middleF = analyzeFinger(lm, 9, 10, 11, 12, palmCenter);
  const ringF = analyzeFinger(lm, 13, 14, 15, 16, palmCenter);
  const pinkyF = analyzeFinger(lm, 17, 18, 19, 20, palmCenter);
  const thumbA = analyzeThumb(lm, palmCenter);

  // Shorthand booleans
  const iE = indexF.extended;
  const iC = indexF.curled;
  const mE = middleF.extended;
  const mC = middleF.curled;
  const rE = ringF.extended;
  const rC = ringF.curled;
  const pE = pinkyF.extended;
  const pC = pinkyF.curled;
  const tE = thumbA.extended;
  const tA = thumbA.abducted;

  // Helper distances
  const thumbTip = lm[4];
  const indexTip = lm[8];
  const middleTip = lm[12];
  const ringTip = lm[16];
  const pinkyTip = lm[20];
  const indexPip = lm[6];
  const indexDip = lm[7];
  const indexMcp = lm[5];
  const middlePip = lm[10];
  const middleMcp = lm[9];
  const ringMcp = lm[13];
  const pinkyMcp = lm[17];
  const wrist = lm[0];

  // Distance between index and middle tips (for spread detection)
  const indexMiddleSpread = dist2D(indexTip, middleTip);
  // Distance between thumb tip and index tip
  const thumbIndexDist = dist2D(thumbTip, indexTip);
  // Distance between thumb tip and middle tip
  const thumbMiddleDist = dist2D(thumbTip, middleTip);

  // Palm reference size for normalization
  const palmSize = dist2D(wrist, middleMcp);

  // Normalized distances
  const nThumbIndexDist = palmSize > 0 ? thumbIndexDist / palmSize : 0;
  const nIndexMiddleSpread = palmSize > 0 ? indexMiddleSpread / palmSize : 0;

  // All four fingers curled (fist variants: A, S, M, N, T, E)
  const allFourCurled = iC && mC && rC && pC;
  // All four fingers extended
  const allFourExtended = iE && mE && rE && pE;

  // ═══════════════════════════════════════════════════════
  // Letters with extended fingers (easier to detect first)
  // ═══════════════════════════════════════════════════════

  // ── B: All four fingers extended + together, thumb tucked across palm ──
  if (allFourExtended && !tE && nIndexMiddleSpread < 0.15) {
    return { sign: "B", confidence: 0.87 };
  }

  // ── 5 / Hello: All five digits extended and spread ──
  if (allFourExtended && tE && tA) {
    return { sign: "Hello", confidence: 0.82 };
  }

  // ── W: Index + middle + ring extended, pinky curled, thumb curled ──
  if (iE && mE && rE && !pE && !tE) {
    return { sign: "W", confidence: 0.85 };
  }

  // ── F: Thumb and index touching in a circle, other 3 fingers up ──
  if (mE && rE && pE && !iE && nThumbIndexDist < 0.08) {
    return { sign: "F", confidence: 0.84 };
  }

  // ── V: Index + middle extended and spread, others curled ──
  if (iE && mE && !rE && !pE && nIndexMiddleSpread > 0.08) {
    // Check it's not K (K has thumb touching middle finger)
    const thumbToMiddlePip = dist2D(thumbTip, middlePip);
    const nThumbToMiddlePip = palmSize > 0 ? thumbToMiddlePip / palmSize : 0;
    if (nThumbToMiddlePip > 0.12 || !tE) {
      return { sign: "V", confidence: 0.87 };
    }
  }

  // ── U: Index + middle extended and together (not spread), others curled ──
  if (iE && mE && !rE && !pE && nIndexMiddleSpread < 0.08) {
    return { sign: "U", confidence: 0.84 };
  }

  // ── K: Index + middle extended + spread, thumb touching between them ──
  if (iE && mE && !rE && !pE && tE) {
    const thumbToMiddlePip = dist2D(thumbTip, middlePip);
    const nThumbToMiddlePip = palmSize > 0 ? thumbToMiddlePip / palmSize : 0;
    if (nThumbToMiddlePip < 0.12) {
      return { sign: "K", confidence: 0.80 };
    }
  }

  // ── R: Index and middle extended and crossed ──
  if (iE && mE && !rE && !pE) {
    // Crossed: index tip x is on the opposite side of middle tip x
    // relative to their MCPs
    const indexTipRelToMiddle = indexTip.x - middleTip.x;
    const indexMcpRelToMiddleMcp = indexMcp.x - middleMcp.x;
    if (Math.sign(indexTipRelToMiddle) !== Math.sign(indexMcpRelToMiddleMcp)) {
      return { sign: "R", confidence: 0.78 };
    }
  }

  // ── H: Index and middle extended horizontally (pointing sideways) ──
  if (iE && mE && !rE && !pE) {
    // If the finger tips are more horizontal than vertical
    const indexAngle = Math.abs(indexTip.y - indexMcp.y);
    const indexHoriz = Math.abs(indexTip.x - indexMcp.x);
    if (indexHoriz > indexAngle * 1.2) {
      return { sign: "H", confidence: 0.76 };
    }
  }

  // ── D: Index up, other three fingers touching thumb (making circle) ──
  if (iE && !mE && !rE && !pE) {
    const thumbToMiddle = dist2D(thumbTip, middleTip);
    const nThumbToMiddle = palmSize > 0 ? thumbToMiddle / palmSize : 0;
    if (nThumbToMiddle < 0.12) {
      return { sign: "D", confidence: 0.82 };
    }
  }

  // ── L: Index extended + thumb extended perpendicular (L-shape) ──
  if (iE && !mE && !rE && !pE && tE && tA) {
    return { sign: "L", confidence: 0.89 };
  }

  // ── I: Only pinky extended ──
  if (!iE && !mE && !rE && pE && !tE) {
    return { sign: "I", confidence: 0.86 };
  }

  // ── J: Same as I but with movement (static = I, but we can try orientation) ──
  // J is typically I + wrist curl/rotation. In static detection, hard to distinguish.

  // ── Y: Thumb + pinky extended, other three curled ──
  if (tE && !iE && !mE && !rE && pE) {
    return { sign: "Y", confidence: 0.86 };
  }

  // ── X: Index finger hooked (DIP bent, rest curled) ──
  if (!mE && !rE && !pE) {
    // Index is partially extended — PIP is up but DIP/tip curled down
    const indexPipAboveMcp = indexPip.y < indexMcp.y;
    const indexTipBelowPip = indexTip.y > indexPip.y;
    const indexDipBelowPip = indexDip.y > indexPip.y;
    if (indexPipAboveMcp && indexTipBelowPip && indexDipBelowPip && !iE) {
      return { sign: "X", confidence: 0.77 };
    }
  }

  // ── G: Index pointing sideways, thumb parallel ──
  if (!mE && !rE && !pE) {
    const indexHoriz = Math.abs(indexTip.x - indexMcp.x);
    const indexVert = Math.abs(indexTip.y - indexMcp.y);
    if (indexHoriz > indexVert * 1.3 && indexF.curlRatio > 0.6 && tE) {
      return { sign: "G", confidence: 0.77 };
    }
  }

  // ── P: Like K but pointing down (index + middle down, thumb between) ──
  if (iE && mE && !rE && !pE) {
    // Pointing down: tips below MCPs
    if (indexTip.y > indexMcp.y && middleTip.y > middleMcp.y) {
      return { sign: "P", confidence: 0.74 };
    }
  }

  // ── Q: Like G but pointing down ──
  if (!mE && !rE && !pE) {
    const indexHoriz = Math.abs(indexTip.x - indexMcp.x);
    const indexVert = Math.abs(indexTip.y - indexMcp.y);
    if (indexTip.y > indexMcp.y && indexF.curlRatio > 0.6 && tE) {
      return { sign: "Q", confidence: 0.72 };
    }
  }

  // ═══════════════════════════════════════════════════════
  // Fist-based letters — all four fingers curled
  // Differentiated by THUMB position
  // ═══════════════════════════════════════════════════════

  if (allFourCurled) {
    // Key measurements for fist variants
    const thumbTipToIndexPip = dist2D(thumbTip, indexPip);
    const thumbTipToMiddlePip = dist2D(thumbTip, middlePip);
    const nThumbTipToIndexPip = palmSize > 0 ? thumbTipToIndexPip / palmSize : 0;

    // Thumb tip Y relative to other landmarks
    const thumbBelowIndexPip = thumbTip.y > indexPip.y;
    const thumbAboveFingerTips = thumbTip.y < indexTip.y && thumbTip.y < middleTip.y;

    // ── E: Fingers curled, tips near palm, thumb across curled fingers ──
    // Fingertips are touching or very close to palm, thumb is across
    const indexTipToPalm = dist2D(indexTip, palmCenter);
    const nIndexTipToPalm = palmSize > 0 ? indexTipToPalm / palmSize : 0;
    if (nIndexTipToPalm < 0.25 && !tA && thumbTip.y < indexTip.y) {
      // Thumb is above the curled fingertips and close to them
      const thumbToIndexTip = dist2D(thumbTip, indexTip);
      const nThumbToIndexTip = palmSize > 0 ? thumbToIndexTip / palmSize : 0;
      if (nThumbToIndexTip < 0.15) {
        return { sign: "E", confidence: 0.78 };
      }
    }

    // ── O: All fingers curled to meet thumb in a circle/oval ──
    // All fingertips close to thumb tip
    const allTipsNearThumb =
      nThumbIndexDist < 0.1 &&
      (palmSize > 0 ? thumbMiddleDist / palmSize : 0) < 0.12;
    if (allTipsNearThumb && !tA) {
      return { sign: "O", confidence: 0.79 };
    }

    // ── C: Curved hand — fingers and thumb curved but not touching ──
    // Wider gap than O but still curved
    if (nThumbIndexDist > 0.08 && nThumbIndexDist < 0.25 && !tA) {
      const allPartiallyCurled =
        indexF.curlRatio > 0.4 && indexF.curlRatio < 0.8 &&
        middleF.curlRatio > 0.4 && middleF.curlRatio < 0.8;
      if (allPartiallyCurled) {
        return { sign: "C", confidence: 0.75 };
      }
    }

    // ── T: Thumb between index and middle (tip pokes out between them) ──
    // Thumb tip is between index PIP and middle PIP x-wise, and y is near them
    const thumbBetweenIM =
      (thumbTip.x > Math.min(indexPip.x, middlePip.x) - 0.02) &&
      (thumbTip.x < Math.max(indexPip.x, middlePip.x) + 0.02);
    if (thumbBetweenIM && nThumbTipToIndexPip < 0.08) {
      return { sign: "T", confidence: 0.77 };
    }

    // ── M: Thumb under three fingers — thumb tip is below/past ring finger ──
    // In M, the thumb tip emerges between ring and pinky
    const thumbTipToRingMcp = dist2D(thumbTip, ringMcp);
    const nThumbToRingMcp = palmSize > 0 ? thumbTipToRingMcp / palmSize : 0;
    const thumbTipToPinkyMcp = dist2D(thumbTip, pinkyMcp);
    const nThumbToPinkyMcp = palmSize > 0 ? thumbTipToPinkyMcp / palmSize : 0;

    if (nThumbToRingMcp < 0.15 || nThumbToPinkyMcp < 0.12) {
      // Thumb is near/under ring or pinky — M
      if (thumbBelowIndexPip || !thumbAboveFingerTips) {
        return { sign: "M", confidence: 0.79 };
      }
    }

    // ── N: Thumb under two fingers — thumb tip between middle and ring ──
    const thumbNearMiddleArea =
      nThumbTipToIndexPip > 0.06 &&
      (palmSize > 0 ? thumbTipToMiddlePip / palmSize : 0) < 0.10;
    if (thumbNearMiddleArea && thumbBelowIndexPip) {
      return { sign: "N", confidence: 0.76 };
    }

    // ── S: Fist with thumb over curled fingers (thumb wraps in front) ──
    if (!tA && !tE && thumbAboveFingerTips && nThumbTipToIndexPip < 0.12) {
      return { sign: "S", confidence: 0.78 };
    }

    // ── A: Fist with thumb alongside (thumb beside index, not over) ──
    if (tE || tA) {
      // Thumb is sticking out to the side
      return { sign: "A", confidence: 0.80 };
    }

    // Default fist — S is the most common fist shape
    return { sign: "S", confidence: 0.70 };
  }

  // ═══════════════════════════════════════════════════════
  // Remaining / fallback patterns
  // ═══════════════════════════════════════════════════════

  // ── Z: Index traces Z (motion-based — detected as pointing index) ──
  // Static: index extended pointing, which is similar to D or 1
  // We'll detect it as index-only extended without thumb touching
  if (iE && !mE && !rE && !pE && !tE) {
    return { sign: "D", confidence: 0.75 }; // D and Z are hard to distinguish statically
  }

  // General index-only extended with thumb out
  if (iE && !mE && !rE && !pE && tE) {
    return { sign: "L", confidence: 0.75 };
  }

  return { sign: "Unknown", confidence: 0.3 };
}

/**
 * Normalize landmarks relative to wrist for model input.
 * Makes the classifier position-invariant.
 */
export function normalizeLandmarks(landmarks: HandLandmark[]): number[] {
  const wrist = landmarks[0];
  const normalized: number[] = [];

  for (const lm of landmarks) {
    normalized.push(lm.x - wrist.x);
    normalized.push(lm.y - wrist.y);
    normalized.push(lm.z - wrist.z);
  }

  const maxVal = Math.max(...normalized.map(Math.abs));
  if (maxVal > 0) {
    return normalized.map((v) => v / maxVal);
  }
  return normalized;
}

/**
 * Smooth predictions over a buffer to reduce flickering.
 */
export class PredictionSmoother {
  private buffer: ClassificationResult[] = [];
  private readonly bufferSize: number;

  constructor(bufferSize = 8) {
    this.bufferSize = bufferSize;
  }

  add(result: ClassificationResult): ClassificationResult {
    this.buffer.push(result);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }

    // Find the most common sign in the buffer
    const counts = new Map<string, { count: number; totalConf: number }>();
    for (const r of this.buffer) {
      const existing = counts.get(r.sign) || { count: 0, totalConf: 0 };
      existing.count++;
      existing.totalConf += r.confidence;
      counts.set(r.sign, existing);
    }

    let bestSign: DetectableSign = "Unknown";
    let bestCount = 0;
    let bestAvgConf = 0;

    for (const [sign, data] of counts) {
      if (data.count > bestCount || (data.count === bestCount && data.totalConf / data.count > bestAvgConf)) {
        bestSign = sign as DetectableSign;
        bestCount = data.count;
        bestAvgConf = data.totalConf / data.count;
      }
    }

    return {
      sign: bestSign,
      confidence: Math.round(bestAvgConf * 100) / 100,
    };
  }

  clear(): void {
    this.buffer = [];
  }
}
