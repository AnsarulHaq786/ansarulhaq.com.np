import type { PointerEvent as ReactPointerEvent } from "react"

export function getPointerPosition(
    svg: SVGSVGElement,
    event: ReactPointerEvent<HTMLDivElement>,
) {
    const transformation=svg.getScreenCTM();
    
    if(!transformation) return null;
    
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(transformation.inverse());
}
