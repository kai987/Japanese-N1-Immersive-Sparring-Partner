// Benchmark only. Normalization and snippet/highlight offsets stay in TypeScript.
use wasm_bindgen::prelude::*;

struct Chunk {
    normalized: String,
    compact: String,
    units: Vec<u16>,
    priority: f64,
}

fn fuzzy(query: &[u16], text: &[u16]) -> f64 {
    if query.len() < 3 || text.len() < query.len() {
        return 0.0;
    }
    let mut first = 0;
    let mut matched = 0;
    for (i, &unit) in text.iter().enumerate() {
        if unit != query[matched] {
            continue;
        }
        if matched == 0 {
            first = i
        }
        matched += 1;
        if matched == query.len() {
            let density = matched as f64 / (i + 1 - first) as f64;
            return if density >= 0.45 { 18.0 * density } else { 0.0 };
        }
    }
    0.0
}

impl Chunk {
    fn score(&self, q: &str, units: &[u16], tokens: &[&str]) -> f64 {
        if q.is_empty() || self.compact.is_empty() {
            return 0.0;
        }
        let mut score = if self.compact == q {
            160.0
        } else if self.compact.starts_with(q) {
            105.0
        } else if self.compact.contains(q) {
            78.0
        } else {
            0.0
        };
        if tokens.len() > 1 {
            let matched = tokens
                .iter()
                .filter(|t| self.normalized.contains(**t))
                .count();
            score += if matched == tokens.len() {
                52.0
            } else {
                matched as f64 / tokens.len() as f64 * 24.0
            };
        }
        if score == 0.0 {
            score = fuzzy(units, &self.units)
        }
        if score > 0.0 {
            score + self.priority
        } else {
            0.0
        }
    }
}

#[wasm_bindgen]
#[derive(Default)]
pub struct Ranker {
    lessons: Vec<(String, Vec<Chunk>)>,
}

#[wasm_bindgen]
impl Ranker {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }
    pub fn lesson(&mut self, date: String) {
        self.lessons.push((date, Vec::new()));
    }
    pub fn chunk(&mut self, normalized: String, compact: String, priority: f64) {
        let units = compact.encode_utf16().collect();
        self.lessons
            .last_mut()
            .expect("start lesson first")
            .1
            .push(Chunk {
                normalized,
                compact,
                units,
                priority,
            });
    }
    // Four numbers per matching lesson; the display strings never cross back.
    pub fn rank(&self, normalized: &str, compact: &str) -> Vec<f64> {
        let tokens: Vec<_> = normalized.split_ascii_whitespace().collect();
        let units: Vec<_> = compact.encode_utf16().collect();
        let mut results = Vec::new();
        for (lesson, (_, chunks)) in self.lessons.iter().enumerate() {
            let (mut hits, mut best, mut score) = (0usize, 0usize, 0.0);
            for (index, chunk) in chunks.iter().enumerate() {
                let s = chunk.score(compact, &units, &tokens);
                if s > 0.0 {
                    hits += 1
                }
                if s > score {
                    best = index;
                    score = s
                }
            }
            if hits > 0 {
                results.push((lesson, best, score + 2.0 * hits.min(8) as f64, hits))
            }
        }
        results.sort_by(|a, b| {
            b.2.total_cmp(&a.2)
                .then_with(|| self.lessons[b.0].0.cmp(&self.lessons[a.0].0))
        });
        results
            .into_iter()
            .flat_map(|(l, c, s, h)| [l as f64, c as f64, s, h as f64])
            .collect()
    }
}
