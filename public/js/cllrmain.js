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

// Global vars 
var version = 'Get from server';         // store software version
var socket = io.connect();               // sockert io related
var defHdr = 10;                         // default number of labs numbers in header
var clock = null;                        // interval timer for clock
var started = false;
var updateScreen = true;                 // control if stats table will get updated
var checkMark = '&#x2705';               // emoji to display as the checkmark
var tbdx = '\u274C';                    // emoji to display red 
var tbdy = '\u2753';                    // emoji to display red question mark
var tbdz = '\u2714';                    // emoji to display grey check mark
var tbda = '\u23FA';                    // emoji to display record button
var tbd = '\u2B55';                    // emoji to display red circle
var tbdc = '\u274e';                    // emoji to display green box with X
var tbdd = '\u1F53a';                    // emoji to display red question mark
var useda = '\u2611';                    // emoji to display if nothing is completed
var timeColor = 'lime'                   // color of numbers in timer display
var blackText = '.beige.wheat.pink.khaki.yellow.tan.yellowgreen.white.snow.lime.lightblue.aqua.gold.plum.' 
+ '.lavender.aliceblue.azure.cornsilk.mintcream.mistyrose.palegreen.central...'
var role = '';
var app_namespace = 'Unknown';
var topicFilter = 'B'                   // B - Both, Q - Questions, L - Labs 
var topicList = '   select item, none';
var currentTopic = '';

//----------------------------------------------------------
// document ready
//----------------------------------------------------------
$(document).ready(function() {
	getSelectLists();
    getVersion();
	showSplash();

	// events from selection list filters	
	$('#option1').parent().on("click", function () {
		topicFilter = "Q"; 
		populateTopicsList();
	 });
	 $('#option2').parent().on("click", function () {
		topicFilter = "L"; 
		populateTopicsList();
	 });
	 $('#option3').parent().on("click", function () {
		topicFilter = "B"; 
		populateTopicsList();
	 });

	// events from tabs being selected
	$( 'a[data-toggle="tab"]' ).on( 'shown.bs.tab', function( evt ) {
		var anchor = $( evt.target ).attr( 'href' );
		// each time clear feedback tab fields before showing tab
	   	if(anchor === "#feedback"){
			$("#comments").val('');
			$("#feedStatus").empty();
			$("#feedStatus").html('');
		}	
	});
});

//----------------------------------------------------------
// socket io definitions for incoming 
//----------------------------------------------------------

socket.on('connect', function(data) {
    socket.emit('join', 'Session connected');
});

socket.on('version', function(data) {
	version = data.version;
	role = data.role;
	app_namespace = data.ns;
	console.log('Version: ' + version + '  Role: ' + role + ' Namespace: ' + data.ns);
	//if (role === 'S') {
    //	  $("#dave").hide();
	//}
	$("#ctitle").html('Collector - ' + app_namespace);

});

socket.on('data', function(data) {
	console.log('GotData');
	if (updateScreen) {	
		var hdr = buildTblHeader(data.max);
		var stats = buildTblStats(data, data.max);
		$("#stats").empty();
    	$("#stats").html('');
		$("#stats").html(hdr + stats);
	} 
});

socket.on('getInfoResults', function(data) {
	console.log('Requested information received')

	if (typeof data.question !== 'undefined'  && data.question !== 'Unknown') {
		$("#iQuestion").empty();
		$("#iQuestion").html('');
		$("#iQuestion").html(data.question);
		$("#holdQuestion").show();
	}

	if (typeof data.lab !== 'undefined' && data.lab !== 'Unknown') {
		$("#iLab").empty();
		$("#iLab").html('');
		$("#iLab").html(data.lab);
		$("#holdLab").show();
	}

	if (typeof data.hint !== 'undefined' && data.hint !== 'Unknown') {
		$("#iHint").empty();
		$("#iHint").html('');
		$("#iHint").html(data.hint);
		$("#holdHint").show();
	}
	
	if (typeof data.answer !== 'undefined' && data.answer !== 'Unknown') {
		$("#iAnswer").empty();
		$("#iAnswer").html('');
		$("#iAnswer").html(data.answer);
		$("#holdAnswer").show();
	}
});

socket.on('getTopicsResults', function(data) {
	console.log('Label list received')
	topicList = data.labels;
	console.log()
	populateTopicsList();
});


socket.on('feedbackResults', function(data) {
	$("#feedStatus").empty();
	$("#feedStatus").html('');
	$("#feedStatus").html('<br><br><p>' + data.status + '</p>');
});


//----------------------------------------------------------
// socket io definitions for out-bound
//----------------------------------------------------------
// send request to server to get drop down list data
function getSelectLists() {
    socket.emit('getTopics');
}

// send request to server to get software version
function getVersion() {
    socket.emit('getVersion');
}

