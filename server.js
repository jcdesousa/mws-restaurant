const express = require('express');
const serveStatic = require('serve-static');
const expressStaticGzip = require('express-static-gzip');
const sslRedirect = require('heroku-ssl-redirect');

const PORT = process.env.PORT || 4000;

const app = express();
app.use(sslRedirect());

const staticDir = './dist';

app.use(expressStaticGzip(staticDir, { enableBrotli: true, maxAge: '1y', index: false }));


app.use(serveStatic(staticDir));
app.listen(PORT);
