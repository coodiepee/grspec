/**
 * BM25 Ranking Algorithm
 *
 * A pure TypeScript implementation of the Okapi BM25 ranking function
 * for full-text search over CSV-backed UI/UX knowledge bases.
 */

export class BM25 {
  private readonly k1: number;
  private readonly b: number;
  private corpus: string[][] = [];
  private docLengths: number[] = [];
  private avgdl = 0;
  private idf: Map<string, number> = new Map();
  private docFreqs: Map<string, number> = new Map();
  private N = 0;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  fit(documents: string[]): void {
    this.corpus = documents.map((doc) => this.tokenize(doc));
    this.N = this.corpus.length;
    if (this.N === 0) return;

    this.docLengths = this.corpus.map((doc) => doc.length);
    this.avgdl = this.docLengths.reduce((a, b) => a + b, 0) / this.N;

    this.docFreqs.clear();
    for (const doc of this.corpus) {
      const seen = new Set<string>();
      for (const word of doc) {
        if (!seen.has(word)) {
          this.docFreqs.set(word, (this.docFreqs.get(word) ?? 0) + 1);
          seen.add(word);
        }
      }
    }

    this.idf.clear();
    for (const [word, freq] of this.docFreqs) {
      this.idf.set(word, Math.log((this.N - freq + 0.5) / (freq + 0.5) + 1));
    }
  }

  score(query: string): Array<[index: number, score: number]> {
    const queryTokens = this.tokenize(query);
    const scores: Array<[number, number]> = [];

    for (let idx = 0; idx < this.corpus.length; idx++) {
      const doc = this.corpus[idx];
      const docLen = this.docLengths[idx];

      const termFreqs = new Map<string, number>();
      for (const word of doc) {
        termFreqs.set(word, (termFreqs.get(word) ?? 0) + 1);
      }

      let score = 0;
      for (const token of queryTokens) {
        const idfVal = this.idf.get(token);
        if (idfVal === undefined) continue;

        const tf = termFreqs.get(token) ?? 0;
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + (this.b * docLen) / this.avgdl);
        score += idfVal * (numerator / denominator);
      }

      scores.push([idx, score]);
    }

    return scores.sort((a, b) => b[1] - a[1]);
  }
}
