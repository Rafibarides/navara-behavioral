// Display-only helpers for lesson rendering. These never change content
// bytes, answer keys, or saved progress - only what the learner sees.

// Internal authoring codes (e.g. "HP2") must never reach the learner.
// Strip a leading ALL-CAPS+digits code token from markdown heading lines.
export function stripInternalCodes(md){
 if(typeof md!=='string')return md;
 return md.split('\n').map(l=>l.replace(/^(\s{0,3}#{1,6}\s+)[A-Z]{2,}\d+\s+/,'$1')).join('\n');
}
