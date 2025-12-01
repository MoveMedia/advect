/**
 * NO BROWSER ACCESS
 */

/**
 * PartyGodTroy here, I did not write this I found it on the internet and copied it. If you are the author thanks you rock and I want to buy you a beverage of your choosing
 */

const props_prefix ='prop-'
const ref_key = 'ref'

/**
 * @enum {number}
 */
const TokenType = {
    TEXT: 0,
    TAG_OPEN: 1,
    TAG_CLOSE: 2,
    ATTRIBUTE_NAME: 3,
    ATTRIBUTE_VALUE: 4,
    SELF_CLOSING_TAG: 5,
};

/**
 * @typedef {Object} Token
 * @property {TokenType} type
 * @property {string} value
 */

const selfClosingTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'source', 'track', 'wbr','att',
    // added for advect
    'attr','mutation','intersection'
]);




export class HTMLNode {
    tagName:string
    attributes:Record<string, string>
    props:Record<string, string>
    children:HTMLNode[]
    content:string
    isSelfClosing:boolean
    isRemoved:boolean
    parent:HTMLNode | null


    constructor(tagName:string, attributes:Record<string,string>, children: HTMLNode[] = [], content:string = "", parent:HTMLNode | null = null, props:Record<string, string> = {}) {
        this.tagName = tagName;
        this.attributes = attributes;
        this.children = children;
        this.content = content;
        this.isRemoved = false;
        this.isSelfClosing = false;
        this.parent = parent;
        this.props = props;
    }

    /**
     * @returns {string}
     */
    html() {
        if (this.isRemoved) {
            return '';
        }

        let innerHTML = this.content || '';
        for (const child of this.children) {
            innerHTML += child.html();
        }

        if (this.isSelfClosing) {
            return `<${this.tagName}${this.getAttributesString()} />`
        }

        return `<${this.tagName}${this.getAttributesString()}>${innerHTML}</${this.tagName}>`;
    }

    /**
     * @returns {string}
     */
    text() {
        return this.isRemoved ? '' : this.content || '';
    }

    /**
     * @param {string} id
     * @returns {HTMLNodeInterface | null}
     */
    getElementById(id:string) : HTMLNode | null {
        if (this.isRemoved) {
            return null;
        }

        if (this.attributes['id'] === id) return this;

        for (const child of this.children) {
            const result = child.getElementById(id);
            if (result) return result;
        }

        return null;
    }

    /**
     * @param {string} className
     * @returns {HTMLNodeInterface[]}
     */
    getElementsByClass(className:string) {
        if (this.isRemoved) {
            return [];
        }

        const results:HTMLNode[] = [];

        if (this.attributes['class'] && this.attributes['class'].split(' ').includes(className)) {
            results.push(this);
        }

        for (const child of this.children) {
            results.push(...child.getElementsByClass(className));
        }

        return results;
    }

    /**
     * @returns {void}
     */
    remove() {
        this.isRemoved = true;
    }

    /**
     * @returns {void}
     */
    unRemove() {
        this.isRemoved = false;
    }

    /**
     * @returns {void}
     */
    hidden() {
        this.attributes['style'] = `display: none;`;
    }

    /**
     * @returns {void}
     */
    show() {
        if (this.attributes['style']) {
            delete this.attributes['style'];
        }
    }

    /**
     * @param {string[]} whitelist
     * @returns {void}
     */
    filterAttributes(whitelist:string[]) {
        if (whitelist.includes('*')) {
            return;
        }

        const filteredAttributes:Record<string, string> = {};

        for (const [key, value] of Object.entries(this.attributes)) {
            if (whitelist.includes(key)) {
                filteredAttributes[key] = value;
            }
        }

        this.attributes = filteredAttributes;

        for (const child of this.children) {
            child.filterAttributes(whitelist);
        }
    }

    /**
     * @returns {string}
     */
    getAttributesString() {
        return Object.entries(this.attributes).map(([key, value]) => ` ${key}="${value}"`).join('');
    }

