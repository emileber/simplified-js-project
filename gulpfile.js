/* eslint-env es6 */
var args = require('yargs').argv,
    config = require('./gulp.config')(),
    del = require('del'),
    fs = require("fs"),
    gulp = require('gulp'),
    rjs = require('requirejs'),
    execFn = require('child_process').exec,
    $ = require('gulp-load-plugins')({ lazy: true });

/**
 * yargs variables can be passed in to alter the behavior, when present.
 * Example: gulp serve-dev
 *
 * --verbose  : Various tasks will produce more output to the console.
 */

/**
 * List the available gulp tasks
 */
gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

gulp.task('watch', function() {
    gulp.watch(config.sass, ['styles']);
    gulp.watch(config.alljs, ['lint']);
});

gulp.task('install', ['bower', 'permissions'], function() {
    gulp.start('post-install');
});

gulp.task('post-install', ['images', 'fonts', 'styles']);

gulp.task('test', ['lint', 'styles']);

/**
 * Build everything
 * This is separate so we can run tests on
 * optimize before handling image or fonts
 */
gulp.task('build', ['libs', 'styles', 'images', 'fonts', 'inject', 'replace-js'], function() {
    log('Building everything to: "' + config.build + '"');

    return gulp.src(config.temp + "**/*")
        .pipe(gulp.dest(config.build))
        .on('end', function() {
            log({
                title: 'gulp build',
                subtitle: 'Deployed to the build folder'
            });
        });
});

/**
 * Lint the code and create coverage report
 * @return {Stream}
 */
gulp.task('lint', function() {
    log('Analyzing source with JSHint and ESLint');
    var fix = Boolean(args.fix);
    if (!fix) {
        log("Try " + $.util.colors.green("`gulp lint --fix`") +
            " to automatically fix ESLint errors.");
    }

    return gulp.src(config.alljs, { base: './' })
        .pipe($.if(args.verbose, $.print()))
        // jshint
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', { verbose: Boolean(args.verbose) }))
        .pipe($.jshint.reporter('fail'))
        // eslint
        .pipe($.eslint({ fix: fix }))
        .pipe($.eslint.format())
        .pipe($.eslint.failAfterError())
        .pipe($.if(isEslintFixed, gulp.dest('./')));

});

/**
 * Compile sass to css
 * @return {Stream}
 */
gulp.task('styles', ['clean-styles', 'fonts'], function(done) {
    log('Compiling SASS --> CSS');
    var dest = config.temp + config.css;
    return gulp.src(config.sass)
        .pipe($.sass({ errLogToConsole: true }))
        // .on('error', sass.logError)
        .pipe(gulp.dest(dest))
        .pipe($.cleanCss({
            keepSpecialComments: 0,
            // outputStyle: sassOptions.outputstyle,
        }))
        .pipe($.rename({ suffix: '.min' }))
        .pipe(gulp.dest(dest));
});

/**
 * Copy ionic fonts
 * @return {Stream}
 */
gulp.task('fonts', ['clean-fonts'], function() {
    log('Copying fonts');
    var files = config.fonts.bower.map(function(lib) {
        return config.bower.dir + lib + "/fonts/*.*";
    });
    log(files);

    return gulp.src(files)
        .pipe(gulp.dest(config.temp + config.fonts.dir));
});

/**
 * Copy lib files to build
 * @return {Stream}
 */
gulp.task('libs', ['clean-libs'], function() {
    log('Copying bower libs');
    return gulp.src(config.src + config.requirejs)
        .pipe($.uglify())
        .pipe(gulp.dest(config.build + "lib/requirejs"));
});

/**
 * Compress images
 * @return {Stream}
 */
gulp.task('images', ['clean-images'], function() {
    log('Compressing and copying images');

    return gulp.src(config.src + config.images + "**/*.*")
        .pipe($.imagemin({ optimizationLevel: 4 }))
        .pipe(gulp.dest(config.temp + config.images));
});

gulp.task('inject', function() {
    log('Wire up css into the html, after files are ready');

    return gulp.src(config.index)
        .pipe($.htmlReplace({
            js: {
                src: [
                    [config.optimized.app, config.requirejs]
                ],
                tpl: '<script data-main="%s" src="%s"></script>'
            },
            css: config.optimized.css,
            cordova: getPlatformArg({ silent: true }) ? config.cordova : "",
        }))
        .pipe(gulp.dest(config.build));
});

/**
 * Optimize all files, move to a build folder,
 * and inject them into the new index.html
 * @return {Stream}
 */
gulp.task('optimize', ['clean-code', 'lint'], function(done) {
    log("Optimizing the app's js and html templates");
    var options = eval(fs.readFileSync(config.rjs, 'utf8'));
    if (args.verbose) console.dir(options);
    rjs.optimize(options, function(buildResponse) {
        done();
    }, done);
});

gulp.task('replace-js', ['optimize'], function() {
    log('Replacing key-value inside the optimized js.');

    var api = args.api ? args.api : config.api;
    log("API: " + api);
    return gulp.src(config.build + "app/*.js")
        .pipe(replace({ "API_ENDPOINT": "'" + api + "'" }))
        .pipe($.uglify({
            compress: {
                dead_code: true,
                unused: true,
                hoist_funs: true,
                join_vars: true,
                passes: 2,
                drop_debugger: true,
            }
        }))
        .pipe(gulp.dest(config.build + "app"));
});

gulp.task('platform', function(done) {
    var command = 'ionic platform add ' + getPlatformArg();
    log("Running: " + command);
    exec(command, done);
});

