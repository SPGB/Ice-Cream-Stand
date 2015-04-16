var min;
var max;
var start_time = Date.now();
var ping_average;
$(document).ready(function () {
	$('body').append('<link rel="stylesheet" href="https://s3.amazonaws.com/icecreamstand.com/stats.css.gz"><section><h1>101</h1><div class="header_sub">' +
		'Active Accounts: <span id="accounts"></span> Min: <span id="min">99</span> Max: <span id="max">99</span></div><div class="chat"></div><div class="response_time">Ping: <span id="ping">100ms</span></div></section>');
	pull_chat();
	pull_online();
	setInterval(function() {
		start_time = Date.now();
		pull_chat();
		pull_online();
	}, 10000);
});

function pull_chat() {
	$.ajax({ 
        url: 'chat',
            dataType: 'JSON',
            type: 'GET',
            timeout: 5000,
        	success: function (msgs) {
	        	$('.chat').html('');
	        	for (var i = 0; i < msgs.length; i++) {
	        		var msg = msgs[i];
	        		$('.chat').prepend('<div class="msg"><span class="msg_user">' + msg.user + '</span>' + msg.text + '</msg>');
	        	}
        	}
    });
}
function pull_online() {
	$.ajax({ 
        url: 'online/total',
        dataType: 'JSON',
        type: 'GET',
        timeout: 5000,
       	success: function (online) { 
          $('body').attr('class', '');
       		var delta = Date.now() - start_time;
        	$('#ping').text(delta + 'ms').attr('class', ''); 
        	if (delta < 100) {
        		$('#ping').addClass('ping_good');
        	} else if (delta > 500) {
        		$('#ping').addClass('ping_bad');
        	} else {
        		$('#ping').addClass('ping_avg');
        	}
       		$('h1').text(online.c + ' On');
       		$('#accounts').text( numberWithCommas(online.t) );
       		if (!min || online.c < min) {
       			$('#min').text(online.c);
       			min = online.c;
       		}
       		if (!max || online.c > max) {
       			$('#max').text(online.c);
       			max = online.c;
       		}
        },
        error: function (j) {
          $('body').attr('class', 'failure');
        }
    });
}
function numberWithCommas(x) {
    if (!x || typeof x === 'undefined') return '';
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}