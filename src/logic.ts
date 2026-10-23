import { CHARACTERS, QUESTIONS, type Answer, type Character, type CharacterId } from "./data";

export type Scores = Record<CharacterId, number>;

function emptyScores(): Scores {
  return Object.fromEntries(CHARACTERS.map((c) => [c.id, 0])) as Scores;
}

// ขั้นที่ 1: รวมคะแนนจากทุกคำตอบที่เลือก
export function scoreAnswers(answers: Answer[]): Scores {
  const scores = emptyScores();
  for (const answer of answers) {
    for (const [id, p] of Object.entries(answer.points)) {
      scores[id as CharacterId] += p;
    }
  }
  return scores;
}

// คะแนนสูงสุดที่ตัวละครแต่ละตัวเก็บได้ทั้งเกม
// (แต่ละข้อนับเฉพาะคำตอบที่ให้คะแนนตัวนั้นมากที่สุด)
// ถ้าตัวเลขของแต่ละตัวต่างกันมาก แปลว่าคำถามเอียงเข้าข้างบางตัว
export function maxScores(): Scores {
  const max = emptyScores();
  for (const q of QUESTIONS) {
    for (const c of CHARACTERS) {
      max[c.id] += Math.max(0, ...q.answers.map((a) => a.points[c.id] ?? 0));
    }
  }
  return max;
}

// ขั้นที่ 2: เรียงตัวละครจากคะแนนมากไปน้อย ตัวแรกคือผลลัพธ์
// % = คะแนนที่ได้ ÷ คะแนนสูงสุดที่ตัวนั้นเก็บได้ ใช้ตัดสินกรณีคะแนนเสมอ
export type Match = { character: Character; score: number; max: number; percent: number };

export function rankCharacters(scores: Scores): Match[] {
  const max = maxScores();
  return CHARACTERS.map((character) => {
    const m = max[character.id];
    const score = scores[character.id];
    return { character, score, max: m, percent: m ? Math.round((score / m) * 100) : 0 };
  }).sort((x, y) => y.score - x.score || y.percent - x.percent);
}
