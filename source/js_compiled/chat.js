var user_me;
var socket;
$(document).ready(function () {
	$.ajax({
		url: '/me',
		success: function (j) {
			// if (j.socket_id) {
			// 	$('.chat_window').html('<h1>Please close other windows of Ice Cream Stand and refresh...</h1>');
			// 	return;
			// }
			$('.chat_window').after('<form action="/chat" method="post"><input type="text" class="new_msg"><input type="submit" value="Send"></form>');
			user_me = j;
			var socket_data = { query: "id=" + user_me._id + '&name=' + user_me.name  };
    		socket = io('http://icecreamstand.ca', socket_data);
    		sync();
    		socket_bind();
		}
	});
	$('body').on('submit', 'form', function () {
        var msg = {
            badge: user_me.badges[0],
            text: $('.new_msg').val()
        };
        socket.emit('chat message', msg);
        $('.new_msg').val('').focus();
        setTimeout(function () {
        	sync();
        }, 250);
        return false;
	});
});

function socket_bind() {
	socket.on('chat message', function (msg) {
		load_message(msg);
	});
}

function sync() {
	$.ajax({
        url: '/chat',
        data: {
            expanded: 20,
            cache: Math.random()
        },
        dataType: 'JSON',
        success: function (j) { 
            var j_len = j.length - 1;
            for (var i = j_len; i >= 0; i--) {
                load_message(j[i]);
           }
        }
    });
}
function load_message(msg) {
	if ( $('.chat_container[x-id="' + msg._id + '"]').length > 0) return;
	var badge_img = (msg.badge)? '<img class="chat_badge" src="http://static.icecreamstand.ca/badges/' + msg.badge + '.png">' : '';
	var construct = $('<div />', {
		'x-id': msg._id,
		'class': 'chat_container',
		'title': msg.created_at,
		'html': '<a href="http://icecreamstand.ca/#!u/' + msg.user + '" class="user_card">' + badge_img + msg.user + '</a><span class="chat_textbody">' +
		msg.text + '</span>'
	});

	$('.chat_window').append(construct);
	if ($('.chat_container').length > 20) $('.chat_container:first').remove();
}