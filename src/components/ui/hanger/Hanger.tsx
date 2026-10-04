import { useRef, type PointerEvent as ReactPointerEvent } from "react";

import { getPointerPosition } from "../../../utils/getPointerPosition";
import HangingWord from "./HangingWord";
import type { HangingWordConfig, PointerMotion } from "./hanger.types";

import "./Hanger.css";

const VIEWBOX_WIDTH=1470;
const VIEWBOX_HEIGHT=650;

const TOP_ROPE_START_X=40;
const TOP_ROPE_END_X=1410;
const TOP_ROPE_Y=110;

const MAX_POINTER_SPEED=1800;
const POINTER_VELOCITY_SMOOTHING=0.35;
const STALE_POINTER_THRESHOLD=0.08;

const WORDS: readonly HangingWordConfig[] = [
  {
    id: "art",
    word: "Art",
    anchorT: 0.16,
    ropeLength: 355,
    attachmentX: 0.38,
    attachmentY: 0.05,
    angle: 0,
    angularVelocity: 0,
    damping: 0.983,
    gravity: 980,
    accent: true,
  },
  {
    id: "can",
    word: "can",
    anchorT: 0.32,
    ropeLength: 380,
    attachmentX: 0.5,
    attachmentY: 0.05,
    angle: 0,
    angularVelocity: 0,
    damping: 0.985,
    gravity: 980,
  },
  {
    id: "take",
    word: "take",
    anchorT: 0.5,
    ropeLength: 360,
    attachmentX: 0.5,
    attachmentY: 0.05,
    angle: 0,
    angularVelocity: 0,
    damping: 0.984,
    gravity: 980,
  },
  {
    id: "any",
    word: "any",
    anchorT: 0.7,
    ropeLength: 390,
    attachmentX: 0.58,
    attachmentY: 0.05,
    angle: 0,
    angularVelocity: 0,
    damping: 0.986,
    gravity: 980,
  },
  {
    id: "form",
    word: "form",
    anchorT: 0.84,
    ropeLength: 365,
    attachmentX: 0.47,
    attachmentY: 0.05,
    angle: 0,
    angularVelocity: 0,
    damping: 0.985,
    gravity: 980,
  },
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function limitPointerVelocity(velocityX: number, velocityY: number) {
  const speed=Math.hypot(velocityX, velocityY);

  if (speed<=MAX_POINTER_SPEED) {
    return { x: velocityX, y: velocityY };
  }

  const scale=MAX_POINTER_SPEED/speed;

  return {
    x: velocityX*scale,
    y: velocityY*scale,
  };
}

function getAnchorX(anchorT: number) {
  return (
    TOP_ROPE_START_X+
    (TOP_ROPE_END_X-TOP_ROPE_START_X)*clamp(anchorT, 0, 1)
  );
}

function Hanger() {
  const svgRef=useRef<SVGSVGElement>(null);
  const activePointerRef=useRef<number | null>(null);
  const lastPointerTimeRef=useRef(0);

  const pointerRef=useRef<PointerMotion>({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    sampleDelta: 0,
    timestamp: 0,
    sequence: 0,
    active: false,
  });

  function startPointerSample(event: ReactPointerEvent<HTMLDivElement>) {
    const svg=svgRef.current;
    if (!svg) return;

    const point=getPointerPosition(svg, event);
    if (!point) return;

    const now=performance.now();
    const pointer=pointerRef.current;

    pointer.x=point.x;
    pointer.y=point.y;
    pointer.velocityX=0;
    pointer.velocityY=0;
    pointer.sampleDelta=0;
    pointer.timestamp=now;
    pointer.sequence+=1;
    pointer.active=true;

    lastPointerTimeRef.current=now;
  }

  function updatePointerSample(x: number, y: number) {
    const pointer=pointerRef.current;
    const now=performance.now();

    if (!pointer.active || lastPointerTimeRef.current === 0) {
      pointer.x=x;
      pointer.y=y;
      pointer.velocityX=0;
      pointer.velocityY=0;
      pointer.sampleDelta=0;
      pointer.timestamp=now;
      pointer.sequence+=1;
      pointer.active=true;
      lastPointerTimeRef.current=now;
      return;
    }

    const elapsed=(now-lastPointerTimeRef.current)/1000;

    if (elapsed>STALE_POINTER_THRESHOLD) {
      pointer.velocityX=0;
      pointer.velocityY= 0;
      pointer.sampleDelta=0;
    } else {
      const sampleDelta=clamp(elapsed, 1 / 240, 1 / 20);
      const limitedVelocity=limitPointerVelocity(
        (x-pointer.x)/sampleDelta,
        (y-pointer.y)/sampleDelta,
      );

      pointer.velocityX+=(limitedVelocity.x-pointer.velocityX)*POINTER_VELOCITY_SMOOTHING;
      pointer.velocityY+=(limitedVelocity.y-pointer.velocityY)*POINTER_VELOCITY_SMOOTHING;
      pointer.sampleDelta=sampleDelta;
    }

    pointer.x=x;
    pointer.y=y;
    pointer.timestamp=now;
    pointer.sequence+=1;
    lastPointerTimeRef.current=now;
  }

  function stopPointerSample() {
    const pointer=pointerRef.current;

    pointer.active=false;
    pointer.velocityX=0;
    pointer.velocityY=0;
    pointer.sampleDelta=0;
    pointer.timestamp=0;
    lastPointerTimeRef.current=0;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    activePointerRef.current=event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    startPointerSample(event);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const isMouse=event.pointerType==="mouse";
    const isActivePointer=activePointerRef.current===event.pointerId;

    if (!isMouse && !isActivePointer) return;

    const svg=svgRef.current;
    if (!svg) return;

    const point=getPointerPosition(svg, event);
    if (!point) return;

    updatePointerSample(point.x, point.y);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerRef.current!==event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointerRef.current=null;

    if (event.pointerType!=="mouse") {
      stopPointerSample();
    }
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType==="mouse" && activePointerRef.current===null) {
      stopPointerSample();
    }
  }

  return (
    <div
      className="hanger"
      onPointerEnter={startPointerSample}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerLeave}
    >
      <svg
        ref={svgRef}
        className="hanger_svg"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label="Art can take any form"
      >
        <line
          className="hanger_top-rope"
          x1={TOP_ROPE_START_X}
          y1={TOP_ROPE_Y}
          x2={TOP_ROPE_END_X}
          y2={TOP_ROPE_Y}
        />

        {WORDS.map((wordConfig) => (
          <HangingWord
            key={wordConfig.id}
            wordConfig={wordConfig}
            pointerRef={pointerRef}
            anchorX={getAnchorX(wordConfig.anchorT)}
            anchorY={TOP_ROPE_Y}
          />
        ))}
      </svg>
    </div>
  );
}

export default Hanger;