// send request to server to clear stats and handle the model
function clearStats() {
	$('#deleteModal').modal('show'); // Show delete modal box.
	$('.confirm_delete').on('click', function() {
		  	console.log('Clear the stats');
			socket.emit('clearStats', {});

			var hdr = buildTblHeader(defHdr);
			$("#stats").empty();
			$("#stats").html('');
			$("#stats").html(hdr);
		});
}

//----------------------------------------------------------
// send feedback to server
//----------------------------------------------------------
function sendFeedback() {
	console.log('feedback button')
	var comments = $('#comments').val();
	comments = comments.trim();
    if (comments !== '') {
		socket.emit('feedback',{'namespace': app_namespace, 'comments': comments});
    } else {
		var msg = 'Nothing submitted, feedback comments are blank.';
		console.log(msg)
		$("#feedStatus").empty();
		$("#feedStatus").html('');
		$("#feedStatus").html('<br><br><p>' + msg + '</p>');
	}
}


//----------------------------------------------------------
// screen handlers
//----------------------------------------------------------

// show the ssplash screen
function showSplash() {
    closeNav();
	$("#splash").show();
	//$("#holdComplete").hide();
	$("#holdQuestion").hide();
	$("#holdLab").hide();
	$("#holdHint").hide();
	$("#holdAnswer").hide();
	$("#ctitle").html('Collector - ' + app_namespace);
}

// start timer 
function setTimer() {
    closeNav();
    // screen defaults
	$("#minutes").val();
    $("#timerModal").modal();
}

// show the about modal 
function about() {
    closeNav();
    $("#version").empty();
    $("#version").html('');
    $("#version").html('VERSION <span style="color: blue;">' + version + '</span>');
    $("#aboutModal").modal();
}

// show the about modal 
function openFilter() {
    $("#filterModal").modal();
}

// send requests to server for hint 
function getQorL() {
	var geth = $("#topiclabels option:selected").text();
	// if different from previous topic reset screen sections
	if(geth !== currentTopic) {
		currentTopic = geth;
		$("#iComplete").empty();
		$("#iComplete").html('');
		$("#iComplete").hide();

		$("#iQuestion").empty();
		$("#iQuestion").html('');
		$("#holdQuestion").hide();

		$("#iLab").empty();
		$("#iLab").html('');
		$("#holdLab").hide();

		$("#iHint").empty();
		$("#iHint").html('');
		$("#holdHint").hide();

		$("#iAnswer").empty();
		$("#iAnswer").html('');
		$("#holdAnswer").hide();
	}
	
	var data;
	if (geth.startsWith('Lab')) {
		data = {
			"labLabel": geth,
			"namespace": app_namespace
		}
	} else {
		data = {
			"questionLabel": geth,
			"namespace": app_namespace
		}
	}
    socket.emit('getInformation', data);
}

// send requests to server for hint 
function getHint() {
	var geth = $("#topiclabels option:selected").text();
	geth = bldRequest(geth, 'Hint')
	console.log('H ::::' + geth)
	var data = {
		"hintLabel": geth,
		"namespace": app_namespace
    }
    socket.emit('getInformation', data);
}


// send requests to server for answer
function getAnswer() {
	var geth = $("#topiclabels option:selected").text();
	geth = bldRequest(geth, 'Answer')
	console.log('A ::::' + geth)
	var data = {
        "answerLabel": geth,
		"namespace": app_namespace
    }
    socket.emit('getInformation', data);
}

function bldRequest(geth, typ) {
	if (geth.startsWith('Lab')) {
		return typ + ' ' + geth;
	}
	var fp = geth.indexOf(' ');
	if (fp > -1) {
		return typ + geth.substring(fp);
	}

}

