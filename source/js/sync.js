var cached_online_count = 0;
var cached_online_peak = 0;
var cached_last_message = '';
var cached_flavor_index = -1;
var cached_canvas_pointer = false;
var cached_epic;
var cached_rooms = {};
function first_time_init() {
    first_time = false;
    if (user.release_channel == 2) {
        toast('This is an ALPHA version used for development.', 'ALPHA');
    }
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
        user.is_animation_workers = false;
        user.is_animation_clouds = false;
        user.is_animation_cones = false;
    }
    if (user.titles) {
        if (user.titles[0] == 'The Usurper') {
            $('body').attr('x-epic', 'fallen');
        }
    }
    if (!gold) gold = user.gold;
    if (user.dunce_until) {
        Icecream.first_time_dunce();
    }
    if (user.release_channel == 2) {
        image_prepend = 'https://s3.amazonaws.com/icecreamstand.com';
        console.log('ALPHA: switching off of CDN for quicker updates');
    }
    if (!user.active_background) {
        user.active_background = 'default';
    }
    $('body').attr('x-background', user.active_background);

    if (!user.upgrade_silo_hay) {
        user.upgrade_silo_hay = 0;
    }
    if (user.party_until) {
        Icecream.first_time_party();
    }
    if (user.is_animation_lore) {
        $('.lore').addClass('lore_float');
    }
    if (!user.silo_hay) user.silo_hay = 0;
    $('.silo_bar').css('height', user.silo_hay / (175 + (25 * user.upgrade_silo_hay)) / 0.01 );
    if (!user.chapters_unlocked) user.chapters_unlocked = [];
    $('.lore').attr('x-chapters', user.chapters_unlocked.length);
    if (user.friends.length < 2 && Math.random() < 0.1 && user.total_gold > 200 && !user.is_guest) {
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
    if (user.badges) {
        for (var i = 0; i < user.badges.length; i++) {
                            var b = user.badges[i];
                            $('.badge_inner').append('<img src="' + image_prepend + '/badges/' + b + '.png" class="individual_badge" x-badge="' + b + '" />');
        }
        if (user.badges[0]) $('.badge_selector').css('background-image', 'url("' + image_prepend + '/badges/' + user.badges[0] + '.png")');
    }


    $('form#new_message').attr('x-badge', user.badges[0]);
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
    $('body').addClass( channel[user.release_channel] );
    $('#version_info').html('<a href="/stats" id="online_count" target="_blank"></a> <a href="http://blog.samgb.com/tag/ice-cream-stand/" target="_blank" id="version_num">' + version + ' "' + version_name + '" ' + channel[user.release_channel] + '</a>');
}
function main_flavours(update_type, callback) {
    //      $.ajax({
    //         url : '/flavors',
    //         data: { sort: 'cost', limit: (user.upgrade_flavor + 1) * 3 },
    //         type: 'GET',
    //         dataType: 'JSON',
    //         success: function (j) {
    //                 //flavors = j;



    //                 }
    //     }); //end flavor call

    if (update_type && update_type === 'sort_flavour') { 
        if (callback && typeof callback === 'function') {
            callback();
        }
    }
    if (update_type && (update_type === 'base')) {
        if (callback && typeof callback === 'function') {
            callback();
        }
        $('.flavor .option[x-id="' + user.last_flavor + '"]').eq(0).click();
        update_sell_value('base');
        Icecream.update_worker_fx('main flavours');
        return;
    }
    main_toppings(update_type, callback);
}
function main_toppings(update_type, callback) {
    $.ajax({
        url : '/addons.json',
        data: 'cache=' + Math.random(),
        type: 'GET',
        dataType: 'JSON',
        success: function (j) {
            toppings = j;

            Icecream.update_worker_fx('first time');
            if (!is_deep_sleep &&  cached_machinery !== user.upgrade_machinery) {
                clearInterval(interval_employees);
                interval_employees = setInterval(function () {
                    Icecream.employees_working();
                }, 5000); //TODO should this be accounting for machinery?
                cached_machinery = user.upgrade_machinery;
                Icecream.get_quests('main topping');
            }

            setTimeout(function () {
                flavour_switch(user.last_flavor);
                addon_switch(user.last_addon);
            }, 3000);

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

    user = j;
    if (first_time) {
        first_time_init();
    }

    if (update_type && (update_type === 'badges')) {
                $('.badge_inner .individual_badge').remove();
                if (user.badges) {
                    for (var i = 0; i < user.badges.length; i++) {
                            var b = user.badges[i];
                            $('.badge_inner').append('<img src="' + image_prepend + '/badges/' + b + '.png" class="individual_badge" x-badge="' + b + '" />');
                    }
                    if (user.badges[0]) $('.badge_selector').css('background-image', 'url("' + image_prepend + '/badges/' + user.badges[0] + '.png")');
                }
    }
            if (user.release_channel > 0) debug_mode = true;
            if (user.is_guest && user.total_gold > 1000) {
                $('body').append('<h4 class="inline-message view_settings" id="guest" style="cursor:pointer;">' + __('Set a name and password!') + '<br />' +
                '<small>' + __('Click here to save your account and set a username.') + '</small></h4>'); 
            }
            if (!user.email && user.total_gold > 200000) {
                $('body').append('<h4 class="inline-message view_settings" id="guest" style="cursor:pointer;">' + __('Set an Email') + '<br />' +
                '<small>' + __('Secure your account and set your email address by clicking here.') + '</small></h4>'); 
            }
            if (!user.email_verified && user.email && user.total_gold > 200000) {
                $('body').append('<h4 class="inline-message view_settings" id="guest" style="cursor:pointer;">' + __('Verify your email address') + '<br />' +
                '<small>' + __('If you did not get a verification email go to settings to re-send.') + '</small></h4>'); 
            }
            $('.login #name').text(j.name).attr('x-user', j.name).prepend('<i class="fa fa-cog"></i>').css('display', 'inline-block');
            $('.inventory_item').remove();
            var items_len = user.items;
            for (var i = 0; i < items_len; i++) {
                var item = user.items[i];
                $('.floating_footer').append('<div class="inventory_item tooltip" x-type="inventory" x-name="' + item + '"><img src="' + image_prepend + '/items/' + item.replace(/\s+/g, '') + '.png" /></div>');
            }
            update_worker_tiers();
            
            if (user.carts == 1000) achievement_register('52b5361e174e8f0000000003');

            if (!user.display_settings) user.display_settings = [1, 1, 1, 1];
            if (!user.quests[1] || user.quests[1].split('&')[1] !== '0') {
                console.log('hiding trends');
                user.display_settings = [1, 1, 0, 1];
            }

            if (user.quests.length > 1 || (user.quests[0] && user.quests[0].split('&')[1] == '0')) $('.tab#employees').removeClass('locked');
            if (user.quests.length > 2 || (user.quests[1] && user.quests[1].split('&')[1] == '0')) {
                if (!cache_event_trend_enable) {
                    cache_event_trend_enable = true;
                    Icecream.update_event();
                    $('.trending_and_events.main_container').removeClass('hidden');
                }
            }
            
            if (user.display_settings[0] == 0) { $('.flavor.main_container').addClass('hidden'); } else {  $('.flavor.main_container').removeClass('hidden'); }
            if (user.display_settings[1] == 0) { $('.quests.main_container').addClass('hidden'); } else {  $('.quests.main_container').removeClass('hidden'); }
            if (user.display_settings[2] == 0) { $('.trending_and_events.main_container').addClass('hidden');  } else {  $('.trending_and_events.main_container').removeClass('hidden'); }
            if (user.display_settings[3] == 0) { $('.chat.main_container').addClass('hidden');  } else {  $('.chat.main_container').removeClass('hidden'); }
            if (user.display_settings[1] == 1 && user.display_settings[2] == 0) {
                $('.quests.main_container').removeClass('half_size');
            }
            if (user.display_settings[1] == 0 && user.display_settings[2] == 1) {
                $('.trending_and_events.main_container').removeClass('half_size');
            }
            if (user.display_settings[2] != 0 && user.display_settings[1] != 0) {
                $('.quests.main_container:not(.half_size)').addClass('half_size');
                $('.trending_and_events.main_container:not(.half_size)').addClass('half_size');
            }
            
    cached_flavor_length = user.flavors.length;
    get_prestige_bonus(user);  

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

    sales_per = user.carts + (user.employees*2) + (user.trucks*3) + (user.robots*5) + (user.rockets*10) + (user.aliens*15) ;
    $('#unlock_machine').attr('x-cost', (15000 + (user.upgrade_machinery * 150000)) );
    $('#unlock_machine .cost').text(numberWithCommas(15000 + (user.upgrade_machinery * 150000)));
    $('#unlock_machine .sale_level').text(user.upgrade_machinery);

    var flavour_res_cost = 50 + (user.upgrade_flavor * user.upgrade_flavor * 100);
    $('#unlock_research').attr('x-cost', flavour_res_cost).find('.cost').text(numberWithCommas( flavour_res_cost));

    var addon_res_cost = 75 + (user.upgrade_addon * user.upgrade_addon * 100);
    $('#unlock_addon').attr('x-cost', addon_res_cost).find('.cost').text(numberWithCommas( addon_res_cost ));

    var heroic_cost = 1000000 + (3000000 * user.upgrade_heroic);
    $('#unlock_heroic').attr('x-cost', heroic_cost).find('.cost').text(numberWithCommas( heroic_cost )); 

    var legendary_cost = 50000000 + (100000000 * user.upgrade_legendary);
    $('#unlock_legendary').attr('x-cost', legendary_cost).find('.cost').text(numberWithCommas( legendary_cost)); 

    $('#unlock_autopilot .unlock_text .cost')[0].textContent = numberWithCommas( Math.floor(get_cost(user.upgrade_autopilot, 'autopilot')) );
    $('#unlock_autopilot .sale_level').text(user.upgrade_autopilot);
    $('#unlock_coldhands .unlock_text .cost')[0].textContent = numberWithCommas(  Math.floor(get_cost(user.upgrade_coldhands, 'coldhands')) );
    $('#unlock_coldhands .sale_level').text(user.upgrade_coldhands);

    $('.employees_inner .unlockable').each(function () {
        var worker = $(this).attr('x-worker');
        var level = user[worker + 's'];
        var cost = Math.floor( get_cost(level, worker) );

        $(this).attr('x-cost', cost);
        $(this).find('.unlock_text .cost')[0].textContent = numberWithCommas( cost ) + ' (x1)';
        $(this).find('.sale_level')[0].textContent = level;
    });
    $('#unlock_prestige .sale_level').text(user.prestige_level);
    $('#unlock_frankenflavour .sale_level').text(user.upgrade_frankenflavour);
    if (user.upgrade_machinery > 0) $('.option[x-type="machine"]').show();
    if (user.upgrade_machinery === 10) $('#unlock_machine').hide();
    if (user.upgrade_autopilot === 250) $('#unlock_autopilot').hide();
    if (user.upgrade_coldhands === 1000) $('#unlock_coldhands').hide();
    if (user.upgrade_frankenflavour === 3) $('#unlock_frankenflavour').hide();
    if (user.upgrade_heroic > 0) {
        $('#unlock_heroic .sale_level').text(user.upgrade_heroic);
    }
    if (user.upgrade_legendary > 0) {
        $('#unlock_legendary .sale_level').text(user.upgrade_legendary);
    }
    if (user.carts < 10) {
        $('#unlock_employee').addClass('locked');
    } else {
        $('#unlock_employee').removeClass('locked');
    }
    if (user.employees < 10) {
        $('#unlock_truck').addClass('locked');
    } else {
        $('#unlock_truck').removeClass('locked');
    }
    if (user.trucks < 25) {
        $('#unlock_robot').addClass('locked');
    } else {
        $('#unlock_robot').removeClass('locked');
    }
    if (user.robots < 75) {
        $('#unlock_rocket').addClass('locked');
    } else {
        $('#unlock_rocket').removeClass('locked');
    }
    if (user.rockets < 200) {
        $('#unlock_alien').addClass('locked');
    } else {
        $('#unlock_alien').removeClass('locked');
    }
    if (user.upgrade_frankenflavour > 0) {
        $('#frankenflavour_tab').show();
    }
    if (user.upgrade_legendary == 3) $('#unlock_legendary .cost,#unlock_legendary button').hide();
    if (user.carts > 50) achievement_register('52b535fd174e8f0000000001');
    if (user.carts >= 250) achievement_register('52b53613174e8f0000000002');
    if (user.carts == 1000 && user.employees == 1000 &&
        user.trucks == 1000 && user.robots == 1000 && 
        user.rockets == 1000 && user.aliens == 1000) achievement_register('537bebae2b2b13b56a283b44');
}