/**
 * BitFun pixel bull head — 32×32, white halo for dark UI,
 * angry-cute bull with horns and nose ring.
 */

import React from 'react';
import type { ChatInputPetMood } from '../utils/chatInputPetMood';
import './ChatInputPixelPet.scss';

export interface ChatInputPixelPetProps {
  mood: ChatInputPetMood;
  className?: string;
  layout?: 'center' | 'stopRight';
}

const MOODS: ChatInputPetMood[] = ['rest', 'analyzing', 'waiting', 'working'];

const VIEW = 32;

/** Bull head shape — rounded rectangle, brown base. */
const HEAD_ROWS: [number, number, number][] = [
  [8, 10, 12],
  [9, 8, 16],
  [10, 6, 20],
  [11, 5, 22],
  [12, 4, 24],
  [13, 4, 24],
  [14, 4, 24],
  [15, 4, 24],
  [16, 4, 24],
  [17, 4, 24],
  [18, 4, 24],
  [19, 4, 24],
  [20, 5, 22],
  [21, 6, 20],
  [22, 8, 16],
  [23, 10, 12],
];

/** White halo around the head. */
function buildHaloRows(pad: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  const first = HEAD_ROWS[0];
  out.push([first[0] - 2, first[1] - pad, first[2] + 2 * pad]);
  out.push([first[0] - 1, first[1] - pad, first[2] + 2 * pad]);
  for (const r of HEAD_ROWS) {
    out.push([r[0], r[1] - pad, r[2] + 2 * pad]);
  }
  return out;
}

const HALO_ROWS = buildHaloRows(3);

/** Bull horns — curved upward. */
const HORN_LEFT: [number, number, number, number][] = [
  [4, 4, 3, 2],
  [3, 3, 3, 2],
  [2, 2, 4, 2],
  [1, 3, 3, 2],
  [0, 5, 2, 2],
];
const HORN_RIGHT: [number, number, number, number][] = [
  [4, 25, 3, 2],
  [3, 26, 3, 2],
  [2, 26, 4, 2],
  [1, 26, 3, 2],
  [0, 25, 2, 2],
];

/** Horn tips — lighter color. */
const HORN_TIP_LEFT: [number, number, number, number][] = [
  [0, 5, 2, 2],
];
const HORN_TIP_RIGHT: [number, number, number, number][] = [
  [0, 25, 2, 2],
];

/** Bull ears — small on sides. */
const EAR_LEFT: [number, number, number, number][] = [
  [10, 2, 3, 3],
  [11, 3, 2, 2],
];
const EAR_RIGHT: [number, number, number, number][] = [
  [10, 27, 3, 3],
  [11, 28, 2, 2],
];

/** Nose ring — golden circle. */
const NOSE_RING: [number, number, number, number][] = [
  [19, 14, 4, 4],
];

/** Nostrils. */
const NOSTRIL_LEFT: [number, number, number, number][] = [
  [20, 12, 2, 2],
];
const NOSTRIL_RIGHT: [number, number, number, number][] = [
  [20, 18, 2, 2],
];

function Px({
  x,
  y,
  w = 1,
  h = 1,
  className,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  className?: string;
}) {
  return <rect x={x} y={y} width={w} height={h} className={className} />;
}

/** Slight overlap removes 1px scanline gaps when scaled. */
function PxRow({ x, y, w, className }: { x: number; y: number; w: number; className?: string }) {
  return <rect x={x} y={y - 0.01} width={w} height={1.02} className={className} />;
}

function HeadHalo() {
  const cls = 'bitfun-bull__halo';
  return (
    <g className="bitfun-bull-head__halo">
      {HALO_ROWS.map(([y, x0, lw], i) => (
        <PxRow key={`h-${i}`} x={x0} y={y} w={lw} className={cls} />
      ))}
    </g>
  );
}

function HeadDisk() {
  const cls = 'bitfun-bull__base';
  return (
    <g className="bitfun-bull-head__disk">
      {HEAD_ROWS.map(([y, x0, lw], i) => (
        <PxRow key={`c-${i}`} x={x0} y={y} w={lw} className={cls} />
      ))}
    </g>
  );
}

function Horns() {
  const cls = 'bitfun-bull__horn';
  const tipCls = 'bitfun-bull__horn-tip';
  return (
    <g className="bitfun-bull-head__horns" aria-hidden>
      {HORN_LEFT.map(([y, x, w, h], i) => (
        <Px key={`hl-${i}`} x={x} y={y} w={w} h={h} className={cls} />
      ))}
      {HORN_RIGHT.map(([y, x, w, h], i) => (
        <Px key={`hr-${i}`} x={x} y={y} w={w} h={h} className={cls} />
      ))}
      {HORN_TIP_LEFT.map(([y, x, w, h], i) => (
        <Px key={`htl-${i}`} x={x} y={y} w={w} h={h} className={tipCls} />
      ))}
      {HORN_TIP_RIGHT.map(([y, x, w, h], i) => (
        <Px key={`htr-${i}`} x={x} y={y} w={w} h={h} className={tipCls} />
      ))}
    </g>
  );
}

function Ears() {
  const cls = 'bitfun-bull__ear';
  return (
    <g className="bitfun-bull-head__ears" aria-hidden>
      {EAR_LEFT.map(([y, x, w, h], i) => (
        <Px key={`el-${i}`} x={x} y={y} w={w} h={h} className={cls} />
      ))}
      {EAR_RIGHT.map(([y, x, w, h], i) => (
        <Px key={`er-${i}`} x={x} y={y} w={w} h={h} className={cls} />
      ))}
    </g>
  );
}

