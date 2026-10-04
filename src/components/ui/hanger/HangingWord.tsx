import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type RefObject } from "react";

import type { HangingWordConfig, PointerMotion } from "./hanger.types";

interface HangingWordProps {
  wordConfig: HangingWordConfig;
  pointerRef: RefObject<PointerMotion>;
  anchorX: number;
  anchorY: number;
}

gsap.registerPlugin(useGSAP);

const RADIANS_TO_DEGREES=180/Math.PI;
const INTERACTION_RADIUS=180;
const POINTER_SAMPLE_MAX_AGE=90;

const ROPE_POINTER_GAIN=0.22;
const BODY_POINTER_GAIN=0.12;
const ROPE_RESPONSE=18;
const BODY_RESPONSE=14;

const MAX_ROPE_ANGULAR_VELOCITY=0.8;
const MAX_BODY_ANGULAR_VELOCITY=1.1;
const MAX_DELTA_TIME=1/30;
const MIN_COM_DISTANCE=24;

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
  const segmentLengthSquared=segmentX**2+segmentY**2;

  if (segmentLengthSquared===0) {
    return Math.hypot(pointX-startX, pointY-startY);
  }

  const projection=((pointX-startX)*segmentX+(pointY-startY)*segmentY)/segmentLengthSquared;
  const projectionFactor=gsap.utils.clamp(0, 1, projection);
  const closestX=startX+segmentX*projectionFactor;
  const closestY=startY+segmentY*projectionFactor;

  return Math.hypot(pointX-closestX, pointY-closestY);
}

