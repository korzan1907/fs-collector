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

/*

*/

// Global vars 
var version = 'Get from server';
var socket = io.connect();
var rdata = '';
var states = ['AK-Alaska','AS-American Samoa','AZ-Arizona','AR-Arkansas','CA-California','CO-Colorado','CT-Connecticut','DE-Delaware','DC-Dist. of Columbia','FL-Florida','GA-Georgia','GU-Guam','HI-Hawaii','ID-Idaho','IL-Illinois','IN-Indiana','IA-Iowa','KS-Kansas','KY-Kentucky','LA-Louisiana','ME-Maine','MD-Maryland','MH-Marshall Islands','MA-Massachusetts','MI-Michigan','FM-Micronesia','MN-Minnesota','MS-Mississippi','MO-Missouri','MT-Montana','NE-Nebraska','NV-Nevada','NH-New Hampshire','NJ-New Jersey','NM-New Mexico','NY-New York','NC-North Carolina','ND-North Dakota','MP-Northern Marianas','OH-Ohio','OK-Oklahoma','OR-Oregon','PW-Palau','PA-Pennsylvania','PR-Puerto Rico','RI-Rhode Island','SC-South Carolina','SD-South Dakota','TN-Tennessee','TX-Texas','UT-Utah','VT-Vermont','VA-Virginia','VI-Virgin Islands','WA-Washington','WV-West Virginia','WI-Wisconsin','WY-Wyoming']

//----------------------------------------------------------
// document ready
//----------------------------------------------------------
$(document).ready(function() {
	getSelectLists();
    getVersion();
    showSplash();
});

//----------------------------------------------------------
// socket io definitions for incoming 
//----------------------------------------------------------

socket.on('connect', function(data) {
    socket.emit('join', 'Session connected');
});

socket.on('searchResult', function(data) {
    buildSearchResults(data);
});

socket.on('version', function(data) {
    version = data.version;
});

socket.on('listResult', function(data) {
    populateSelectLists(data);
});


socket.on('feedbackResult', function(data) {
    $("#feedbackStatus").empty();
    $("#feedbackStatus").html('');
    var resp = '';
    if (data.status === 'OK') {
        resp = '<br><div><img style="float: left;" src="images/checkMarkGreen.png" height="40" width="40">' +
            '&nbsp;&nbsp;&nbsp;&nbsp;Feedback successfully submitted</div>';
    	$("#feedbackStatus").html(resp); 
    } else {
        resp = '<br><div><img style="float: left;" src="images/checkMarkRed.png" height="40" width="40">' +
            '&nbsp;&nbsp;&nbsp;&nbsp;Failed to submit feedback</div>';
        $("#feedbackStatus").html(resp);
    	
    }   
});


//----------------------------------------------------------
// socket io definitions for out-bound
//----------------------------------------------------------
// send request to server to get drop down list data
function getSelectLists() {
    socket.emit('getlists');
}

// send request to server to get software version
function getVersion() {
    socket.emit('getVersion');
}

// build search data and send to server 
function search() {
    closeNav();
    var selected = 0;
	var data = {};
	var tmp;
	// set state 
	tmp = $("#drstate").val();
	if (tmp !== null && tmp.trim().length > 0) {
		data.state = tmp.toUpperCase();
		selected++;
	}

	// set city
	tmp = $("#drcity").val();
	if (tmp !== null && tmp.trim().length > 0) {
		data.city = tmp.toUpperCase();
		selected++;		
	}
	// set first name
	tmp = $("#drfirst").val();
	if (tmp !== null && tmp.trim().length > 0) {
		data.first = tmp.toUpperCase();
		selected++;
	}
	// set last name
	tmp = $("#drlast").val();
	if (tmp !== null && tmp.trim().length > 0) {
		data.last = tmp.toUpperCase();
		selected++;
	}
	// set speciality
	tmp = $("#drspeciality").val();
	if (tmp !== null && tmp.trim().length > 0) {
		data.spec = tmp.toUpperCase();
		selected++;
	}
	// set zip
	tmp = $("#drzip").val();
	if (tmp !== null && tmp.trim().length > 0) {
		data.zip = tmp;
		selected++;
	}

	// determine if any fields selected
	if (selected === 0) {
		$("#noSearchModal").modal();
	} else{
		$("#searchStatus").empty();
    	$("#searchStatus").html('');
        var resp = '<br><div><img style="float: left;" src="images/loading.gif" height="40" width="40">' +
            '<span style="color: green; font-size: 150%;">&nbsp;&nbsp;&nbsp;&nbsp;Processing . . .</span></div>';
        $("#searchStatus").html(resp);
		socket.emit('search', data);
	}
}

