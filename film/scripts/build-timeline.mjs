// Builds src/data/timeline.json from the narration files in public/vo.
// Scenes whose VO file is missing get an estimated duration from the script length,
// so the film can be previewed now and re-timed automatically when the audio arrives.
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

const FPS = 30;
const TRANSITION_FRAMES = 20;
const CHARS_PER_SECOND = 10.7; // measured on the generated segments

const SCENES = [
  { id: "opening", vo: "vo/01_opening.mp3", lead: 2.2, tail: 0.8, text: "سيارتك مو مجرد وسيلة تنقلك من مكان إلى مكان... هي جزء من شخصيتك، وتفاصيلها تستحق عناية تليق بيها." },
  { id: "brand", vo: "vo/02_brand.mp3", lead: 0.8, tail: 1.0, text: "في REK Proffset، نؤمن أن العناية الحقيقية تبدأ بالاختيار الصحيح... وباهتمام بالتفاصيل، من أول لمسة إلى آخر انعكاس." },
  { id: "ppf", vo: "vo/03_ppf.mp3", lead: 0.8, tail: 1.0, text: "طلاء السيارة يتعرض يومياً لظروف الطريق واحتكاكاته. وهنا تجي أهمية الـ بي بي إف، طبقة حماية تساعد على تقليل آثار الخدوش السطحية وبعض الأضرار اليومية، بحسب نوع الفيلم." },
  { id: "ceramic", vo: "vo/04_ceramic.mp3", lead: 0.8, tail: 1.0, text: "ولمظهر أكثر عمقاً ولمعاناً، تساعد الحماية النانوية على تحسين خصائص السطح تجاه الماء وتسهيل التنظيف، مع ضرورة الاهتمام الدوري بالسيارة." },
  { id: "polishing", vo: "vo/05_polishing.mp3", lead: 0.8, tail: 1.0, text: "التلميع الاحترافي يهتم بمظهر الطلاء ويساعد على تقليل العيوب السطحية المناسبة للمعالجة، حتى تظهر انعكاسات السيارة وبريقها بصورة أجمل." },
  { id: "interior", vo: "vo/06_interior.mp3", lead: 0.8, tail: 1.0, text: "والعناية ما تكتمل من الخارج فقط. نهتم بالمقاعد والأسطح والتفاصيل الداخلية، حتى تكون تجربة القيادة أنظف وأكثر راحة." },
  { id: "pdr", vo: "vo/07_pdr.mp3", lead: 0.8, tail: 1.0, text: "وبالنسبة لبعض الانبعاجات، تساعد تقنية بي دي آر على إصلاح الضرر دون إعادة طلاء المنطقة، عندما تكون حالة الانبعاج والطلاء مناسبة لهذه التقنية." },
  { id: "windshield", vo: "vo/08_windshield.mp3", lead: 0.8, tail: 1.0, text: "وللزجاج الأمامي أيضاً، تتوفر حلول حماية مخصصة تساعد على الحفاظ عليه بحسب نوع الفيلم وطريقة استخدامه." },
  { id: "finale", vo: "vo/09_finale.mp3", lead: 0.8, tail: 2.6, text: "من حماية الطلاء إلى اللمعان، ومن العناية الداخلية إلى التفاصيل الدقيقة... كل سيارة إلها عناية تناسبها. REK Proffset... اختار الأفضل لسيارتك." },
];

const probe = (file) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());

let cursor = 0; // absolute start frame of the current scene
const scenes = SCENES.map((s, i) => {
  const path = `public/${s.vo}`;
  const hasVo = existsSync(path);
  const voSeconds = hasVo ? probe(path) : +(s.text.length / CHARS_PER_SECOND).toFixed(2);
  const voFrom = Math.round(s.lead * FPS);
  const voFrames = Math.ceil(voSeconds * FPS);
  const durationInFrames = voFrom + voFrames + Math.round(s.tail * FPS);
  const scene = { id: s.id, vo: hasVo ? s.vo : null, voSeconds, voEstimated: !hasVo, voFrom, voFrames, durationInFrames, start: cursor };
  cursor += durationInFrames - (i < SCENES.length - 1 ? TRANSITION_FRAMES : 0);
  return scene;
});

const timeline = { fps: FPS, transitionFrames: TRANSITION_FRAMES, durationInFrames: cursor, scenes };
writeFileSync("src/data/timeline.json", JSON.stringify(timeline, null, 2) + "\n");
console.log(`total ${(cursor / FPS).toFixed(2)} s, missing VO: ${scenes.filter((s) => s.voEstimated).map((s) => s.id).join(", ") || "none"}`);
for (const s of scenes) console.log(`${s.id.padEnd(11)} start ${(s.start / FPS).toFixed(2)}s  dur ${(s.durationInFrames / FPS).toFixed(2)}s  vo ${s.voSeconds}s${s.voEstimated ? " (estimated)" : ""}`);
