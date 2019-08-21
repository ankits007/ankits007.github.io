var compression = require('compression')
var express = require('express');
var app = express();
app.use(compression())
app.use(function(req, res, next) {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    return next();
});
app.use('/', express.static(__dirname));

app.listen(process.env.PORT || 5000);
console.log('App running on ' + process.env.PORT);