// validate and submit feedback
function feedbackSubmit() {
	var data = {};
	var tmp;
	var msg = '';
	var fp;
	tmp = $("#fbuser").val();
	if (tmp === null || tmp.length < 1) {
		msg = msg + '<p>Please enter user name, none provided.<p>';
	}
	tmp = $("#fbcomment").val();
	if (tmp === null || tmp.length < 1) {
		msg = msg + '<p>Please enter feedback, none provided.<p>';
	}
	tmp = $("#fbAPIurl").val();
	if (tmp === null || tmp.length < 1) {
		msg = msg + '<p>Please enter API Url, none provided.<p>';
	} else {
		tmp = tmp.toUpperCase();
		if (!tmp.startsWith('HTTP://')) {
			msg = msg + '<p>API Url must start with http://, please correct<p>';
		} else {
			fp = tmp.indexOf(':', 7)
			if (fp === -1 ) {
				msg = msg + '<p>API Url must end with a port number, please correct<p>';
			} else {
				tmp = tmp.substring(fp);
				if (tmp.length < 5) {
					msg = msg + '<p>API Url port number invalid, must be a minimum of four digits please correct<p>';
				}
			}	
		}
	}

	// if no errors submit, else inform the user
	if (msg === '') {
		data.user = $("#fbuser").val();
		data.comment = $("#fbcomment").val();
		data.api = $("#fbAPIurl").val();
		// clear the status area
		$("#feedbackStatus").empty();
    	$("#feedbackStatus").html('');
        var resp = '<br><div><img style="float: left;" src="images/loading.gif" height="40" width="40">' +
            '<span style="color: green; font-size: 150%;">&nbsp;&nbsp;&nbsp;&nbsp;Processing . . .</span></div>';
        $("#feedbackStatus").html(resp);

		// submit feedback
    	socket.emit('feedback', data);
    } else {
        var resp = '<br><div><img style="float: left;" src="images/checkMarkRed.png" height="40" width="40">' +
            '&nbsp;&nbsp;&nbsp;&nbsp;Input errors: <br><br> ' + msg + '</div>';
        $("#feedbackStatus").html(resp);
    }
}


//----------------------------------------------------------
// screen handlers
//----------------------------------------------------------

// show the ssplash screen
function showSplash() {
    closeNav();
    $("#splash").show();
    $("#searchParms").hide();
    $("#searchR").hide();
    $("#searchDetail").hide();
}

// get new search params
function begin() {
    closeNav();
    newsearch();
}

// get new search params
function newsearch() {
    closeNav();
    $("#splash").hide();
    $("#searchParms").show();
    $("#searchR").hide();
    $("#searchDetail").hide();
}

// get new search params
function returnsearch() {
    closeNav();
    $("#splash").hide();
    $("#searchParms").hide();
    $("#searchR").show();
    $("#searchDetail").hide();
}

// show item detail
function showDetail() {
    closeNav();
    $("#splash").hide();
    $("#searchParms").hide();
    $("#searchR").hide();
    $("#searchDetail").show();			
}

// show the search result list
function showSearchResults() {
    closeNav();
    $("#splash").hide();
    $("#searchParms").hide();
    $("#searchR").show();
    $("#searchDetail").hide();
}

// show the about modal 
function about() {
    closeNav();
    $("#version").empty();
    $("#version").html('');
    $("#version").html('VERSION <span style="color: blue;">' + version + '</span>');
    $("#aboutModal").modal();
}

// show detail data
function getDoctor(npi) {
    closeNav();
	var hl = rdata.length;
	for (var d = 0; d < hl; d++) {
		if (rdata[d].npi === npi) {
			$("#shnpi").val(rdata[d].npi);
			$("#shfirst").val(rdata[d].first);
			$("#shmiddle").val(rdata[d].middle);
			$("#shlast").val(rdata[d].last);
			$("#shcity").val(rdata[d].city);
			$("#shstate").val(rdata[d].state);
			$("#shzip").val(rdata[d].zip);
			$("#shspec").val(rdata[d].spec);
			$("#shphone").val(phone(rdata[d].phone));
			// show the screen section with the detail data
    		showDetail();
		}
	}
}

