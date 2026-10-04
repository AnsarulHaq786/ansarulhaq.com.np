import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { type PointerMotion, type HangingWordConfig, type TopRopeState } from "./hanger.types";
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

import './Hanger.css';
import { getPointerPosition } from '../../../utils/getPointerPosition';
import HangingWord from './HangingWord';

gsap.registerPlugin(useGSAP);

const VIEWBOX_WIDTH=1470;
const VIEWBOX_HEIGHT=200;

const START_X=40;
const END_X=1410;
const RESTING_Y=100;
const RESTING_CONTROL_X=(START_X+END_X)/2;
const RESTING_CONTROL_Y=RESTING_Y;

const MIN_CONTROL_X=START_X+100;
const MAX_CONTROL_X=END_X-100;
const MIN_CONTROL_Y=RESTING_Y-55;
const MAX_CONTROL_Y=RESTING_Y+105;
const TOP_ROPE_INTERACTION_BOTTOM=RESTING_Y+140;
const MAX_POINTER_SPEED=2400;
const POINTER_VELOCITY_SMOOTHING=0.35;

// const RESTING_PATH=`M ${START_X} ${RESTING_Y} Q ${RESTING_CONTROL_X} ${RESTING_CONTROL_Y} ${END_X} ${RESTING_Y}`;

const WORDS: readonly HangingWordConfig[]=[
  {
    id: "art",
    word: "Art",
    
    anchorT: 0.15,
    ropeLength: 200,
    attachmentX: 0.42,
    attachmentY: 0.05, 
    angle: 0,
    angularVelocity: 0,
    damping: 0.9,
    gravity: 980,
    
    accent: true
  },
  {
    id: "can",
    word: "can",
    
    anchorT: 0.32,
    ropeLength: 200,
    attachmentX: 0.56,
    attachmentY: 0.05,
    angle: 0,
    angularVelocity: 0,
    damping: 0.9,
    gravity: 980,
    
    accent: false
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
    damping: 0.994,
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
    damping: 0.993,
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
    damping: 0.992,
    gravity: 980,
  }
];

function makeTopRopePath(rope: TopRopeState) {
  return (
    `M ${rope.startX} ${rope.startY}
     Q ${rope.controlX} ${rope.controlY}
    ${rope.endX} ${rope.endY}`
  )
}

function limitPointerVelocity(velocityX: number, velocityY: number) {
  const speed=Math.hypot(velocityX, velocityY);
  if(speed<=MAX_POINTER_SPEED) {
    return { x: velocityX, y: velocityY };
  }
  
  const scale=MAX_POINTER_SPEED/speed;
  
  return {
    x: velocityX*scale,
    y: velocityY*scale
  }
}

function Hanger() {
  
  const containerRef=useRef<HTMLDivElement>(null);
  const svgRef=useRef<SVGSVGElement>(null);
  const topRopePathRef=useRef<SVGPathElement>(null);
  const activePointerRef=useRef<number | null>(null);
  const lastPointerTimeRef=useRef(0);
  
  const topRopeRef=useRef<TopRopeState>({
    startX: START_X,
    startY: RESTING_Y,
    controlX: RESTING_CONTROL_X,
    controlY: RESTING_CONTROL_Y,
    endX: END_X,
    endY: RESTING_Y
  })
  
  const pointerRef=useRef<PointerMotion>({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    sequence: 0,
    active: false
  })

  const { contextSafe } = useGSAP({ scope: containerRef });
  
  function drawTopRope() {
    topRopePathRef.current?.setAttribute(
      "d",
      makeTopRopePath(topRopeRef.current)
    )
  }
  
  const moveTopRope=contextSafe((x: number, y: number) => {
    gsap.to(topRopeRef.current, {
      controlX: gsap.utils.clamp(MIN_CONTROL_X, MAX_CONTROL_X, x),
      controlY: gsap.utils.clamp(MIN_CONTROL_Y, MAX_CONTROL_Y, y),
      duration: 0.2,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: drawTopRope
    })
  })
 
  const resetTopRope=contextSafe(()=>{
    gsap.to(topRopeRef.current, {
      controlX: RESTING_CONTROL_X,
      controlY: RESTING_CONTROL_Y,
      duration: 0.8,
      ease: 'elastic.out(1, 0.28)',
      overwrite: true,
      onUpdate: drawTopRope
    })
  })
  
  function startPointerSample(event: ReactPointerEvent<HTMLDivElement>) {
    const svg=svgRef.current;
    if(!svg) return;
    
    const point=getPointerPosition(svg, event);
    
    if(!point) return;
    
    const pointer=pointerRef.current;
    
    pointer.x=point.x;
    pointer.y=point.y;
    pointer.velocityX=0;
    pointer.velocityY=0;
    pointer.sequence+=1;
    pointer.active=true;
    lastPointerTimeRef.current=performance.now();
  }
  
  function updatePointerSample(x: number, y: number) {
    const pointer=pointerRef.current;
    const now=performance.now();
    
    if(!pointer.active || lastPointerTimeRef.current===0) {
      pointer.x=x;
      pointer.y=y;
      pointer.velocityX=0;
      pointer.velocityY=0;
      pointer.sequence+=1;
      pointer.active=true;
      lastPointerTimeRef.current=now;
      return;
    }
    
    const deltaTime=Math.max((now-lastPointerTimeRef.current)/1000, 1/240);
    
    const limitedVelocity=limitPointerVelocity(
      (x-pointer.x)/deltaTime,
      (y-pointer.y)/deltaTime
    );
    
    pointer.velocityX+=(limitedVelocity.x-pointer.velocityX)*POINTER_VELOCITY_SMOOTHING;
    pointer.velocityY+=(limitedVelocity.y-pointer.velocityY)*POINTER_VELOCITY_SMOOTHING;
    
    pointer.x=x;
    pointer.y=y;
    pointer.sequence+=1;
    lastPointerTimeRef.current=now;
  }
  
  function stopPointerSample() {
    const pointer=pointerRef.current;
    pointer.active=false;
    pointer.velocityX=0;
    pointer.velocityY=0;
    lastPointerTimeRef.current=0;
  }
  
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    activePointerRef.current=event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    startPointerSample(event);
  }
  
  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const isMouse=event.pointerType==='mouse';
    const isActivePointer=activePointerRef.current===event.pointerId;
    
    if(!isMouse && !isActivePointer) return;
    
    const svg=svgRef.current;
    
    if(!svg) return;
    
    const point=getPointerPosition(svg, event);
    
    if(!point) return;
    
    updatePointerSample(point.x, point.y);
    
    if(point.y<=TOP_ROPE_INTERACTION_BOTTOM) {
      moveTopRope(point.x, point.y);
    }
  }
  
  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerRef.current !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    activePointerRef.current = null;

    if(event.pointerType!=='mouse') {
      stopPointerSample();
    }
    
    resetTopRope();
  }
  
  function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if(event.pointerType==='mouse' && activePointerRef.current==null) {
      stopPointerSample();
      resetTopRope();
    }
  }
  
  return (
    <>
      <div ref={containerRef} className="hanger" onPointerEnter={startPointerSample} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onPointerLeave={handlePointerLeave}>
        <svg ref={svgRef} className="hanger_svg" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} role="img" aria-label="Art can take any form">
          <path ref={topRopePathRef} className="hanger_top-rope" d={makeTopRopePath(topRopeRef.current)}/>

          {WORDS.map((wordConfig)=>(
            <HangingWord key={wordConfig.id} wordConfig={wordConfig} pointerRef={pointerRef} topRopeRef={topRopeRef}/>
          ))}
        </svg>
      </div>
    </>
)}

export default Hanger;
