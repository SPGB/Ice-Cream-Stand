var interval_employees;
var interval_gold;
var interval_sell;
var interval_chat;
var interval_events;
var cached_new_messages = 0;
var process_clicks_iteration = 0;
var game_working = true;
var image_prepend = 'http://static.icecreamstand.ca';
var cached_language = [];
var lang;
var cache_event_trend_enable = false;
var sales_lastmove_stamp;
var cache_sell_float = 0;
var cache_sell_float_num = 0;
var cache_sell_float_record = false;
var cache_sell_misses = 0;
var cache_grass_active = false;
var cache_unread_message = false;
var cache_unread_mention = false;
var cache_friends = [];

var Icecream = {
    paginate: function(index) { //pages through the ice cream container
        return false;
        var len = $('.inner_flavor_container:visible .option_wrapper').length;
        if ( index === null || len < 5 ) { //only show the first 5
            $('.inner_flavor_container:visible .option_wrapper').hide();
            $('.inner_flavor_container:visible .option_wrapper').slice(0, 5).show();
            $('.filter_box').remove();
            return false;
        }
        $('.inner_flavor_container:visible .option_wrapper').slice(0, 5).show();
        
        var offset = 5;
        var page_len = Math.ceil((len - offset) / 15) - 1;
        if (index > page_len) { index = page_len; return false; } else if (index < 0) { index = 0; return false; }
        if (cached_page === index) {
            $('.page_wrap:visible').hide();
            $('.page_wrap[x-page="' + index + '"]').css('left', 0).show();
            $('.page_wrap[x-page="' + index + '"] .option_wrapper').show();
        } else {
            var is_dir_left = (index < cached_page);
            cached_page = index;      
            $('.page_wrap:visible').animate({'left': (is_dir_left)? 1000 : -1000}, 500, function () {
                $(this).hide();
            });
            
            console.log('loading page: ' + index);
            $('.page_wrap[x-page="' + index + '"]').css('left', (is_dir_left)? -1000 : 1000).show().animate({'left': 0}, 500);
            $('.page_wrap[x-page="' + index + '"] .option_wrapper').show();
        }
        $('.inner_flavor_container:visible .option_wrapper:visible img[x-src]').each(function () { //lazy load them images
            lazy_load(this);
        });

        //add in prev/next
        $('.filter_box').remove();
        if (len < 20) return false;
        $('.inner_flavor_container:visible').after('<div class="filter_box"><div id="filter_flavour"></div><div class="filter_prev button" ng-click="currentPage=currentPage-1">' +
            '<i class="fa fa-arrow-left"></i></div><div class="filter_next button" ng-click="currentPage=currentPage+1"><i class="fa fa-arrow-right"></i></div></div>');
        if (index == 0) $('.filter_prev').css('opacity', '0.5');
        if (index == page_len) $('.filter_next').css('opacity', '0.5');
        for (var i = 0; i < 6; i++) {
            //if (i >= 0 && i <= page_len) {
                $('.filter_box').append('<span class="filter_page ' + ((i == index)? 'active' : '') + '" ng-click="currentPage=' + i + '">' + (i+1) + '</span>');
            //}
        }
    },
    shop_paginate: function(index) {
        var real_index = parseInt($('.shop_table:visible').attr('x-index'));
        var page_size = parseInt($('.shop_table:visible').attr('x-page')) || 5;
        var new_index = real_index + index;
        if (new_index  < 0) new_index = 0;
        var ele_to_show = (new_index + 1) * page_size;

        if (new_index > 0 && $('.shop_table:visible tr:gt(' + (ele_to_show - page_size - 1) + ')').length == 0) {
            return false;
        }

        $('.shop_table:visible').attr('x-index', new_index);
        $('.shop_table:visible tr').show();
        $('.shop_table:visible tr:gt(' + (ele_to_show-1) + ')').hide();
        $('.shop_table:visible tr:lt(' + (ele_to_show - page_size) + ')').hide();

        
    },
    employees_working: function() {

        if (cow) {
            if (Math.random() < 0.8) cow_hay();
            if (Math.random() < 0.8) cow_hay();

            if (Math.random() < 0.25 && cow.happiness > 0) {
                var decrease_by = ( (cow.constitution + cow.con_mod) / 30);
                console.log(decrease_by);
                if (decrease_by > .9) decrease_by = 0.9;
                if (user.silo_hay > 0 && is_deep_sleep) {
                    user.silo_hay -= 1 - decrease_by;
                    cow.experience += .25;
                    if (user.silo_hay < 0) user.silo_hay = 0;
                    //$('.silo').attr('x-hay', Math.floor( (user.silo_hay + 49) / 50) );
                    $('.silo_bar').css('height', user.silo_hay / (175 + (25 * user.upgrade_silo_hay)) / 0.01 );
                } else {
                    cow.happiness -= 1 - decrease_by;
                    $('.cow_level_bar > #happiness').attr('x-full', false).attr('value', cow.happiness);
                }
            }
        }

        if (true) {
            $('#upgrades .unlockable[x-cost]').each(function () {
                var cost = $(this).attr('x-cost');
                $(this).find('button:first').css('background-size', (user.gold / cost / 0.01) + '% 100%');
            });
        }
        if (is_deep_sleep) {
            cache_worker_sales_to_send++;
            if (cache_worker_sales_to_send < 100) return;
        }
        if (sales_per > 0 && game_working) {
            sell_icecream(sales_per, true);
        }
    },
    update_quest_bar: function() {
        if (!user.quests || user.quests.length === 0) return false;
        var last_quest = user.quests[user.quests.length - 1];
        var progress;
        var quest_split = last_quest.split('&');

        if (last_quest.substring(0,1) === '!') { //dynamic
            var starting_point = parseInt(quest_split[2]);
            var dynamic = quest_split[0].split(',');
            var cost = parseInt(dynamic[5]);
            var type = dynamic[4];
            var current = user.flavors.indexOf( type );
            var current_sold = (current > -1)? user.flavors_sold[ current ] : 0;
            progress = 100 * ((current_sold - starting_point) / cost);
        } else {
            var real_cost = parseInt(quest_split[2]);
            if (quest_split[0] === '52577a6288983d0000000001') {
                var position_of_strawberry = user.flavors.indexOf('5238d9d376c2d60000000002');
                if (position_of_strawberry > -1) {
                    var flavor_sold = user.flavors_sold[position_of_strawberry];
                    progress = 100 * (flavor_sold / expertise_reqs[real_cost-1]);
                }
            } else if (quest_split[0] === '52672bedde0b830000000001') {
                progress = 100 * (user.carts / real_cost);
            } else if (quest_split[0] === '52672dea3a8c980000000001') {
                progress = 100 * (user.combos.length / real_cost);
            } else if (quest_split[0] === '526744f40fc3180000000001') {
                progress = 100 * (user.trucks / real_cost);
            } else if (quest_split[0] === '526745240fc3180000000002') {
                var num_above_100 = 0;
                var f_len = user.flavors_sold.length;
                for (var i = 0; i < f_len; i++) {
                    if (user.flavors_sold[i] > 99) num_above_100++;
                }
                progress = 100 * (num_above_100 / real_cost);
            }
        }
        if (progress > 100) progress = 100;
        if (cached_progress) {
            if (cached_progress != progress) {
                $('#complete_quest_progress').addClass('active');
            } else {
                $('#complete_quest_progress').removeClass('active');
            }
        }
        cached_progress = progress;
        $('#complete_quest_progress').css('width', progress + '%');
    },
    cloud: function(num) {
        if (is_deep_sleep || !user.is_animation_clouds || !window_focus || canvas_drop_clouds_len > 10 - num) return;
        for (var i = 0; i < num; i++) {
            var speed = (Math.floor(Math.random() * 4) - 2);
            if (speed === 0) speed = 1;
            var w = 200 + (Math.random() * 175);
            var x = (speed > 0)? 0-w : canvas_cache_width;
            canvas_drop_clouds.push({
                x: x,
                y: Math.floor(Math.random() * (canvas_cache_height / 2)),
                width: w,
                height: w * 0.75,
                speed: speed,
                variation: Math.floor( Math.random() * 4 )
            });
        }
        canvas_drop_clouds_len = canvas_drop_clouds.length;
    },
    canvas_icecream_sales: function() { //SCOOPLINGS
        if (!is_cube) { return false; }
        //var update = false;
        var clen = canvas_cache_sales.length;
        if (clen == 0) return;
        for (var i = 0; i < clen; i++) {
            var c = canvas_cache_sales[i];
            canvas_sales_context.clearRect(c[1] - 60 - 2, c[2] - 60 - 2, 125, 125);
        }
        for (var i = 0; i < clen; i++) {
            var c = canvas_cache_sales[i];
            canvas_sales_context.beginPath();

            canvas_sales_context.arc(c[1], c[2], c[3] + 8, 0, 2 * Math.PI, false);
            canvas_sales_context.globalAlpha = 0.5;
            canvas_sales_context.fillStyle = 'white';
            canvas_sales_context.fill();
            canvas_sales_context.globalAlpha = 1;
            canvas_sales_context.beginPath();
            if (c[0] > 0) {
                canvas_sales_context.arc(c[1],c[2], (c[3] / 2) + 8,-0.5 * Math.PI,  ( (c[0] / 50 ) - 0.5) * Math.PI);
            }
            canvas_sales_context.lineWidth = c[3];
            canvas_sales_context.strokeStyle = (c[0] <= 100)? '#7F7DC7' : '#BC0000';
            canvas_sales_context.stroke();
            if (canvas_cache_sale_cold.complete) {
                canvas_sales_context.drawImage(
                    canvas_cache_sale_cold,  //img
                    180 * Math.floor(c[4] % 5), Math.floor(c[4] / 5) * 130, //clip x, y
                    180,130, //clip width, height
                    c[1] - c[3], c[2] - c[3], //x, y
                    c[3] * 2, c[3] * 1.7222 //width, height
                );
            }
            if (cache_cube_multiplier && cache_cube_multiplier > 1 && c[0] <= 100) {
                canvas_sales_context.lineWidth = 2;
                canvas_sales_context.strokeStyle = '#111';
                canvas_sales_context.font = "24px sans-serif";
                canvas_sales_context.strokeText('x' + cache_cube_multiplier, c[1] + (c[3] / 2), c[2] + (c[3] / 2) );
            }
            if (c[3] < 50) {
                c[3] += 10;
                //update = true;
            }
            if (c[4] > 7 && c[4] < 14) {
                c[4] += 0.2;
            }
            if ( c[4] == 1 || (c[4] >= 1.5 && c[4] < 2) ) {
                c[4] = 0;
            } else if (c[4] < 2) {
                c[4] += 0.3;
            }
        }
        //if (canvas_cache_sale_cold.complete) canvas_icecream_sales_dirty = update; //only mark it painted if the cube is loaded
    },
    canvas_icecream_drop: function() {
        if (!window_focus || (!user.is_animation_clouds && !user.is_animation_cones) ) return false;
        
        if (user.is_animation_clouds) {
            for (var j = 0; j < canvas_drop_clouds_len; j++) {
                var c = canvas_drop_clouds[j];
                canvas_drop_context.clearRect(c.x, c.y, c.width, c.height);
            }
        }

        if (user.is_animation_cones) {
            for (var j = 0; j < canvas_drop_cache_len; j++) {
                var c = canvas_drop_cache[j];
                if (c[2] > -80) { //only draw when it's on the screen
                    canvas_drop_context.clearRect(c[1], c[2] - speed - 8, 55  * c[3], 40  * c[3]);
                    if (canvas_cache_cone && canvas_cache_cone.complete) {
                        canvas_drop_context.drawImage(canvas_cache_cone, c[1] + (5 * c[3]), c[2] + 35, 40 * c[3], 50 * c[3]);
                    }
                    if (canvas_cache_workers[c[0]].complete && typeof canvas_cache_workers[c[0]].naturalWidth !== "undefined") {
                        canvas_drop_context.drawImage(canvas_cache_workers[c[0]], c[1], c[2], 50 * c[3], 40 * c[3]);
                    }
                    if (canvas_cache_addon[c[0]].complete && typeof canvas_cache_addon[c[0]].naturalWidth !== "undefined") {
                        canvas_drop_context.drawImage(canvas_cache_addon[c[0]], c[1], c[2] - 15, 50 * c[3], 40 * c[3]);
                    }
                }
                c[2] += speed;
                
                if (c[2] >= canvas_cache_height) { //past the bounds
                    canvas_drop_context.clearRect(c[1], c[2] - speed - 8, 50  * c[3], 90  * c[3]);
                    canvas_drop_cache.splice(j, 1);
                    j--;
                    canvas_drop_cache_len--;
                }
            }
        }

        if (user.is_animation_clouds) {
            for (var j = 0; j < canvas_drop_clouds_len; j++) {
                var c = canvas_drop_clouds[j];
                c.x += c.speed;
                canvas_drop_context.globalAlpha = 0.75;
                if (c.variation && canvas_cache_cloud[c.variation] && canvas_cache_cloud[c.variation].complete && typeof canvas_cache_cloud[c.variation].naturalWidth !== "undefined") {
                    canvas_drop_context.drawImage(canvas_cache_cloud[c.variation], c.x, c.y, c.width, c.height);
                }
                canvas_drop_context.globalAlpha = 1;
                if ((c.x > canvas_cache_width && c.speed > 0) || (c.x < 0 - c.width && c.speed < 0)) { 
                    canvas_drop_context.clearRect(c.x, c.y, c.width, c.height);
                    canvas_drop_clouds.splice(j,1);
                    j--;
                    canvas_drop_clouds_len--;
                }
            }
        }
    },
    process_clicks: function() { //for autopilots
        if (is_cube) return false; //dont process while the ice cube game is in progress

        if (game_working && user.upgrade_autopilot > 0) {
            do_click(user.upgrade_autopilot); //increase expertise
            icecream_mousedown(user.upgrade_autopilot); //visual floating text

            sell_icecream(user.upgrade_autopilot); //sell em!
        }

        if (!window_focus) {
            if (cache_sell_inactive > 2) {
                if (!is_deep_sleep) Icecream.deep_sleep();
                cache_sell_inactive = 0;
            }
            cache_sell_inactive++;
        }
    },
    update_event: function () {
        if (!cache_event_trend_enable) return;
        $.ajax({
            url: '/event',
            data: 'cache=' + Math.random(),
            dataType: 'JSON',
            type: 'GET',
            success: function (j) {
                var x = new Date().getSeconds();
                var addon_amount = (user.trend_bonus).toFixed(2);
                if (j._id) {
                    trending_addon = j._id;
                    var desc = (j.event)? j.event : j.name + ' is HOT!';
                    if ($('#event_name[x-id="' + trending_addon + '"]').length == 0) {
                        $('.event #event_name').attr('x-id', trending_addon)[0].textContent =  __(desc);
                        $('.event #trend_time').html('<span id="trend_bonus" class="money_icon">' + addon_amount + '</span><i class="fa fa-clock-o"></i> <span class="event_time">' + x +
                        '</span>');
                    }
                    event_time_left = (60 - x) + ( parseInt(j.mins) * 60 );
                    
                } else {
                    event_time_left = 60;
                    $('.event #event_name').html('<span id="noevent">There is currently no add-on event</span>');
                    $('.event #trend_time')[0].textContent = '';
                    trending_addon = '';
                }
                clearInterval(interval_events);
                interval_events = setInterval(function() {
                    Icecream.update_clock('.event_time', event_time_left);
                    event_time_left--;
                    if (event_time_left == 0) {
                        Icecream.update_event();
                    }
                }, 1000);
                update_sell_value('update event');
            }
        });
    },
    update_flavors: function() {
        if (!cache_event_trend_enable) return;
        $.ajax({
            url : '/flavors',
            data: { sort: '-votes last_trend_at', limit: 5, show_mine: true },
            type: 'GET',
            dataType: 'JSON',
            success: function (j) {
                //flavors = j;
                var f_len = j.length;
                //$('.vote_container').html('');
                for (var i = 0; i < f_len; i++) {
                    var flavor = j[i];
                    if (i < 5) {
                        if (!flavor.votes) flavor.votes = 0;
                        if ($('.vote_box[x-id="' + flavor._id + '"][x-num="' + i + '"]').length > 0) {
                            $('.vote_box[x-id="' + flavor._id + '"][x-num="' + i + '"] b')[0].textContent = flavor.votes;
                        } else {
                            $('.vote_box[x-num="' + i + '"]').remove();
                            $('.vote_container').append('<div class="vote_box tooltip" x-id="' + flavor._id + '" x-num="' + i + '" x-name="' + flavor.name + '"><img src="' + image_prepend + '/flavours/thumb/' + flavor.name.replace(/\s+/g, '') + '.png.gz" title="' + flavor.name + '" /><b>' + flavor.votes + '</b></div>');
                        }
                    }
                    if (flavor.value == 0.10) {
                        $('#main_base .option[x-id="' + flavor._id + '"]').parent('.option_wrapper:not(.outofstock)').addClass('outofstock');
                    } else {
                        $('#main_base .option[x-id="' + flavor._id + '"]').parent('.option_wrapper.outofstock').removeClass('outofstock');
                    }
                }
            }
        });
    },
    first_time_dunce: function() {
        $('.dunce').remove();
        console.log('dunce: ' + user.dunce_until + ' - ' +  new Date());
        $('#new_message input[type="text"]').attr('placeholder', 'What would you like to say');
        if (new Date(user.dunce_until) > new Date()) {
            var time_diff = ( new Date(user.dunce_until) - new Date()) / 1000 / 60;
            $('.footer').prepend('<div class="dunce">' + user.dunce_message + '<br>Time left: ' + time_diff.toFixed(1) + ' minutes.</div>');
            $('#new_message input[type="text"]').attr('placeholder', 'Think before you type');
            setTimeout(function () { Icecream.first_time_dunce(); }, 6000);
        }
    },
    first_time_party: function() {
        $('.dunce').remove();
        console.log('dunce: ' + user.party_until + ' - ' +  new Date());
        $('#new_message input[type="text"]').attr('placeholder', 'What would you like to say');
        if (user.party_until && new Date(user.party_until) > new Date()) {
            var time_diff = ( new Date(user.party_until) - new Date()) / 1000 / 60;
            $('.footer').prepend('<div class="dunce" x-type="party"><img src="' + image_prepend + '/party.png" class="party_icon" />While you are partying you can invite others to party. Invite people to party by typing /party player_name.<br>Time left: ' + time_diff.toFixed(1) + ' minutes.</div>');
            $('#new_message input[type="text"]').attr('placeholder', 'Party Party Party');
            setTimeout(function () { Icecream.first_time_party(); }, 6000);
        }
    },
    sync_cow: function(cb, is_sync_items) {
        if (!game_working) { return; }
        console.log('syncing cow...');
        if (cow && cow.name) {
            var d = { h: cow.happiness, experience: cow.experience, silo: user.silo_hay };
            if (is_sync_items) {
                d.skin = cow.skin;
                d.items = cow.items;
                var all_rares = true;
                for (var i = 0; i < cow.items.length; i++) {
                    var item = cow.items[i];
                    if (i < 3 && item) {
                        var rarity = cow.items[i].split('/')[4];
                        if (!rarity || rarity != 'rare') {
                            all_rares = false;
                            break;
                        }
                    }
                }
                d.items_check = btoa( JSON.stringify(d.items) );
                if (all_rares) { achievement_register('545dad806c43abdf66d01473'); }
            }
            socket.emit('cow/update', d);
            if (cb && typeof cb == 'function') {
                cb();
            }
        } else {

            $.ajax({
                url: '/me/cows',
                dataType: 'json',
                type: 'get',
                success: function (cows) {
                    for (var i = 0; i < cows.length; i++) {
                        var temp_cow = cows[i];
                        if (temp_cow.is_active) {
                            cow = temp_cow;
                            cow_item_stats();
                            cow_redraw();
                            if (cow.skin == 'Moose' || cow.skin == 'Polar Bear') { $('body:not(.winter)').addClass('winter'); }
                        } else if (!user.is_display_friendcows) {
                            //draw in background
                            var items = '';
                            
                            $('.cow').show();
                            if (temp_cow.level < 5) {
                                temp_cow.skin = 'baby';
                            } else {
                                for (var j = 0; j < temp_cow.items.length; j++) {
                                    var item = temp_cow.items[j];
                                    items = items + '<div x-type="' + item.split('/')[0] + '" class="cow_attachment type_item"></div>';
                                    if (j === 3) break;
                                }
                            }
                            var cow_bg_elem = $('<div />', {
                                "class": "cow_background",
                                "x-id": temp_cow._id,
                                "title": temp_cow.name,
                                "x-num": i,
                                "html": '<div x-skin="' + temp_cow.skin + '" class="cow_body"></div>' + items
                            });
                            $(cow_bg_elem).appendTo('.footer_cows');
                            if (temp_cow.memories.length > 0 && Math.random() < 0.25) {
                                alert_inline(cow_bg_elem, temp_cow.memories[ Math.floor( Math.random() * temp_cow.memories.length) ]);
                            }
                        }
                    }
                }
            });

            if (user.friends.length > 0 && user.is_display_friendcows) {
                $.ajax({
                    url: '/me/cows/friends',
                    dataType: 'json',
                    type: 'get',
                    success: function (cows) {

                        for (var i = 0; i < cows.length; i++) {
                            var items = '';
                            var temp_cow = cows[i];
                            if (temp_cow.level < 5) {
                                temp_cow.skin = 'baby';
                            } else {
                                for (var j = 0; j < temp_cow.items.length; j++) {
                                    var item = temp_cow.items[j];
                                    if (item) {
                                        items = items + '<div x-type="' + item.split('/')[0] + '" class="cow_attachment type_item"></div>';
                                    }
                                    if (j === 3) break;
                                }
                            }
                            var cow_bg_elem = $('<div />', {
                                "class": "cow_background",
                                "x-id": temp_cow._id,
                                "title": temp_cow.name,
                                "x-num": i,
                                "html": '<div x-skin="' + temp_cow.skin + '" class="cow_body"></div>' + items
                            });
                            $(cow_bg_elem).appendTo('.footer_cows');
                        }
                    }
                });
            }


        }
    },
    sync_chat: function() {
        if (!game_working || user.chat_off || user.quests.length < 1) { 
            $('.chat.main_container').hide();
            return;
        } else {
            $('.chat.main_container').show();
        }
        return false; //depreciated into angular
        var expanded = $('.chat.main_container .expand').hasClass('active')? 75 : 15;
        $.ajax({
            url: 'chat',
            data: {
                expanded: expanded,
                cache: Math.random()
            },
            dataType: 'JSON',
            type: 'GET',
            success: function (j) { 
                var j_len = j.length - 1;
                for (var i = j_len; i >= 0; i--) {
                    load_message(j[i]);
                }
                init_canvas();
            }
        });
    },
    reconnect: function (i) {
        console.log('reconnect attempt ' + i);
        if (i > 0) {
            toast('Trying again in ' + i + ' seconds', 'Connectivity Issues');
            return;
        }
        toast('Trying again in ' + i + ' seconds', 'Reconnecting...');
        game_working = true;
        main('reconnect', function () {
            $('.inline-message').remove();
        });
    },
    deep_sleep: function () {
        if (is_deep_sleep) {
            Icecream.update_flavors();
            Icecream.update_trending();
            Icecream.update_event();
            buff_remove('deep sleep');
        } else {
            buff_add('deep sleep', 'The game will update more slowly to conserve memory');
        }
        is_deep_sleep = !is_deep_sleep;
        console.log('deep sleep: ' + is_deep_sleep);
        socket.emit('sleep', {sleep: is_deep_sleep});

        Icecream.employees_working();
    },
    sync_messages: function(skip) {
        if ($('#message_list').length > 0) return false;
        if (!skip) skip = 0;
        $.ajax({
        url: 'messages', 
        data: { 'skip': skip },
        success: function (messages) {
            $('.new_message').remove();
            if (messages && messages.length > 0) {
                cache_unread_message = false;
                for (var i = 0; i < messages.length; i++) {
                    var msg = messages[i];
                    if (!msg.is_read) {
                        message_display(msg);
                        break;
                    }
                }
            }
        }
    });
    },
    sync_friends: function() { 
        $.ajax({
            url: 'online', 
            data: 'cache=' + Math.random(),
            success: function (j) {
                cache_friends = j.friends;

                var now = new Date();
                var fiveminago = new Date(now.getTime() - 30*60*1000);
                var friend_count = 0;
                var f_l = cache_friends.length;
                for (var i = 0; i < f_l; i++) {
                    var user = cache_friends[i];
                    var is_online = (new Date(user.updated_at).getTime() > fiveminago); 
                    var status = 0;
                    if (is_online) { 
                        status = user.is_away? 1 : 2;
                        friend_count++;
                    }
                    friend_list_add(user.name, status);
                }
                $('.friends_counter span#count').attr('x-length', f_l);
                $('.friends_counter span#count').text(friend_count + '/' + f_l);
                
            }
        });
    },
    sync_online: function() {
        $.ajax({
            url: 'online/all', 
            success: function (j) {
                if (cached_online_count === j.c) {
                    return;
                }
                cached_online_count = j.c;
                if (j.c > cached_online_peak) cached_online_peak = j.c;
                $('#online_count').text( numberWithCommas(j.c) + ' ' + __('Players')).attr('x-peak', cached_online_peak);
            }
        });
    },
    get_quest: function (origin) {
        if (origin) console.log('get_quest, -> ' + origin);
        $.ajax({
            url : 'new_quest',
            data: { o: origin}, 
            dataType: 'JSON',
            success: function (j) {
                if (j.error) {
                    alert(j.error, 'error');
                    return;
                }
                if (j.warn) {
                    toast(j.warn, 'warning');
                    return;
                }
                if (j.time) {
                    user.next_quest_at = j.time;
                    clearInterval(quest_interval);
                    quest_interval = setInterval(function () {
                        Icecream.quests_timer();
                    }, 1000);
                    return;
                }
                if (j && j.name && $('.quests.main_container:visible').length > 0) {
                    user.next_quest_at = null;
                    $('.quests.main_container h4 > .lang')[0].textContent = 'Quests';
                    var reward = 'Extra $1 add-on event bonus';
                    if (j.name == 'Bargaining Time') reward = 'Unlock Workers, chat, and a cow';
                    if (j.name == 'Delusions of Grandeur') reward = 'Unlock Trends and Events';
                    if (j.dynamic_quest) {
                        reward = 'Extra <span class="money_icon">0.25</span> add-on event bonus';
                        j.description = parse_dynamic(j.dynamic_quest);
                    }
                    alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">' + j.description.replace(/\n/g, '<br>') + '<br /><br /><b>' + __('Reward') + '</b> ' + reward + '<div class="button button_quest button_green">Start Quest</div>', __('New Quest') + ': ' + j.name);
                    main('quest'); 
                }
            }
        });
	},
	quests_timer: function () {
	    if (!user.next_quest_at) return;
	    var diff = (new Date(user.next_quest_at) - new Date()) / 1000;
	    var suffix;
	    if (diff < 0) { 
	        user.next_quest_at = null;
	        clearInterval(quest_interval);
	        $('.quests.main_container h4 > .lang')[0].textContent = 'Quests - Unlocking... ';
	        setTimeout(function () {
	            Icecream.get_quest();
	        }, 1000);
	        return false;
	    }
	    if (diff > 60) {
	        var minutes = (diff / 60).toFixed(1);
	        suffix = minutes + ' ' + ((minutes == 1)? 'minute' : 'minutes');
	    } else {
	        var seconds = Math.floor(diff);
	        suffix = seconds  + ' ' + ((seconds == 1)? 'second' : 'seconds');
	    }
	    $('.quests.main_container h4 > .lang')[0].textContent = 'Quests - Next quest unlocks in ' + suffix;
	},
	get_quests: function(origin) {
	    console.log('getting quests');
	    if (user.quests.length == 0) {
	        $('.quest_default').remove(); 
	        $('.quest_list').append('<p class="quest_default">You aren\'t currently on any quests...</p>');
	        if (user.gold > 10) Icecream.get_quest('get_quests');
	        return;
	    }
	    if (user.next_quest_at && new Date(user.next_quest_at) > new Date()) {
	        clearInterval(quest_interval);
	        quest_interval = setInterval(function () {
	            Icecream.quests_timer();
	        }, 1000);
	    } else {
	        var last_quest = user.quests[ user.quests.length - 1];
	        var split = last_quest.split('&');
	        if (split[1] == '0') { //last quest complete
	            Icecream.get_quest();
	        }
	    }
	    $.ajax({
	        url : 'quests',
	        dataType: 'JSON',
	        success: function (j) {
	            if (!j) return false;
	            quests = j;
	            var q_len = user.quests.length - 1;
	            var last_quest = user.quests[q_len].split('&');
	            $('.quest_default').remove(); 
	            for (var i = 0; i <= q_len; i++) {
	                var q = user.quests[i];
	                if (q.substring(0,2) == '!d') {
	                    var user_progress = q.split('&');
	                    var complete = (user_progress[1] == '0')? '<center><img src="'+image_prepend+'/star.png" class="quest_star" /><b>' + __('Completed') + '</b></center>' : '<div class="button complete_quest"><div id="complete_quest_progress"></div><b>' + __('Complete Quest') + '</b></div>';
	                    $('.quest[x-dynamic="' + q + '"]').remove();
	                    $('.quest_list').prepend('<div class="quest" x-dynamic="' + q + '" x-num="' + i + '">' +
	                    '<div class="quest_body">' + parse_dynamic(q) + '<div class="quest_goal"><b>' + __('Reward') + '</b> <span class="money_icon">0.25</span> Event Bonus</div></div>' + complete + '</div>');
	                  } else {
	                    var quest = j[i];
	                    if (typeof quest == 'undefined') break;
	                    
	                    $('.quest[x-id="' + quest._id + '"]').remove(); //just making sure
	                    var user_progress = user.quests[i].split('&');
	                    if (user_progress[2]) {
	                        var cost = user_progress[2];
	                        quest.description = quest.description.replace('[cost]', cost);
	                    }
	                    $('.quest_list').prepend('<div class="quest" x-num="' + i + '" x-id="' + quest._id + '">' +
	                    '<div class="quest_body">' + quest.description + '</div></div>');
	                    
	                    
	                    if (user_progress[1] != '0') {
	                        if (quest.level == 0) {
	                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Become an expert ' + ((cost)? cost : 5 )+ ' with her favourite flavor<br /><b>Reward</b> Unlock Workers, chat, and a cow</div>');
	                        }
	                        if (quest.level == 1) {
	                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Buy ' + cost + ' carts<br /><b>Reward</b> Unlock Trends</div>');
	                        }
	                        if (quest.level == 2) { 
	                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Discover ' + cost + ' combos<br /><b>Reward</b> + <span class="money_icon">1.00</span> event bonus</div>');
	                        }
	                        if (quest.level == 3) {
	                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Buy ' + ((cost)? cost : 2 ) + ' truck' + ((cost != 1)? 's' : '') + '<br /><b>Reward</b> Unlock Frankenflavours</div>');
	                        }
	                        if (quest.level == 4) {
	                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Sell 100 of ' + ((cost)? cost : 5 ) + ' flavors<br /><b>Reward</b>: Unlocks prestige, + $1 event bonus</div>');
	                        }
	                        $('.quest[x-id="' + quest._id + '"]').append('<div class="button complete_quest"><div id="complete_quest_progress"></div><b>' + __('Complete') + ' ' + quest.name + '</b></div>');
	                    } else {
	                        $('.quest[x-id="' + quest._id + '"]').append('<center><img src="'+image_prepend+'/star.png" class="quest_star" /><b>' + __('Completed') + ' ' + quest.name + '</b></center>');
	                    }
	                }
	            }
	            if (user.quests.length == 20 && last_quest[1] == '0') {
	                 $('.quest_list').prepend('<div class="quest"><div class="quest_title">' + __('Prestige') + '</div>' +
	                '<p>When you are ready, go to upgrades and unlock Prestige. You will get a bonus based on cash balance, and the number of flavours and add-ons unlocked. ' +
	                'This restarts the game with a percentage bonus on all income.</p>' +
	                '<img src="' + image_prepend + '/prestige_thumb.png" id="quest_prestige"></div>');
	            }
	            $('.quest').hide();
	            $('.quest:first').show();
	            Icecream.update_quest_bar();
	        }
	    });
	},
	update_trending: function() {
	    if (!cache_event_trend_enable) return;
	    console.log('socket:trending ->');
	    socket.emit('trending');
	},
	update_clock: function(item, seconds_left) { 
	    var mins = Math.floor(seconds_left / 60);
	    var secs = seconds_left % 60;
	    if (seconds_left > 0) {
	        $(item)[0].textContent = mins + ':' + ((secs < 10)? '0' + secs : secs);
	    }
	},
	update_worker_fx: function(origin) {
	    if (origin) console.log('update_worker_fx <- ' + origin);
	    $('.wrapper_addon_thumb').remove();
	    for (var i = 0; i < 5; i++) {
	        var topping = user.toppings[i];
	        if (topping) {
	            var t_len = toppings.length;
	            for (var j = 0; j < t_len; j++) {
	                if (toppings[j]._id === topping) {
	                    topping = toppings[j].name;
	                    break;
	                }
	            }
	            var is_new =  new_art_addons.indexOf(topping) > -1;
	            var url = (!is_new)? image_prepend+'/toppings/' + topping.replace(/\s+/g, '') + '_thumb.png' : image_prepend + '/addons/thumb/' + topping.replace(/\s+/g, '') + '.png.gz';
	            $('#main_base .option_wrapper').eq(i).append('<img src="'+ url + '" x-is-new="' + is_new + '" class="wrapper_addon_thumb" />');
	        }
	    }

	    $('#main_base .option_wrapper .icecream_float').remove();
	    for (var last_worker_fx = 0; last_worker_fx < 5; last_worker_fx++) {
	        //if (last_worker_fx >= user.carts) return;
	        
	        var icecream_to_fx = $('#main_base .option').eq(last_worker_fx);
	        var addon_to_fx = $('#main_addon .option').eq(last_worker_fx);

	        if ( user.flavors.length > last_worker_fx) {
	            var flavour = Icecream.get_flavor(user.flavors[last_worker_fx]);

	            if (user.is_animation_workers && user.carts > last_worker_fx) {
	                $('#main_base .option[x-id="' + flavour._id + '"]').parent().prepend('<div class="icecream_float">' + precise_round(cached_worker_sell_value[last_worker_fx],2).toFixed(2) + '</div>');
	            }
	            //$('.icecream_particle[x-id="' + $(icecream_to_fx).attr('id') + '"]').remove();
	            canvas_cache_workers[last_worker_fx] = new Image();
	            canvas_cache_workers[last_worker_fx].src = image_prepend + "/flavours/thumb/" + flavour.name.replace(/\s+/g, '') + '.png.gz';
	            console.log('loading img: ' + flavour.name.replace(/\s+/g, ''));
	        }
	        if (user.toppings.length > last_worker_fx) {
	            var addon = Icecream.get_addon( user.toppings[last_worker_fx] );
	            canvas_cache_addon[last_worker_fx] = new Image();
	            canvas_cache_addon[last_worker_fx].src = image_prepend + "/toppings/" + addon.name.replace(/\s+/g, '') + '_thumb.png';
	            console.log('loading img: ' + addon.name.replace(/\s+/g, ''));
	        }
	    }
	},
	get_tutorial: function() {
	    $('.tutorial, .tutorial_shadow').remove();

	    if (is_cube) {
	        setTimeout(function () {
	            Icecream.get_tutorial();
	        }, 2000);
	        return false;
	    }
	    if (user.tutorial == 0) { //where to click
	        $('.section-main, .section-side#upgrades, .expertise_bar_outer').css('opacity', 0.25);
	        $('body').append('<div class="tutorial tutorial_0"><h2>' + __('Click Me!') + '</h2><p class="tutorial_text">' +
	            __('Click here and click the scooplings as they appear.') + '. <b>' + __('Click Click!') +
	            '</b></p><div class="tut_ice_cube" x-id="1"></div><div class="triangle-left"></div></div>');
	        for (var i = 0; i < 30; i++) {
	            setTimeout(function () {
	                $('.tut_ice_cube[x-id="1"]').toggleClass('active');
	            }, i * 500);
	        }
	    }
	    if (user.tutorial == 1) {
	        $('.expertise_bar_outer').css('opacity', 1);
	        $('body').append('<div class="tutorial tutorial_2"><h2>' + __('Get better with expertise') + '</h2><p class="tutorial_text">' +
	            __('The more Ice Cream you sell, <b>the better you will get</b> at making it (and the more you can sell it for). This is called ') + '<b>' + __('Expertise') +
	            '</b></p><div class="button next_tutorial button_green">Got it</div><div class="triangle-left"></div></div><div class="tutorial_shadow"></div>');
	    }
	    if (user.tutorial == 2) {
	        $('.section-main, .section-side#upgrades').css('opacity', 1);
	        var top = $('.flavor.main_container').offset().top;
	        $('body').append('<div class="tutorial tutorial_3" style="top: ' + top + 'px;"><h2>' + __('Almost done! Customize here') + '</h2><p class="tutorial_text">' +
	            __('Choose your <b>favourite flavours and add-ons</b> as you unlock them. If you want to see more than your top 5 click Expand.') +
	            '</p><div class="button next_tutorial button_green">Ok cool</div><div class="triangle-left"></div></div><div class="tutorial_shadow"></div>');
	    }
	    if (user.total_gold > 50 && user.tutorial == 3) {
	        $('body').append('<div class="tutorial tutorial_4"><h2>' + __('Buy All The Things!') + '</h2>' +
	        'Research <b>powerful upgrades</b> for your Ice Cream here. Hire workers, or get upgrades.<div class="button next_tutorial button_green">' + __("Let's Start") + 
	        '</div><div class="triangle-right"></div></div><div class="tutorial_shadow"></div>');
	    }
	    if (user.total_gold > 500 && user.tutorial == 4) {
	        $('body').append('<div class="tutorial tutorial_6"><h2>' + __('Connect your Facebook') + '</h2>' +
	        __('Secure your account and find friends that play Ice Cream Stand!<br>') +
	        '<div class="clearfix"></div><br><div class="button next_tutorial">' + __('No thanks') + '</div><a class="button next_tutorial button_facebook" href="/auth/facebook"><i class="fa fa-facebook"></i> Connect</a>' +
	        '</div><div class="tutorial_shadow"></div>');
	        
	    }
	    if (user.total_gold > 500000 && user.tutorial == 5) {
	         $('body').append('<div class="tutorial tutorial_6"><h2>' + __('Support Ice Cream Stand') + '</h2>' +
	         __('Please help keep Ice Cream Stand free and awesome, <b>support us by donating</b> and earn cosmetic rewards.') +
	         '<div class="clearfix"></div><div class="button next_tutorial">' + __('No thanks') + '</div><div x-link="donate" class="button next_tutorial">' +
	          __('Support the game') + '</div></div><div class="tutorial_shadow"></div>');
	    }
	    if (user.total_gold > 5000000 && user.tutorial == 6) {
	        $('body').append('<div class="tutorial tutorial_5"><h2>' + __('Sharing is caring') + '</h2>' +
	        __('If you enjoy Ice Cream Stand <b>please tell your friends</b>. Any time someone you invite completes a quest, you earn money!') +
	        '<div class="clearfix"></div><div class="button next_tutorial button_red">' + __('No thanks') + 
	        '</div><div id="invite" x-link="invite" class="button next_tutorial button_green">' + __('Sure') + '</div></div><div class="tutorial_shadow"></div>');
	    }
	},
	get_flavor: function(id) {
	    var f_len = flavors.length;
	    for (var i = 0; i < f_len; i++) {
	        if (flavors[i]._id === id) {
	            return flavors[i];
	        }
	    }
	    return { name: 'vanilla', value: '?', total_value: '?'};
	},
	get_friend: function(id) {
	    var f_len = cache_friends.length;
	    for (var i = 0; i < f_len; i++) {
	        if (cache_friends[i]._id === id) {
	            return cache_friends[i];
	        }
	    }
	    return;
	},
	get_combo: function(id) {
	    console.log('getting combo with id ' + id);
	    var len = combos.length;
	    for (var i = 0; i < len; i++) {
	        if (combos[i]._id === id) {
	            return combos[i];
	        }
	    }
	    return { name: 'mystery'};
	},
	get_addon: function(id) {
	    var len = toppings.length;
	    for (var i = 0; i < len; i++) {
	        if (toppings[i]._id === id) {
	            return toppings[i];
	        }
	    }
	    return { name: 'cherries'};
	}
};
function update_sell_value(origin) {
    if (origin) console.log('update_sell_value <- ' + origin);
    var total_value = 0;
    var f_len = flavors.length;
    var average_sale = 0;
    var t_len = toppings.length;
    var current_flavor;
    var is_combo = false;
    cache_combo = null;
    for (var i = 0; i < t_len; i++) {
        var t = toppings[i];
        if (t._id == user.last_addon) { 
            total_value += t.value;
            cached_addon_value = t.value;
        }
        for (var j = 0; j < 5; j++) {
            if (typeof user.toppings[j] == 'string' && user.toppings[j] == t._id) {
                var t_value = t.value;
                cached_worker_addon_value[j] = t_value;
                break;
            }
        }
    }
    buff_remove('trend');
    buff_remove('event');
    buff_remove('combo');
    $('.banner#trending, .banner#event, .banner#combo').remove();

    //current equipped flavour
    current_flavor = Icecream.get_flavor(user.last_flavor);
    cached_flavor_value = current_flavor.value;

    var base = parseFloat(cached_flavor_value);
    if (isNaN(base)) {
        return console.log('update sell: base is NaN');
    }
    if (user.last_frankenflavour) {
        var franken_flavour = Icecream.get_flavor(user.last_frankenflavour);
        base = (cached_flavor_value + franken_flavour.value) * 0.75;
    }
    base = base + cached_cone_value;
    if (user.last_flavor === trending_flavor && trending_bonus) base = base + parseFloat(trending_bonus);
    if (user.last_addon === trending_addon && trending_addon) base = base + parseFloat(user.trend_bonus);
    for (var k = 0; k < combos.length; k++) {
        var combo = combos[k];
        if (!combo.franken_id) combo.franken_id = null;
        if (combo.topping_id === user.last_addon && ((combo.flavor_id === user.last_flavor &&  combo.franken_id == user.last_frankenflavour) 
        || (combo.franken_id === user.last_flavor &&  combo.flavor_id == user.last_frankenflavour)) ) {
            base += parseFloat(combo.value);
            $('.current_flavor').attr('x-combo', true)[0].textContent = __(combo.name);
            is_combo = true;
            buff_add('combo', 'The active flavour is a combo, and gives a bonus when sold.');
            cache_combo = combo;
        }
    }
    var expertise_bonus =  base * (.1 * cached_expertise);
    var prestige_bonus = base * (user.prestige_bonus / 100);
    var f_value = base + prestige_bonus + expertise_bonus;
    total_value += f_value;

    for (var i = 0; i < f_len; i++) {
        var flavor = flavors[i];
        for (var j = 0; j < 5; j++) {
            if (typeof user.flavors[j] == 'string' && user.flavors[j] == flavor._id) {
                var base = flavor.value;
                if (flavor._id === trending_flavor && trending_bonus != '') {
                    base = base + parseFloat(trending_bonus);
                    $('#main_base .option_wrapper').eq(j).append('<img src="' + image_prepend + '/banner_trending_small.png" class="banner small" id="trending" />');
                }
                if (user.toppings[j] === trending_addon && trending_addon) {
                    base = base + parseFloat(user.trend_bonus);
                    $('#main_base .option_wrapper').eq(j).append('<img src="' + image_prepend + '/banner_event_small.png" class="banner small" id="trending" />');
                }
                for (var k = 0; k < combos.length; k++) {
                    var combo = combos[k];
                    if (combo.flavor_id === user.flavors[j] && combo.topping_id === user.toppings[j]) {
                        base += parseFloat(combo.value);
                        $('#main_base .option_wrapper').eq(j).append('<img src="' + image_prepend + '/banner_combo_small.png" class="banner small" id="combo" />'); 
                        break;
                    }
                }
                var expertise_bonus = base * ( .1 * parseInt($('#main_base .option_wrapper').eq(j).find('.expertise_level').text()) );
                if (isNaN(expertise_bonus)) { console.log('NaN expertise'); expertise_bonus = 0; }
                var prestige_bonus =  base * (user.prestige_bonus / 100);
                var f_value = cached_worker_addon_value[j] + base + expertise_bonus + prestige_bonus;
                //console.log('updating f_value: ' +','+ cached_addon_value +','+ flavor.value +','+ expertise_value +','+ user.prestige_bonus);
                cached_worker_sell_value[j] = f_value;
                cached_worker_base_value[j] = flavor.value;
                average_sale += f_value;
                break;
            }
        }
    }
    if (!is_combo) {
        if (user.last_frankenflavour) {
            console.log('updating current flavour name (franken)');
            $('.current_flavor').attr('x-combo', false).html( get_franken( user.last_flavor, user.last_frankenflavour ).name);
        } else {
            if (current_flavor) {
                var addon = Icecream.get_addon( user.last_addon );
                if (addon) {
                    $('.current_flavor').attr('x-combo', false).html(current_flavor.name + ' <br/>with ' + addon.name);
                }
            }
        }
    }
    if (user.last_flavor === trending_flavor && trending_flavor != '') {
        buff_add('trend', 'You are selling a trending flavour');
    }
    if (user.last_addon === trending_addon && trending_addon != '') {
        buff_add('event', 'The active add-on is part of an event and gives a bonus when sold');
    }
    cached_sell_value = parseFloat(total_value).toFixed(2);
    $('.current_value').text( cached_sell_value );

    

    var ice_creams_sold = (user.flavors.length >= 5)? 5 : user.flavors.length;
    cached_worker_value = average_sale / ice_creams_sold;

    var cow_bonus = (cow && cow.total_bonus && cow.happiness >= 90)? cached_worker_value * ( cow.total_bonus * 0.01 ) : 0;
    cached_cowbonus_value = cow_bonus;

    cached_worker_total = (cached_worker_value + cow_bonus);
    var sales_time = (5 - (user.upgrade_machinery*0.25));
    var income_per_minute = ((sales_per/sales_time)* cached_worker_total *60) + (user.upgrade_autopilot * 6 * cached_sell_value); //do NOT remove the outer ( )s 
    if (isNaN(income_per_minute)) {
        console.log('income is nan: ' + sales_per + ' - ' + sales_time + ' -> ' + cached_sell_value);
    } else {
        $('.gold_sales span').text( numberWithCommas( (income_per_minute).toFixed(0)) );
    }
    Icecream.update_quest_bar();
} 