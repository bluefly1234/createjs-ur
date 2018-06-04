module.exports = {
  src: 'src',
  dest: 'dist',
  html: {
    src: 'src/*.html',
    dest: 'dist'
  },
  css: {
    src: 'src/css/**/*.css',
    dest: 'dist/css'
  },
  sass: {
    src: ['src/sass/**/*.scss', '!src/sass/**/common.scss', '!src/sass/utils/**/*.scss'],
    dest: 'dist/css'
  },
  image: {
    src: 'src/images/**/*',
    dest: 'dist/images'
  },
  js: {
    src: 'src/js/**/*.js',
    dest: 'dist/js'
  },
  lib: {
    src: 'src/lib/**/*',
    dest: 'dist/lib'
  },
  json: {
    src: 'src/json/**/*',
    dest: 'dist/json'
  }
}
