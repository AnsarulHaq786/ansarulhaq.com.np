import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { type PointerMotion, type HangingWordConfig } from "./hanger.types";
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

import './Hanger.css';
import { getPointerPosition } from '../../../utils/getPointerPosition';
import HangingWord from './HangingWord';

gsap.registerPlugin(useGSAP);

const VIEWBOX_WIDTH=1470;
const VIEWBOX_HEIGHT=200;
const TOP_ROPE_Y=100;

const IncrementOfWordXPosition=245;
const topRopeRestingPosition=136;

const START_X=40;
const RESTING_CONTROL_X=685;
const END_X=1410;
const RESTING_Y=100;
const RESTING_CONTROL_Y=100;
const RESTING_PATH=`M ${START_X} ${RESTING_Y} Q ${RESTING_CONTROL_X} ${RESTING_CONTROL_Y} ${END_X} ${RESTING_Y}`;

const WORDS: readonly HangingWordConfig[]=[
  {
    id: "art",
    word: "Art",
    
    anchorX: IncrementOfWordXPosition,
    anchorY: topRopeRestingPosition,
    ropeLength: 200,
    
    angle: 0,
    angularVelocity: 0,
    damping: 0.9,
    gravity: 980,
    restingAngle: 0,
    
    accent: true
  },
  {
    id: "can",
    word: "can",
    
    anchorX: IncrementOfWordXPosition*2,
    anchorY: topRopeRestingPosition,
    ropeLength: 200,
    
    angle: 0,
    angularVelocity: 0,
    damping: 0.9,
    gravity: 980,
    restingAngle: 0,
    
    accent: false
  }
]

function Hanger() {
  
  const containerRef=useRef<HTMLDivElement>(null);
  const topRopeSvgRef=useRef<SVGSVGElement>(null);
  const pathRef=useRef<SVGPathElement>(null);
  const activePointerRef=useRef<number | null>(null);
  const wordSvgRef=useRef<SVGSVGElement>(null);
  const pointerRef=useRef<PointerMotion>({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    sequence: 0,
    active: false
  })

  const { contextSafe } = useGSAP({ scope: containerRef });
  
  const moveString=contextSafe(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const topRopeSvg=topRopeSvgRef.current;
      const path=pathRef.current;
      
      if(!topRopeSvg || !path) return;
      
      const pointer=getPointerPosition(topRopeSvg, event);
      
      if(!pointer) return;
      
      const controlX=gsap.utils.clamp(START_X, END_X, pointer.x);
      const controlY=gsap.utils.clamp(0, VIEWBOX_HEIGHT, pointer.y);
      const pulledPath=`M ${START_X} ${RESTING_Y} Q ${controlX} ${controlY} ${END_X} ${RESTING_Y}`;
      
      gsap.to(path, {
        attr: {d: pulledPath},
        duration: 0.2,
        ease: 'power3.out',
        overwrite: true
      })
    }
  )
  
  const resetString=contextSafe(() => {
      const path=pathRef.current;
      
      if(!path) return;
      
      gsap.to(path, {
        attr: {d: RESTING_PATH},
        duration: 0.8,
        ease: 'elastic.out(1, 0.28)',
        overwrite: true
      })
  })
  
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    activePointerRef.current=event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveString(event);
  }
  
  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const isMouse=event.pointerType==='mouse';
    const isActivePointer=activePointerRef.current===event.pointerId;
    if(!isMouse && !isActivePointer) return;
    moveString(event);
  }
  
  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerRef.current !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    activePointerRef.current = null
    resetString()
  }
  
  function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if(event.pointerType==='mouse' && activePointerRef.current==null) {
      resetString();
    }
  }
  
  return (
    <>
      <div ref={containerRef} className="hanger" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onPointerLeave={handlePointerLeave}>
        <svg ref={topRopeSvgRef} className="hanger_svg" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          <path ref={pathRef} className="hanger_top-rope" d={RESTING_PATH} />
        </svg>
        <svg ref={wordSvgRef} className="hanger_svg" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} role="img" aria-label="Art can take any form">
          {WORDS.map((wordConfig)=>(
            <HangingWord key={wordConfig.id} wordConfig={wordConfig} pointerRef={pointerRef} />
          ))}
        </svg>
      </div>
    </>
)}

export default Hanger;
