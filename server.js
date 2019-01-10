/*
Copyright 2019 Dave Weilert

Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
and associated documentation files (the "Software"), to deal in the Software without restriction, 
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial 
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT 
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

//------------------------------------------------------------------------------
// Software version
//------------------------------------------------------------------------------
var softwareVersion = '1.0.0';
var appname = 'Collector';

//------------------------------------------------------------------------------
// Require statements
//------------------------------------------------------------------------------
var fs = require('fs-extra');
var express = require('express');
var Q = require('q');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var commandLineArgs = require('command-line-args');
var commandLineUsage = require('command-line-usage');
var chalk = require('chalk');
var multer = require('multer');
var path = require('path');
var cors = require('cors');
var request = require('request');

var cllr = require('./lib/cllr');
var utl = require('./lib/utl');

//------------------------------------------------------------------------------
// Application variables
//------------------------------------------------------------------------------
var colors = '';

var resetReq = false;
var statMessages;
var dashline = '---------------------------------';
var validDir = true;
var port = 3000;
var options;
var optionDefinitions = [{
        name: 'port',
        alias: 'p',
        type: Number,
        defaultOption: 3000
    },
    {
        name: 'help',
        alias: 'h'
    }
];

var bb = chalk.green;
var CLLR_TITLE = chalk.bold.underline('Collector server' );
var CLLR_VERSION = chalk.bold.underline('Version: ' + softwareVersion );

// Do not change the spacing of the following VPK_HEADER, and 
// do not delete the single tick mark
var CLLR_HEADER = `
${bb('-----------------------------------------------------------------')}
 ${bb(CLLR_TITLE)}
 ${bb(CLLR_VERSION)}                  
${bb('-----------------------------------------------------------------')}              
  `
//Do not delete the single tick mark above

// Global vars
cllr.startTime = new Date();;
cllr.startMilli = cllr.startTime.getTime();

//------------------------------------------------------------------------------
// process start parameters if provided
//------------------------------------------------------------------------------
options = commandLineArgs(optionDefinitions)

// -help used
if (typeof options.help !== 'undefined') {
    help();
    process.exit(0);
}

// -p used
if (typeof options.port !== 'undefined' && options.port !== null) {
    port = options.port;
    if (port < 1 || port > 65535) {
        utl.logMsg('cllrM099 - Invalid port number defined.  Valid range is 1 - 65535.', 'server');
        process.exit(-1);
    }
}


//------------------------------------------------------------------------------
// Define express routes / urls
//------------------------------------------------------------------------------
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

// Express app definitions
app.use(cors());

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
});


app.get('/ping', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('Server is OK\n');
});

app.get('/quit', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('Server stopped\n');
    stopAll();
});

app.get('/status', function(req, res) {
    if (typeof req.query.app !== 'undefined') {
        cllr.app_name = req.query.app;
    }
    if (typeof req.query.ns !== 'undefined') {
        cllr.app_namespace = req.query.namespace;
    }
    if (typeof req.query.user !== 'undefined') {
        cllr.app_user = req.query.user;
    }

    console.log('App: ' + cllr.app_name + ' NS: ' + cllr.app_namespace + ' User: ' + cllr.app_user);

    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('GotIt\n');


});
  

//------------------------------------------------------------------------------
// Define SocketIO events and handlers
//------------------------------------------------------------------------------
io.on('connection', (client) => {

    setInterval(function() {
        let result = cllr.data;
        //console.log('send data');
        client.emit('data', result)
    }, 5000);

    client.on('getVersion', function(data) {
        utl.logMsg('cllrM091 - Get software version request ', 'server');
        var result = {'version': softwareVersion};
        client.emit('version', result);
    });

    client.on('getlists', function(data) {
        utl.logMsg('cllrM047 - List request', 'server');
        // return the list of states and specialities that were found in the loaded data
		var result = {'states': cllr.states, 'specs': cllr.specs}
        client.emit('listResult', result);
    });

});




  
//------------------------------------------------------------------------------
// start all 
//------------------------------------------------------------------------------
function startAll() {
    statMessages = [];
    splash();
    utl.logMsg('cllrM014 - Collector Server started, port: ' + port, 'server');
    server.listen(port);
}

//------------------------------------------------------------------------------
// stopt all 
//------------------------------------------------------------------------------
function stopAll() {
    statMessages = [];
    utl.logMsg('cllrM019 - Collector Server stopping');
    process.exit(0)
}

//------------------------------------------------------------------------------
// Command line startup and help
//------------------------------------------------------------------------------
function help() {
    var usage = commandLineUsage([{
            content: CLLR_HEADER,
            raw: true,
        },
        {
            header: 'Options',
            optionList: optionDefinitions
        }
    ]);
    console.log(usage);
}

function splash() {
    var adv = commandLineUsage([{
        content: CLLR_HEADER,
        raw: true,
    }]);
    console.log(adv);
}


//------------------------------------------------------------------------------
//begin processing
//------------------------------------------------------------------------------
startAll();
//------------------------------------------------------------------------------

