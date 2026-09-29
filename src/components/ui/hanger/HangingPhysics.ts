export interface PointerMotion {
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    sequence: number,
    active: boolean
}

export interface HangingWordCofig {
    id: string,
    word: string,
    
    anchorX: number,
    anchorY: number,
    ropeLength: number,
    
    angle: number,
    angularVelocity: number,
    damping: number,
    gravity: number,
    restingAngle: number,
    
    accent?: boolean
}