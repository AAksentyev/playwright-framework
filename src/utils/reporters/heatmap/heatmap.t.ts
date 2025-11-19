/** Types of Locator interactions we're tracking as part of @Interaction() decorator in BaseLocator */
export type InteractionType =
    | 'click'
    | 'doubleclick'
    | 'fill'
    | 'hover'
    | 'check'
    | 'uncheck'
    | 'dragdrop';

/** Bounding box for the locator as returned by Locator.boundingBox() */
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 *  Interaction log interface with data passed from the @Interaction() decorator
 */
export interface InteractionLog {
    //locator: Locator; // locator being interacted with
    type: InteractionType; // the type of interaction ('fill' | 'click' | 'hover')
    pageObjectName: string;
    timestamp: number;
    boundingBox: BoundingBox;
}
