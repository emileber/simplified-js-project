/* eslint-env es6 */

module.exports = function() {
    var src = 'app/',
        temp = `${src}.tmp/`,
        bower = {
            directory: `${src}libs/`,
        },
        build = 'build/';

    var config = {
        /**
         * File paths
         */
        app: {
            name: 'main',
            mainConfigFile: `${src}js/main.js`,
            out: `${build}js/main.min.js`,
            baseUrl: `${src}js`,
        },
        build: build,
        bower: bower,
        css: 'assets/css/',
        fonts: {
            dir: 'assets/fonts/',
            bower: ['font-awesome']
        },
        images: 'assets/images/',
        index: src + 'index.html',
        // app js, with no specs
        js: [
            '**/*.js',
            `!${bower.directory}**/*`,
            '!node_modules/**/*',
            `!${build}**/*`
        ],
        libs: {
            dir: bower.directory,
            src: [
                'libs/todomvc-common/base.js',
                'libs/requirejs/require.js'
            ],
            bundle: 'libs/bundle.min.js'
        },
        /**
         * optimized files
         */
        optimized: {
            app: 'js/main.min.js',
            css: 'assets/css/main.min.css'
        },
        requirejs: 'libs/requirejs/require.min.js',

        sass: src + 'sass/main.scss',
        src: src,
        temp: temp,
    };

    return config;
};
