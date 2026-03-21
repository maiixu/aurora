// Post-processing for whisper transcription output.
// Applied after replace-map substitutions.

// Whisper sometimes hallucinates these when audio is silent or noisy.
const ARTIFACT_PATTERNS = [
  /\[.*?\]/g,          // [Music], [Applause], [Laughter], etc.
  /\(.*?\)/g,          // (music), (inaudible), etc.
  /^(thanks?\s*(you)?|thank you)[.!,]?\s*$/i,  // lone "Thank you." hallucination
]

/**
 * Remove consecutive duplicate n-grams (n = 1..4).
 * "the the the cat" → "the cat"
 * "I was going I was going home" → "I was going home"
 */
function dedupNgrams(tokens: string[]): string[] {
  for (let n = 4; n >= 1; n--) {
    let changed = true
    while (changed) {
      changed = false
      const out: string[] = []
      let i = 0
      while (i < tokens.length) {
        const a = tokens.slice(i, i + n).map(t => t.toLowerCase()).join(' ')
        const b = tokens.slice(i + n, i + n * 2).map(t => t.toLowerCase()).join(' ')
        if (a && a === b) {
          // skip the second occurrence, keep the first
          out.push(...tokens.slice(i, i + n))
          i += n * 2
          changed = true
        } else {
          out.push(tokens[i])
          i++
        }
      }
      tokens = out
    }
  }
  return tokens
}

export function postprocess(text: string): string {
  let s = text.trim()
  if (!s) return s

  // Strip whisper artifact markers
  for (const pat of ARTIFACT_PATTERNS) {
    s = s.replace(pat, '').trim()
  }
  if (!s) return s

  // Deduplicate consecutive repeated n-grams
  const tokens = s.split(/\s+/).filter(Boolean)
  const deduped = dedupNgrams(tokens)

  return deduped.join(' ')
}