    /**
     * @param {string} input
     * @returns {HTMLNodeInterface[]}
     */
    static create(input:string) {
        const tokens = HTMLNode.tokenize(input);
        const refs:Map<string, string> = new Map()
        const nodes = [];
        const stack:HTMLNode[] = [];

        let currentNode = null;
        let currentAttributes:Record<string, any> = {};
        let currentProps:Record<string, any> = {};

        let currentContent = '';

        for (const token of tokens) {
            switch (token.type) {
                case TokenType.TAG_OPEN:
                    if (currentNode) {
                        if (Object.keys(currentNode.attributes).length === 0) {
                            currentNode.attributes = currentAttributes
                        }

                        currentNode.content = currentContent.trim();
                        currentAttributes = {};
                        currentContent = '';
                        stack.push(currentNode);
                    }

                    currentNode = new HTMLNode(token.value, {}, []);
                    

                    break;
                case TokenType.ATTRIBUTE_NAME:
                    currentAttributes[token.value] = '';
                    break;
                case TokenType.ATTRIBUTE_VALUE:
                    const lastKey = Object.keys(currentAttributes).pop();
                    if (!lastKey) break;
                    currentAttributes[lastKey] = token.value;
                    if (lastKey.startsWith(props_prefix)){
                        currentProps[lastKey.substring(props_prefix.length)] = token.value;
                    }
                    break;
                case TokenType.TAG_CLOSE:
                case TokenType.SELF_CLOSING_TAG:
                    if (!currentNode) {
                        break;
                    }
                    
                    currentNode.isSelfClosing = token.type === TokenType.SELF_CLOSING_TAG;

                    if (Object.keys(currentNode.attributes).length === 0) {
                        currentNode.attributes = currentAttributes
                    }
                    if (Object.keys(currentNode.props).length === 0) {
                        currentNode.props = currentProps
                    }

                    if (!currentNode.content) {
                        currentNode.content = currentContent;
                    } else {
                        currentNode.content += ' ' + currentContent;
                    }

                    currentContent = '';
                    currentAttributes = {};
                    if (stack.length > 0) {
                        const parent = stack[stack.length - 1];
                        currentNode.parent = parent;
                        parent.children.push(currentNode);
                    } else {
                        nodes.push(currentNode);
                    }
                    currentNode = stack.pop() || null;
                    break;
                case TokenType.TEXT:
                    if (currentNode) {
                        currentContent += token.value;
                    }
                    break;
            }
        }

        return nodes;
    }

    /**
     * @param {string} input
     * @returns {Token[]}
     */
    static tokenize(input:string) {
        const tokens = [];
        let i = 0;

        while (i < input.length) {
            if (input[i] === '<') {
                if (input[i + 1] === '/') {
                    let j = i + 2;
                    while (j < input.length && input[j] !== '>') j++;
                    tokens.push({ type: TokenType.TAG_CLOSE, value: input.slice(i + 2, j).trim() });
                    i = j + 1;
                } else {
                    let j = i + 1;
                    while (j < input.length && input[j] !== ' ' && input[j] !== '>' && input[j] !== '/') j++;
                    const tagName = input.slice(i + 1, j).trim();
                    tokens.push({ type: TokenType.TAG_OPEN, value: input.slice(i + 1, j).trim() });

                    while (j < input.length && input[j] !== '>') {
                        if (input[j] === ' ') {
                            j++;
                            let attrName = '';
                            while (j < input.length && input[j] !== '=' && input[j] !== ' ' && input[j] !== '>' && input[j] !== '/') {
                                attrName += input[j];
                                j++;
                            }

                            if (attrName !== '') {
                                tokens.push({ type: TokenType.ATTRIBUTE_NAME, value: attrName.trim().toLowerCase() });
                            }

                            if (input[j] === '=') {
                                j++;
                                const quoteType = input[j];
                                j++;
                                let attrValue = '';
                                while (j < input.length && input[j] !== quoteType) {
                                    attrValue += input[j];
                                    j++;
                                }
                                tokens.push({ type: TokenType.ATTRIBUTE_VALUE, value: attrValue });
                                j++;
                            }
                        }
                        else {
                            j++;
                        }
                    }

                    if (selfClosingTags.has(tagName.toLowerCase()) && input[j] === '>') {
                        tokens.push({ type: TokenType.SELF_CLOSING_TAG, value: tagName });
                    }

                    if (input[j] === '>') {
                        j++;
                    }

                    i = j;
                }
            } else {
                let j = i;
                while (j < input.length && input[j] !== '<') j++;
                tokens.push({ type: TokenType.TEXT, value: input.slice(i, j) });
                i = j;
            }
        }

        return tokens;
    }
}

