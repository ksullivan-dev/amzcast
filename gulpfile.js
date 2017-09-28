/*global require,console*/

'use strict';
var browserify = require('browserify');
var concat     = require('gulp-concat');
var declare    = require('gulp-declare');
var gulp       = require('gulp');
var handlebars = require('gulp-handlebars');
var minifyCSS  = require('gulp-minify-css');
var rename     = require('gulp-rename');
var replace    = require('gulp-replace');
var sass       = require('gulp-sass');
var source     = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var streamify  = require('gulp-streamify');
var stringify  = require('stringify');
var uglify     = require('gulp-uglify');
var webserver  = require('gulp-webserver');
var wrap       = require('gulp-wrap');
var prefixer   = require('gulp-autoprefixer');
var inject     = require('gulp-inject');
var jshint     = require("gulp-jshint");
var imagemin   = require('gulp-imagemin');
require("bluebird");

var PATH = {
	PUBLIC               : './public/**/*',
	JS_ONLY              : ['src/js/*.js', 'src/js/**/*.js'],
	JS_HTML              : ['src/js/*.js', 'src/js/**/*.js', 'src/js/**/*.html'],
	JS_MAIN_ENTRY        : './src/js/main.js',
	JS_MAIN_OUTFILE      : 'main.js',
	JS_MAIN_OUTFILE_MIN  : 'main.min.js',
	JS_DEST              : './public/dist/js/',
	DEST                 : './public/dist',
	SASS                 : ['src/scss/**/*.scss'],
	WEB_ROOT             : 'public',
	TEMPLATES            : 'src/templates/**/*.hbs',
	INDEX                : 'src/index.html'
};

function handleError(error) {
	console.log('*****************');
	console.log(error);
	console.log('*****************');
	// this.emit('end');
}

gulp.task( 'imagemin', function(){
    gulp.src( 'public/dist/images/**/*' )
        .pipe( imagemin() )
        .pipe( gulp.dest( 'public/dist/images' ) );
});

gulp.task( 'import-styles', function(){
	gulp.src('src/scss/style.scss')
		.pipe(inject(gulp.src('src/scss/*/*.scss', {read:false}),{
			starttag: '/* inject:imports */',
			endtag: '/* endinject */',
			transform: function (filepath) {
				var modFilepath = filepath.replace( '/src/scss/', '' );
				return '@import "' + modFilepath + '";';
			}
		}))
		.pipe(gulp.dest('src/scss/'));
});

gulp.task( 'sass-compile-dev', function(){
	return gulp.src('src/scss/style.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({
			errLogToConsole: true
		}))
		.pipe(sourcemaps.write())
		.pipe(prefixer({
			browsers: ['last 4 versions', '> 5%']
		}))
		.pipe(gulp.dest(PATH.DEST + '/css/'));
});
gulp.task( 'sass-compile-deploy', function(){
	return gulp.src('src/scss/*.scss')
		.pipe(sass({
			errLogToConsole: true
		}))
		.pipe(prefixer({
			browsers: ['last 4 versions', '> 5%']
		}))
		.pipe(gulp.dest(PATH.DEST + '/css/'))
		.pipe(minifyCSS())
		.pipe(rename(function (path) {
			path.basename += '.min';
		}))
		.pipe(gulp.dest(PATH.DEST + '/css/'));
});

gulp.task('sass-dev', ['sass-compile-dev'], function(){
	// Inserts a stylesheet link in head for development
	return gulp.src('src/index.html')
		.pipe(replace(
			/<!-- inject:head:css -->/g,
			'<link href="dist/css/style.css" rel="stylesheet" />'
		))
		.pipe(gulp.dest(PATH.WEB_ROOT));
});

gulp.task('sass-deploy', ['sass-compile-deploy'], function ( type ) {
	// Inserts critical (all) sass as inline styles
	return gulp.src('./src/index.html')
		.pipe(inject(gulp.src([ PATH.DEST + '/css/style.min.css']), {
			starttag: '<!-- inject:head:css -->',
			transform: function (filePath, file) {
				return '<style>' + file.contents.toString('utf8') + '</style>';
			}
		}))
		.pipe(gulp.dest(PATH.WEB_ROOT));
});