function HangingWord({
  wordConfig,
  pointerRef,
  anchorX,
  anchorY
}: HangingWordProps) {
  const rootRef=useRef<SVGGElement>(null);
  const ropeRef=useRef<SVGLineElement>(null);
  const bodyRef=useRef<SVGGElement>(null);
  const visualRef=useRef<SVGGElement>(null);
  const textRef=useRef<SVGTextElement>(null);
  const lastPointerSequenceRef=useRef(-1);

  const physicsRef=useRef({
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
    bodyInteractionRadius: INTERACTION_RADIUS,
  });

  useGSAP(
    ()=>{
      const ropeElement=ropeRef.current;
      const bodyElement=bodyRef.current;
      const visualElement=visualRef.current;
      const textElement=textRef.current;

      if (!ropeElement || !bodyElement || !visualElement || !textElement) {
        return;
      }

      const rope=ropeElement;
      const body=bodyElement;
      const physics=physicsRef.current;
      const bounds=textElement.getBBox();
      const width=Math.max(bounds.width, 1);
      const height=Math.max(bounds.height, 1);
      const attachmentX=gsap.utils.clamp(0, 1, wordConfig.attachmentX);
      const attachmentY=gsap.utils.clamp(
        0,
        1,
        wordConfig.attachmentY ?? 0,
      );
      const attachmentOffsetX=(attachmentX-0.5)*width;
      const attachmentOffsetY=(attachmentY-0.5)*height;

      physics.ropeLength=wordConfig.ropeLength;
      physics.ropeAngle=wordConfig.angle;
      physics.ropeAngularVelocity=wordConfig.angularVelocity;
      physics.damping=wordConfig.damping;
      physics.gravity=wordConfig.gravity;
      physics.comOffsetX=-attachmentOffsetX;
      physics.comOffsetY=-attachmentOffsetY;
      physics.comDistance=Math.max(
        Math.hypot(physics.comOffsetX, physics.comOffsetY),
        MIN_COM_DISTANCE
      );
      physics.bodyInteractionRadius=Math.max(width, height)*0.65+50;
      physics.bodyRestAngle=Math.atan2(
        physics.comOffsetX,
        physics.comOffsetY
      );
      physics.bodyAngle=physics.bodyRestAngle;
      physics.bodyAngularVelocity=0;

      visualElement.setAttribute(
        "transform",
        `translate(${physics.comOffsetX} ${physics.comOffsetY})`
      );

      function getAttachmentPosition() {
        return {
          x: anchorX+Math.sin(physics.ropeAngle)*physics.ropeLength,
          y: anchorY+Math.cos(physics.ropeAngle)*physics.ropeLength
        };
      }

      function getCenterOfMass(
        attachmentXPosition: number,
        attachmentYPosition: number
      ) {
        const cosine=Math.cos(physics.bodyAngle);
        const sine=Math.sin(physics.bodyAngle);

        return {
          x: attachmentXPosition+physics.comOffsetX*cosine-physics.comOffsetY*sine,
          y: attachmentYPosition+physics.comOffsetX * sine+physics.comOffsetY*cosine
        };
      }

      function applyPointerInfluence(
        attachmentXPosition: number,
        attachmentYPosition: number,
        centerX: number,
        centerY: number
      ) {
        const pointer=pointerRef.current;

        if (!pointer.active) return;
        if (pointer.sequence===lastPointerSequenceRef.current) return;

        lastPointerSequenceRef.current=pointer.sequence;

        const sampleAge=performance.now()-pointer.timestamp;

        if(
          sampleAge > POINTER_SAMPLE_MAX_AGE ||
          pointer.sampleDelta===0
        ) {
          return;
        }

        const distanceToRope=distanceToSegment(
          pointer.x,
          pointer.y,
          anchorX,
          anchorY,
          attachmentXPosition,
          attachmentYPosition
        );

        if(distanceToRope<INTERACTION_RADIUS) {
          const proximity=1-distanceToRope/INTERACTION_RADIUS;
          const falloff=proximity**2;
          const tangentX=Math.cos(physics.ropeAngle);
          const tangentY=-Math.sin(physics.ropeAngle);
          const tangentialVelocity=pointer.velocityX*tangentX+pointer.velocityY*tangentY;
          const desiredAngularVelocity=gsap.utils.clamp(
            -MAX_ROPE_ANGULAR_VELOCITY,
            MAX_ROPE_ANGULAR_VELOCITY,
            (tangentialVelocity/physics.ropeLength)*
              ROPE_POINTER_GAIN*
              falloff
          );
          const response=1-Math.exp(-ROPE_RESPONSE*pointer.sampleDelta);

          physics.ropeAngularVelocity+=(desiredAngularVelocity-physics.ropeAngularVelocity)*response;
        }

        const distanceToBody=Math.hypot(
          pointer.x-centerX,
          pointer.y-centerY
        );

        if(distanceToBody<physics.bodyInteractionRadius) {
          const proximity=
            1-distanceToBody/physics.bodyInteractionRadius;
          const falloff=proximity**2;
          const leverX = pointer.x-centerX;
          const leverY = pointer.y-centerY;
          const leverDistanceSquared=Math.max(
            leverX**2+leverY**2,
            MIN_COM_DISTANCE**2,
          );
          const pointerAngularVelocity=
            (leverX*pointer.velocityY-leverY*pointer.velocityX)/
            leverDistanceSquared;
          const desiredBodyAngularVelocity=gsap.utils.clamp(
            -MAX_BODY_ANGULAR_VELOCITY,
            MAX_BODY_ANGULAR_VELOCITY,
            pointerAngularVelocity*BODY_POINTER_GAIN*falloff,
          );
          const response=1-Math.exp(-BODY_RESPONSE*pointer.sampleDelta);

          physics.bodyAngularVelocity+=(desiredBodyAngularVelocity-physics.bodyAngularVelocity)*response;
        }
      }

      function render(
        attachmentXPosition: number,
        attachmentYPosition: number
      ) {
        rope.setAttribute("x1", String(anchorX));
        rope.setAttribute("y1", String(anchorY));
        rope.setAttribute("x2", String(attachmentXPosition));
        rope.setAttribute("y2", String(attachmentYPosition));

        body.setAttribute(
          "transform",
          `translate(${attachmentXPosition} ${attachmentYPosition}) rotate(${physics.bodyAngle*RADIANS_TO_DEGREES})`
        );
      }

      function update(_time: number, deltaTimeMilliseconds: number) {
        const deltaTime=Math.min(
          deltaTimeMilliseconds/1000,
          MAX_DELTA_TIME
        );
        const currentAttachment=getAttachmentPosition();
        const currentCenter=getCenterOfMass(
          currentAttachment.x,
          currentAttachment.y
        );

        applyPointerInfluence(
          currentAttachment.x,
          currentAttachment.y,
          currentCenter.x,
          currentCenter.y
        );

        const ropeAngularAcceleration=
          -(physics.gravity/physics.ropeLength)*
          Math.sin(physics.ropeAngle);
        const bodyAngularAcceleration=
          -(physics.gravity/physics.comDistance)*
          Math.sin(physics.bodyAngle-physics.bodyRestAngle);

        physics.ropeAngularVelocity+=ropeAngularAcceleration*deltaTime;
        physics.bodyAngularVelocity+=bodyAngularAcceleration*deltaTime;

        const frameIndependentDamping=Math.pow(
          physics.damping,
          deltaTime*60,
        );

        physics.ropeAngularVelocity*=frameIndependentDamping;
        physics.bodyAngularVelocity*=frameIndependentDamping;

        physics.ropeAngularVelocity=gsap.utils.clamp(
          -MAX_ROPE_ANGULAR_VELOCITY,
          MAX_ROPE_ANGULAR_VELOCITY,
          physics.ropeAngularVelocity,
        );
        physics.bodyAngularVelocity=gsap.utils.clamp(
          -MAX_BODY_ANGULAR_VELOCITY,
          MAX_BODY_ANGULAR_VELOCITY,
          physics.bodyAngularVelocity,
        );

        physics.ropeAngle+=physics.ropeAngularVelocity*deltaTime;
        physics.bodyAngle+=physics.bodyAngularVelocity*deltaTime;

        const nextAttachment=getAttachmentPosition();
        render(nextAttachment.x, nextAttachment.y);
      }

      const initialAttachment=getAttachmentPosition();
      render(initialAttachment.x, initialAttachment.y);
      gsap.ticker.add(update);

      return ()=>{
        gsap.ticker.remove(update);
      };
    },
    {
      scope: rootRef,
      dependencies: [anchorX, anchorY, pointerRef, wordConfig]
    },
  );

  const wordClassName=wordConfig.accent
    ? "hanger_word hanger_word--accent"
    : "hanger_word";

  return (
    <g ref={rootRef}>
      <line ref={ropeRef} className="hanger_vertical-rope" />

      <g ref={bodyRef}>
        <g ref={visualRef}>
          <text
            ref={textRef}
            className={wordClassName}
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {wordConfig.word}
          </text>
        </g>
      </g>
    </g>
  );
}

export default HangingWord;
