// PRIVATE server adapter. Nothing deployed. Auth returns current trusted
// principal; runtime repository rechecks plan/track before any read or replay.
const uuid = (x) =>
  typeof x === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
export function validateCommand(body) {
  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    Object.keys(body).some((k) =>
      !["nonce", "action", "payload"].includes(k)
    ) || !uuid(body.nonce)
  ) throw Error("invalid_program_request");
  const allowed = {
    enroll_lessons: [],
    status: [],
    start_session: [],
    open_next: [],
    answer: ["deliveryId", "chosen"],
    accept_focus: ["contrastId"],
    decline_focus: ["reason"],
    finish_episode: [],
    finish_session: [],
    continue_curriculum: [
      "catalogModuleId",
      "catalogContentVersion",
      "sequenceVersion",
      "manifestVersion",
    ],
    teaching_commit: ["choice"],
  };
  if (!Object.hasOwn(allowed, body.action)) {
    throw Error("invalid_program_action");
  }
  const p = body.payload ?? {};
  if (
    !p || typeof p !== "object" || Array.isArray(p) ||
    Object.keys(p).some((k) => !allowed[body.action].includes(k))
  ) throw Error("invalid_program_payload");
  if (
    body.action === "answer" &&
    (!uuid(p.deliveryId) || !Number.isSafeInteger(p.chosen) || p.chosen < 0 ||
      p.chosen > 3)
  ) throw Error("invalid_answer");
  if (
    body.action === "accept_focus" &&
    (typeof p.contrastId !== "string" || p.contrastId.length < 1 ||
      p.contrastId.length > 160)
  ) throw Error("invalid_focus");
  if (
    body.action === "decline_focus" && p.reason !== undefined &&
    !["does_not_fit", "guessed", "misread"].includes(p.reason)
  ) throw Error("invalid_feedback");
  if (
    body.action === "continue_curriculum" &&
    !(typeof p.catalogModuleId === "string" && p.catalogModuleId.length > 0 &&
      p.catalogModuleId.length <= 160 &&
      typeof p.catalogContentVersion === "string" &&
      p.catalogContentVersion.length > 0 &&
      p.catalogContentVersion.length <= 200 &&
      typeof p.sequenceVersion === "string" &&
      p.sequenceVersion.length <= 200 &&
      typeof p.manifestVersion === "string" && p.manifestVersion.length <= 200)
  ) throw Error("invalid_curriculum_choice");
  if (
    body.action === "teaching_commit" &&
    !(Number.isSafeInteger(p.choice) && p.choice >= 0 && p.choice <= 3)
  ) throw Error("invalid_teaching_choice");
  return { nonce: body.nonce, action: body.action, payload: p };
}
export function programHTTP(
  { program, authenticate, guard, origin, extraOrigins = [], enabled = false },
) {
  if (origin !== "https://navarabehavioralgroup.com") {
    throw Error("explicit_owner_origin_required");
  }
  // Staging-scoped additive preview origins. Production default is [] meaning
  // the exact owner origin only. HTTPS DNS origins only; wildcards and the
  // owner origin itself are refused at construction.
  if (
    !Array.isArray(extraOrigins) ||
    extraOrigins.some((x) =>
      typeof x !== "string" || x === origin ||
      !/^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(?::\d{1,5})?$/
        .test(x)
    )
  ) throw Error("explicit_owner_origin_required");
  const allow = [origin, ...extraOrigins];
  return async (req) => {
    const o = req.headers.get("origin");
    const matched = o !== null && allow.includes(o);
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Vary": "Origin",
      ...(matched
        ? {
          "Access-Control-Allow-Origin": o,
          "Access-Control-Allow-Headers": "authorization,apikey,content-type",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
        }
        : {}),
    };
    const reply = (status, x) =>
      new Response(status === 204 ? null : JSON.stringify(x), {
        status,
        headers,
      });
    if (o && !matched) return reply(403, {});
    if (req.method === "OPTIONS") return reply(matched ? 204 : 403, null);
    if (req.method !== "POST") return reply(405, {});
    if (!enabled) return reply(503, { error: "This Pathway is unavailable." });
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return reply(401, { error: "Sign in to continue." });
    }
    let identity;
    try {
      identity = await authenticate(auth);
    } catch {
      return reply(401, { error: "Sign in to continue." });
    }
    if (!identity?.id) return reply(401, { error: "Sign in to continue." });
    try {
      if (Number(req.headers.get("content-length") || 0) > 8192) {
        return reply(400, { error: "Invalid program request." });
      }
      const raw = await req.text();
      if (raw.length > 8192) {
        return reply(400, { error: "Invalid program request." });
      }
      const command = validateCommand(JSON.parse(raw));
      if (!guard || !await guard(identity.id, command)) {
        return reply(429, {
          error: "Wait a moment, then retry the same action.",
        });
      }
      return reply(200, await program.run(identity, command));
    } catch {
      return reply(409, {
        error:
          "This action could not be confirmed. Your saved answers are unchanged. Retry the same action.",
      });
    }
  };
}
