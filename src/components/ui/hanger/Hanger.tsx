import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

import './Hanger.css';
import { getPointerPosition } from '../../../utils/getPointerPosition';

gsap.registerPlugin(useGSAP);

const VIEWBOX_WIDTH=1470;
const VIEWBOX_HEIGHT=200;

const START_X=40;
const RESTING_CONTROL_X=685;
const END_X=1410;
const RESTING_Y=100;
const RESTING_CONTROL_Y=100;
const RESTING_PATH=`M ${START_X} ${RESTING_Y} Q ${RESTING_CONTROL_X} ${RESTING_CONTROL_Y} ${END_X} ${RESTING_Y}`;

function Hanger() {
  
  const containerRef=useRef<HTMLDivElement>(null);
  const svgRef=useRef<SVGSVGElement>(null);
  const pathRef=useRef<SVGPathElement>(null);
  const activePointerRef=useRef<number | null>(null);

  const { contextSafe } = useGSAP({ scope: containerRef });
  
  const moveString=contextSafe(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const svg=svgRef.current;
      const path=pathRef.current;
      
      if(!svg || !path) return;
      
      const pointer=getPointerPosition(svg, event);
      
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
        ease: 'elastic.out(1, 0.28',
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
        <svg ref={svgRef} className="hanger_svg" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
          <path ref={pathRef} className="hanger_string" d={RESTING_PATH} />
        </svg>
      </div>
    </>
)}

export default Hanger;
