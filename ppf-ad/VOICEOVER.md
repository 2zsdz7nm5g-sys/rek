# Voice-over: Iraqi Arabic, male, confident premium delivery

Voice chosen: **مؤمل العباس** (ElevenLabs library, Iraqi Arabic, ads).
Status: **blocked**. ElevenLabs refused generation ("Free Tier access has been
disabled ... upgrade to a paid subscription"). Nothing was charged.

Once audio exists (ElevenLabs on a paid plan, or a studio recording of the
same script), save each line as `public/vo/01.wav` … `15.wav`, list the line
numbers in `voAvailable` in `src/timeline.json`, and run
`scripts/mix-vo.sh`. It places each line at its slot, ducks the score
under the voice and writes `out/REK_FlexiShield_PPF_Reel_VO.mp4`.

| # | Slot (scene + frame) | Line |
|---|---|---|
| 1 | S1Hook +40 | حصوة صغيرة وحدة… تكفي. |
| 2 | S1Chaos +10 | كل يوم بالشارع: حصو، خدوش، عجاج، وغسيل غلط. |
| 3 | S1Stakes +6 | وسيارتك عدها صبغ أصلي واحد بس. |
| 4 | S1Stakes +110 | التصليح غالي… والصبغ الأصلي ما يرجع. |
| 5 | S2Turn +30 | بس تكدر تحميه. |
| 6 | S2Intro +30 | فلكسي شيلد، فيلم حماية الصبغ الأمريكي… |
| 7 | S2Intro +140 | وريك بروفسِت، وكيله الحصري بالعراق. |
| 8 | S3Apply +10 | يتفصّل رقمياً على قياس سيارتك. |
| 9 | S3Layers +10 | طبقة تي بي يو شفافة، فوق صبغك الأصلي… |
| 10 | S3Impact +6 | تساعد تمتص ضربات الحصى الصغيرة، وتحمي من الخدوش اليومية. |
| 11 | S3Heal +6 | والخدوش الخفيفة بالطبقة العليا؟ تختفي بالحرارة، حسب الظروف ومواصفات الفيلم. |
| 12 | S3Ring +10 | شفافية عالية، مقاوم للاصفرار، وحماية من الأشعة فوق البنفسجية. |
| 13 | S4BeforeAfter +40 | نفس الشارع… بس النتيجة غير. |
| 14 | S4Hero +20 | خلّي سيارتك أصلية… بصبغها ولمعتها. |
| 15 | S4End +20 | ريك بروفسِت. احجز استشارتك لفلكسي شيلد هسه… وراسلنا واتساب. |

Lines 10–12 are the longest; if the read runs long, extend those scenes in
`src/timeline.json` (the score and all cues follow automatically).
