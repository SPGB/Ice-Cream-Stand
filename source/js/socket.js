socket = io('http://icecreamstand.ca', { query: "id=" + user._id + '&name=' + user.name  });
bind_sockets();

function bind_sockets() {
    socket.on('trend', function(msg){
        console.log(msg);
        var j = msg.trend;
        trending_flavor = j.flavour_id;
            var flavour;
            for (var i = 0; i < flavors.length; i++) {
                if (flavors[i]._id === trending_flavor) {
                    flavour = flavors[i];
                    break;
                }
            }
            trending_bonus = j.bonus.toFixed(2);
            $('.trending #trend_bonus')[0].textContent = trending_bonus;
            $('.trending h4 > span')[0].textContent = __(j.flavour_name) + ' is trending';
            if (flavour) {
                update_sell_value('update trending');
                if ($('.currently_trending[x-id="' + trending_flavor + '"]').length == 0) {
                    $('.trending .currently_trending_container').html('<span class="currently_trending tooltip" x-type="base" x-id="' + trending_flavor + '" id="' + j.flavour_name.replace(/\s+/g, '') + 
                    '"><img src="' + image_prepend + '/flavours/thumb/' + j.flavour_name.replace(/\s+/g, '') + '.png.gz" class="trending_img active" /></span></span>');
                } else {
                    $('.trending #trend_bonus').text(trending_bonus).show();
                }
            } else {
                $('.trending .currently_trending_container').html('<span class="currently_trending tooltip" x-type="base" x-id="' + trending_flavor + '" id="' + j.flavour_name.replace(/\s+/g, '') + 
                    '"><img src="' + image_prepend + '/flavours/thumb/' + j.flavour_name.replace(/\s+/g, '') + '.png.gz" class="trending_img active trending_locked" /></span></span>');
            }
            $('#trend_left')[0].textContent = numberWithCommas(75000 - j.total_sold) + ' left';
            $('#trend_sold_inner').css('width', ((j.total_sold / 75000.00) * 100) + '%');
    });
    socket.on('cow', function(msg){
        console.log(msg);
        if (msg.resync) {
            cow = null;
            Icecream.sync_cow();
        }
        if (msg.experience) {
            cow.experience = msg.experience;
        }
        if (cow.level < 5 && msg.level > 5) {
            alert('<center><b>Your cow is growing up!</b><br><br><img src="' + image_prepend + '/skins/default.png" class="cow_evolve" /></center>', cow.name + ' is evolving!');
            cow = null;
            $('.cow')[0].textContent = '';
            Icecream.sync_cow();
        }
        cow.level = msg.level;
        cow.experience = msg.experience;
        cow.happiness = msg.happiness;
        if (msg.item_change) cow_item_stats();
    });
    socket.on('epic/aoc/log', function(msg){
        var message = '';
        if (msg.power) {
            epic_last_attack = new Date();
            message = msg.player + ' attacked <i>' + msg.fort + '</i> with <b>' + msg.power + ' power</b><small>' + new Date() + '</small>';
        }
        if (msg.health) {
            message = msg.player + ' repaired <i>' + msg.fort + '</i> for <b>' + msg.health + ' health</b><small>' + new Date() + '</small>';
        }
        $('.aoc_log').append('<div class="aoc_log_msg">' + message + '</div>');
        if ( $('.aoc_log_msg').length > 10 ) $('.aoc_log_msg:first').remove();
        //epic_interval();
    });
    socket.on('update', function(msg){
        if (msg.gold) {
            user.gold = parseFloat(msg.gold);
        }
        if (msg.ifr) {
            main('flavor');
        }
        if (msg.chapter) {
            toast('You have unlocked <b>' + msg.chapter + '</b>', 'Lore Chapter Unlocked!');
            if (!user.chapters_unlocked) user.chapters_unlocked = [];
            user.chapters_unlocked.push(msg.chapter);
            $('.lore').attr('x-chapters', user.chapters_unlocked.length);
        }
        if (msg.epic) {
            user.epic_collected = msg.epic;
            $('.user_epic_collected')[0].textContent = user.epic_collected;
        }
        if (msg.fort) {
            $('.aoc_dynamic[x-id="' + msg.fort + '"] .fort_options span')[0].textContent = numberWithCommas(msg.fort_health);
            if (msg.fort_health <= 0) {
                $('.aoc_dynamic[x-id="' + msg.fort + '"]').remove();
            }
        }
        if (msg.messages) {
            message_display(msg.messages[0]);
        }
        if (msg.room) {
            change_room(msg.room); //TO THE SWAMP WITH YEE
        }
        if (msg.refresh) {
            game_working = false;
            $('body').append('<div class="white_overlay"><strong>Already signed in (or the server just went down)<br><br><small>Refreshing in 10 seconds</small></strong>' +
                '<i class="fa fa-times"></i></div>');
            $('.white_overlay i').click(function () {
                $('.white_overlay').fadeOut(250, function() {
                    $(this).remove();
                    game_working = true;
                });
            });
            setTimeout(function () {
                if (!game_working) window.location.reload(true); 
            }, 10000);
        }
        if (msg.trend) {
            $('#trend_left')[0].textContent = numberWithCommas(75000 - msg.trend) + ' left';
            $('#trend_sold_inner').css('width', ((msg.trend / 75000.00) * 100) + '%');
        }
        if (msg.expertise && msg.expertise_position) {
            user.flavors_sold[msg.expertise_position] = msg.expertise;
        }
    });
    socket.on('alert', function(msg){
        if (msg.error) {
            $('.inline-message').remove();
            var error_messages = ['Ack Ack', 'Oh Noooo', 'Errrrar', 'Uh-oh', 'Bad news doc'];
            toast(msg.error, error_messages[ Math.floor( Math.random() * error_messages.length ) ] );
            return;
        }
        if (msg.error) {
            toast(msg.error, 'Error');
        }
        alert(msg.message, msg.title);
    });
    socket.on('leave', function(msg){
        var friend = Icecream.get_friend(msg._id);
        if (friend) {
            console.log('offline -' + friend.name);
            friend.updated_at = new Date();
            friend.is_away = true;
            friend_list_add(friend.name, 0);
            $('.friends_counter span#count')[0].textContent = $('.friends_list_online > user, .friends_list_away > user').length + '/' + $('.friends_counter span#count').attr('x-length');
        }
    });
    socket.on('typing', function(msg){
            typing_cache[msg._id] = new Date();
            setTimeout(function () {
                if (typing_cache[msg._id] < new Date() - 900) {
                    $('.is_typing[x-id="' +  msg._id + '"]').remove();
                }
            }, 1000);
            if ($('.is_typing[x-id="' +  msg._id + '"]').length === 0) {
                $('#typing').append('<span class="is_typing" x-id="' + msg._id + '">' + msg.name + ' is typing.</span>');
        }
    });
}