(() => {

    'use strict';

    /**************** Gulp.js configuration ****************/
    process.env.NODE_ENV = 'development';
    const

        // development or production
        // devBuild — true if NODE_ENV is blank or set to development
        devBuild  = ((process.env.NODE_ENV || 'development').trim().toLowerCase() === 'development'),

            // directory locations
        dir = {
            src         : 'src/',
            build       : 'build/'
        },

        // modules
        gulp          = require('gulp'),
        noop          = require('gulp-noop'),
        newer         = require('gulp-newer'),
        size          = require('gulp-size'),
        imagemin      = require('gulp-imagemin'),
        sass          = require('gulp-sass'),
        postcss       = require('gulp-postcss'),
        // sourcemaps and browsersync are only enabled for development builds.
        sourcemaps    = devBuild ? require('gulp-sourcemaps') : null,
        browsersync   = devBuild ? require('browser-sync').create() : null;


    console.log('Gulp', devBuild ? 'development' : 'production', 'build');


    /**************** images task ****************/
    const imgConfig = {
        src           : dir.src + 'media/**/*',
        build         : dir.build + 'media/',

        minOpts: {
            optimizationLevel: 5                //gulp-imagemin optimization options.
        }
    };

    gulp.task('images', () =>
        gulp.src(imgConfig.src)                 //The source folder is examined.
            .pipe(newer(imgConfig.build))       //Nothing will occur because only newer files will be processed.
            .pipe(imagemin(imgConfig.minOpts))  //Optimizes the remaining files.
            .pipe(size({ showFiles:true }))     //Shows the resulting size of all processed files.
            .pipe(gulp.dest(imgConfig.build))   //The files are saved to the gulp.dest build folder.
    );


    /**************** CSS task ****************/
    const cssConfig = {

        src         : dir.src + 'sass/main.scss',
        watch       : dir.src + 'sass/**/*',
        build       : dir.build + 'css/',
        sassOpts: {
            sourceMap       : devBuild,
            outputStyle     : 'nested',
            imagePath       : '/media/',
            precision       : 3,
            errLogToConsole : true
        },

        postCSS: [
            require('postcss-assets')({         // Inlining images & SVG, Calculating dimensions, URL resolution
                loadPaths: ['media/'],          // inline('image.png') - width or height() - resolve()
                basePath: dir.build
            }),
            require('autoprefixer')({           // any browser with a global market share of 1% or more
                browsers: ['> 1%']              // will have vendor prefixes added
            })
        ]
    };

    // remove unused selectors and minify production CSS
    if (!devBuild) {
        cssConfig.postCSS.push(
            require('usedcss')({ html: ['index.html'] }),   // removes unused selectors
            require('cssnano')      // minifies the resulting CSS file by removing all comments, whitespace, etc.
        );

    }

    gulp.task('css', ['images'], () =>  // It runs the images task first, since the CSS may depend on images.
        gulp.src(cssConfig.src)         // The source folder is examined
            .pipe(sourcemaps ? sourcemaps.init() : noop())  // plugin is initialized. Otherwise, the gulp-noop does nothing.
            .pipe(sass(cssConfig.sassOpts).on('error', sass.logError))  // transpiles main.scss to CSS
            .pipe(postcss(cssConfig.postCSS))   //postcss plugins
            .pipe(sourcemaps ? sourcemaps.write() : noop()) // It will appended as a data URI to the end of the CSS.
            .pipe(size({ showFiles:true }))     //Displays the final size of the CSS file.
            .pipe(gulp.dest(cssConfig.build))   //The files are saved to the gulp.dest build folder
            .pipe(browsersync ? browsersync.reload({ stream: true }) : noop())  // refresh the CSS in all connected browsers.
    );

    /**************** browser-sync task ****************/
    const syncConfig = {
        server: {
            baseDir   : './',
            index     : 'index.html'
        },
        port        : 8000,
        open        : false,
        notify: false            // Don't show any notifications in the browser.
    };

    // browser-sync
    gulp.task('browsersync', () =>
        browsersync ? browsersync.init(syncConfig) : null
    );


    /**************** watch task ****************/
    gulp.task('default', ['css', 'browsersync'], () => {
        // image changes
        gulp.watch(imgConfig.src, ['images']);

        // CSS changes
        gulp.watch(cssConfig.watch, ['css']);
    });
})();