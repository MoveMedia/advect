import css_with_vals from './css_with_vals.json';

const unique_vals = css_with_vals.reduce((p,c) => {
    c.type.split(',').forEach(t => {;
        p[t.trim()] = t.trim();
    });
    return p;
}, {});
/**
 * layout
 * * display
 * * position
 * * top
 * * right
 * * bottom
 * * left
 * * z-index
 * * flex
 * * flex-direction
 * * flex-wrap
 * * justify-content
 * * align-items
 * * align-content
 * * order
 * * flex-grow
 * * flex-shrink
 * * flex-basis
 * * align-self
 * * grid
 * * grid-template-columns
 * * grid-template-rows
 * * grid-template-areas
 * * grid-template
 * * grid-auto-columns
 * * grid-auto-rows
 * * grid-auto-flow
 * * row-gap
 * * column-gap 
 * * gap
 * * grid-area
 * * box-sizing
 * * width
 * * min-width
 * * max-width
 * * height
 * * min-height
 * * max-height
 * * margin
 * * margin-top
 * * margin-right
 * * margin-bottom
 * * margin-left
 * * padding
 * * padding-top
 * * padding-right
 * text
 * * color
 * font
 * * font-family
 * * font-size
 * * font-weight
 * * font-style
 * * font-variant
 * * font-size-adjust
 * * font-stretch
 * * font-effect
 * * font-emphasize
 * * font-emphasize-position
 * * font-emphasize-style
 * * font-smooth
 * * line-height
 * * letter-spacing
 * * text-align
 * * text-align-last
 * * text-transform
 * * text-decoration
 * * text-emphasis
 * * text-emphasis-color
 * * text-emphasis-style
 * * text-emphasis-position
 * border
 * * border
 * * border-width
 *  * border-style
 * * border-color
 * * border-top
 * * border-top-width
 * * border-top-style
 * * border-top-color
 * * border-right
 * * border-right-width
 * * border-right-style
 * * border-right-color
 * * border-bottom
 * * border-bottom-width
 *  
 * * border-bottom-style
 * * border-bottom-color
 * * border-left
 * * border-left-width
 * * border-left-style
 * * border-left-color
 * * border-radius
 * * border-top-left-radius
 * * border-top-right-radius
 * * border-bottom-right-radius
 * * border-bottom-left-radius
 * * border-image
 * * border-image-source
 * * border-image-slice
 * * border-image-width
 * * border-image-outset
 * * border-image-repeat
 * outline
 * * outline-width
 * * outline-style
 * * outline-color
 *  * outline-offset
 * background
 * * background-color
 * * background-image
 * * background-repeat
 * * background-attachment
 * * background-position
 * * background-position-x
 * * background-position-y
 * * background-clip
 * * background-origin
 * * background-size
 * * background-blend-mode
 * * box-shadow
 * * text-shadow
 * * filter
 * * backdrop-filter
 * * color-adjust
 * * opacity
 * * visibility
 * * overflow
 * * overflow-x
 * * overflow-y
 * * clip
 * * clip-path
 * * resize
 * * cursor
 * * user-select
 * * pointer-events
 * * touch-action
 * * content
 * * quotes
 * * counter-reset
 * * counter-increment
 * * 
 */