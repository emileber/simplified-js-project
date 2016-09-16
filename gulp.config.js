/* eslint-env es6 */
module.exports = function() {
    var src = './src/';
    var app = src + 'app/';
    var temp = src + '.tmp/';
    var dest = src;
    var build = './www/';
    var bower = {
        json: require('./bower.json'),
        dir: src + 'lib/',
        ignorePath: '../..',
    };
    var config = {
        /**
         * File paths
         */
        // all javascript that we want to vet
        alljs: [
            './src/app/**/*.js',
            './*.js',
            '!app.build.js'
        ],
        api: "https://www.totalcoaching.com/api/v3/",
        bower: bower,
        build: build,
        cordova: [
            "cordova.js",
            "cordova_plugins.js"
        ],
        css: 'assets/css/',
        dest: dest,
        fonts: {
            dir: 'assets/fonts/',
            bower: ['font-awesome', 'simple-line-icons']
        },
        // htmltemplates: app + '**/*.html',
        images: 'assets/images/',
        index: src + 'index.html',
        // app js, with no specs
        js: [
            // src + '**/*.module.js',
            src + '**/*.js',
            '!' + src + '**/*.spec.js',
            '!' + bower.dir + '**/*.js'
        ],
        /**
         * optimized files
         */
        optimized: {
            app: 'app/main.min',
            css: 'assets/css/main.min.css'
        },
        permissions: {
            src: [
                "hooks/**/*.js"
            ],
            value: 755
        },
        rjs: 'app.build.js',
        sass: src + 'sass/main.scss',
        src: src,
        temp: temp,
        specHelpers: [src + 'test-helpers/*.js']
    };

    return config;
};
