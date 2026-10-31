import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {tw} from './lib/anim';
import {C, T} from './theme';
import {S1Hook} from './scenes/S1Hook';
import {S2Reveal} from './scenes/S2Reveal';
import {S3Science} from './scenes/S3Science';
import {S4Install} from './scenes/S4Install';
import {S5Final} from './scenes/S5Final';

/** Cross-fades a scene in/out over its overlap with neighbours. */
const Fade: React.FC<{dur: number; fadeIn: number; fadeOut: number; children: React.ReactNode}> = ({dur, fadeIn, fadeOut, children}) => {
	const f = useCurrentFrame();
	const o = Math.min(fadeIn ? tw(f, [0, fadeIn], [0, 1]) : 1, fadeOut ? tw(f, [dur - fadeOut, dur], [1, 0]) : 1);
	return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

export type MainProps = {withAudio: boolean};

export const Main: React.FC<MainProps> = ({withAudio}) => (
	<AbsoluteFill style={{background: C.black}}>
		<Sequence name="01 Hook" from={T.s1.from} durationInFrames={T.s1.dur}>
			<Fade dur={T.s1.dur} fadeIn={0} fadeOut={0}>
				<S1Hook />
			</Fade>
		</Sequence>
		<Sequence name="02 Product reveal" from={T.s2.from} durationInFrames={T.s2.dur}>
			<Fade dur={T.s2.dur} fadeIn={6} fadeOut={6}>
				<S2Reveal />
			</Fade>
		</Sequence>
		<Sequence name="03 How it works" from={T.s3.from} durationInFrames={T.s3.dur}>
			<Fade dur={T.s3.dur} fadeIn={6} fadeOut={6}>
				<S3Science />
			</Fade>
		</Sequence>
		<Sequence name="04 Installation" from={T.s4.from} durationInFrames={T.s4.dur}>
			<Fade dur={T.s4.dur} fadeIn={6} fadeOut={6}>
				<S4Install />
			</Fade>
		</Sequence>
		<Sequence name="05 Final reveal" from={T.s5.from} durationInFrames={T.s5.dur}>
			<Fade dur={T.s5.dur} fadeIn={6} fadeOut={0}>
				<S5Final />
			</Fade>
		</Sequence>
		{withAudio && <Audio src={staticFile('audio/mix.wav')} />}
	</AbsoluteFill>
);