function NoseRing() {
  const ringCls = 'bitfun-bull__ring';
  const nostrilCls = 'bitfun-bull__nostril';
  return (
    <g className="bitfun-bull-head__nose" aria-hidden>
      {NOSE_RING.map(([y, x, w, h], i) => (
        <Px key={`ring-${i}`} x={x} y={y} w={w} h={h} className={ringCls} />
      ))}
      {NOSTRIL_LEFT.map(([y, x, w, h], i) => (
        <Px key={`nl-${i}`} x={x} y={y} w={w} h={h} className={nostrilCls} />
      ))}
      {NOSTRIL_RIGHT.map(([y, x, w, h], i) => (
        <Px key={`nr-${i}`} x={x} y={y} w={w} h={h} className={nostrilCls} />
      ))}
    </g>
  );
}

/** Open eyes — angry determined look. */
function EyesOpen() {
  const white = 'bitfun-bull__eye-white';
  const pupil = 'bitfun-bull__pupil';
  return (
    <g className="bitfun-bull-head__eyes-open" aria-hidden>
      {/* Left eye - bigger, moved left */}
      <Px x={7} y={9} w={8} h={6} className={white} />
      <Px x={9} y={11} w={4} h={3} className={pupil} />
      {/* Right eye - bigger, moved right */}
      <Px x={17} y={9} w={8} h={6} className={white} />
      <Px x={19} y={11} w={4} h={3} className={pupil} />
      {/* Angry eyebrows */}
      <Px x={6} y={7} w={5} h={2} className={pupil} />
      <Px x={21} y={7} w={5} h={2} className={pupil} />
    </g>
  );
}

/** Rest: closed eyes — peaceful. */
function FaceRest() {
  const line = 'bitfun-bull__eye-white';
  return (
    <g className="bitfun-bull-head__face bitfun-bull-head__face--rest">
      {/* Closed eyes - bigger, spaced apart */}
      <Px x={8} y={12} w={6} h={2} className={line} />
      <Px x={18} y={12} w={6} h={2} className={line} />
      <NoseRing />
    </g>
  );
}

function FaceAnalyzing() {
  return (
    <g className="bitfun-bull-head__face bitfun-bull-head__face--analyze">
      <EyesOpen />
      <NoseRing />
      <g className="bitfun-bull-head__dots" aria-hidden>
        <Px x={2} y={6} w={2} h={2} className="bitfun-bull-head__dot" />
        <Px x={28} y={4} w={2} h={2} className="bitfun-bull-head__dot" />
        <Px x={15} y={1} w={2} h={2} className="bitfun-bull-head__dot" />
      </g>
    </g>
  );
}

function FaceWaiting() {
  return (
    <g className="bitfun-bull-head__face bitfun-bull-head__face--wait">
      <EyesOpen />
      <NoseRing />
      <g className="bitfun-bull-head__wait-pips" aria-hidden>
        <Px x={10} y={27} w={2} h={2} className="bitfun-bull-head__wait-pip" />
        <Px x={15} y={27} w={2} h={2} className="bitfun-bull-head__wait-pip" />
        <Px x={20} y={27} w={2} h={2} className="bitfun-bull-head__wait-pip" />
      </g>
    </g>
  );
}

function FaceWorking() {
  return (
    <g className="bitfun-bull-head__face bitfun-bull-head__face--work">
      <EyesOpen />
      <NoseRing />
      <g className="bitfun-bull-head__sweat" aria-hidden>
        <Px x={4} y={8} w={2} h={2} className="bitfun-bull-head__sweat-drop" />
        <Px x={26} y={7} w={2} h={2} className="bitfun-bull-head__sweat-drop" />
      </g>
      <g className="bitfun-bull-head__speed" aria-hidden>
        <Px x={0} y={10} w={2} h={2} className="bitfun-bull-head__speed-line" />
        <Px x={0} y={14} w={2} h={2} className="bitfun-bull-head__speed-line" />
        <Px x={0} y={18} w={2} h={2} className="bitfun-bull-head__speed-line" />
        <Px x={30} y={10} w={2} h={2} className="bitfun-bull-head__speed-line" />
        <Px x={30} y={14} w={2} h={2} className="bitfun-bull-head__speed-line" />
        <Px x={30} y={18} w={2} h={2} className="bitfun-bull-head__speed-line" />
      </g>
    </g>
  );
}

function Face({ mood }: { mood: ChatInputPetMood }) {
  switch (mood) {
    case 'rest':
      return <FaceRest />;
    case 'analyzing':
      return <FaceAnalyzing />;
    case 'waiting':
      return <FaceWaiting />;
    default:
      return <FaceWorking />;
  }
}

function MoodSvg({ mood }: { mood: ChatInputPetMood }) {
  const rootClass = `bitfun-bull-head bitfun-bull-head--${mood}`;

  return (
    <svg
      className={`bitfun-chat-input-pixel-pet__svg bitfun-chat-input-pixel-pet__svg--${mood}`}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g className={rootClass}>
        <HeadHalo />
        <HeadDisk />
        <Horns />
        <Ears />
        <Face mood={mood} />
      </g>
    </svg>
  );
}

export const ChatInputPixelPet: React.FC<ChatInputPixelPetProps> = ({
  mood,
  className = '',
  layout = 'center',
}) => {
  const layoutMod =
    layout === 'stopRight' ? ' bitfun-chat-input-pixel-pet--layout-stop-right' : '';
  return (
    <div className={`bitfun-chat-input-pixel-pet${layoutMod} ${className}`.trim()} aria-hidden>
      {MOODS.map(m => (
        <div
          key={m}
          className="bitfun-chat-input-pixel-pet__layer"
          data-active={m === mood ? 'true' : 'false'}
        >
          <MoodSvg mood={m} />
        </div>
      ))}
    </div>
  );
};

export default ChatInputPixelPet;
