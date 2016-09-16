module.exports = {
    rules: {
        "linebreak-style": ["error", "unix"],
        "semi": ["error", "always"],
        "block-spacing": ["error", "always"],
        "comma-spacing": ["error"],
        "computed-property-spacing": ["error", "never"],
        "eol-last": ["error", "unix"],
        "no-extra-parens": "error",
        "no-extra-semi": "error",
        "no-multiple-empty-lines": ["error", { "max": 2, "maxEOF": 1 }],
        "no-multi-spaces": "error",
        "no-trailing-spaces": ["error", { "skipBlankLines": true }],
        "no-unsafe-negation": "error",
        "func-call-spacing": ["error", "never"],
        "key-spacing": ["error", {
            "beforeColon": false,
            "afterColon": true,
            "mode": "strict"
        }],
        "keyword-spacing": ["error", { "before": true, "after": true }],
        "no-whitespace-before-property": "error",
        // "object-curly-newline": ["error", { "multiline": true }],
        "object-curly-spacing": ["error", "always"],
        "space-before-blocks": "error",
        "space-before-function-paren": ["error", "never"],
        "space-in-parens": ["error", "never"],
        "space-infix-ops": "error",
        "space-unary-ops": ["error", {
            "words": true,
            "nonwords": false,
        }],
        "unicode-bom": "error",

    }
};
