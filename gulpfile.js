var args = require('yargs').argv,
    config = require('./gulp.config')(),
    del = require('del'),
    gulp = require('gulp'),
    rjs = require('requirejs'),
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

gulp.task('install', ['bower'], function() {
    gulp.start('post-install');
});

gulp.task('post-install', ['images', 'fonts', 'styles']);

gulp.task('test', ['lint', 'styles']);

/**
 * Build everything
 * This is separate so we can run tests on
 * optimize before handling image or fonts
 */
gulp.task('build', ['libs', 'styles', 'images', 'fonts', 'inject', 'optimize'], function() {
    log('Building everything to: "' + config.build + '"');

    return gulp.src([
            `${config.temp}**/*`,
            `${config.src}*.*`,
            `!${config.src}index.html`
        ])
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
    log('Analyzing source with ESLint');
    var fix = Boolean(args.fix);
    if (!fix) {
        log("Try " + $.util.colors.green("`gulp lint --fix`") +
            " to automatically fix ESLint errors.");
    }

    return gulp.src(config.js, { base: './' })
        .pipe($.if(args.verbose, $.print()))
        .pipe($.if(fix, $.jsbeautifier()))
        .pipe($.if(fix, gulp.dest('./')))
        // eslint
        .pipe($.eslint({ fix: fix }))
        .pipe($.eslint.format())
        .pipe($.eslint.failAfterError())
        .pipe($.if(isEslintFixed, gulp.dest('./')));

});

gulp.task('serve', function() {
    return $.nodemon({
        delay: 10,
        script: 'server.js',
        watch: ['gulpfile.js', 'server.js'],
        env: { 'DIR': args.prod ? 'build' : args.dir || 'app', },
        verbose: true
    });
});

/**
 * Compile sass to css
 * @return {Stream}
 */
gulp.task('styles', ['clean-styles', 'fonts'], function() {
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
        return config.libs.dir + lib + "/fonts/*.*";
    });

    return gulp.src(files)
        .pipe($.if(args.verbose, $.print()))
        .pipe(gulp.dest(config.temp + config.fonts.dir));
});

/**
 * Copy lib files to build
 * @return {Stream}
 */
gulp.task('libs', ['clean-libs'], function() {
    log('Copying bower libs');
    var files = config.libs.src.map(function(lib) {
        return config.src + lib;
    });
    return gulp.src(files, { base: config.src })
        .pipe($.if(args.verbose, $.print()))
        .pipe($.concat(config.libs.bundle))
        .pipe($.uglify())
        // .pipe($.rename({ suffix: '.min' }))
        .pipe(gulp.dest(config.build));
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
                    [config.optimized.app, config.libs.bundle],
                ],
                tpl: '<script data-main="%s" src="%s"></script>'
            },
            css: config.optimized.css,
        }))
        .pipe(gulp.dest(config.build));
});

/**
 * Optimize all files, move to a build folder,
 * and inject them into the new index.html
 * @return {Stream}
 */
gulp.task('optimize', ['clean-code', 'lint'], function(done) {
    log("Optimizing the app's js");
    var options = Object.assign({

        removeCombined: true,
        preserveLicenseComments: false,
        generateSourceMaps: true,

        skipModuleInsertion: false,
        wrapShim: true,

        optimize: "uglify2", //"uglify"

        //Inlines the text for any text! dependencies, to avoid the separate
        //async XMLHttpRequest calls to load those dependencies.
        inlineText: true,

        stubModules: ['text'],
    }, config.app);

    if (args.verbose) console.dir(options);
    rjs.optimize(options, function() {
        done();
    }, done);
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
gulp.task('clean', function(done) {
    var delconfig = [].concat(config.build, config.temp);
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

module.exports = gulp;
