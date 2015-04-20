var cached_online_count = 0;
var cached_online_peak = 0;
var cached_last_message = '';
var cached_flavor_index = -1;
var cached_canvas_pointer = false;
var cached_epic;
var cached_rooms = {};
function first_time_init() {
    first_time = false;
    if (location.hash == '#!donate') {
        $('#donate').click();
    }
    if (location.hash == '#!event/winter') {
        tooltip_winter();
    }
    if (location.hash.substring(0,4) == '#!u/') {
        get_usercard( location.hash.substring(4) );
    }
    if (lang !== 'en') {
        var lang_elems = $('.lang').length;
        for (var i = 0; i < lang_elems; i++) {
            var l = $('.lang').eq(i)[0];
            l.textContent = __(l.textContent);
        }
    }
    $('body').attr('x-rand', Math.random() < .5);
    if ($(window).width() < 800) {
        user_me.is_animation_workers = false;
        user_me.is_animation_clouds = false;
        user_me.is_animation_cones = false;
    }
    var socket_data = { query: "id=" + user_me._id + '&name=' + user_me.name  };
    socket = io('http://icecreamstand.ca', socket_data);
    bind_sockets();
    if (user_me.titles) {
        if (user_me.titles[0] == 'The Usurper') {
            $('body').attr('x-epic', 'fallen');
        }
    }
    if (!gold) gold = user_me.gold;
    if (user_me.dunce_until) {
        Icecream.first_time_dunce();
    }
    if (user_me.release_channel == 2) {
        image_prepend = 'https://s3.amazonaws.com/icecreamstand.com';
        console.log('ALPHA: switching off of CDN for quicker updates');
    }
    if (!user_me.active_background) {
        user_me.active_background = 'default';
    }
    $('body').attr('x-background', user_me.active_background);

    if (!user_me.upgrade_silo_hay) {
        user_me.upgrade_silo_hay = 0;
    }
    if (user_me.party_until) {
        Icecream.first_time_party();
    }
    if (user_me.is_animation_lore) {
        $('.lore').addClass('lore_float');
    }
    if (!user_me.silo_hay) user_me.silo_hay = 0;
    $('.silo_bar').css('height', user_me.silo_hay / (175 + (25 * user_me.upgrade_silo_hay)) / 0.01 );
    if (!user_me.chapters_unlocked) user_me.chapters_unlocked = [];
    $('.lore').attr('x-chapters', user_me.chapters_unlocked.length);
    if (user_me.friends.length < 2 && Math.random() < 0.1 && user_me.total_gold > 200 && !user_me.is_guest) {
        setTimeout(function () {
            $.ajax({
                url: '/user/suggestion',
                dataType: 'json',
                success: function(j) {
                    alert('<p>Add some friends and help them out!</p><p>Would you like to add <b class="user_card" x-user="' + j.user + '">' + j.user + '</b> as a friend?<div class="button_container button_friendship_container">' +
                    '<div class="button decline_friendship">No thanks</div><div class="button accept_friendship" x-add="' + j.user + '">Sure!</div></div>', 'Ice Cream Stand is better with friends!');
                }
            });
        }, 5000);
    }
    if (user_me.badges) {
        for (var i = 0; i < user_me.badges.length; i++) {
                            var b = user_me.badges[i];
                            $('.badge_inner').append('<img src="' + image_prepend + '/badges/' + b + '.png" class="individual_badge" x-badge="' + b + '" />');
        }
        if (user_me.badges[0]) $('.badge_selector').css('background-image', 'url("' + image_prepend + '/badges/' + user_me.badges[0] + '.png")');
    }


    $('form#new_message').attr('x-badge', user_me.badges[0]);
    var cols = document.querySelectorAll('.cow');
    [].forEach.call(cols, function(col) {
        col.addEventListener('drop', cow_handleDrop, false);
        col.addEventListener('dragover', item_handleDragOver, false);
        col.addEventListener('dragenter', item_handleDragEnter, false);
        col.addEventListener('dragleave', item_handleDragLeave, false);
    });

    var cols = document.querySelectorAll('.silo');
    [].forEach.call(cols, function(col) {
        col.addEventListener('drop', silo_handleDrop, false);
        col.addEventListener('dragover', item_handleDragOver, false);
        col.addEventListener('dragenter', item_handleDragEnter, false);
        col.addEventListener('dragleave', item_handleDragLeave, false);
    });

    trend_event_active = true;
    Icecream.get_tutorial();
    var canvas = document.getElementById("canvas_main");
    canvas_drop_context = canvas.getContext("2d");
    var canvas = document.getElementById("canvas_sales");
    canvas_sales_context = canvas.getContext("2d");


    setInterval(function () { Icecream.canvas_icecream_sales()}, 100);
    setInterval(function () { Icecream.canvas_icecream_drop(); }, 100);
    //interval_gold = setInterval(function () { Icecream.update_gold()}, 500);
    setInterval(function () { 
        if (is_deep_sleep) return;
        //Icecream.sync_messages();
        Icecream.update_trending();
        Icecream.update_flavors();
        Icecream.cloud( Math.random() * 3 );
        setTimeout(function () {
          Icecream.cloud( Math.random() * 3 );  
        }, 10000);
        Icecream.sync_cow();
    }, 60000);
    Icecream.sync_online();
    Icecream.sync_friends();
    setTimeout(function () {
        Icecream.update_trending();
        Icecream.update_flavors();
        Icecream.sync_chat();
        Icecream.sync_cow();
        Icecream.cloud( Math.random() * 2 );
        init_canvas();
    }, 10);
    setTimeout(function () {
        Icecream.sync_messages();
    }, 2000);
    interval_sell = setInterval(function () {
        Icecream.process_clicks();
    }, 10000);

    Icecream.employees_working();
    populate_easter();
    $('body').addClass( channel[user_me.release_channel] );
    $('#version_info').html('<a href="/stats" id="online_count" target="_blank"></a> <a href="http://blog.samgb.com/tag/ice-cream-stand/" target="_blank" id="version_num">' + version + ' ' + channel[user_me.release_channel] + '</a>');      
}
function main_flavours(update_type, callback) {
     $.ajax({
        url : '/flavors',
        data: { sort: 'cost', limit: (user_me.upgrade_flavor + 1) * 3 },
        type: 'GET',
        dataType: 'JSON',
        success: function (j) {
            //$('#upgrades .flavors_inner').text('');
            if (true || update_type === 'sort_flavour') { 
                $('#main_base .option_wrapper').remove();
            }
                flavors = j; //.sort(function(a, b){ if(a.name < b.name) return -1; if(a.name > b.name) return 1; return 0; });
                    var my_flavors = user_me.flavors.length;
                    var flav_len = flavors.length;
                    for (var i = my_flavors - 1; i >= 0; i--) {
                        var flavor =  user_me.flavors[i];
                        for (var j = 0; j < flav_len; j++) {
                            if (flavors[j]._id === flavor) { flavor = flavors[j]; break; }
                        }
                        if (flavor && flavor.name) {
                            var f_name = flavor.name.replace(/\W+/g, '');
                            if ($('#main_base .option#' + f_name).length === 0) {
                                var src_attr = (i < 5)? 'src' : 'x-src'; 
                                $('#main_base').prepend('<div class="option_wrapper' + ((flavor.value === 0.10)? ' outofstock' : '') + '" style="display: none;" x-new="true"><img ' + src_attr + '="' + image_prepend + '/flavours/thumb/' + f_name+ '.png.gz" draggable="true" id="' + f_name + '" ' + ' x-id="' + flavor._id + '" class="option tooltip" x-base-value="' + flavor.base_value + '" x-value="' + flavor.value + '" x-type="base" /></div>');
                            }
                        }
                    }

                    for (var j = 0; j < flav_len; j++) {
                        var flavor = flavors[j];  
                        if (user_me.flavors.indexOf(flavor._id) === -1) {
                            var f_name = flavor.name.replace(/\W+/g, '');
                            flavor.image = 'https://s3.amazonaws.com/icecreamstand.com/flavours/thumb/' + f_name + '.png.gz';
                            flavor.cost_formatted = numberWithCommas(flavor.cost);
                        }
                    }

                    //wrap
                    $('#main_base.inner_flavor_container .option_wrapper').each(function () {
                        if ($(this).parent().is('.page_wrap')) $(this).unwrap();
                    });
                    var elems = $('#main_base.inner_flavor_container .option_wrapper:gt(4)');
                    for(var i = 0; i < elems.length; i+=15) {
                      elems.slice(i, i+15).wrapAll("<div class='page_wrap' x-page='" + Math.floor(i / 15) + "' style='display:none;'></div>");
                    }

                    if ($('#main_base > .base_active').length === 0) $('#main_base').prepend('<div class="base_active"></div>');
                    update_all_expertise();
                    
                    if ($('#upgrades .flavors_inner').text().length == 0) {
                        if (user_me.upgrade_flavor  < 23) {
                            var src = $('#unlock_research img').attr('x-src');
                            if (src) {
                                $('#unlock_research img').attr('src', src);
                                $('#unlock_research img').removeAttr('x-src');
                            }
                            $('#upgrades .flavors_inner').html($('#unlock_research')[0].outerHTML);
                        } else if (user_me.upgrade_heroic < 3) {
                            var src = $('#unlock_heroic img').attr('x-src');
                            if (src) {
                                $('#unlock_heroic img').attr('src', src);
                                $('#unlock_heroic img').removeAttr('x-src');
                            }
                            $('#upgrades .flavors_inner').html($('#unlock_heroic')[0].outerHTML);
                        } else if (user_me.upgrade_legendary < 3) {
                            var src = $('#unlock_legendary img').attr('x-src');
                            if (src) {
                                $('#unlock_legendary img').attr('src', src);
                                $('#unlock_legendary img').removeAttr('x-src');
                            }
                            $('#upgrades .flavors_inner').html($('#unlock_legendary')[0].outerHTML);
                        } else {
                            $('#upgrades .flavors_inner').html('<h3>' + __('Every flavour unlocked') + '</h3>');
                        }
                    }
                    
                    
                    Icecream.paginate(cached_page);

                    if (update_type && update_type === 'sort_flavour') { 
                        if (callback && typeof callback === 'function') {
                            callback();
                        }
                    }
                    if (update_type && (update_type === 'base')) {
                        if (callback && typeof callback === 'function') {
                            callback();
                        }
                        $('.flavor .option[x-id="' + user_me.last_flavor + '"]').eq(0).click();
                        update_sell_value('base');
                        Icecream.update_worker_fx('main flavours');
                        return;
                    }
                    main_toppings(update_type, callback);
                }
    }); //end flavor call
}
function main_toppings(update_type, callback) {
    $.ajax({
        url : '/toppings',
        data: 'cache=' + Math.random(),
        type: 'GET',
        dataType: 'JSON',
        success: function (j) {
            toppings = j; //.sort(function(a, b){ if(a.name < b.name) return -1; if(a.name > b.name) return 1; return 0; });
            //$('#upgrades .toppings_inner').text('');
            if (true || update_type === 'sort_addon') { 
                $('#main_addon .option_wrapper').remove();
            }
            var top_len = user_me.toppings.length;
            for (var i = top_len -1; i >= 0; i--) {
                var topping = Icecream.get_addon(user_me.toppings[i]);
                var is_new = new_art_addons.indexOf(topping.name) > -1;
                if ($('.option[x-id="' + topping._id + '"]').length === 0) {
                    var topping_name = topping.name.replace(/\s+/g, '');
                    var url = (is_new)? image_prepend + '/addons/thumb/' + topping_name + '.png.gz' : image_prepend + '/toppings/' + topping_name + '_thumb.png'; 
                    $('.flavor div#main_addon').prepend('<div class="option_wrapper" x-new-art="' + is_new + '"><img src="' + url + '" id="' + topping.name + '" x-id="' + topping._id + '" class="option tooltip" x-value="' + topping.value + '" x-type="addon" /></div>');
                }
            }
            // window.unlocked_addons = [];
            for (var i = 0; i < toppings.length; i++) {
                var topping = toppings[i];  
                if (user_me.toppings.indexOf(topping._id) === -1) { //locked
                    var is_new = new_art_addons.indexOf(topping.name) > -1;
                    var topping_name = topping.name.replace(/\s+/g, '');
                    var url = (is_new)? image_prepend + '/addons/thumb/' + topping_name + '.png.gz' : image_prepend + '/toppings/' + topping_name + '_thumb.png'; 
                    topping.image = url;
                    topping.cost_formatted = numberWithCommas(topping.cost);
                    //$('#upgrades .toppings_inner').append('<div class="unlockable" id="' + topping.name + '" x-cost="' + topping.cost + '" x-id="' + topping._id + '" x-type="addon" x-new-art="' + is_new + '"><div class="unlock_art_wrapper tooltip"><img src="' + url + '" /></div><div class="unlock_text">' + __(topping.name) + ' <span class="cost">' + numberWithCommas(topping.cost) + '</span></div><button>' + __('Unlock') + '</button></div>');
                }
            }


            //wrap
            $('#main_addon.inner_flavor_container .option_wrapper').each(function () {
                if ($(this).parent().is('.page_wrap')) $(this).unwrap();
            });
            var elems = $('#main_addon.inner_flavor_container .option_wrapper:gt(4)');
            for(var i = 0; i < elems.length; i+=15) {
                elems.slice(i, i+15).wrapAll("<div class='page_wrap' x-page='" + Math.floor(i / 15) + "' style='display:none;'></div>");
            }

            Icecream.update_worker_fx('first time');
            if (!is_deep_sleep &&  cached_machinery !== user_me.upgrade_machinery) {
                clearInterval(interval_employees);
                interval_employees = setInterval(function () {
                    Icecream.employees_working();
                }, 5000); //TODO should this be accounting for machinery?
                cached_machinery = user_me.upgrade_machinery;
                Icecream.get_quests('main topping');
                $('.flavor .option[x-id="' + user_me.last_flavor + '"]').eq(0).click();  
                $('.flavor .option[x-id="' + user_me.last_addon + '"]').eq(0).click();
                if (user_me.last_addon == 'undefined') $('#main_addon .option').eq(0).click();
            }
                if (user_me.upgrade_addon  < 23) {
                    var src = $('#unlock_addon img').attr('x-src');
                    if (src) {
                        $('#unlock_addon img').attr('src', src);
                        $('#unlock_addon img').removeAttr('x-src');
                    }
                    $('#upgrades .toppings_inner').html($('#unlock_addon')[0].outerHTML);
                } else if (user_me.upgrade_heroic < 3) {
                    var src = $('#unlock_heroic img').attr('x-src');
                    if (src) {
                        $('#unlock_heroic img').attr('src', src);
                        $('#unlock_heroic img').removeAttr('x-src');
                    }
                    $('#upgrades .toppings_inner').html($('#unlock_heroic')[0].outerHTML);
                } else if (user_me.upgrade_legendary < 3) {
                    var src = $('#unlock_legendary img').attr('x-src');
                    if (src) {
                        $('#unlock_legendary img').attr('src', src);
                        $('#unlock_legendary img').removeAttr('x-src');
                    }
                    $('#upgrades .toppings_inner').html($('#unlock_legendary')[0].outerHTML);
                } else {
                    $('#upgrades .toppings_inner').html('<h3>' + __('Every add-on unlocked') + '</h3>');
                }
            if (callback && typeof callback === 'function') {
                callback();
            }
        } //end success call
    });
}
function main(update_type, callback) {
    console.log('main <- ' + update_type);

    if (update_type && (update_type === 'base')) {
        main_flavours(update_type, callback);
        return;
    }
    if (update_type && (update_type === 'addon')) {
        main_toppings(update_type, callback);
        return;
    }
    $.ajax({
        url : '/me',
        type: 'GET',
        dataType: 'JSON',
        timeout: 10000,
        success: function (j) {
            me_callback(j, update_type, callback);
        },
        error: function (j) {
            if (game_working) {
                game_working = false;
                connect_fails++;
                if (connect_fails > 20) {
                    connect_fails = 20;
                }
                var timeout = connect_fails * 10;
                toast( __('Trying again in') + ' ' + timeout + ' ' + __('seconds'), 'Connectivity Issues');
                for (var i = 0; i <= timeout; i++) {
                    setTimeout("Icecream.reconnect(" + (timeout - i) + ")", 1000 * i);
                }
            }
        }
    });
}
function me_callback(j, update_type, callback) {
    if (!j.badges) j.badges = [];
    if (!j.cones) j.cones = [];
    if (!j.ignore) {
        j.ignore = '';
    } else {
        j.ignore_list = j.ignore.split(',');
    }
    if (!j.upgrade_coldhands) j.upgrade_coldhands = 0;
    if (!j.badge_off) j.badge_off = false;
    if (j.is_night) {
        $('body:not(.night)').addClass('night');
    } else if (j.is_auto_daynight && new Date().getHours() > 20) {
        $('body:not(.night)').addClass('night');
    }
    if (!j.last_icecube_at && j.total_gold < 100) j.last_icecube_at = new Date();
    buff_remove('firstwin');
    cache_first_win_avail = false;
    if (!j.last_icecube_at || new Date() - new Date(j.last_icecube_at) > 1000 * 60 * 60 * 24 ) {
            cache_first_win_avail = true;
            buff_add('firstwin', 'Daily x2 Ice Cube Bonus available');
    }
    $('.friend_gold').remove();
    if (j.friend_gold) {
        $('.floating_footer').append('<div class="friend_gold"><span class="money_icon is_white">' + numberWithCommas( (j.friend_gold).toFixed(0) ) + '</span><img src="' + image_prepend + '/moneybag.png" id="moneybag" /></div>');
    }

    user_me = j;
    if (first_time) {
        first_time_init();
    }

    if (update_type && (update_type === 'badges')) {
                $('.badge_inner .individual_badge').remove();
                if (user_me.badges) {
                    for (var i = 0; i < user_me.badges.length; i++) {
                            var b = user_me.badges[i];
                            $('.badge_inner').append('<img src="' + image_prepend + '/badges/' + b + '.png" class="individual_badge" x-badge="' + b + '" />');
                    }
                    if (user_me.badges[0]) $('.badge_selector').css('background-image', 'url("' + image_prepend + '/badges/' + user_me.badges[0] + '.png")');
                }
    }
            if (user_me.release_channel > 0) debug_mode = true;
            if (user_me.is_guest && user_me.total_gold > 1000) {
                $('body').append('<h4 class="inline-message view_settings" id="guest" style="cursor:pointer;">' + __('Set a name and password!') + '<br />' +
                '<small>' + __('Click here to save your account and set a username.') + '</small></h4>'); 
            }
            if (!user_me.email && user_me.total_gold > 200000) {
                $('body').append('<h4 class="inline-message view_settings" id="guest" style="cursor:pointer;">' + __('Set an Email') + '<br />' +
                '<small>' + __('Secure your account and set your email address by clicking here.') + '</small></h4>'); 
            }
            if (!user_me.email_verified && user_me.email && user_me.total_gold > 200000) {
                $('body').append('<h4 class="inline-message view_settings" id="guest" style="cursor:pointer;">' + __('Verify your email address') + '<br />' +
                '<small>' + __('If you did not get a verification email go to settings to re-send.') + '</small></h4>'); 
            }
            $('.login #name').text(j.name).attr('x-user', j.name).prepend('<i class="fa fa-cog"></i>').css('display', 'inline-block');
            $('.inventory_item').remove();
            var items_len = user_me.items;
            for (var i = 0; i < items_len; i++) {
                var item = user_me.items[i];
                $('.floating_footer').append('<div class="inventory_item tooltip" x-type="inventory" x-name="' + item + '"><img src="' + image_prepend + '/items/' + item.replace(/\s+/g, '') + '.png" /></div>');
            }
            update_worker_tiers();
            
            if (user_me.carts == 1000) achievement_register('52b5361e174e8f0000000003');

            if (!user_me.display_settings) user_me.display_settings = [1, 1, 1, 1];
            if (!user_me.quests[1] || user_me.quests[1].split('&')[1] !== '0') {
                console.log('hiding trends');
                user_me.display_settings = [1, 1, 0, 1];
            }

            if (user_me.quests.length > 1 || (user_me.quests[0] && user_me.quests[0].split('&')[1] == '0')) $('.tab#employees').removeClass('locked');
            if (user_me.quests.length > 2 || (user_me.quests[1] && user_me.quests[1].split('&')[1] == '0')) {
                if (!cache_event_trend_enable) {
                    cache_event_trend_enable = true;
                    Icecream.update_event();
                    $('.trending_and_events.main_container').removeClass('hidden');
                }
            }
            
            if (user_me.display_settings[0] == 0) { $('.flavor.main_container').addClass('hidden'); } else {  $('.flavor.main_container').removeClass('hidden'); }
            if (user_me.display_settings[1] == 0) { $('.quests.main_container').addClass('hidden'); } else {  $('.quests.main_container').removeClass('hidden'); }
            if (user_me.display_settings[2] == 0) { $('.trending_and_events.main_container').addClass('hidden');  } else {  $('.trending_and_events.main_container').removeClass('hidden'); }
            if (user_me.display_settings[3] == 0) { $('.chat.main_container').addClass('hidden');  } else {  $('.chat.main_container').removeClass('hidden'); }
            if (user_me.display_settings[1] == 1 && user_me.display_settings[2] == 0) {
                $('.quests.main_container').removeClass('half_size');
            }
            if (user_me.display_settings[1] == 0 && user_me.display_settings[2] == 1) {
                $('.trending_and_events.main_container').removeClass('half_size');
            }
            if (user_me.display_settings[2] != 0 && user_me.display_settings[1] != 0) {
                $('.quests.main_container:not(.half_size)').addClass('half_size');
                $('.trending_and_events.main_container:not(.half_size)').addClass('half_size');
            }
            
    cached_flavor_length = user_me.flavors.length;
    get_prestige_bonus(user_me);  

    if (update_type && (update_type === 'carts' || update_type === 'employees' || update_type === 'trucks' || 
                update_type === 'robots' || update_type === 'rockets' || update_type === 'aliens' || update_type === 'repaint' )) {
                Icecream.update_worker_fx('main workers');
                update_sell_value('bought worker');
                if (callback && typeof callback === 'function') callback();
                return;
    }
    if (update_type && (update_type === 'quest')) {
        console.log('getting quests...');
        Icecream.get_quests();
        //Icecream.get_quest('me_callback');
        return;
    }
    populate_cones();
    main_flavours(update_type, callback);
}
function update_worker_tiers() {

    sales_per = user_me.carts + (user_me.employees*2) + (user_me.trucks*3) + (user_me.robots*5) + (user_me.rockets*10) + (user_me.aliens*15) ;
    $('#unlock_machine').attr('x-cost', (15000 + (user_me.upgrade_machinery * 150000)) );
    $('#unlock_machine .cost').text(numberWithCommas(15000 + (user_me.upgrade_machinery * 150000)));
    $('#unlock_machine .sale_level').text(user_me.upgrade_machinery);

    var flavour_res_cost = 50 + (user_me.upgrade_flavor * user_me.upgrade_flavor * 100);
    $('#unlock_research').attr('x-cost', flavour_res_cost).find('.cost').text(numberWithCommas( flavour_res_cost));

    var addon_res_cost = 75 + (user_me.upgrade_addon * user_me.upgrade_addon * 100);
    $('#unlock_addon').attr('x-cost', addon_res_cost).find('.cost').text(numberWithCommas( addon_res_cost ));

    var heroic_cost = 1000000 + (3000000 * user_me.upgrade_heroic);
    $('#unlock_heroic').attr('x-cost', heroic_cost).find('.cost').text(numberWithCommas( heroic_cost )); 

    var legendary_cost = 50000000 + (100000000 * user_me.upgrade_legendary);
    $('#unlock_legendary').attr('x-cost', legendary_cost).find('.cost').text(numberWithCommas( legendary_cost)); 

    $('#unlock_autopilot .unlock_text .cost')[0].textContent = numberWithCommas( Math.floor(get_cost(user_me.upgrade_autopilot, 'autopilot')) );
    $('#unlock_autopilot .sale_level').text(user_me.upgrade_autopilot);
    $('#unlock_coldhands .unlock_text .cost')[0].textContent = numberWithCommas(  Math.floor(get_cost(user_me.upgrade_coldhands, 'coldhands')) );
    $('#unlock_coldhands .sale_level').text(user_me.upgrade_coldhands);

    $('.employees_inner .unlockable').each(function () {
        var worker = $(this).attr('x-worker');
        var level = user_me[worker + 's'];
        var cost = Math.floor( get_cost(level, worker) );

        $(this).attr('x-cost', cost);
        $(this).find('.unlock_text .cost')[0].textContent = numberWithCommas( cost ) + ' (x1)';
        $(this).find('.sale_level')[0].textContent = level;
    });
    $('#unlock_prestige .sale_level').text(user_me.prestige_level);
    $('#unlock_frankenflavour .sale_level').text(user_me.upgrade_frankenflavour);
    if (user_me.upgrade_machinery > 0) $('.option[x-type="machine"]').show();
    if (user_me.upgrade_machinery === 10) $('#unlock_machine').hide();
    if (user_me.upgrade_autopilot === 250) $('#unlock_autopilot').hide();
    if (user_me.upgrade_coldhands === 1000) $('#unlock_coldhands').hide();
    if (user_me.upgrade_frankenflavour === 3) $('#unlock_frankenflavour').hide();
    if (user_me.upgrade_heroic > 0) {
        $('#unlock_heroic .sale_level').text(user_me.upgrade_heroic);
    }
    if (user_me.upgrade_legendary > 0) {
        $('#unlock_legendary .sale_level').text(user_me.upgrade_legendary);
    }
    if (user_me.carts < 10) {
        $('#unlock_employee').addClass('locked');
    } else {
        $('#unlock_employee').removeClass('locked');
    }
    if (user_me.employees < 10) {
        $('#unlock_truck').addClass('locked');
    } else {
        $('#unlock_truck').removeClass('locked');
    }
    if (user_me.trucks < 25) {
        $('#unlock_robot').addClass('locked');
    } else {
        $('#unlock_robot').removeClass('locked');
    }
    if (user_me.robots < 75) {
        $('#unlock_rocket').addClass('locked');
    } else {
        $('#unlock_rocket').removeClass('locked');
    }
    if (user_me.rockets < 200) {
        $('#unlock_alien').addClass('locked');
    } else {
        $('#unlock_alien').removeClass('locked');
    }
    if (user_me.upgrade_frankenflavour > 0) {
        $('#frankenflavour_tab').show();
    }
    if (user_me.upgrade_legendary == 3) $('#unlock_legendary .cost,#unlock_legendary button').hide();
    if (user_me.carts > 50) achievement_register('52b535fd174e8f0000000001');
    if (user_me.carts >= 250) achievement_register('52b53613174e8f0000000002');
    if (user_me.carts == 1000 && user_me.employees == 1000 &&
        user_me.trucks == 1000 && user_me.robots == 1000 && 
        user_me.rockets == 1000 && user_me.aliens == 1000) achievement_register('537bebae2b2b13b56a283b44');
}