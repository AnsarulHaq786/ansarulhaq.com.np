import { useGSAP } from "@gsap/react";
import { useRef, type RefObject } from "react";

import type { HangingWordCofig, PointerMotion } from "./HangingPhysics";

interface HangingWordProps {
    wordConfig: HangingWordCofig,
    pointerRef: RefObject<PointerMotion>
}

gsap.registerPlugin(useGSAP);

const RADIANS_TO_DEGREES=180/Math.PI;
const INTERACTION_RADIUS=230;
const IMPULSE_STRENTH=0.08;
const MAX_ANGULAR_IMPULSE=0.38;
const MAX_DELTA_TIME=1/30;

function distanceToSegment(
    pointX: number,
    pointY: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
) {
    const segmentX=endX-startX;
    const segmentY=endY-startY;
    
    const segmentLenghSquared=segmentX**2+segmentY**2;
    
    const projection=((pointX-startX)*segmentX+(pointY-startY)*segmentY)/segmentLenghSquared;
    
    const projectionFactor=gsap.utils.clamp(0, 1, projection);
    const closestX=startX+segmentX*projectionFactor;
    const closestY=startY+segmentY*projectionFactor;
    
    return Math.hypot(pointX-closestX, pointY-closestY);
}

function HangingWord({ wordConfig, pointerRef }: HangingWordProps) {
    const ropeRef=useRef<SVGLineElement>(null);
    const wordRef=useRef<SVGGElement>(null);
    const lastPointerSequenceRef=useRef(-1);
    
    const physicsRef=useRef({
        anchorX: wordConfig.anchorX,
        anchorY: wordConfig.anchorY,
        ropeLength: wordConfig.ropeLength,
        angle: wordConfig.angle,
        angularVelocity: wordConfig.angularVelocity,
        damping: wordConfig.damping,
        gravity: wordConfig.gravity,
        restingAngle: wordConfig.restingAngle
    })
    
    useGSAP(() => {
        const rope=ropeRef.current;
        const word=wordRef.current;
        
        if(!rope || !word) return;
        
        const physics=physicsRef.current;
        
        function render() {
            const x=physics.anchorX+Math.sin(physics.angle)*physics.ropeLength;
            const y=physics.anchorY+Math.cos(physics.angle)*physics.ropeLength;
            
            const rotation=physics.angle*RADIANS_TO_DEGREES;
            
            gsap.set(ropeRef, {
                attr: {
                    x1: physics.anchorX,
                    y1: physics.anchorY,
                    x2: x,
                    y2: y
                }
            })
            
            gsap.set(wordRef, {
                attr: {
                    transform: `translate(${x} ${y}) rotate(${rotation})`
                }
            })
            
            return {x, y};
        }
        
        function applyPointerImpulse(wordX: number, wordY: number) {
            const pointer=pointerRef.current;
            
            if(!pointer.active || pointer.sequence===lastPointerSequenceRef.current) return;
            
            lastPointerSequenceRef.current=pointer.sequence;
            
            const distanceToWord=Math.hypot(pointer.x-wordX, pointer.y-wordY);
            
            const distanceToRope=distanceToSegment(pointer.x, pointer.y, physics.anchorX, physics.anchorY, wordX, wordY);
            
            const distance=Math.min(distanceToWord, distanceToRope);
            
            if(distance>=INTERACTION_RADIUS) return;
            
            const linearFalloff=1-distance/INTERACTION_RADIUS;
            const subtleFalloff=linearFalloff**2;
            
            const tangentX=Math.cos(physics.angle);
            const tangentY=-Math.sin(physics.angle);
            
            const tangentialPointerVelocity=pointer.velocityX*tangentX+pointer.velocityY*tangentY;
            
            const rawImpulse=(tangentialPointerVelocity/physics.ropeLength)*IMPULSE_STRENTH*subtleFalloff;
            
            const impulse=gsap.utils.clamp(-MAX_ANGULAR_IMPULSE, MAX_ANGULAR_IMPULSE, rawImpulse);
        
            physics.angularVelocity+=impulse;
        }
        
        function update(_time: number, deltaTimeMilliseconds: number) {
            const deltaTime=Math.min(deltaTimeMilliseconds/1000, MAX_DELTA_TIME);
            
            const angularAcceleration=-(physics.gravity/physics.ropeLength)*Math.sin(physics.angle-physics.restingAngle);
            
            physics.angularVelocity+=angularAcceleration*deltaTime;
            
            const frameIndependentDamping=Math.pow(physics.damping, deltaTime*60);
            
            physics.angularVelocity*=frameIndependentDamping;
            physics.angle+=physics.angularVelocity*deltaTime;
            
            const position=render();
            applyPointerImpulse(position.x, position.y);
        }
        
        render();
        gsap.ticker.add(update);
        
        return()=>{
            gsap.ticker.remove(update);
        }
    }, { scope: wordRef })
    
    return (
        <g>
            <line ref={ropeRef} className="hanger_vertical-rope" />
            <g ref={wordRef}>
                <text x="0" y="12" textAnchor="middle" dominantBaseline="hanging">
                    {wordConfig.word}
                </text>
            </g>
        </g>
    )
}

export default HangingWord;