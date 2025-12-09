
/**
 * Available page links on the Home page
 */
export const HOME_PAGE_LINKS = {
    DYNAMIC_ID: {
        linkLabel: 'Dynamic ID',
        targetURL: '/dynamicid'
    },
    CLASS_ATTRIBUTE: {
        linkLabel: 'Class Attribute',
        targetURL: '/classattr'
    },
    HIDDEN_LAYERS: {
        linkLabel: 'Hidden Layers',
        targetURL: '/hiddenlayers'
    },
    LOAD_DELAY: {
        linkLabel: 'Load Delay',
        targetURL: '/loaddelay'
    },
    AJAX_DATA: {
        linkLabel: 'AJAX Data',
        targetURL: '/ajax'
    },
    CLIENT_SIDE_DELAY: {
        linkLabel: 'Client Side Delay',
        targetURL: '/clientdelay'
    },
    CLICK: {
        linkLabel: 'Click',
        targetURL: '/click'
    },
    TEXT_INPUT: {
        linkLabel: 'Text Input',
        targetURL: '/textinput'
    },
    SCROLLBARS: {
        linkLabel: 'Scrollbars',
        targetURL: '/scrollbars'
    },
    DYNAMIC_TABLE: {
        linkLabel: 'Dynamic Table',
        targetURL: '/dynamictable'
    },
    VERIFY_TEXT: {
        linkLabel: 'Verify Text',
        targetURL: '/verifytext'
    },
    PROGRESS_BAR: {
        linkLabel: 'Progress Bar',
        targetURL: '/progressbar'
    },
    VISIBILITY: {
        linkLabel: 'Visibility',
        targetURL: '/visibility'
    },
    SAMPLE_APP: {
        linkLabel: 'Sample App',
        targetURL: '/sampleapp'
    },
    MOUSE_OVER: {
        linkLabel: 'Mouse Over',
        targetURL: '/mouseover'
    },
    NON_BREAKING_SPACE: {
        linkLabel: 'Non-Breaking Space',
        targetURL: '/nbsp'
    },
    OVERLAPPED_ELEMENT: {
        linkLabel: 'Overlapped Element',
        targetURL: '/overlapped'
    },
    SHADOW_DOM: {
        linkLabel: 'Shadow DOM',
        targetURL: '/shadowdom'
    },
    ALERTS: {
        linkLabel: 'Alerts',
        targetURL: '/alerts'
    },
    FILE_UPLOAD: {
        linkLabel: 'File Upload',
        targetURL: '/upload'
    },
    ANIMATED_BUTTON: {
        linkLabel: 'Animated Button',
        targetURL: '/animation'
    },
    DISABLED_INPUT: {
        linkLabel: 'Disabled Input',
        targetURL: '/disabledinput'
    },
    AUTO_WAIT: {
        linkLabel: 'Auto Wait',
        targetURL: '/autowait'
    },
} as const

/**
 * List of available link names on the page
 * This is not a full list and is just used as an example
 * for making clickPageLink typesafe during compile time
 * so that only available pages show up.
 */
export type AvailableLinks = (typeof HOME_PAGE_LINKS)[keyof typeof HOME_PAGE_LINKS]['linkLabel'];
