import { useEffect, useMemo, useState } from "react";
import {
  CHARACTERS,
  ENDING_STORY,
  QUESTIONS,
  type Answer,
  type Character,
  // type CharacterId, // DEV
  resultImageFor,
} from "./data";
import { rankCharacters, scoreAnswers } from "./logic";

type Screen = "start" | "name" | "quiz" | "ending" | "loading" | "result";

const NAME_MAX_LENGTH = 15;

// เวลาหน้าโหลดดิ้งก่อนไปหน้าผลลัพธ์ (มิลลิวินาที)
const LOADING_MS = 2400;

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [answers, setAnswers] = useState<Answer[]>([]);
  // ชื่อผู้เล่น ใช้แทน {name} ในข้อความทุกจุด (เก็บไว้ตอนเล่นใหม่ จะได้ไม่ต้องพิมพ์ซ้ำ)
  const [playerName, setPlayerName] = useState("");
  const fill = (text: string) => text.split("{name}").join(playerName);
  // หน้าเล่าเรื่องที่กำลังแสดงของข้อปัจจุบัน ถ้าเท่ากับจำนวนหน้า story แปลว่าถึงคำถามแล้ว
  const [storyPage, setStoryPage] = useState(0);
  // เลขสุ่ม 0–1 ใช้เลือก variant ของตัวละคร สุ่มใหม่ทุกครั้งที่เล่นจบ (ไม่สุ่มทุก render)
  const [variantRoll, setVariantRoll] = useState(0);

  const scores = useMemo(() => scoreAnswers(answers), [answers]);
  const ranking = useMemo(
    () =>
      rankCharacters(scores).map((m) => ({
        ...m,
        character: pickVariant(m.character, variantRoll),
      })),
    [scores, variantRoll],
  );
  const step = answers.length;
  const top = ranking[0];
  // variant ใส่ resultImage เองได้ ถ้าไม่ใส่ใช้รูปใน asset ที่ชื่อไฟล์ตรงกับ id
  // หาจากชื่อด้วย เพื่อให้ variant (เช่น ป้าอร.jpg) ใช้รูปตามชื่อได้
  const resultPhoto =
    top.character.resultImage ??
    resultImageFor(top.character.name) ??
    resultImageFor(top.character.id);
  const question = QUESTIONS[step];
  const story = question?.story ?? [];
  const inStory = storyPage < story.length;

  function choose(answer: Answer) {
    const next = [...answers, answer];
    setAnswers(next);
    setStoryPage(0);
    if (next.length === QUESTIONS.length) {
      setVariantRoll(Math.random());
      setScreen(ENDING_STORY.length ? "ending" : "loading");
    }
  }

  // บทสรุป: ใช้ storyPage นับหน้าเหมือนเรื่องเล่าก่อนคำถาม หน้าสุดท้ายแล้วไปโหลดดิ้ง
  function nextEnding() {
    if (storyPage + 1 < ENDING_STORY.length) setStoryPage(storyPage + 1);
    else setScreen("loading");
  }

  // ย้อนทีละหน้า: หน้าเล่าเรื่องก่อนหน้า → คำถามข้อก่อน (ข้ามหน้าเล่าเรื่องของข้อนั้น)
  // จากบทสรุปหน้าแรก ย้อนกลับไปแก้คำตอบข้อสุดท้าย
  function back() {
    if (storyPage > 0) return setStoryPage(storyPage - 1);
    if (step === 0) return restart();
    setAnswers(answers.slice(0, -1));
    setStoryPage(QUESTIONS[step - 1].story?.length ?? 0);
    setScreen("quiz");
  }

  /* DEV (ปิดไว้): เปิดใช้โดยลบ comment ตรงนี้, ที่ DevSkip, ที่หน้าแรก และ import CharacterId
  // DEV: ข้ามคำถามทั้งหมด โดยเลือกคำตอบที่ให้คะแนนตัวละครนี้มากสุดในทุกข้อ
  // viaEnding = ไปหน้าบทสรุปก่อน (แล้วโหลดดิ้ง → ผลลัพธ์ตามปกติ) แทนการไปหน้าผลลัพธ์ทันที
  function skipTo(id: CharacterId, viaEnding: boolean) {
    setAnswers(
      QUESTIONS.map((q) =>
        q.answers.reduce((best, a) =>
          (a.points[id] ?? 0) > (best.points[id] ?? 0) ? a : best,
        ),
      ),
    );
    setStoryPage(0);
    setVariantRoll(Math.random());
    if (!playerName) setPlayerName("ทดสอบ");
    setScreen(viaEnding ? (ENDING_STORY.length ? "ending" : "loading") : "result");
  }
  */

  function restart() {
    setAnswers([]);
    setStoryPage(0);
    setScreen("start");
  }

  return (
    <main className="relative min-h-screen px-4 py-10 flex flex-col items-center overflow-hidden">
      <SakuraPetals />

      {/* key เปลี่ยนทุกหน้า เพื่อให้ animation .enter เล่นใหม่ */}
      <div
        key={`${screen}-${step}-${storyPage}`}
        className="enter relative z-10 w-full max-w-xl"
      >
        {screen === "start" && (
          <section className="text-center pt-8">
            <div
              className="flex flex-wrap justify-center gap-3 mb-8"
              aria-hidden
            >
              {CHARACTERS.map((c, i) => (
                <Avatar
                  key={c.id}
                  character={c}
                  className="w-14 h-14 text-2xl bob"
                  delay={i * 0.13}
                />
              ))}
            </div>
            <p className="font-display text-shu tracking-widest mb-4">
              ถ้า L O V E มีอยู่จริง
            </p>
            <h1 className="font-display text-4xl sm:text-5xl leading-tight mb-4">
              คุณคือใครในจักรวาล
            </h1>
            {/* <p className="text-lg opacity-80 mb-10">
              เจอ {QUESTIONS.length} สถานการณ์ เลือกคำที่คุณจะพูดออกไป
            </p> */}
            <button
              onClick={() => setScreen("name")}
              className="pixel-btn font-display text-xl px-10 py-3"
            >
              ▶ เริ่มเดินทาง
            </button>
            <p
              className="font-display text-sm mt-6 opacity-60 blink"
              aria-hidden
            >
              - PRESS START -
            </p>
            {/* DEV: ทางลัดไปหน้าผลลัพธ์ ลบบรรทัดนี้กับฟังก์ชัน DevSkip ด้านล่างได้เลยเมื่อไม่ใช้ */}
            {/* {import.meta.env.DEV && <DevSkip onPick={skipTo} />} */}
          </section>
        )}

        {screen === "name" && (
          <NameScreen
            initial={playerName}
            onBack={() => setScreen("start")}
            onSubmit={(name) => {
              setPlayerName(name);
              setScreen("quiz");
            }}
          />
        )}

        {screen === "quiz" && (
          <section>
            <div className="flex items-center justify-between mb-3 text-sm">
              <button
                onClick={back}
                className="font-display opacity-70 hover:opacity-100"
              >
                ◀ ย้อนกลับ
              </button>
              <span className="font-display opacity-70">
                {/* ข้อ {step + 1}/{QUESTIONS.length} */}
              </span>
            </div>

            <Progress step={step} />

            {inStory ? (
              <StoryBox
                text={fill(story[storyPage])}
                onNext={() => setStoryPage(storyPage + 1)}
              />
            ) : (
              <>
                <DialogBox
                  tag={`ข้อที่ ${step + 1}`}
                  text={fill(question.situation)}
                />

                {/* <p className="font-display opacity-70 mt-6 mb-3">
                  คุณจะพูดว่า…
                </p> */}
                <div className="pixel-card grid">
                  {question.answers.map((a) => (
                    <button
                      key={a.text}
                      onClick={() => choose(a)}
                      // สลับสีพื้น อ่อน/เข้ม ทีละแถว ให้แยกตัวเลือกออกจากกันชัดบนจอมือถือ
                      className="menu-item flex gap-2 text-left text-lg px-3 py-4 odd:bg-cream even:bg-gold/25 not-last:border-b-2 not-last:border-ink/15 hover:bg-sakura/50! focus-visible:bg-sakura/50! focus-visible:outline-none"
                    >
                      <span
                        className="w-4 shrink-0 font-display text-[10px] leading-7 text-shu"
                        aria-hidden
                      >
                        <span className="bullet">◆</span>
                        <span className="cursor">▶</span>
                      </span>
                      <span>{fill(a.text)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {screen === "ending" && (
          <section>
            <div className="flex items-center justify-between mb-3 text-sm">
              <button
                onClick={back}
                className="font-display opacity-70 hover:opacity-100"
              >
                ◀ ย้อนกลับ
              </button>
            </div>

            <Progress step={step} />

            <StoryBox
              tag="บทสรุป"
              text={fill(ENDING_STORY[storyPage])}
              onNext={nextEnding}
            />
          </section>
        )}

        {screen === "loading" && (
          <LoadingScreen onDone={() => setScreen("result")} />
        )}

        {screen === "result" && (
          <section>
            <div className="pixel-card relative p-8 text-center">
              <div className="hanko absolute -top-5 -right-3 font-display text-xl w-14 h-14 flex items-center justify-center">
                {`<3`}
              </div>
              <p className="opacity-70 mb-2">คุณคือ</p>
              <div className="pop">
                {resultPhoto ? (
                  <img
                    src={resultPhoto}
                    alt={top.character.name}
                    className="photo w-full h-auto my-4 border-[3px] border-ink"
                  />
                ) : (
                  <Avatar
                    character={top.character}
                    className="w-32 h-32 text-6xl mx-auto my-4 bob"
                  />
                )}
              </div>
              <h1 className="font-display text-4xl mb-3">
                {top.character.name}
              </h1>
              <p className="text-lg">{fill(top.character.description)}</p>
              {/* <p className="font-display mt-5 inline-block bg-matcha text-ink px-4 py-1 border-[3px] border-ink">
                ★ เข้ากัน {top.percent}%
              </p> */}
            </div>

            {/* <h2 className="font-display text-2xl mt-10 mb-4">
              ランキング · คะแนนทุกตัวละคร
            </h2>
            <ol className="pixel-card grid gap-1 p-3">
              {ranking.map((m, i) => (
                <li
                  key={m.character.id}
                  className="flex items-center gap-3 px-2 py-2"
                >
                  <span className="font-display w-5 opacity-60">{i + 1}</span>
                  <Avatar character={m.character} className="w-8 h-8 text-sm" />
                  <span className="flex-1">{m.character.name}</span>
                  <span className="font-display text-sm opacity-60">
                    {m.score}/{m.max}
                  </span>
                  <span className="font-display w-12 text-right">
                    {m.percent}%
                  </span>
                </li>
              ))}
            </ol> */}

            <button
              onClick={restart}
              className="pixel-btn mt-10 w-full font-display text-xl py-3"
            >
              ↺ เล่นอีกครั้ง
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

/* DEV (ปิดไว้)
// DEV: ปุ่มลัดดูผลของแต่ละตัวละคร (แสดงเฉพาะตอน npm run dev)
function DevSkip({
  onPick,
}: {
  onPick: (id: CharacterId, viaEnding: boolean) => void;
}) {
  const [viaEnding, setViaEnding] = useState(false);
  return (
    <div className="mt-10 p-3 border-2 border-dashed border-ink/40 text-sm">
      <p className="font-display opacity-60 mb-2">DEV · ข้ามไปดูผล</p>
      <div className="flex flex-wrap justify-center gap-2">
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id, viaEnding)}
            className="px-3 py-1 bg-cream border-2 border-ink hover:bg-sakura/50"
          >
            {c.name}
          </button>
        ))}
      </div>
      <label className="flex items-center justify-center gap-2 mt-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={viaEnding}
          onChange={(e) => setViaEnding(e.target.checked)}
          className="accent-shu w-4 h-4"
        />
        ผ่านบทสรุป + โหลดดิ้งก่อน
      </label>
    </div>
  );
}
*/

// ถ้าตัวละครมี variants ให้หยิบ 1 แบบตามเลขสุ่ม มาแทน name/description/image
function pickVariant(character: Character, roll: number): Character {
  const variants = character.variants;
  if (!variants?.length) return character;
  return { ...character, ...variants[Math.floor(roll * variants.length)] };
}

// ---------- ข้อความพิมพ์ทีละตัวแบบ visual novel ----------

// ตัดเป็นตัวอักษรที่แสดงผลได้ (รวมสระบน/ล่างและวรรณยุกต์ไทยไว้กับพยัญชนะ) จะได้ไม่มีสระลอยตอนพิมพ์
function splitGraphemes(text: string): string[] {
  return text.match(/.[ัำ-ฺ็-๎]*/gsu) ?? [];
}

function useTypewriter(text: string, msPerChar = 40) {
  const chars = useMemo(() => splitGraphemes(text), [text]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(chars.length);
      return;
    }
    setCount(0);
    const id = setInterval(() => {
      setCount((n) => {
        if (n >= chars.length) clearInterval(id);
        return Math.min(n + 1, chars.length);
      });
    }, msPerChar);
    return () => clearInterval(id);
  }, [chars, msPerChar]);

  return {
    shown: chars.slice(0, count).join(""),
    done: count >= chars.length,
    skip: () => setCount(chars.length),
  };
}

// กล่องบทพูด/สถานการณ์ ข้อความพิมพ์ทีละตัว คลิกเพื่อแสดงทั้งหมด
function DialogBox({ tag, text }: { tag: string; text: string }) {
  const { shown, done, skip } = useTypewriter(text);
  return (
    <div className="relative mt-4">
      <span className="pixel-tag absolute -top-4 left-4 z-10 font-display text-sm px-3 py-0.5">
        {tag}
      </span>
      <div
        onClick={skip}
        className="pixel-box px-7 pt-8 pb-7 min-h-32 cursor-pointer"
      >
        <p className="font-display text-2xl leading-relaxed">
          {shown}
          {/* ข้อความที่ยังไม่แสดง จองพื้นที่ไว้ไม่ให้กล่องขยายระหว่างพิมพ์ */}
          <span className="invisible">{text.slice(shown.length)}</span>
        </p>
        {done && (
          <span
            className="blink absolute right-5 bottom-3 text-sakura"
            aria-hidden
          >
            ▼
          </span>
        )}
      </div>
    </div>
  );
}

// หน้าเล่าเรื่อง: คลิกครั้งแรกแสดงข้อความทั้งหมด ครั้งถัดไปไปหน้าต่อ
function StoryBox({
  text,
  onNext,
  tag = "L-O-V-E",
}: {
  text: string;
  onNext: () => void;
  tag?: string;
}) {
  const { shown, done, skip } = useTypewriter(text);
  return (
    <div className="relative mt-4">
      <span className="pixel-tag absolute -top-4 left-4 z-10 font-display text-sm px-3 py-0.5">
        {tag}
      </span>
      <button
        onClick={done ? onNext : skip}
        className="pixel-box block w-full text-left px-7 pt-8 pb-10 min-h-48 focus-visible:outline-4 focus-visible:outline-shu"
      >
        <p className="text-xl leading-relaxed">
          {shown}
          <span className="invisible">{text.slice(shown.length)}</span>
        </p>
        <span className="font-display absolute right-5 bottom-3 text-sm text-sakura">
          {done ? <span className="blink">▼ ต่อไป</span> : "คลิกเพื่อข้าม"}
        </span>
      </button>
    </div>
  );
}

// หน้ากรอกชื่อ ก่อนเริ่มเรื่อง กด Enter หรือปุ่มตกลงเพื่อไปต่อ (ห้ามว่าง)
function NameScreen({
  initial,
  onBack,
  onSubmit,
}: {
  initial: string;
  onBack: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  const trimmed = name.trim();

  return (
    <section>
      <div className="flex items-center justify-between mb-3 text-sm">
        <button
          onClick={onBack}
          className="font-display opacity-70 hover:opacity-100"
        >
          ◀ ย้อนกลับ
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed) onSubmit(trimmed);
        }}
        className="relative mt-4"
      >
        <span className="pixel-tag absolute -top-4 left-4 z-10 font-display text-sm px-3 py-0.5">
          L-O-V-E
        </span>
        <div className="pixel-box px-7 pt-8 pb-7">
          <label htmlFor="player-name" className="block text-xl mb-4">
            ก่อนเริ่มการเดินทาง… คุณชื่ออะไร?
          </label>
          <input
            id="player-name"
            autoFocus
            autoComplete="off"
            value={name}
            maxLength={NAME_MAX_LENGTH}
            onChange={(e) => setName(e.target.value)}
            placeholder="พิมพ์ชื่อของคุณ"
            className="w-full bg-cream text-ink text-xl px-4 py-3 border-[3px] border-cream outline-none focus:border-sakura placeholder:text-ink/40"
          />
          <p className="font-display text-xs text-right mt-2 opacity-60">
            {name.length}/{NAME_MAX_LENGTH}
          </p>
        </div>
        <button
          type="submit"
          disabled={!trimmed}
          className="pixel-btn mt-6 w-full font-display text-xl py-3 disabled:opacity-40 disabled:pointer-events-none"
        >
          ▶ ตกลง
        </button>
      </form>
    </section>
  );
}

// โหลดดิ้งสั้น ๆ ก่อนหน้าผลลัพธ์: แถบบล็อกค่อย ๆ เติมเต็มแบบเกม 8bit แล้วไปต่อเอง
function LoadingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, LOADING_MS);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <section className="text-center pt-24">
      <div className="font-display text-5xl text-shu bob mb-8" aria-hidden>
        ♥
      </div>
      <p className="font-display text-xl mb-6">
        Loading<span className="blink">...</span>
      </p>
      <div className="h-6 max-w-xs mx-auto bg-cream border-[3px] border-ink p-0.5">
        <div
          className="loading-fill h-full"
          style={{ animationDuration: `${LOADING_MS}ms` }}
        />
      </div>
      <p className="font-display text-sm mt-4 opacity-60">NOW LOADING</p>
    </section>
  );
}

// ---------- ส่วนประกอบเล็ก ๆ ----------

function SakuraPetals() {
  // ค่าคงที่ต่อกลีบ (ไม่สุ่มทุกครั้งที่ render) กระจายตำแหน่ง ความเร็ว และจังหวะเริ่ม
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        "--dur": `${9 + (i % 5) * 2}s`,
        "--delay": `${-i * 1.3}s`,
        "--drift": `${i % 2 ? 60 : -40}px`,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      {petals.map((style, i) => (
        <span key={i} className="petal" style={style as React.CSSProperties} />
      ))}
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5 mb-8" aria-hidden>
      {QUESTIONS.map((_, i) => (
        <div
          key={i}
          className={`h-3 flex-1 border-2 border-ink ${
            i < step ? "bg-shu" : i === step ? "bg-sakura blink" : "bg-cream"
          }`}
        />
      ))}
    </div>
  );
}

function Avatar({
  character,
  className,
  delay = 0,
}: {
  character: Character;
  className: string;
  delay?: number;
}) {
  const style = { animationDelay: `${delay}s` };
  if (character.image) {
    return (
      <img
        src={character.image}
        alt=""
        style={style}
        className={`${className} object-cover border-[3px] border-ink`}
      />
    );
  }
  return (
    <div
      style={style}
      className={`${className} bg-gold border-[3px] border-ink flex items-center justify-center font-display`}
      aria-hidden
    >
      ?
    </div>
  );
}
