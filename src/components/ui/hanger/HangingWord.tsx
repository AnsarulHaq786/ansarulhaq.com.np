import { useGSAP } from "@gsap/react";
import gsap from 'gsap';
import { useRef, type RefObject } from "react";

import type { HangingWordConfig, PointerMotion, TopRopeState } from "./hanger.types";
interface HangingWordProps {
    wordConfig: HangingWordConfig,
    pointerRef: RefObject<PointerMotion>,
    topRopeRef: RefObject<TopRopeState>
}

gsap.registerPlugin(useGSAP);

const RADIANS_TO_DEGREES=180/Math.PI;
const INTERACTION_RADIUS=80;
const IMPULSE_STRENGTH=0.1;
const MAX_ANGULAR_IMPULSE=0.4;
const MAX_DELTA_TIME=1/30;

function getQuadraticBezierPoint(rope: TopRopeState, t: number) {
    const inverseT=1-t;
    
    return {
        x: inverseT**2*rope.startX+2*inverseT*t*rope.controlX+t**2*rope.endX,
        y: inverseT**2*rope.startY+2*inverseT*t*rope.controlY+t**2*rope.endY,
    }
}

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

function HangingWord({ wordConfig, pointerRef, topRopeRef }: HangingWordProps) {
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
        const ropeElement=ropeRef.current;
        const wordElement=wordRef.current;
        
        if(!ropeElement || !wordElement) return;
        
        const physics=physicsRef.current;
        
        function updateAnchor() {
            const anchor=getQuadraticBezierPoint(topRopeRef.current, wordConfig.anchorT);
            physics.anchorX=anchor.x;
            physics.anchorY=anchor.y;
        }
        
        function getWordPosition() {
            return {
                x: physics.anchorX+Math.sin(physics.angle)*physics.ropeLength,
                y: physics.anchorY+Math.cos(physics.angle)*physics.ropeLength
            }
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
            
            const rawImpulse=(tangentialPointerVelocity/physics.ropeLength)*IMPULSE_STRENGTH*subtleFalloff;
            
            const impulse=gsap.utils.clamp(-MAX_ANGULAR_IMPULSE, MAX_ANGULAR_IMPULSE, rawImpulse);
        
            physics.angularVelocity+=impulse;
        }
        
        function render(wordX: number, wordY: number) {
            const rotation=physics.angle*RADIANS_TO_DEGREES;
            
            gsap.set(ropeElement, {
                attr: {
                    x1: physics.anchorX,
                    y1: physics.anchorY,
                    x2: wordX,
                    y2: wordY 
                }
            })
            
            gsap.set(wordElement, {
                attr: {
                    transform: `translate(${wordX} ${wordY}) rotate(${rotation})`
                }
            })
        }
        
        function update(_time: number, deltaTimeMilliseconds: number) {
            const deltaTime=Math.min(deltaTimeMilliseconds/1000, MAX_DELTA_TIME);
            
            updateAnchor();
            
            const currentPosition=getWordPosition();
            
            applyPointerImpulse(currentPosition.x, currentPosition.y);
            
            const angularAcceleration=-(physics.gravity/physics.ropeLength)*Math.sin(physics.angle-physics.restingAngle);
            
            physics.angularVelocity+=angularAcceleration*deltaTime;
                        
            physics.angle+=physics.angularVelocity*deltaTime;
            
            const nextPostion=getWordPosition();
            
            render(nextPostion.x, nextPostion.y);
        }
        
        updateAnchor();
        const initialPosition=getWordPosition();
        render(initialPosition.x, initialPosition.y);
        
        gsap.ticker.add(update);
        
        return()=>{
            gsap.ticker.remove(update);
        }
    }, { scope: wordRef, dependencies: [pointerRef, topRopeRef, wordConfig.anchorT] })
   
    const wordClassName=wordConfig.accent? 'hanger_word hanger_word--accent': 'hanger_word';

    return (
        <g>
            <line ref={ropeRef} className="hanger_vertical-rope" />
            <g ref={wordRef}>
                <text className={wordClassName} x="0" y="12" textAnchor="middle" dominantBaseline="hanging">
                    {wordConfig.word}
                </text>
            </g>
        </g>
    )
}

export default HangingWord;