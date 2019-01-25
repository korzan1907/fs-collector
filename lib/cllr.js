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

var sepLine =  '--------------------------------------------';

var cllr = module.exports = {

    startTime: 0,
    startMilli: 0,
    //app_name: 'Unknown',
    app_namespace: 'Unknown',
    app_user: 'Unknown',
    reported: '',
    data: '{"items": []}',
    reported: {},
    counted: {},
    countkey: '',

    stats: {},                 //
    namespace: {},             // contains the audit entries for each namespace
    namespacekey: '',          // string with comma seperated namespaces
    environment: {},           // program environment variables
    skipAudit: 0,
    auditlog: {},              // instructor audit log info received, not used when student
    sep01: sepLine,
    hints: {},
    getHint: {},
    answers: {},
    getAnswer: {},
    questions: {},
    labs: {},
    labels: '',
 
    //last var holder
    do_not_delete: 'do not delete'
};