gulp.task('mobile', ['platform', 'build'], function(done) {
    var command = 'ionic build ' + getPlatformArg();
    log("Running: " + command);
    exec(command, done);
});

gulp.task('bower', ['git-check'], function() {
    log("Install bower ");
    var bower = require("bower");
    return bower.commands.install()
        .on('log', function(data) {
            $.util.log('bower', $.util.colors.cyan(data.id), data.message);
        });
});

gulp.task('git-check', function(done) {
    log("Checking if git is installed");
    var sh = require("shelljs");
    if (!sh.which('git')) {
        throw new $.util.PluginError({
            plugin: "git-check",
            message: '  ' + $.util.colors.red('Git is not installed.') +
                '\n  Git, the version control system, is required to download Ionic.' +
                '\n  Download git here:' + $.util.colors.cyan('http://git-scm.com/downloads') + '.' +
                '\n  Once git is installed, run \'' + $.util.colors.cyan('gulp install') + '\' again.'
        });
    }
    done();
});

gulp.task('permissions', function() {
    var perm = config.permissions;
    log("Adjust permissions to " + perm.value);

    return gulp.src(perm.src, { base: './' })
        .pipe($.chmod(perm.value))
        .pipe(gulp.dest('./'));
});

///////////////////
// clean up task //
///////////////////

/**
 * Remove all files from the build and temp folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean', ['clean-code'], function(done) {
    var delconfig = [].concat(config.build + '**/*', config.temp);
    log('Cleaning: ' + $.util.colors.blue(delconfig));
    del(delconfig, done);
});

/**
 * Remove all fonts from the build folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-fonts', function(done) {
    clean(config.build + 'assets/fonts/**/*.*', done);
});

/**
 * Remove all images from the build folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-images', function(done) {
    clean(config.build + 'assets/images/**/*.*', done);
});

/**
 * Remove all styles from the build and temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-styles', function(done) {
    var css = config.css + '**/*',
        files = [].concat(
            config.temp + css,
            config.build + css
        );
    clean(files, done);
});

/**
 * Remove all js and html from the build and temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-code', function(done) {
    var files = [].concat(
        config.temp + '**/*.js',
        config.build + 'app/**/*.js',
        config.build + '**/*.html'
    );
    clean(files, done);
});

/**
 * Remove all libs from the build
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-libs', function(done) {
    clean(config.build + "lib", done);
});

////////////////

/**
 * Has ESLint fixed the file contents?
 * Used in `$.if`
 * @param  {Object}  file
 * @return {Boolean}  true if fixed through a eslint fixable rule.
 */
function isEslintFixed(file) {
    return file.eslint != null && file.eslint.fixed;
}

/**
 * Formatter for bytediff to display the size changes after processing
 * @param  {Object} data - byte data
 * @return {String}      Difference in bytes, formatted
 */
function bytediffFormatter(data) {
    var difference = data.savings > 0 ? ' smaller.' : ' larger.';
    return data.fileName + ' went from ' +
        (data.startSize / 1000).toFixed(2) + ' kB to ' +
        (data.endSize / 1000).toFixed(2) + ' kB and is ' +
        formatPercent(1 - data.percent, 2) + '%' + difference;
}

/**
 * Format a number as a percentage
 * @param  {Number} num       Number to format as a percent
 * @param  {Number} precision Precision of the decimal
 * @return {String}           Formatted perentage
 */
function formatPercent(num, precision) {
    return (num * 100).toFixed(precision);
}

/**
 * Delete all files in a given path
 * @param  {Array}   path - array of paths to delete
 * @param  {Function} done - callback when complete
 */
function clean(path, done) {
    log('Cleaning: ' + $.util.colors.blue(path));
    del(path, done);
}

/**
 * Log a message or series of messages using chalk's blue color.
 * Can pass in a string, object or array.
 */
function log(msg) {
    if (typeof msg === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}

/* #MY_KEY */
/*value to be replaced*/
/* /MY_KEY */
// The RegExp to parse the pattern above: \/\*\s*#MY_KEY\s*\*\/(.*)\/\*\s*\/MY_KEY\s*\*\/
function getReplacePattern(key, value) {
    return {
        match: new RegExp("\\/\\*\\s*#" + key + "\\s*\\*\\/(.*)\\/\\*\\s*\\/" + key + "\\s*\\*\\/"),
        replacement: value
    };
}

/**
 * Builds the patterns using the tags match above.
 *
 * @param  {Object} data key - value to use as replacement.
 * @return {Stream} gulp stream.
 */
function replace(data) {
    var patterns = [];
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            patterns.push(getReplacePattern(key, data[key]));
        }
    }
    return $.replaceTask({ patterns: patterns });
}

function exec(command, callback) {
    return execFn(command, function(err, stdout, stderr) {
            if (err !== null) {
                console.log(stderr);
            }
            callback(err);
        })
        .stdout.on('data', (data) => {
            if (args.verbose) { console.log(data); }
        });
}

function getPlatformArg(options) {
    options = options || {};
    var platform = args.android ? "android" :
        args.ios ? "ios" :
        args.platform;
    if (!options.silent && (!platform || !isAllowedPlatform(platform))) {
        throw new $.util.PluginError({
            plugin: 'getPlatformArg',
            message: "A platform must be specified through one of the " +
                "following flags: `--platform`, `--android` or `--ios`.\n" +
                "e.g.: " + $.util.colors.green("gulp mobile --android")
        });
    }
    return platform;
}

var ALLOWED_PLATFORM = ['android', 'ios', 'browser'];

function isAllowedPlatform(platform) {
    return ALLOWED_PLATFORM.indexOf(platform) > -1;
}

module.exports = gulp;