// format the phone number
function phone(data) {
	var result = '';
	if (data.length === 10) {
		result = '(' + data.substring(0,3) + ') ' + data.substring(3,6) + '-' + data.substring(6);
		return result;
	} else {
		return data
	}
}

// open feedback modal
function feedbackOpen() {
    closeNav();
	$("#fbuser").val('');
	$("#fcomment").val('');
    $("#feedbackStatus").empty();
    $("#feedbackStatus").html('');	
    $("#feedbackModal").modal();
}

// enable feedback icon in header
function feedbackShow() {
	$("#feedbackIcon").show();
	closeNav();
}

// disable feedback icon in header
function feedbackHide() {
	$("#feedbackIcon").hide();
	closeNav();
}


//----------------------------------------------------------
// slide out navigation functions
//----------------------------------------------------------
function openNav() {
    document.getElementById("sideNavigation").style.width = "250px";
}

function closeNav() {
    document.getElementById("sideNavigation").style.width = "0";
}


//----------------------------------------------------------
// common functions
//----------------------------------------------------------

//----------------------------------------------------------
// populate drop down selection for specialities
//----------------------------------------------------------
function populateSelectLists(data) {

	var options;
	var sdata;
	var gdata = [];

	// set speciality drop down
	if (typeof data.specs === 'undefined') {
		options = '<option>No specialities located</option>'
	} else {
		sdata = data.specs.split('..');
    	sdata.sort();
    	for (var i = 0; i <sdata.length; i++) {
        	if (i === 0 ) {
            	options = '<option></option>'
	        	if (sdata[i].length > 1) {
        			options += '<option value="' + sdata[i] + '">' + sdata[i] + '</option>';
        		}        		
        	} else {
	        	if (sdata[i].length > 1) {
        			options += '<option value="' + sdata[i] + '">' + sdata[i] + '</option>';
        		}
        	}
    	}
	}

    if (typeof data.specs !== 'undefined') {
	    $("#drspecaility").empty();
    	$("#drspecaility").html('');
        $("#drspeciality").html(options);
    }
    
    // set state drop down
    options = '';
	if (typeof data.states === 'undefined') {
		options = '<option>No states located</option>'
	} else {
    	for (var s = 0; s <states.length; s++) {
        	if (s === 0 ) {
            	options = '<option></option>'
        	}
        	sdata = states[s];
        	if (data.states.indexOf(states[s].substring(0,2)) > -1) {
        		options += '<option value="' + states[s].substring(0,2) + '">' + states[s].substring(3) + '</option>';
        	}
    	}
	}

    if (typeof data.states !== 'undefined') {
	    $("#drstate").empty();
    	$("#drstate").html('');
        $("#drstate").html(options);
    }
}


//----------------------------------------------------------
// build the search results table
//----------------------------------------------------------
function buildSearchResults(data) {

	// Clear processing spinner
	$("#searchStatus").empty();
    $("#searchStatus").html('');

	// save results to be used to find detail information
	rdata = data;
	
    var part2 = '';
    var newPart;
    var tmp;
    var a, b, c, d, e;
    if (data.length > 0) {
    	for (item in data) {
        	tmp = data[item]
        	a = tmp.first;
        	b = tmp.last;
        	c = tmp.city;
        	d = tmp.state;
        	e = tmp.npi;

        	newPart = '<tr>' +
            '<td>' + a + '</td><td>' + b + '</td><td>' + c + '</td><td>' + d + '</td>' +
            '<td><button id="viewSvg" class="btn btn-outline-primary btn-sm" onclick="getDoctor(\'' + e + '\')">Detail</button></td></tr>'
        	part2 = part2 + newPart;
    	};
    } else {
        newPart = '<tr><td><span style="color: red;">Zero records returned<span></td><td></td><td></td><td></td><td></td></tr>'
        part2 = part2 + newPart;
    }

    $("#searchData").empty();
    $("#searchData").html('');
    $("#searchData").html(part2);
    
    // show the search results list
    showSearchResults();
}

//----------------------------------------------------------
console.log('loaded drsmain.js');
//----------------------------------------------------------


