import {Composition, Folder} from 'remotion';
import {Main} from './Main';
import {S1Problem, S1_DUR} from './scenes/S1Problem';
import {S2Reveal, S2_DUR} from './scenes/S2Reveal';
import {S3Before, S3_DUR} from './scenes/S3Before';
import {S4After, S4_DUR} from './scenes/S4After';
import {S5Final, S5_DUR} from './scenes/S5Final';
import {T} from './theme';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="REK-Windshield-Shield" component={Main} width={1080} height={1920} fps={30} durationInFrames={T.total} defaultProps={{withAudio: true}} />
		<Folder name="Scenes">
			<Composition id="S1-Problem" component={S1Problem} width={1080} height={1920} fps={30} durationInFrames={S1_DUR} />
			<Composition id="S2-Product" component={S2Reveal} width={1080} height={1920} fps={30} durationInFrames={S2_DUR} />
			<Composition id="S3-Before" component={S3Before} width={1080} height={1920} fps={30} durationInFrames={S3_DUR} />
			<Composition id="S4-After" component={S4After} width={1080} height={1920} fps={30} durationInFrames={S4_DUR} />
			<Composition id="S5-Final" component={S5Final} width={1080} height={1920} fps={30} durationInFrames={S5_DUR} />
		</Folder>
	</>
);
