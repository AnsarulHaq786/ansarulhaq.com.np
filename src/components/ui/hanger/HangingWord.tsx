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
const INTERACTION_RADIUS=150;
const ROPE_IMPULSE_STRENGTH=0.08;
const BODY_IMPULSE_STRENGTH=0.03;
const MAX_ROPE_IMPULSE=0.35;
const MAX_BODY_IMPULSE=0.25;
const MAX_DELTA_TIME=1/30;
const MIN_COM_DISTANCE=24;

function getQuadraticBezierPoint(rope: TopRopeState, t: number) {
    const inverseT=1-t;
    
    return {
        x: inverseT**2*rope.startX+2*inverseT*t*rope.controlX+t**2*rope.endX,
        y: inverseT**2*rope.startY+2*inverseT*t*rope.controlY+t**2*rope.endY,
    }
}

function distanceToSegment(
    // mouse pointer position
    pointX: number,
    pointY: number,
    // vertical rope anchor points with top rope and the word
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
    const bodyRef=useRef<SVGGElement>(null);
    const visualRef=useRef<SVGGElement>(null);
    const textRef=useRef<SVGTextElement>(null);
    const lastPointerSequenceRef=useRef(-1);
    
    const physicsRef=useRef({
        anchorX: 0,
        anchorY: 0,
        ropeLength: wordConfig.ropeLength,
        ropeAngle: wordConfig.angle,
        ropeAngularVelocity: wordConfig.angularVelocity,
        damping: wordConfig.damping,
        gravity: wordConfig.gravity,
        bodyAngle: 0,
        bodyAngularVelocity: 0,
        bodyRestAngle: 0,
        comOffsetX: 0,
        comOffsetY: MIN_COM_DISTANCE,
        comDistance: MIN_COM_DISTANCE,
        bodyInteractionRadius: INTERACTION_RADIUS
    })
    
    useGSAP(() => {
        const ropeElement=ropeRef.current;
        const bodyElement=bodyRef.current;
        const visualElement=visualRef.current;
        const textElement=textRef.current;
        
        if(!ropeElement || !bodyElement || !visualElement || !textElement) return;
        
        const physics=physicsRef.current;
        const bounds=textElement.getBBox();
        const width=Math.max(bounds.width, 1);
        const height=Math.max(bounds.height, 1);
        const attachmentX=gsap.utils.clamp(0, 1, wordConfig.attachmentX);
        const attachmentY=gsap.utils.clamp(0, 1, wordConfig.attachmentY?? 0);
        const attachmentOffsetX=(attachmentX-0.5)*width;
        const attachmentOffsetY=(attachmentY-0.5)*height;
        
        physics.comOffsetX=-attachmentOffsetX;
        physics.comOffsetY=-attachmentOffsetY;
        physics.comDistance=Math.max(Math.hypot(physics.comOffsetX, physics.comOffsetY), MIN_COM_DISTANCE);
        physics.bodyInteractionRadius=Math.max(width, height)*0.65+50;
        physics.bodyRestAngle=Math.atan2(physics.comOffsetX, physics.comOffsetY);
        physics.bodyAngle=physics.bodyRestAngle;
        
        gsap.set(visualElement, {
            attr: {
                transform: `translate(${physics.comOffsetX} ${physics.comOffsetY})`
            }
        })
        
        function updateAnchor() {
            const anchor=getQuadraticBezierPoint(topRopeRef.current, wordConfig.anchorT);
            physics.anchorX=anchor.x;
            physics.anchorY=anchor.y;
        }
        
        function getAttachmentPosition() {
            return {
                x: physics.anchorX+Math.sin(physics.ropeAngle)*physics.ropeLength,
                y: physics.anchorY+Math.cos(physics.ropeAngle)*physics.ropeLength
            }
        }
        
        function getCenterOfMass(attachmentXPosition: number, attachmentYPosition: number) {
            const cosine=Math.cos(physics.bodyAngle);
            const sine=Math.sin(physics.bodyAngle);
            
            return {
                x: attachmentXPosition+physics.comOffsetX*cosine-physics.comOffsetY*sine,
                y: attachmentYPosition+physics.comOffsetY*sine+physics.comOffsetY*cosine
            }
        }
       
        function applyPointerImpulse(attachmentXPosition: number, attachmentYPosition: number, centerX: number, centerY: number) {
            const pointer=pointerRef.current;
            
            if(!pointer.active || pointer.sequence===lastPointerSequenceRef.current) return;
            
            lastPointerSequenceRef.current=pointer.sequence;
            
            const distanceToBody=Math.hypot(pointer.x-centerX, pointer.y-centerY);
            
            const distanceToRope=distanceToSegment(pointer.x, pointer.y, physics.anchorX, physics.anchorY, attachmentXPosition, attachmentYPosition);
                        
            if(distanceToRope<INTERACTION_RADIUS) {
                const falloff=(1-distanceToRope/INTERACTION_RADIUS)**2;                
                const tangentX=Math.cos(physics.ropeAngle);
                const tangentY=-Math.sin(physics.ropeAngle);
                
                const tangentialPointerVelocity=pointer.velocityX*tangentX+pointer.velocityY*tangentY;
                
                const rawRopeImpulse=(tangentialPointerVelocity/physics.ropeLength)*ROPE_IMPULSE_STRENGTH*falloff;
                
                const ropeImpulse=gsap.utils.clamp(-MAX_ROPE_IMPULSE, MAX_ROPE_IMPULSE, rawRopeImpulse);
            
                physics.ropeAngularVelocity+=ropeImpulse;
            }
            
            if(distanceToBody<INTERACTION_RADIUS) {
                const falloff=(1-distanceToBody/physics.bodyInteractionRadius)**2;
                const leverX=pointer.x-centerX;
                const leverY=pointer.y-centerY;
                const torqueFromPointer=leverX*pointer.velocityY-leverY*pointer.velocityX;
                const rawBodyImpulse=(torqueFromPointer/physics.comDistance**2)*BODY_IMPULSE_STRENGTH*falloff;
                const bodyImpulse=gsap.utils.clamp(-MAX_BODY_IMPULSE, MAX_BODY_IMPULSE, rawBodyImpulse);
                physics.bodyAngularVelocity+=bodyImpulse;
            }
        }
        
        function render(attachmentXPosition:number, attachmentYPosition: number) {
            gsap.set(ropeElement, {
                attr: {
                    x1: physics.anchorX,
                    y1: physics.anchorY,
                    x2: attachmentXPosition,
                    y2: attachmentYPosition 
                }
            })
            
            gsap.set(bodyElement, {
                attr: {
                    transform:
                        `translate(${attachmentXPosition} ${attachmentYPosition})`+
                        `rotate(${physics.bodyAngle*RADIANS_TO_DEGREES})`
                }
            })
        }
        
        function update(_time: number, deltaTimeMilliseconds: number) {
            const deltaTime=Math.min(deltaTimeMilliseconds/1000, MAX_DELTA_TIME);
            
            updateAnchor();
            
            const currentAttachment=getAttachmentPosition();
            const currentCenter=getCenterOfMass(
                currentAttachment.x,
                currentAttachment.y
            )
            
            applyPointerImpulse(currentAttachment.x, currentAttachment.y, currentCenter.x, currentCenter.y);
            
            const ropeAngularAcceleration=-(physics.gravity/physics.ropeLength)*Math.sin(physics.ropeAngle);
            const bodyAngularAcceleration=-(physics.gravity/physics.comDistance)*Math.sin(physics.bodyAngle-physics.bodyRestAngle);
            
            physics.ropeAngularVelocity+=ropeAngularAcceleration*deltaTime;
            physics.bodyAngularVelocity+=bodyAngularAcceleration*deltaTime;
            
            const frameIndependentDamping=Math.pow(physics.damping, deltaTime*60);
            
            physics.ropeAngularVelocity*=frameIndependentDamping;
            physics.bodyAngularVelocity*=frameIndependentDamping;
            physics.ropeAngle+=physics.ropeAngularVelocity*deltaTime;
            physics.bodyAngle+=physics.bodyAngularVelocity*deltaTime;
            
            const nextAttachment=getAttachmentPosition();
            
            render(nextAttachment.x, nextAttachment.y);
        }
        
        updateAnchor();
        
        const initialAttachmentPosition=getAttachmentPosition();
        render(initialAttachmentPosition.x, initialAttachmentPosition.y);
        
        gsap.ticker.add(update);
        
        return()=>{
            gsap.ticker.remove(update);
        }
    }, { scope: bodyRef, dependencies: [pointerRef, topRopeRef, wordConfig.anchorT, wordConfig.attachmentX, wordConfig.attachmentY] })
   
    const wordClassName=wordConfig.accent? 'hanger_word hanger_word--accent': 'hanger_word';

    return (
        <g>
            <line ref={ropeRef} className="hanger_vertical-rope" />
            
            <g ref={bodyRef}>
                <g ref={visualRef}>
                    <text ref={textRef} className={wordClassName} x="0" y="0" textAnchor="middle" dominantBaseline="middle">
                        {wordConfig.word}
                    </text>
                </g>
            </g>    
        </g>
    )
}

export default HangingWord;