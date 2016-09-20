'use strict';

var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    port = process.env.PORT || 4000,
    dir = process.env.DIR || 'app';

app.use(express.static(__dirname + `/${dir}`));

http.listen(port, function() {
    console.log(`Serving ${dir} on localhost:${port}`);
});
