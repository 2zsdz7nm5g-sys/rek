import { Composition } from "remotion";
import { FPS, H, W } from "./lib/brand";
import { Master } from "./Master";
import { TOTAL } from "./timeline";
import { S1Chaos, S1Damage, S1Hook, S1Stakes } from "./scenes/S1";
import { S2Intro, S2Turn } from "./scenes/S2";
import { S3Apply, S3Heal, S3Impact, S3Layers, S3Ring } from "./scenes/S3";
import { S4BeforeAfter, S4End, S4Hero } from "./scenes/S4";

// Style-frame scenes. Each is a real animated scene; the full edit will
// sequence them with transitions in one master composition.
const scenes = {
  S1Hook,
  S1Chaos,
  S1Damage,
  S1Stakes,
  S2Turn,
  S2Intro,
  S3Apply,
  S3Layers,
  S3Impact,
  S3Heal,
  S3Ring,
  S4BeforeAfter,
  S4Hero,
  S4End,
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Master"
      component={Master}
      durationInFrames={TOTAL}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="Master30"
      component={Master}
      durationInFrames={Math.round(TOTAL / 2)}
      fps={30}
      width={W}
      height={H}
    />
    {Object.entries(scenes).map(([id, C]) => (
      <Composition
        key={id}
        id={id}
        component={C}
        durationInFrames={240}
        fps={FPS}
        width={W}
        height={H}
      />
    ))}
  </>
);
