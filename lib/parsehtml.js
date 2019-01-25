/*
Copyright 2018 Dave Weilert

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

/*----------------------------------------------------------
Routine to parse the solution.hmtl files and place data in memory
*/

const cllr = require('../lib/cllr');
const utl = require('../lib/utl');
const lblreader = require('line-by-line');
const fs = require('fs');
let filec = 0;

let s01 = '<div><pre><code ';
let e01 = '</code></pre></div>';
let s02 = '<table>';
let s03 = '</table>';
let s04 = '<thead>';
let s05 = '<tr>';
let s06 = '<pre><code>';
let e06 = '</code></pre>';
let s07 = '<p>Confirm ';

let r01 = '<br><table class="table-bordered">'
let r02 = '<thead style="background-color: #eee">';
let r03 = '<tr style="background-color: #f8f8f8;">'; 

let rkey = 1000;
//------------------------------------------------------------------------------
// check for files solution01.html - solution10.html, if found rip
//------------------------------------------------------------------------------
let findFiles = function() {
    let cwd = process.cwd();
    let filename = '';
    let fc = 0;
    try {
        for (fc = 1; fc < 11; fc++) {
            if (fc < 10) {
                filename = cwd + '/' + 'solution0' + fc + '.html';
            } else {
                filename = cwd + '/' + 'solution' + fc + '.html'
            }
            if (fs.existsSync(filename)) {
                ripFiles(filename)
            }
        }     
    } catch (e) {
        logMsg('cllrP747 - Error message: ' + e);
    }

};
    
//------------------------------------------------------------------------------
// Get the label from the Question, Hint, or Answer line
//------------------------------------------------------------------------------
let getLabel = function(line) {
    let rtn = '';
    let fp = line.indexOf('>');
    let lp = line.length - 5;
    let x = line.substring(fp + 1, lp);
    return x;
};

    
//------------------------------------------------------------------------------
// Save the ripped lines for the label
//------------------------------------------------------------------------------
let saveData = function(type, label, content, cnt, filec) {
    try {
        if (type === 'A'){
            cllr.answers[label] = content;
        } else if (type === 'H'){
            cllr.hints[label] = content;
        } else if (type === 'Q'){
            cllr.questions[label] = content;
        } else if (type === 'L'){
            cllr.labs[label] = content;
        }

        // save labels to be returned when browser asks for lists
        if (cllr.labels === '') {
            cllr.labels = label;
        } else {
            cllr.labels = cllr.labels + ',' + label;
        }

        //utl.logMsg('cllrM709 - Content added Last line: ' + cnt + ' for label: ' + label);

    } catch (err) {
        utl.logMsg('cllrM701 - Error adding content, message: ' + err);
    }


};

//------------------------------------------------------------------------------
// file located rip the content 
//------------------------------------------------------------------------------
let ripFiles = function(filename) {
    filec++;
    utl.logMsg('cllrP010 - Extracting HINTS and ANSWERS from file: ' + filename);

    let lr = new lblreader(filename);
    let body = false;
    let type = ''
    let label = '';
    let newType = '';
    let newLabel = '';
    let keep = false;
    let content = '';
    let count = 0;
    let addBR = false;

    try {
        // catch and handle error for line-by-line processing
        lr.on('error', function (err) {
            logMsg('cllrP401 - Error message: ' + err);
            terminate();
        });

        // process record from input file
        lr.on('line', function (line) {
            count++;

            if (line.startsWith('<body>')) {
                body = true;
            };

            if (body) {
                if (line.startsWith('<h4 ') ) {
                    if (line.indexOf('>Question ') > -1 ) {
                        newLabel = getLabel(line);
                        newType = 'Q';
                        keep = true;
                    } else if (line.indexOf('>Hint ') > -1 ) {
                        newLabel = getLabel(line);
                        newType = 'H';
                        keep = true;
                    } else if (line.indexOf('>Answer ') > -1 ) {
                        newLabel = getLabel(line);
                        newType = 'A';
                        keep = true;
                    }  else if (line.indexOf('>Lab ') > -1 ) {
                        newLabel = getLabel(line);
                        newType = 'L';
                        keep = true;
                    }
                }

                // last record so save data;
                if (line.startsWith('</body>')) {
                    saveData(type, label, content, count, filec);
                    keep = false;
                }
            }
            

            if (keep) {
                // is this the first time something was found?
                if (type === '') {
                    type = newType;
                    label = newLabel;
                    content = '';
                }
                // is this a new label
                if (newLabel !== label) {
                    saveData(type, label, content, count, filec);
                    label = newLabel;
                    type = newType;
                    content = line;
                } else {
                    var nline = '';
                    // is this a line that needs <br> added    
                    if (line.startsWith(s01) || line.startsWith(s06)) {
                       addBR = true;
                    }
                    if (addBR) {
                        if (line.endsWith(e01) || line.endsWith(e06)) {
                            nline = '<br>' + line + '<br>';
                        } else {
                            nline = '<br>' + line;
                        }
                    }

                    // check for href, if found add target to force opening in new tab
                    var hrc = line.indexOf('<a href=');
                    if (hrc > -1) {
                        var p1 = line.indexOf('>', hrc);
                        var tmp = line.substring(0,p1) + ' target="_blank" ' + line.substring(p1);
                        line = tmp;
                    }
                    
                    // check for table related lines
                    if (line.startsWith(s02)) {
                        // add border to table
                        nline = r01;
                    }

                    if (line.startsWith(s03)) {
                        // add border to table
                        nline = line + '<br>';
                    }

                    if (line.startsWith(s04)) {
                        // add shading to table header
                        nline = r02;
                    }

                    if (line.startsWith(s05)) {
                        // add shading to table header
                        nline = r03;
                    }



//------- Ensue this check if after other processing
                    
                    if (nline !== '') {
                        content = content + nline;
                    } else {
                        content = content + line;
                    }

                    if (line.startsWith(s07)) {
                        var key = '';
                        if (line.length > 15 ) {
                            key = line.substring(11, line.length - 4);
                        } else {
                            rkey++;
                            key = rkey;
                        }
                        var cmi = '<div>' 
                        + '<button class="btn btn-success" onclick="markComplete(\'' 
                        + key 
                        + '\')">Press to mark completed</button></div>';
                        content = content + cmi;
                    }


                    // check to turn off adding <br>
                    if (line.endsWith(e01)) {
                        addBR = false;
                    }
                }
            }

        });

        // check if end of file because special processing is needed
        lr.on('end', function () {
            //console.log(cllr.labels);
            //console.log(JSON.stringify(cllr.hints,null,2));
            utl.logMsg('cllrP402 - Processed file: ' + filename);
        });

    } catch (e) {
        utl.logMsg('cllrP777 - Error: attempting to read file: config.txt, message: ' + e);
        terminate();
    }

};







//------------------------------------------------------------------------------
// common routines
//------------------------------------------------------------------------------
module.exports = {

    //------------------------------------------------------------------------------
    // check if namespace is in array 
    //------------------------------------------------------------------------------
    parseFiles: function(msg) {
        findFiles();
    }
    
//end of exports 
};