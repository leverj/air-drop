let ghpages = require('gh-pages');

ghpages.publish('www', function (err) {
  if (err) console.log('eeror in deployment', err)
  else console.log('deployed....')
});