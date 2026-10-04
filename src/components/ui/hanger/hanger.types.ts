export interface PointerMotion {
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    sequence: number,
    active: boolean
}
export interface TopRopeState {
    startX: number,
    startY: number,
    controlX: number,
    controlY: number,
    endX: number,
    endY: number
}

export interface HangingWordConfig {
    id: string,
    word: string,
    anchorT: number,
    ropeLength: number,
    attachmentX: number,
    attachmentY?: number,
    angle: number,
    angularVelocity: number,
    damping: number,
    gravity: number,
    accent?: boolean
}