const express = require('express');
const serveStatic = require('serve-static');
const expressStaticGzip = require('express-static-gzip');

const PORT = process.env.PORT || 4000;

const app = express();
const staticDir = './dist';

app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

app.use(expressStaticGzip(staticDir, { enableBrotli: true, maxAge: '1y', index: false }));

app.use(serveStatic(staticDir));

app.listen(PORT);
