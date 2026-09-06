export const ARTICLE_CATEGORIES = [
    "technology",
    "programming",
    "javascript",
    "typescript",
    "nodejs",
    "mongodb",
    "nextjs",
    "react",
    "career",
    "tutorial"
] as const;

export const ARTICLE_TAGS = [
    "jwt",
    "express",
    "mongoose",
    "docker",
    "git",
    "redis",
    "aws",
    "css",
    "html"
] as const;

export const ARTICLE_STATUS = [
    "DRAFT",
    "PUBLISHED",
    "EDITED"
] as const;


export const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/svg+xml"
];

// badWords.ts

export const BAD_WORDS = new Set([
    "fuck", "fucking", "shit", "bullshit", "bitch", "bastard", "asshole", "motherfucker", "cunt", "dick", "pussy", "slut", "whore", "nigger", "niga", "fag", "faggot", "retard", "idiot", "moron", "stupid", "dumb", "loser",
    // spam
    "viagra", "casino", "betting", "porn", "xxx", "crypto giveaway", "free money", "earn money fast", "click here", "buy now"
]);

export const allowedHTMLTags = [
    "h1", "h2", "h3", "h4", "h5", "h6", "section", "blockquote", "div",
    "figcaption", "figure", "hr", "li", "ol", "p", "pre", "ul", "a", "b",
    "br", "cite", "em", "i", "mark", "small", "span", "strong", "sub", "sup",
    "u", "caption", "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "iframe"
    // other supported tags are:
    // "address", "article", "aside", "footer", "header", "hgroup", "main", "nav", "dd", "dl", "dt", "main", "abbr", "bdi", "bdo", "code", "data", "dfn", "kbd", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp", "time", "var", "wbr", 
]


export const allowedAttributes = {
    "*": [
        "class",
        "id",
        "title",
        "style",
        "lang",
        "dir",
    ],

    a: [
        "href",
        "target",
        "rel",
        "title",
    ],

    img: [
        "src",
        "srcset",
        "alt",
        "title",
        "width",
        "height",
        "loading",
    ],

    table: ["class"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan", "scope"],
    col: ["span"],
    iframe: [
        "src",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "loading",
    ],
};

/*
    Rarely needed
    "abbr", "accept", "accept-charset", "accesskey", "action", "as", "autocapitalize", "autocomplete", "blocking", "charset", "cite", "color", "content", "contenteditable", "coords", "crossorigin", "data", "datetime", "dirname", "draggable", "enctype", "enterkeyhint", "form", "formaction", "formenctype", "formmethod", "formtarget", "high", "hidden", "http-equiv", "imagesizes", "imagesrcset", "inputmode", "integrity", "is", "itemid", "itemprop", "itemref", "itemtype", "kind", "label", "list", "low", "max", "maxlength", "media", "method", "min", "minlength", "nonce", "optimum", "pattern", "ping", "popover", "popovertarget", "popovertargetaction", "shape", "size", "slot", "srcdoc", "srclang", "step", "translate", "usemap", "wrap",

    Event handlers
    'onauxclick', 'onafterprint', 'onbeforematch', 'onbeforeprint', 'onbeforeunload', 'onbeforetoggle', 'onblur', 'oncancel', 'oncanplay', 'oncanplaythrough', 'onchange', 'onclick', 'onclose', 'oncontextlost', 'oncontextmenu', 'oncontextrestored', 'oncopy', 'oncuechange', 'oncut', 'ondblclick', 'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop', 'ondurationchange', 'onemptied', 'onended', 'onerror', 'onfocus', 'onformdata', 'onhashchange', 'oninput', 'oninvalid', 'onkeydown', 'onkeypress', 'onkeyup', 'onlanguagechange', 'onload', 'onloadeddata', 'onloadedmetadata', 'onloadstart', 'onmessage', 'onmessageerror', 'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onoffline', 'ononline', 'onpagehide', 'onpageshow', 'onpaste', 'onpause', 'onplay', 'onplaying', 'onpopstate', 'onprogress', 'onratechange', 'onreset', 'onresize', 'onrejectionhandled', 'onscroll', 'onscrollend', 'onsecuritypolicyviolation', 'onseeked', 'onseeking', 'onselect', 'onslotchange', 'onstalled', 'onstorage', 'onsubmit', 'onsuspend', 'ontimeupdate', 'ontoggle', 'onunhandledrejection', 'onunload', 'onvolumechange', 'onwaiting', 'onwheel'
*/
