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
var defMax = 10;                         // default number of labs numbers in header
var clock = null;                        // interval timer for clock
var started = false;
var updateScreen = true;                 // control if stats table will get updated
var checkMark = '&#x2705';               // emoji to display as the checkmark
var timeColor = 'lime'                   // color of numbers in timer display

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

socket.on('version', function(data) {
    version = data.version;
});

socket.on('data', function(data) {
	console.log(JSON.stringify(data,null,2))
	if (updateScreen) {	
		var hdr = buildTblHeader(data.max);
		var stats = buildTblStats(data, data.max);
		$("#stats").empty();
    	$("#stats").html('');
		$("#stats").html(hdr + stats);
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

// send request to server to clear stats and handle the model
function clearStats() {
	$('#deleteModal').modal('show'); // Show delete modal box.
	$('.confirm_delete').on('click', function() {
		  	console.log('Clear the stats');
			socket.emit('clearStats', {});

			var hdr = buildTblHeader(10);
			$("#stats").empty();
			$("#stats").html('');
			$("#stats").html(hdr);
		});
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
	if (max < defMax ) {
		max = defMax;
	}	
	var rtn = '<table class="table table-condensed"><thead><tr style="text-align: center;"><th>namespace</th>';
	var tm = 0;
	for (var m = 0; m < max; m++ ) {
		tm = m + 1;
		if (m < 9) {
			rtn = rtn + '<th>0' + tm + '</th>';
		} else {
			rtn = rtn + '<th>' + tm + '</th>';
		}
	}
	rtn = rtn + '<th>&nbsp;</th></tr></thead>';
	return rtn;
}

// build the stats table completion inf
function buildTblStats(data, max) {
	if (max < defMax ) {
		max = defMax;
	}	
	var hl = data.items.length;
	var rtn = '<tbody>';
	var color;
	var cnt;
	for (var i = 0; i < hl; i++) {
		color = data.items[i].team;
		rtn = rtn + '<tr style="text-align: center;"><td style="background-color: ' + color 
		+ '; color: white; font-size: 125%">' + color
		+ '</td>';
		cnt = data.items[i].cnt;
		for (var c = 0; c < max; c++) {
			if (c < cnt) {
				rtn = rtn + '<td style="font-size: 125%;">' + checkMark + ';</td>';
			} else {
				rtn = rtn + '<td></td>'
			}
		}
		rtn = rtn + '<td style="background-color: ' + color + ';">&nbsp;</td></tr>'
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
  		document.getElementById("labtime").innerHTML = "&#x23F1;"   
  			+ " Remaining time:   <span style='color: " + timeColor + ";'>" 
  			+ hours   + "</span>h <span style='color: " + timeColor + ";'>"
  			+ minutes + "</span>m <span style='color: " + timeColor + ";'>" 
  			+ seconds + "</span>s ";
	
  		// If the count down is over, write some text 
  		if (distance < 0) {
			clearInterval(clock);
			clock = null;
			updateScreen = false;
			document.getElementById("labtime").innerHTML = "&#x1F6D1;" + "&nbsp;STOP";
  		}
	}, 1000);
}

//----------------------------------------------------------
console.log('loaded cllrsmain.js');
//----------------------------------------------------------