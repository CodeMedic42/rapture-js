const gulp = require('gulp');
const mocha = require('gulp-mocha');

function defaultTask(done) {
  // place code for your default task here
  done();
}

function testTask(done) {
  return gulp.src(['test/*.test.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec'
    }));
}

gulp.task('default', defaultTask);
gulp.task('test', testTask);