gulp.task( 'lint', function(){
	return gulp.src( PATH.JS_ONLY )
		.pipe(jshint())
		.pipe(jshint.reporter())
		.pipe(jshint.reporter('fail'));
});

gulp.task('templates', function () {
	return gulp.src(PATH.TEMPLATES)
		.pipe(handlebars({
			handlebars: require('handlebars')
		}))
		.pipe(wrap('Handlebars.template(<%= contents %>)'))
		.pipe(declare({
			root: 'exports',
			noRedeclare: true,
			processName: function (filePath) {
				return declare.processNameByPath(filePath.replace('src/templates/', ''));
			}
		}))
		.pipe(concat('index.js'))
		.pipe(wrap(
			'/*global require,exports*/\n\n' +
			'"use strict";\nvar Handlebars = require("handlebars");\n\n<%= contents %>'
		))
		.pipe(gulp.dest('./src/templates'));
});

gulp.task('js', function () {
	return gulp.src(PATH.JS_MAIN_ENTRY)
		.pipe(gulp.dest(PATH.JS_DEST));
});

gulp.task('js-dev', ['templates'], function () {
	browserify({
		entries: [PATH.JS_MAIN_ENTRY],
		insertGlobals: true,
		debug: true,
		cache: {}, packageCache: {}, fullPaths: true
	})
		.bundle()
		.on('error', handleError)
		.pipe(source(PATH.JS_MAIN_OUTFILE))
		.pipe(gulp.dest(PATH.JS_DEST));
});

gulp.task('version', ['sass-deploy'], function () {
	// Depends on sass-deploy because that is what moves index.html from src to public
	gulp.src('./public/index.html')
		.pipe(replace(
			/<script src="\/dist\/js\/main(\.min)*\.js" async><\/script>/g,
			'<script src="/dist/js/main.min.js?ver=' + new Date().getTime() + '" async></script>'
		))
		.pipe(gulp.dest('./public'));
});

gulp.task('webserver', function () {
	gulp.src(PATH.WEB_ROOT)
		.pipe(webserver({
			host: '0.0.0.0',
			livereload: true,
			directoryListing: false,
			fallback: 'index.html'
		}));
});

gulp.task('watch', function () {
	gulp.watch(PATH.JS_ONLY, ['lint']);
	// gulp.watch(PATH.JS_HTML, ['js-dev']);
	gulp.watch(PATH.JS_HTML, ['js']);
	gulp.watch(PATH.SASS, function( e ){
		if( e.type === 'added' || e.type === 'deleted' ){
			gulp.start( 'import-styles' );
		}
		gulp.start( 'sass-compile-dev' );
	});
	gulp.watch(PATH.TEMPLATES, ['js-dev']);
	// Runs sass-dev when there is a change to index.html because that is what moves it from src to public
	gulp.watch(PATH.INDEX, ['sass-dev']);
});

gulp.task('configure-production', function () {
	return gulp.src('./src/js/config/config-production.js')
		.pipe(rename('config.js'))
		.pipe(gulp.dest('./src/js'));
});

gulp.task('configure-master', function () {
	return gulp.src('./src/js/config/config-master.js')
		.pipe(rename('config.js'))
		.pipe(gulp.dest('./src/js'));
});

gulp.task('configure-mobile', function () {
	return gulp.src('./src/js/config/config-mobile.js')
		.pipe(rename('config.js'))
		.pipe(gulp.dest('./src/js'));
});

// Build tasks -> imagemin, js (depends on templates), and version (depends on sass-deploy which depends on compile-sass-deploy)
gulp.task('build', ['imagemin', 'js', 'version']);

// Dev tasks -> imagemin, js-dev (depends on templates), sass-dev (depends on sass-compile-dev), webserver, and watch
gulp.task('dev', ['imagemin', 'js', 'sass-dev', 'webserver', 'watch']);

gulp.task('default', ['configure-master', 'dev']);

gulp.task('default-mobile', ['configure-mobile', 'dev']);
// Make sure to set your IP address on port 8888 as the apiUrl in bookscouter-www/src/js/config/config-mobile.js
// Also set your IP address on port 8000 as a value of $this->crossOriginDomainsAllowed in bookscouter-api/src/BookScouter/Controllers/V3.php (~line 26)
// Then start the vagrant server for the API
