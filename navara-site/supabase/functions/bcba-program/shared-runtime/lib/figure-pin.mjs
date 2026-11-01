import { Buffer } from "node:buffer";
// Content-addressed figure pin (C measurement format, reviewer brief v0.1):
// exact bytes + mime + dimensions + factual alt + the underlying labeled
// record. The pin is IDENTITY-BEARING: inside a teaching interaction it is
// folded into the canonical interaction digest (an image, axis, alt or record
// edit changes the version); on a practice asset it is folded into the served
// version string. Bytes are re-verified against the pin at EVERY serve;
// missing or mismatched assets fail closed, never degrade to text.
import { createHash } from "node:crypto";
export function validateFigurePin(f) {
  if (!f || typeof f !== "object" || Array.isArray(f)) return false;
  if (
    Object.keys(f).sort().join(",") !== "alt,height,mime,record,sha256,width"
  ) return false;
  if (!/^[0-9a-f]{64}$/.test(f.sha256)) return false;
  if (f.mime !== "image/png") return false;
  if (
    !Number.isSafeInteger(f.width) || !Number.isSafeInteger(f.height) ||
    f.width < 1 || f.height < 1
  ) return false;
  if (typeof f.alt !== "string" || !f.alt.trim()) return false;
  if (!Array.isArray(f.record) || !f.record.length) return false;
  return f.record.every((r) =>
    r && typeof r === "object" && !Array.isArray(r) &&
    Object.keys(r).length >= 1 && Object.entries(r).every(([k, v]) =>
      k.trim() &&
      (typeof v === "string" || typeof v === "number" && Number.isFinite(v))
    )
  );
}
export function verifyFigureBytes(pin, bytes) {
  if (!bytes || !Buffer.isBuffer(bytes) || bytes.length < 24) return false;
  if (createHash("sha256").update(bytes).digest("hex") !== pin.sha256) {
    return false;
  }
  if (bytes.readUInt32BE(0) !== 0x89504e47) return false; // PNG magic
  return bytes.readUInt32BE(16) === pin.width &&
    bytes.readUInt32BE(20) === pin.height;
}

const canonPin = (v) =>
  Array.isArray(v)
    ? v.map(canonPin)
    : (v && typeof v === "object"
      ? Object.fromEntries(
        Object.keys(v).sort().map((k) => [k, canonPin(v[k])]),
      )
      : v);
// Canonical FULL-pin digest: binds image bytes AND alt AND record AND mime/dims
// (an alt or record edit is content-bearing even when image bytes are
// unchanged). The image sha256 remains the byte-store lookup key.
export const figurePinDigest = (pin) =>
  createHash("sha256").update(JSON.stringify(canonPin(pin))).digest("hex");
