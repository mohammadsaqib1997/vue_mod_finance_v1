const gulp = require('gulp');

gulp.task('css', function () {
    return gulp.src('node_modules/bootstrap-select/dist/css/bootstrap-select.min.css')
        .pipe(gulp.dest('public/assets/css'));
});

gulp.task('js', function () {
    return gulp.src('node_modules/bootstrap-select/dist/js/bootstrap-select.min.js')
        .pipe(gulp.dest('public/assets/js'));
});

gulp.task('default', ['css', 'js']);