function markComplete(key) {
	console.log('Mark complete: ' + key);
	$("#iComplete").empty();
	$("#iComplete").html(key);
	$("#iComplete").show();
	var result = {'namespace': app_namespace, 'item': key};
	socket.emit('markComplete', result);
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
// Statistics table functions
//----------------------------------------------------------

// build the stats table header info
function buildTblHeader(max) {
	if (max < defHdr ) {
		max = defHdr;
	}	
	var rtn = '<table class="table table-condensed table-sm"><thead>' 
	+ '<tr style="text-align: center; font-family: Arial Rounded MT Bold, Helvetica Rounded, Arial, sans-serif;">' 
	+ '<th>namespace</th>';
	var tm = 0;
	for (var m = 0; m < max; m++ ) {
		tm = m + 1;
		if (m < 9) {
			rtn = rtn + '<th>0' + tm + '</th>';
		} else {
			rtn = rtn + '<th>' + tm + '</th>';
		}
	}
	rtn = rtn + '<th>Cnt</th></tr></thead>';
	return rtn;
}

// build the stats table for all reported namespaces / team / color
function buildTblStats(data, max) {
	if (max < defHdr ) {
		max = defHdr;
	}	
	var hl = data.items.length;
	var rtn = '<tbody>';
	var color;
	var cnt;
	var tColor;
	var defaultNS = false;
	// loop all entires and create the row in the stats table
	for (var i = 0; i < hl; i++) {
		color = data.items[i].team;
		color = color.trim();
		if (color.length > 0) {
			color = color.toLowerCase();
			// default namespace gets changed to snow
			if (color === 'default') {
				color = 'snow';
				defaultNS = true;
			} else {
				defaultNS = false;
			}
			// set the font color to black or white
			if (blackText.indexOf('.'+color+'.') > -1) {
				tColor = 'black';
			} else {
				tColor = 'white';
			}
			// build the table stats data for this entry
			rtn = rtn + '<tr style="text-align: center;">' 
			+ '<td style="background-color: ' 
			+ color 
			+ '; color: ' 
			+ tColor + '; font-size: 125%; font-family: Arial Rounded MT Bold, Helvetica Rounded, Arial, sans-serif;">' 
			if (defaultNS) {
				rtn = rtn + 'DEFAULT</td>';
			} else {
				rtn = rtn + color + '</td>';
			}
			cnt = data.items[i].cnt;
			for (var c = 0; c < max; c++) {
				if (c < cnt) {
					rtn = rtn + '<td style="font-size: 125%; ">' + checkMark + ';</td>';
				} else {
					rtn = rtn + '<td style="font-size: 125%; ">' + tbd + '</td>'
				}
			}
			rtn = rtn + '<td style="background-color: ' + color 
			+ '; color: '
			+ tColor + '; font-size: 100%; font-family: Arial Rounded MT Bold, Helvetica Rounded, Arial, sans-serif;">' 
			+ i + '</td></tr>'
		} 
	}
	rtn = rtn + '</tbody></table>'
	return rtn;
}


//----------------------------------------------------------
// Timer common functions
//----------------------------------------------------------
// handle response to show the timer modal
function timer() {
	$("#timerModal").modal('hide');
	var timerMinutes = $("#minutes").val();
	var cnt = (timerMinutes * 60 * 1000);
	var now = new Date().getTime();
	
	// add minutes to now
	cnt = cnt + now;
	
	// enable updating when data received
	updateScreen = true;
	startClock(cnt);
}

// control creation and stopping of interval
function startClock(cnt) {
	// Set the date we're counting down to based on minutes provided
	var countDownDate = new Date(cnt);

	// if timer is already started clear the timer
	if (started) {
		clearInterval(clock);
		started = false;
	}

	// Update the count down every 1 second
	clock = setInterval(function() {
		started = true;
  		// Get todays date and time
  		var now = new Date().getTime();
	
  		// Find the distance between now and the count down date
  		var distance = countDownDate - now;

  		// Time calculations for days, hours, minutes and seconds
  		var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  		var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  		var seconds = Math.floor((distance % (1000 * 60)) / 1000);
	
  		// Output the result in an element with id="demo"
  		//document.getElementById("labtime").innerHTML = "&#x23F1;"   
  		document.getElementById("labtime").innerHTML = " "   
  			+ " Remaining time:   <span style='color: " + timeColor + ";'>" 
  			+ hours   + "</span>h <span style='color: " + timeColor + ";'>"
  			+ minutes + "</span>m <span style='color: " + timeColor + ";'>" 
  			+ seconds + "</span>s ";
	
  		// If the count down is over, write some text 
  		if (distance < 0) {
			clearInterval(clock);
			clock = null;
			// Turn off updatinf of screen
			//updateScreen = false;
			document.getElementById("labtime").innerHTML = "&#x1F6D1;" + "&nbsp;STOP";
  		}
	}, 1000);
}

//----------------------------------------------------------
// populate the topics drop down
//----------------------------------------------------------
function populateTopicsList() {
    var options;
    $("#topiclabels").empty();
    $("#topiclabels").html('');
    options = bldOptions();
    $("#topiclabels").html(options);
}

//----------------------------------------------------------
// sort and build the selection list option entries
//----------------------------------------------------------
function bldOptions() {
	var items = [];
	items.push('   select item');
    var listitems = '';
	var options = topicList.split(',');
    for (var j = 0; j < options.length; j++) {
		var jj = options[j];
		if (topicFilter === 'B') {
			if (options[j].startsWith('Question') ||  options[j].startsWith('Lab') ) {
				items.push(options[j])
			} 
		} else if (topicFilter === 'Q') {
			if (options[j].startsWith('Question') ) {
				items.push(options[j])
			} 
		} else if (topicFilter === 'L') {
			if (options[j].startsWith('Lab') ) {
				items.push(options[j])
			}
		}
	};
    items.sort();
    for (var i = 0; i < items.length; i++) {
        //if (i === 0 && type === 'K') {
        //    listitems = '<option>all-kinds</option>'
        //}
        listitems += '<option>' + items[i] + '</option>';
    }
    return listitems;
}

//----------------------------------------------------------
console.log('loaded cllrsmain.js');
//----------------------------------------------------------