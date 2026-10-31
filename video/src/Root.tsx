import {Composition, Folder} from 'remotion';
import {Main} from './Main';
import {T} from './theme';
import {S1Hook, S1_DUR} from './scenes/S1Hook';
import {S2Reveal, S2_DUR} from './scenes/S2Reveal';
import {S3Science, S3_DUR} from './scenes/S3Science';
import {S4Install, S4_DUR} from './scenes/S4Install';
import {S5Final, S5_DUR} from './scenes/S5Final';

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="REK-Windshield-Shield"
			component={Main}
			width={1080}
			height={1920}
			fps={30}
			durationInFrames={T.total}
			defaultProps={{withAudio: true}}
		/>
		<Folder name="Scenes">
			<Composition id="S1-Hook" component={S1Hook} width={1080} height={1920} fps={30} durationInFrames={S1_DUR} />
			<Composition id="S2-Reveal" component={S2Reveal} width={1080} height={1920} fps={30} durationInFrames={S2_DUR} />
			<Composition id="S3-Science" component={S3Science} width={1080} height={1920} fps={30} durationInFrames={S3_DUR} />
			<Composition id="S4-Install" component={S4Install} width={1080} height={1920} fps={30} durationInFrames={S4_DUR} />
			<Composition id="S5-Final" component={S5Final} width={1080} height={1920} fps={30} durationInFrames={S5_DUR} />
		</Folder>
	</>
);
