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
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var commandLineArgs = require('command-line-args');
var commandLineUsage = require('command-line-usage');
var chalk = require('chalk');
var cors = require('cors');
var request = require('request');
var cllr = require('./lib/cllr');
var utl = require('./lib/utl');
var parsehtml = require('./lib/parsehtml');


//------------------------------------------------------------------------------
// Application variables
//------------------------------------------------------------------------------
var eventCnt = 0;
var auditCnt = 0;
var icount = 0;
var instructorURL = '';
var instructorLocal = 'http://localhost:4200';
var instructorCloud = 'http://dashboard.default';
var auditSender;
var app_namespace = '';
var role = 'S';                   // S = student, I = Instructor
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
    },
    {
        name: 'role',
        alias: 'r',
        type: String,
        defaultOption: 'S'
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

// -r role
if (typeof options.role !== 'undefined' && options.role !== null) {
    role = options.role;
    role = role.toUpperCase();
    if (role === 'S' || role === 'I') {
        utl.logMsg('cllrM654 - Role: ' + role + ' is being used', 'server');
    } else {
        utl.logMsg('cllrM099 - Invalid role defined.  Valid values are S or I', 'server');
        process.exit(-1);
    }
}


//------------------------------------------------------------------------------
// get environment variable
//------------------------------------------------------------------------------
var localVars = process.env;

// check if running as Instructor
// any value for this 
if (typeof localVars.INSTRUCTOR !== 'undefined') {
    // force role to instructor
    role = 'I'
    utl.logMsg('cllrM655 - Role forced to instructor.', 'server');
} 


// namespace - this should be a color, if missing set to balck
if (typeof localVars.APP_NAMESPACE !== 'undefined') {
    app_namespace = localVars.APP_NAMESPACE;
    cllr.app_namespace = localVars.APP_NAMESPACE;
    instructorURL = instructorCloud;
} else {
    instructorURL = instructorLocal;
    if (role === 'I') {
        app_namespace = 'Central'
        cllr.app_namespace = 'Central';
    } else {
        app_namespace = 'black';
        cllr.app_namespace = 'black';
    }
}
utl.logMsg('cllrM654 - Environment APP_NAMESPACE: ' + app_namespace);


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

app.post('/audit',function(req,res){
    res.end("OK");
    var ns = req.body.audit.ns;
    var evt = req.body.audit.events;
    utl.logMsg('cllrM731 - Received audit data for: ' + ns);
    cllr.auditlog[ns] = evt;
});

app.get('/auditlog',function(req,res){
    res.end(JSON.stringify(cllr.auditlog,null,2));
});

app.get('/dumpcore',function(req,res){
    res.end(JSON.stringify(cllr,null,2));
    utl.logMsg('cllrM999 - Dump core request received');
    //console.log(JSON.stringify(cllr,null,2));
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

app.get('/status/:ns/:app', function(req, res) {
    var name = req.params.app;
    var ns = req.params.ns;
    // save the information
    addDataNew(ns, name);
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
        let result = blbData();
        if (typeof result.items !== 'undefined') {
            if (typeof result.items[0] !== 'undefined') {
                client.emit('data', result)
            }
        }
    }, 5000);

    client.on('getVersion', function(data) {
        utl.logMsg('cllrM091 - Get software version request ', 'server');
        var result = {'version': softwareVersion, 'role': role, 'ns': app_namespace};
        client.emit('version', result);
    });

    client.on('clearStats', function() {
        utl.logMsg('cllrM093 - Request to clear stats received, all stats removed.', 'server');
        cllr.stats = {};
        cllr.namespace = {};
        cllr.namespacekey = '';

        iCnt = 0;
        oCnt = 0;
    });

    client.on('getTopics', function(data) {
        utl.logMsg('cllrM047 - List request', 'server');
        // return the comma seperated string of all questions, labs, hints, and answers
        var result = {'labels': cllr.labels}
        client.emit('getTopicsResults', result);
    });

    client.on('feedback', function(data) {
        utl.logMsg('cllrM047 - Feedback received', 'server');
        addEvent(data.namespace, 'Feedback-' + data.comments)

        var result = {'status': 'Feedback was successfully received, thank you.'}
        client.emit('feedbackResults', result);
    });

    client.on('markComplete', function(data) {
        utl.logMsg('cllrM047 - Mark complete received', 'server');
        // save the information
        addDataNew(data.namespace, data.item);
        client.emit('markCompletekResults', 'OK');

        // tell the instructor about this
        if (role === 'S') {
            tellInstructor(data.namespace, data.item);
        }
    });

    client.on('getInformation', function(data) {
        utl.logMsg('cllrM047 - Get info request', 'server');
		var answer = cllr.answers[data.answerLabel];
        if (typeof answer !== 'undefined' && answer.length > 0) {
            // add to events
            addEvent(data.namespace, 'GetAnswer-' + data.answerLabel)
        }
        var hint = cllr.hints[data.hintLabel];
        if (typeof hint !== 'undefined' && hint.length > 0) {
            // add to events
            addEvent(data.namespace, 'GetHint-' + data.hintLabel)
        }
        var question = cllr.questions[data.questionLabel];
        if (typeof question !== 'undefined' && question.length > 0) {
            // add to events
            addEvent(data.namespace, 'GetQuestion' + data.questionLabel)
        }
        var lab = cllr.labs[data.labLabel];
        if (typeof lab !== 'undefined' && lab.length > 0) {
            // add to events
            addEvent(data.namespace, 'GetLab-' + data.labLabel)
        }
        var result = {
            "answer": answer,
            "hint": hint,
            "lab": lab,
            "question": question
        }
        client.emit('getInfoResults', result);
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

function tellInstructor(ns, app) {
    sendToInstructor(ns, app, function(resp){
        if (resp.startsWith('Got') ) {
        	icount++;
	        utl.logMsg('cllrM044 - Tell Instructor count: ' + icount );
        }
    });
}


// tell the collector server we are here
function sendToInstructor(ns, app, callback) {
    var uri = instructorURL + '/status/' + ns + '/' + app;
    var options = {
        uri : uri,
        method : 'GET'
    }; 
    var res = '';
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res = body;
            utl.logMsg('cllrM043 - Student told Instructor about task: ' + ns + '/' + app);
        }
        else {
            utl.logMsg('cllrM744 - Failed sending data to student: ' + uri + ' Message: ' + error);
        }
        callback(res);
    });
}

// send audit log to Instructor
function sendAuditLog() {
    if (auditCnt === eventCnt) {
        cllr.skipAudit++;
        return;   // no changes since last time audit log was sent
    } else {
        auditCnt = eventCnt;
    }
    var uri = instructorURL + '/audit';
    var data = {'ns': app_namespace, 'events': cllr.namespace[app_namespace].events};
    var options = {
        uri : uri,
        method : 'POST',
        body: {'audit': data},
        json: true
    }; 

    var res = '';
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res = body;
            utl.logMsg('cllrM043 - Audit info sent to Instructor');
        }
        else {
            utl.logMsg('cllrM044 - Failed sending audit log, Message: ' + error);
        }
    });
}

function addDataNew(ns, pod) {
    try {
        // is this a new namespace
        if (typeof cllr.namespace[ns] === 'undefined'){
            // create new namespace 
            cllr.namespace[ns] = {'ns': ns, 'count': 0, events: {}};
            // save key
            cllr.namespacekey = cllr.namespacekey + '.' + ns;
            utl.logMsg('cllrM709 - Added new namespace: ' + ns)
        }

        // is this a new ns:pod value
        var lkey = ns + ':' + pod;
        if (typeof cllr.stats[lkey] === 'undefined') {

            // save fact that event occured, this prevents duplicate requests
            cllr.stats[lkey] = new Date().toLocaleString();
 
            var item = cllr.namespace[ns];
            item.count = item.count + 1;
            utl.logMsg('cllrM701 - Incremented: ' + lkey);

            // add to events
            addEvent(ns, lkey)
        }
    } catch (err) {
        utl.logMsg('cllrM701 - Error adding ns: ' + ns + ' pod: ' + pod + ' error message: ' + err);
    }
}

function addEvent(ns, event) {
    if (typeof cllr.namespace[ns] === 'undefined'){
        // create new namespace 
        cllr.namespace[ns] = {'count': 0, events: {}};
        // save key
        cllr.namespacekey = cllr.namespacekey + '.' + ns;
        utl.logMsg('cllrM709 - Added new namespace: ' + ns)
    }

    var item = cllr.namespace[ns];
    eventCnt++;
    item.events[eventCnt] = {'time': new Date().toLocaleString(), 'milli': Date.now(), 'what': event};
    cllr.namespace[ns] = item;
    utl.logMsg('cllrM833 - Added event to audit log: ' + event);
}

function blbData() {
    var data = {"items": []};
    var keys = cllr.namespacekey.split('.');
    var hl = keys.length;
    var max = 0;
    for (var k = 0; k < hl; k++) {
        var ns = keys[k];
        if (ns !== '') {
            // TODO Add logic to build array of completed work that matches the 'what'
            // of the events to the labs 
            var team = cllr.namespace[ns];
            var cnt = team.count;
            var row = {"team": ns, "cnt": cnt};
            data.items.push(row);
            if (cnt > max) {
                max = cnt;
            }
        }
    }
    data.max = max;
    return data;
}


//------------------------------------------------------------------------------
// parse the HTML based content to build topics Questions, Answers, Labs and Hints
//------------------------------------------------------------------------------
parsehtml.parseFiles();

//------------------------------------------------------------------------------
// add starting entry to cllr.namespace
//------------------------------------------------------------------------------
addEvent(app_namespace, 'Started Collector')

//------------------------------------------------------------------------------
// begin processing for web and REST endpoints
//------------------------------------------------------------------------------
startAll();

//------------------------------------------------------------------------------
// Print and save environment variables
//------------------------------------------------------------------------------
utl.logMsg('cllrM344 - Environment variables');
console.log(JSON.stringify(process.env, null, 4))
cllr.environment = process.env;

//------------------------------------------------------------------------------
// Check if audit logs should be sent to instructor
//------------------------------------------------------------------------------
if (role === 'S') {
    auditSender = setInterval(sendAuditLog, 60000);
    utl.logMsg('cllrM564 - Send audit log to instructor has been enabled');
}

//------------------------------------------------------------------------------