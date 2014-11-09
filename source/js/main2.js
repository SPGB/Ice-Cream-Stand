Icecream = (function(){ //encapsulate that, homie!
"use strict";
var version = '1.42';
var user_me = { name : 'newbie', gold : 0};
var cow = { happiness: 75};
var flavors = [];
var toppings = [];
var gold = null;
var color_pool = ['9a2f2f', '5f2f9a', '2f8f9a', '2f9a39', '919a2f', '52509e', '454392', '4b4975', '9a2f8f']; //for click fx
var trending_flavor; //id
var trending_bonus = 0;
var trending_addon; //id
var first_time = true;
var combos = [];
var cache_combo; //current combo
var cached_sell_value = 0;
var cached_cowbonus_value = 0;
var cached_worker_value = 0;
var cached_addon_value = 0;
var cached_flavor_length = 0;
var cached_flavor_value = 0;
var cached_progress;
var cached_worker_total;
var cached_worker_sell_value = [0,0,0,0,0];
var cached_worker_base_value = [0,0,0,0,0];
var cached_worker_addon_value = [0,0,0,0,0];
var cached_cone_value = 0;
var cached_cone = 'default';
var cached_machinery;
var cache_sell_num = 0
var cache_sell_inactive = 0
var sales_per = 0; //number of sales every 5 secs
var dragSrcEl = null;
var last_worker_fx = 0; //0 through 4
var map_control_active = '';
var connect_fails = 0;
var quests = {};
var trend_event_active = false;
var disable_animations = false;
var debug_mode = false;
var window_focus = true;
var background_animation_num = 0;
//10000+4000+2400+1600+900+600+300+150+50+15
var expertise_reqs = [15,50,150,300,600,900,1600,2400,4000,10000,50000, 95000, 225000, 1000000, 5000000, 10000000];
var cached_expertise = 0;
var canvas_cache_width = 0;
var canvas_cache_height = 0;
var canvas_drop_cache = [];
var canvas_drop_cache_len = 0;
var canvas_drop_clouds = [];
var canvas_drop_clouds_len = 0;
var cached_page = 0;
var canvas_drop_context;
var canvas_sales_context;
var canvas_cache_cone;
var canvas_cache_sale_cold;
var cache_item_pool = [];
var canvas_cache_cloud = [];
var canvas_cache_sales = [];
var canvas_icecream_sales_dirty = true;
var canvas_cache_workers = [0,0,0,0,0,0,0]; //the flavor images
var canvas_cache_addon = [0,0,0,0,0,0,0]; //the addon images
var cached_online_count = 0;
var cached_online_peak = 0;
var cached_last_message = '';
var cached_flavor_index = -1;
var cached_canvas_pointer = false;
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
var win_height = 0, doc_height = 0;
var messages = [];
var alert_queue = [];
var alert_current;
var alert_active = false;
var canvas_width = 0;
var speed = 15; 
var is_deep_sleep = false;
var is_chatting = false;
var item_remove = true;
var socket;
var typing_cache = {};
$(document).ready(function () {
    lang = $('html').attr('lang');
    canvas_cache_height = $(document).height();
    if (lang !== 'en') {
        $.ajax({
            url: image_prepend + '/' + $('html').attr('lang') + '.json.gz',
            type: 'GET',
            dataType: 'JSON',
            success: function (j) {
                cached_language = j;
            }, error: function (j) {
                console.log('error loading languages: ' + j);
            }
        });
    }
    main('start', function () {
        cow_hay();
    });
    $('body').on('click', '.flavor .flavor_tab', function () {
        var xid = $(this).attr('x-id');
        $('.flavor .inner_flavor_container').hide();
        $('#' + xid).show().find('img[x-src]').each(function () {
            var xsrc = $(this).attr('x-src');
            if (typeof xsrc !== 'undefined') {
                $(this).attr('src', xsrc).removeAttr('x-src');
            }
        });
        $('.flavor .flavor_tab.active').removeClass('active');
        $(this).addClass('active');
        $('.filter_box').remove();
        if ($(this).parent().find('.expand').hasClass('active')) Icecream.paginate(0);
        if (xid == 'main_combo') {
            var that = this;
            $.ajax({
                url : '/me',
                type: 'GET',
                dataType: 'JSON',
                success: function (j) {
                    user_me = j;
                    $.ajax({
                        url : '/combos',
                        type: 'GET',
                        dataType: 'JSON',
                        success: function (j) {
                            combos = j;
                            var combo_len = user_me.combos.length;
                            for (var i = 0; i < combo_len; i++) {
                                var combo_id = user_me.combos[i];
                                if ($('.combo_option[x-id="' + combo_id + '"]').length === 0) {
                                    var combo = Icecream.get_combo(combo_id);
                                    var combo_franken = null;
                                    var flavor = Icecream.get_flavor(combo.flavor_id);
                                    var addon = Icecream.get_addon(combo.topping_id);
                                    if (combo.franken_id) combo_franken = Icecream.get_flavor(combo.franken_id);

                                    var div = $('<div />', {
                                            'class': 'combo_option tooltip option', 
                                                    'x-type': 'combo', 
                                                    'x-id': combo_id, 
                                                    'x-addon': addon._id, 
                                                    'x-flavor': flavor._id,
                                                    'x-franken': combo.franken_id,
                                                    'x-value': combo.value,
                                                    'x-name': combo.name,
                                            'draggable': true,
                                            'style': 'background-image:url(' + image_prepend + '/toppings/' + addon.name.replace(/\W/g, '') + '.png), url('+image_prepend+'/' + flavor.name.replace(/\s+/g, '') + '_thumb.png)',
                                            'html': combo.name + ( (combo_franken)? '<div class="combo_split" style="background-image: url('+image_prepend+'/' + combo_franken.name.replace(/\s+/g, '') + '_thumb.png)"></div>' : '')
                                    });

                                    $('.flavor div#main_combo').prepend(div);
                                    $(div).wrap('<div class="option_wrapper"></div>');
                                }
                            }
                            if ($(that).parent().find('.expand').hasClass('active')) Icecream.paginate(0);
                        }
                    }); //end combos call
                }
            });
            
        } else if (xid == 'main_franken') {
            $('#main_franken').remove();
            $('.flavor').append('<div class="inner_flavor_container" id="main_franken">' +
                '<div class="col_3 franken_left"><div class="option_wrapper"></div></div>' +
                '<div class="col_3 franken_center"><b>&lt; - - - - - &gt;</b><p>Select your flavours<br><br></p><button>Combine!</button></div><div class="col_3 franken_right"><div class="option_wrapper"></div></div></div>');
            //$('.col_2.franken_left .option_wrapper').html( $('#main_base .option.selected')[0].outerHTML );
        }
        init_canvas();
    });
    $('body').on('click', '.franken_option', function () {
        var f_text = $(this).text();
        var f_len = flavors.length;
        var f;
        for (var i = 0; i < f_len; i++) {
            f = flavors[i];
            if (f.name == f_text) break;
        }
        var f_name = f.name.replace(/\s+/g, '');
        
        $(this).closest('.col_3').find('.option_wrapper').html('<img x-type="base" x-value="' + f.value + '" x-base-value="' + f.base_value + '" class="option tooltip" x-id="' + f._id + '" id="' + f_name + '" src="' + image_prepend + '/' + f_name + '_thumb.png">');
        $('.franken_selector').remove();
        $('.franken_center p').html( get_franken_info() );
        $('.franken_center b').html( get_franken_image() );
    });
    $('body').on('click', '#main_franken button', function () {
        var f_1 = $('.col_3.franken_left .option').attr('x-id');
        var f_2 = $('.col_3.franken_right .option').attr('x-id');
        if (!f_1 || !f_2 || f_1 == f_2) {
            return alert('Please select two different flavours to combine.');
        }
        
        $.ajax({
            url: '/last/franken',
            data: { one: f_1, two: f_2},
            dataType: 'json',
            type: 'POST',
            success: function (j) {
                if (j.message) {
                    return alert(j.message);
                }
                user_me.last_flavor = f_1;
                user_me.last_frankenflavour = f_2;
                main('base');
                _gaq.push(['_trackEvent', 'Flavour', 'Combined a frankenflavour', $('#franken_name').text()]);
            }
        });
    });
    $('body').on('click', '#main_franken .option_wrapper', function (e) {
        $('.franken_selector').remove();
        $(this).after('<div class="franken_selector"><div class="selector_nav"><div class="col_3 active" x-show="selector_normal">Normal</div><div class="col_3" x-show="selector_heroic">Heroic</div><div class="col_3" x-show="selector_legendary">Legendary</div></div>' +
            '<p id="selector_normal"></p><p id="selector_heroic" style="display: none;"></p><p id="selector_legendary" style="display: none;"></p><div class="franken_close">Close</div></div>');
        var f_len = flavors.length;
        for (var i = 0; i < f_len; i++) {
            if (i < (24 * 3) ) {
                $('.franken_selector p#selector_normal').append('<div class="franken_option">' + flavors[i].name + '</div>');
            } else if (i < (27 * 3) && user_me.upgrade_frankenflavour >= 2) {
                $('.franken_selector p#selector_heroic').append('<div class="franken_option">' + flavors[i].name + '</div>');
            } else if (user_me.upgrade_frankenflavour == 3) {
                $('.franken_selector p#selector_legendary').append('<div class="franken_option">' + flavors[i].name + '</div>');
            }
        }
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    });
    $('body').on('click', '.franken_selector .col_3', function () {
        $('.franken_selector .col_3').removeClass('active');
        $(this).addClass('active');
        var show = $(this).attr('x-show');
        $('.franken_selector p').hide();
        $('.franken_selector p#' + show).show();
    });
    $('body').on('click', '.franken_close', function () {
        $('.franken_selector').remove();
    });
    $('body').on('click', '.highscores .button_container .flavor_tab, .highscores .flavor_tab#hide', function () {
        if ($(this).attr('id') == 'hide') {
            $('.highscores').hide();
            init_canvas();
            return;
        }
        $(this).parent().find('.active').removeClass('active');
        $(this).addClass('active');
        $('.refresh_highscores').click();
    });
    $('body').on('click', '.tab', function () {
        if ($(this).hasClass('locked')) return false;
        $('.tab.active').removeClass('active');
        $(this).addClass('active');
        $('.flavors_inner, .employees_inner, .upgrades_inner, .toppings_inner, .cones_inner').hide();
        $('.' + $(this).attr('id') + '_inner').show();
        $('.' + $(this).attr('id') + '_inner img[x-src]').each(function () {
            var xsrc = $(this).attr('x-src');
            if (typeof xsrc !== 'undefined') {
                $(this).attr('src', xsrc).removeAttr('x-src');
            }
        });
    });
    $('body').on('click', '.controls_forward', function () {
        if ($('.tab#flavors').hasClass('active')) $(".flavors_inner .unlockable:visible").slice(0,5).hide();
        if ($('.tab#toppings').hasClass('active')) $(".toppings_inner .unlockable:visible").slice(0,5).hide();
        return false;
    });
    $('body').on('click', '.controls_show', function () {
        if ($('.tab#flavors').hasClass('active')) {
            $(".flavors_inner .unlockable:hidden").show();
            $('.flavors_inner').css('overflow-y', 'scroll');
        }
        if ($('.tab#toppings').hasClass('active')) {
            $(".toppings_inner .unlockable:hidden").show();
            $('.toppings_inner').css('overflow-y', 'scroll');
        }
        return false;
    });
    $('body').on('click', '.controls_back', function () {
        if ($('.tab#flavors').hasClass('active')) $(".flavors_inner .unlockable:hidden").slice(-5).show();
        if ($('.tab#toppings').hasClass('active')) $(".toppings_inner .unlockable:hidden").slice(-5).show();
        return false;
    });
    $('body').on('click', '.flavor .expand', function () {
        if (!$(this).hasClass('active')) {
            $('#main_base, #main_addon, #main_combo, #main_cone').addClass('expanded').css('overflow', 'visible');
            Icecream.paginate(0);
            $(this).text('Minimize').addClass('active');
        } else {
            $('#main_base, #main_addon, #main_combo, #main_cone').removeClass('expanded').css('overflow', 'hidden');
            $(this).text('Expand').removeClass('active');
            $('.filter_box').remove();
        }
        init_canvas();
    });
    $('body').on('click', '.quests .expand', function () {
        if (!$(this).hasClass('active')) {
            $('.quest').show();
            $(this).text('Minimize').addClass('active');
        } else {
            $('.quest').hide();
            $('.quest:first').show();
            $(this).text('Expand').removeClass('active');
        }
        init_canvas();
    });
    $('body').on('click', '.shop_button', function () {
        var item = $(this).attr('x-item');
        var cost = parseInt($(this).attr('x-cost'));
        if (isNaN(cost) || user_me.gold < cost) {
            return alert('<p>You need more money to buy this item!</p>', 'Can not Afford');
        }
        if (!cow) {
            return alert('<p>"Come back when you have a cow."</p><p>Who said that? You only see a cart.</p>', 'A talking cart?');
        }
        user_me.gold = user_me.gold - parseInt(cost);
        if (item) {
            alert('<p>Success! You have purchased <b class="tooltip" x-type="item" x-name="' + item + '">' + item.replace(/_/g, ' - ') + '</b> for ' + cow.name + '.</p>', 'Purchased');
        }
        $.ajax({
            url: '/shop/item',
            data: { item: item },
            dataType: 'json',
            type: 'post',
            success: function(j) {
                if (j.error) return alert(j.error);
                if (j.gamble) {
                    Icecream.sync_cow(function () {
                        cow_redraw();
                        update_sell_value();
                    });
                    return alert('<p>Success! You have found a <b class="tooltip" x-type="item" x-name="' + j.gamble + '">' + j.gamble.split('/')[0].replace(/_/g, ' - ') + '</b> for ' + cow.name + '.</p>', 'Mystery Item');
                }
                cow = j;
                cow_redraw();
                main();
            }
        });
    });
    $('body').on('click', '.chat.main_container .expand', function () {
        if (!$(this).hasClass('active')) {
            $('.chat.main_container').attr('x-expand', true);
            $('#chat_window').css('overflow-y', 'scroll');
            $(this).text('Minimize').addClass('active');
        } else {
            $('.chat.main_container').attr('x-expand', false);
            $('#chat_window').css('overflow-y', 'hidden');
            $(this).text('Expand').removeClass('active');
        }
        cached_last_message = '';
        $('#chat_window').text('');
        Icecream.sync_chat();
        Icecream.sync_online();
    });
    
    $('body').on('mouseout', '.option, .unlockable, .tooltip, .hovercard', function () {
        $('.hovercard').remove();
    });
    $('body').on('click', '.shop', function () {
        $.ajax({
            url: 'https://s3.amazonaws.com/icecreamstand.com/shop.json.gz',
            data: { 'cache': Math.random() },
            dataType: 'json',
            success: function(items) {
                var compiled = '<tr><td><img src="https://s3.amazonaws.com/icecreamstand.com/gamble.png" class="tooltip inventory_thumb" x-type="gamble" /> Mystery Item' +
                    '</td><td><div class="shop_button button" x-cost="250000"><span class="money_icon">250,000</span></div></td></tr>';
                for(var item in items) {
                    var cost = items[item].cost;
                    if (cost) {
                        compiled = compiled + '<tr><td><img src="https://s3.amazonaws.com/icecreamstand.com/items/' + item + '.png" class="tooltip inventory_thumb" x-type="item" x-name="' + item + '/' + items[item].int + '/' + items[item].str + '/' + items[item].con + '" /> ' + item.replace(/_/g, ' - ') +
                        '</td><td><div class="shop_button button" x-cost="' + cost + '" x-item="' + item + '"><span class="money_icon">' + numberWithCommas(cost) + '</span></div></td></tr>';
                    }
                }
                alert('<table class="shop_table">' + compiled + '</table>', 'Shop');
            },
            error: function(err, e) {
                console.log(e);
                alert('The shop is closed.', 'Come back later!');
            }
        });
    });
    $('body').on('click', '.inline-message', function () {
        $(this).hide();
    });
    $('body').on('mouseover', '.tooltip', function () {
        $('.hovercard').remove();
        if (!user_me.is_tooltip) return;
        $('body').append('<div class="hovercard"><div></div></div>');
        $('.hovercard').css('left', $(this).offset().left);
        var doc = document.documentElement;
        var scroll_top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        var top = $(this).offset().top - 20;
        var reverse;
        if (top < 150 + scroll_top) { 
            top += 225;
            reverse = true;
        }
        $('.hovercard').css('top', top - scroll_top);
        var xtype = $(this).attr('x-type');
        var id = $(this).attr('x-id');
        var elem = this;
        if (!xtype) {
           xtype = $(this).parent().attr('x-type');
           var id = $(this).parent().attr('x-id');
           elem = $(this).parent();
        }
        if (xtype == 'sales_cart') {
            $('.hovercard').html('<div>Cart<span class="level">' + user_me.carts + '</span></div><p>Each cart automatically sells 1 ice cream every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000.</p>');
        } else if (xtype == 'sales_employee') {
            $('.hovercard').html('<div>Employees<span class="level">' + user_me.employees + '</span></div><p>Each employee automatically sells 2 ice creams every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000. Unlocks after you have 10 Carts.</p>');
        } else if (xtype == 'sales_truck') {
            $('.hovercard').html('<div>Truck<span class="level">' + user_me.trucks + '</span></div><p>Each truck automatically sells 3 ice creams every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000. Unlocks after you have 25 Employees.</p>');
        } else if (xtype == 'sales_robot') {
            $('.hovercard').html('<div>Robot<span class="level">' + user_me.robots + '</span></div><p>Each robot automatically sells 5 ice creams every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000. Unlocks after you have 50 Trucks.</p>');
        } else if (xtype == 'sales_rocket') {
            $('.hovercard').html('<div>Rocket<span class="level">' + user_me.rockets + '</span></div><p>Each rocket automatically sells 10 ice creams every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000. Unlocks after you have 100 Robots.</p>');
        } else if (xtype == 'sales_alien') {
            $('.hovercard').html('<div>Alien<span class="level">' + user_me.aliens + '</span></div><p>Each alien automatically sells 15 ice creams every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</p><p class="flavor_text">Workers sell your top row. Can be leveled up to 1000. Unlocks after you have 250 Rockets.</p>');
        } else if (xtype == 'machine') {
            $('.hovercard').html('<div>Ice Cream Machines<span class="level">' + user_me.upgrade_machinery + '</span></div><p>Increases the speed that your workers make ice cream. Currently it takes them ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds, level up to decrease it by .25s</p>');
        } else if (xtype == 'research') {
            $('.hovercard').html('<div>Flavor research<span class="level">' + user_me.upgrade_flavor + '</span></div><p>Each level unlocks 3 new flavors of ice cream</p>');
        } else if (xtype == 'research_addon') {
            $('.hovercard').html('<div>Add-on research<span class="level">' + user_me.upgrade_addon + '</span></div><p>Each level unlocks 3 new add-ons for your ice cream</p>');
        } else if (xtype == 'trending') {
            $('.hovercard').html('<div>Trending</div>This flavour is in demand! Sell it quickly while it\'s hot. As it gets sold more it becomes less popular.<p class="flavor_text">Every 1,000 sales reduces the bonus by $0.05. After 75,000 sales the trend cycles out.</p>'); 
        } else if (xtype == 'adopt_cow') {
            $('.hovercard').html('<div>Adopt a Cow</div>Adopt a helper to increase your Ice Cream sales. Cows can equip items, and have ability scores (Strength, Constitution, Intelligence).<p class="flavor_text">When a cow grows old it can be replaced with a new, younger and stronger cow. Cows persist through prestige.</p>'); 
        } else if (xtype == 'friend') {
            $('.hovercard').html('<div>Friend</div><p>Make the Ice Cream Stand more exciting and play with friends. Every day your friends get a bonus .01% of any money you earn. This doesn\'t take away from what you earn. It\'s a fascimile of social interaction that gives you some of the benefits.</p>');
        } else if (xtype == 'item') {
            var intelligence = 0, strength = 0, constitution = 0, special = '';;
            var item = $(this).attr('x-name');
            var item_split = item.split('/');
            var name = item_split[0].replace(/_/g, ': ');
            if (item_split[1] && !isNaN(item_split[1])) {
                intelligence = item_split[1];
            }
            if (item_split[2] && !isNaN(item_split[2])) {
                strength = item_split[2];
            }
            if (item_split[3] && !isNaN(item_split[3])) {
                constitution = item_split[3];
            }
            var rarity = (item_split[4])? '<p class="rarity" x-rarity="' + item_split[4] + '">This item is ' + item_split[4] + '</p>' : '';
            if (name == 'hat: jester' || name == 'accessory: marotte') {
                special = '<p class="flavor_text">Improves your chances of finding rare items by 5%</p>';
            }
            $('.hovercard').html('<div style="padding-left: 40px;"><img src="' + image_prepend + '/items/' + item_split[0].replace(/ /g, '') + '.png" class="tooltip_item" />' + name + '</div><p><b>Strength</b>: ' + strength + '<br><b>Constitution</b>: ' + constitution + '<br><b>Intelligence</b>: ' + intelligence + '</p>' +
                rarity + special);
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'gamble') {
            $('.hovercard').html('<div>Mystery Item</div><p>This will give you a mystery item, including items not normally available.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'strength') {
            $('.hovercard').html('<div>Strength</div><p>Strength increases the % bonus increase of your cow. Every 1 point of strength gives an additional 1% bonus to income.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'constitution') {
            $('.hovercard').html('<div>Constitution</div><p>Constitution decreases the rate at which your happiness declines. Each point in constitution decreases the decline rate by 5%.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'intelligence') {
            $('.hovercard').html('<div>Intelligence</div><p>Intelligence increases the total amount of happiness your cow can have. Each points increase your total happiness by 2.</p>');
            $('.hovercard').css('z-index',12);
        } else if (xtype == 'autopilot') {
            $('.hovercard').html('<div>Autopilot<span class="level">' + user_me.upgrade_autopilot + '</span></div><p>automatically sells your active flavor for you. Selling once every 10 seconds per level of autopilot.</p><p>It can be leveled up to 250.</p>');
        } else if (xtype === 'coldhands') {
            $('.hovercard').html('<div>Cold Hands<span class="level">' + user_me.upgrade_coldhands + '</span></div><p>Clicking an Ice Cube sells an additional 0.25 Ice cream.</p><p>It can be leveled up to 100.</p>');
        } else if (xtype === 'shop') {
            $('.hovercard').html('<div>Shop</div><p>Buy items and upgrades for your cow.</p>');
        } else if (xtype === 'cone') {
            if (id === 'sugarcone') {
                $('.hovercard').html('<div>Sugar Cone</div><p>This cone gives a $0.50 bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id === 'babycone') {
                $('.hovercard').html('<div>Baby Cone</div><p>This cone gives a $0.10 bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id === 'chocolate') {
                $('.hovercard').html('<div>Chocolate Dipped Cone</div><p>This cone gives a $0.25 bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id == 'sprinkle') {
                $('.hovercard').html('<div>Sprinkle Cone</div><p>This cone gives a $0.35 bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id == 'sugarcone') {
            } else if (id == 'waffle') {
                $('.hovercard').html('<div>Waffle Cone</div><p>This cone gives a $0.75 bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else if (id == 'whitechocolate') {
                $('.hovercard').html('<div>White Chocolate Cone</div><p>This cone gives a $1.00 bonus with every sale.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            } else {
                 $('.hovercard').html('<div>Starter Cone</div><p>This cone does not give a bonus when sold.</p><p class="flavor_text">Cones only affect your sales and your autopilot sales. Cones persist through prestige and are affected by prestige and expertise.</p>');
            }
         } else if (xtype === 'highscore') {
            id = $(this).attr('id');
            if (id === 'this_day') {
                $('.hovercard').html('<div>Daily Highscores</div><p>These are the totals for money earned today. This list resets at 12PM EST.</p>');
            } else if (id === 'this_week') {
                $('.hovercard').html('<div>Weekly Highscores</div><p>These are the totals for money earned this week. This list resets weekly.</p>');
            } else if (id === 'all_time') {
                $('.hovercard').html('<div>All Time Highscores</div><p>This is a leaderboard for total money earned. This list does not reset.</p>');
            } else if (id === 'up_and_coming') {
                $('.hovercard').html('<div>Up and Coming Highscores</div><p>This is a leaderboard for total money earned for accounts newer than 30 days.</p>');
            } else if (id === 'prestige') {
                $('.hovercard').html('<div>Prestige Highscores</div><p>This is a leaderboard for the total prestige amount.</p>');
            } else {
                $('.hovercard').html('<div>Accumulation Highscores</div><p>This is a leaderboard for the amount of money earned in one consecutive batch.</p>');
            }
            $('.hovercard').css('height', 80);
        } else if (xtype === 'inventory') {
            var name = $(this).attr('x-name');
            $('.hovercard').html('<div><img src="' + image_prepend + '/items/' + name.replace(/\s+/g, '') + '.png" class="inventory_hover_img" /> ' + name + '</div><p>This is an item in your inventory.</p>');
        } else if (xtype === 'ipm') { 
            var sales_time = (5 - (user_me.upgrade_machinery*0.25));
            var sales_modifier = (sales_per/sales_time)*60;
            var income_per_minute_worker = sales_modifier * cached_worker_value;
            var income_per_minute_cow = sales_modifier * cached_cowbonus_value;
            var income_per_minute_ap = user_me.upgrade_autopilot * 6 * cached_sell_value;

            $('.hovercard').html('<div>Income Breakdown</div><table class="ipm_breakdown">' +
                '<tr><td>Average worker value</td><td>$' + (cached_worker_value).toFixed(2) + '</td></tr>' +
                '<tr><td>Number of Sales</td><td>$' + sales_per + '<br>' +
                '<tr><td>Income from workers</td><td>$' + (income_per_minute_worker).toFixed(2) + '</td></tr>' +
                '<tr><td>Income from autopilot</td><td>$' + (income_per_minute_ap).toFixed(2) + '</td></tr>' +
                '<tr><td><b>Total before bonuses</b></td><td>$' + numberWithCommas ((income_per_minute_ap + income_per_minute_worker).toFixed(2)) + '</td></tr>' +
                '<tr><td>Income Bonus - Cow</td><td>$' + numberWithCommas( (income_per_minute_cow).toFixed(2) ) + '</td></tr>' +
                '</table>');
        } else if (xtype === 'vote') {
            var xname =  $(this).attr('x-name');
            var title = (xname)? 'Vote for ' + xname : 'Voting';
            $('.hovercard').html('<div>' + title + '</div><p>Click on a flavour to vote for it. The ice cream conglomerates will influence public perception and make the public want a specific flavour of ice cream enough that they would be willing to pay a premium.' + 
            'The flavour with the most votes will be the next to trend. The trending bonus goes up by $.05 for each vote. You can vote once every 10 minutes.</p>');
        } else if (xtype === 'cow') {
            if (!cow.name) {
                $('.hovercard').html('<div>Adopt A Cow</div><p>Adopt a cow under the <b>Upgrade menu</b> first.</p>');
                return false;
            }
            var cow_status = 'is happy';
            var cow_emote = ':)';
            var happy_percent = cow.happiness / cow.total_happiness;
            if (happy_percent < 0.10) {
                cow_status = 'is unhappy';
                    cow_emote = ':(';
            } else if (happy_percent < 0.20) {
                cow_status = 'demands sacrifices';
                cow_emote = '>:(';
            } else if (happy_percent < 0.30) {
                cow_status = 'is unhappy and full of ignorance';
                cow_emote = ':<';
            } else if (happy_percent < 0.40) {
                cow_status = 'is unhappy and full of attachment';
                cow_emote = ':c';
            }else if (happy_percent < 0.50) {
                cow_status = 'is unhappy and full of aversion';
                cow_emote = ';|';
            } else if (happy_percent < 0.60) {
                cow_status = 'is feeling existential';
                cow_emote = ':o';
            } else if (happy_percent < 0.70) {
                cow_status = 'contemplates his role';
                cow_emote = ':|';
            } else if (happy_percent < 0.80) {
                cow_status = 'is content';
                cow_emote = ':)';
            } else if (happy_percent < 0.90) {
                cow_status = 'is elated';
                cow_emote = ':^)';
            }
            
            var cname = (cow)? cow.name : user_me.cow_name.replace(/(<|>)/gi, '');
            $('.hovercard').html('<div>' + cname + '<span class="level">' + Math.floor(user_me.cow_level) + '</span></div><p><i class="emote">' + cow_emote + '</i> ' +
                cname + ' <b>' + cow_status + ' (' + (cow.happiness).toFixed(1) + '/' + cow.total_happiness + ')</b><br>Hay fed: ' + user_me.cow_clicks + '</p><p class="flavor_text">Feed your cow hay to make it happy. A happy cow produces more, and gives you +10% sales + .5% per level.<br><b>Click to view more.</b></p>');
        } else if (xtype == 'expertise') {
            $('.hovercard').css('left', '23%'); 
            $('.hovercard').html('<div>Expertise level</div><p>Sell this flavor to raise your expertise level. Higher value flavors are more difficult to master. Each level gives a bonus +10% to the flavor\'s value for you and your workers. The maximum expertise level is 15.</p>');
        }   else if (xtype == 'frankenflavour') {
            $('.hovercard').html('<div>Frankenflavour</div><p>Combine two flavours into one stronger flavour. Frankenflavour transformations last 20 minutes and are free. There are three tiers, one for normal, heroic, and legendary.</p><p class="flavor_text">To unlock each of the additional tiers requires the item "lab parts". Frankenflavours do not last through prestige. </p>');
        }  else if (xtype == 'prestige') {
            $('.hovercard').css('height', 180).css('font-size', '12px');
           var current_prestige = get_prestige_bonus(user_me);
            if (user_me.prestige_level < 8) {
                $('.hovercard').html('<div>Prestige<span class="level">' + user_me.prestige_bonus + '%</span></div><p><b>Restart the game with a bonus</b> based on cash balance, flavors unlocked, and add-ons unlocked</p>' +
                '<p>This restarts the game and increases sales values by ' + parseFloat(parseFloat(user_me.prestige_bonus)+parseFloat(current_prestige)).toFixed(5) + '%.' +
                'You can upgrade Prestige up to 8 times, after that the lowest prestige bonus can be redone. Each time you upgrade you will get a bonus from 1-50% based on your progress. <b>This bonus adds with your past prestige bonuses.</b></p>');
            } else {
                var smallest_amount = user_me.prestige_array[0];
                for (var i = 1; i < user_me.prestige_array.length; i++) {
                    if (user_me.prestige_array[i] < smallest_amount) smallest_amount = user_me.prestige_array[i];
                }
                var newp =  parseFloat(parseFloat(user_me.prestige_bonus)-parseFloat(smallest_amount)+parseFloat(current_prestige)).toFixed(5);
                $('.hovercard').html('<div>Prestige<span class="level">current: +' + user_me.prestige_bonus + '%</span></div><p><b>Restart the game with a bonus</b>, ' +
                    'overwriting your current lowest prestige score (' + parseFloat(smallest_amount).toFixed(5) + '%)</p><p>New Prestige Bonus: ' + newp + '%</p>');
            }
            if (user_me.last_prestige_at) $('.hovercard').append('<div class="last_prestige">Last prestiged: ' + user_me.last_prestige_at.substring(0,10) + '</div>');
        } else if (xtype == 'heroic') {
            $('.hovercard').html('<div>Heroic Tier<span class="level">' + user_me.upgrade_heroic + '</span></div><p>Unlock 3 high level flavors and add-ons. This can be upgraded 3 times.</p>');
        } else if (xtype == 'legendary') {
            $('.hovercard').html('<div>Legendary Tier<span class="level">' + user_me.upgrade_legendary + '</span></div><p>Unlock 3 high level flavors and add-ons. This can be upgraded 2 times. You must have 1 level of Prestige to unlock this.</p>');
        } else if (xtype == 'combo') {
            var combo_value = parseFloat($(elem).attr('x-value'));
            var flavor_value = 0;
            var addon_value = 0;
            var f_len = flavors.length;
            var t_len = toppings.length;
            for (var i = 0; i < f_len; i++) {
                if (flavors[i]._id == $(elem).attr('x-flavor')) {
                    flavor_value = flavors[i].value;
                    break;
                }
            }
            for (var i = 0; i < t_len; i++) {
                if (toppings[i]._id == $(elem).attr('x-addon')) {
                    addon_value = toppings[i].value;
                    break;
                }
            }
            $('.hovercard').html('<div>' + $(elem).attr('x-name') + '<span class="level flavor_current">' + (combo_value + flavor_value + addon_value).toFixed(2) + '</span></div><p>Click this ice cream to switch to it for a bonus <b>$' + parseFloat($(this).attr('x-value')).toFixed(2) + '</b></p><p class="flavor_text">Combos are made by matching a certain base and addon into an even better flavor. Increases the value of the flavor.</p>');
        } else if (xtype == 'value') {  
            var top = parseInt( $(elem).offset().top ) - 40;
            $('.hovercard').css('top', top).css('margin-left', (((canvas_cache_width / 4) - 300) / 2) + 'px');
            var flavor = Icecream.get_flavor( user_me.last_flavor );
            var base_type = 'Flavour';
            var base;
            var time_left = '';
            if (user_me.last_frankenflavour) {
                base_type = 'Frankenflavour';
                var frankenflavour = Icecream.get_flavor( user_me.last_frankenflavour );
                base = (flavor.value + frankenflavour.value) * 0.75; 
                var time_delta = new Date() - new Date(user_me.last_frankenflavour_at);
                time_left = 'Time left: ' + (20 - (time_delta / 1000 / 60)).toFixed(1) + ' Minutes';
            } else {
                base = flavor.value;
            }
            var base_mods = 0;
            $('.hovercard').html('<div>' + $('.current_flavor').text() + '</div>' + time_left + '<p style="text-align: right;">' + base_type +' value: $' + parseFloat(base).toFixed(2) + '<br />' +
            'Add-on value: $' + parseFloat($('#main_addon .selected').attr('x-value')).toFixed(2) + '<br /></p>');
            if (cached_cone_value > 0) {
                $('.hovercard p').append('Cone bonus: $' + parseFloat(cached_cone_value).toFixed(2) + '<br />');
                base_mods += parseFloat(cached_cone_value);
            }
            for (var i = 0; i < combos.length; i++) {
                var combo = combos[i];
                if (combo.flavor_id === user_me.last_flavor && combo.topping_id === user_me.last_addon) {
                    $('.hovercard p').append('Combo bonus: $' + combo.value.toFixed(2) + '<br />');
                    base_mods += combo.value;
                }
            }
            if (user_me.last_flavor == trending_flavor && trending_flavor != '') {
                $('.hovercard p').append('Trending bonus: $' + parseFloat(trending_bonus).toFixed(2) + '<br />');
                base_mods += parseFloat(trending_bonus);
            }
            if (user_me.last_addon == trending_addon && trending_addon != '') {
                $('.hovercard p').append('Event bonus: $' + user_me.trend_bonus+ '<br />');
                base_mods += user_me.trend_bonus;
            }
            var val_expertise = 0;
            if (cached_expertise > 0) {
                val_expertise = (base+base_mods) * ((0.1 * cached_expertise));
                $('.hovercard p').append(cached_expertise + '0% (x $' + (base+base_mods).toFixed(2) + ') Expertise: $' + parseFloat(val_expertise).toFixed(2) + '<br />');
            }
            if (user_me.prestige_bonus > 0) {
                var val_prestige = (base+base_mods) * ((user_me.prestige_bonus / 100));
                $('.hovercard p').append(user_me.prestige_bonus + '% (x $' + (base+base_mods).toFixed(2) + ') Prestige: $' + parseFloat(val_prestige).toFixed(2) + '<br />');
            }
            $('.hovercard').css('left', ($(elem).offset().left - 25) + 'px');
        } else if (xtype == 'base') {
            var f_len = flavors.length;
            for (var i = 0; i < f_len; i++) {
                var flavor = flavors[i];
                if (flavor._id == $(elem).attr('x-id')) {
                    var expertise = parseInt($(elem).parent().find('.expertise_level').text());
                    if (isNaN(expertise)) expertise = 0;
                    var expertise_bonus = flavor.value * (.1 * expertise);
                    var prestige_bonus = flavor.value * (user_me.prestige_bonus / 100);
                    var value = flavor.value + expertise_bonus + prestige_bonus;
                    var flavors_sold_index = user_me.flavors.indexOf(flavor._id);
                    var num_sold = (parseInt(user_me.flavors_sold[flavors_sold_index]) > 0)? user_me.flavors_sold[flavors_sold_index] : '0';
                    $('.hovercard').html('<div>' + flavor.name + '<span class="level flavor_current money_icon">' + parseFloat(value).toFixed(2) + '</span></div>' +
                        '<p>' + flavor.description + '</p>' + 
                    '<p>Value <span class="money_icon">' + parseFloat(flavor.value).toFixed(2) + '</span> (Max <span class="money_icon">' + parseFloat(flavor.base_value).toFixed(2) + '</span>). You\'ve sold: ' + num_sold + '</p><p class="flavor_text">Flavour value fluctuates over time based on supply.</p>');
                    break;
                }
                $('.hovercard').html('<div>' + $(elem).attr('id') + '<span class="level flavor_current">?<small>Base: ?</small></span></div><p>This flavour has not yet been unlocked</p>' + 
                '<p>Maximum base value ? You\'ve sold: 0</p><p class="flavor_text">Flavour value fluctuates over time based on supply.</p>');
            }
        } else if (xtype == 'addon') {
            var t_len = toppings.length;
            for (var i = 0; i < t_len; i++) {
                var t = toppings[i];
                if (t.name == $(elem).attr('id')) {
                    $('.hovercard').html('<div>' + t.name + '<span class="level flavor_current money_icon">' + t.value.toFixed(2) + '</span></div><p>Add-ons can be used with a base flavour to increase the value of ice cream.</p><p class="flavor_text">Addons increase the value of every ice cream you or your workers sell and do not decrease in value over time like flavours.</p>');
                    break;
                }
            }
        }
        if (reverse) {
            $('.hovercard').append('<div class="triangle-up"></div>');
        } else {
            $('.hovercard').append('<div class="triangle-down"></div>');
        }
        
    });
    $('body').on('click', '.prestige_cancel', function () {
        $(this).parent().find('.button').show();
        $(this).parent().find('button').remove();
        $(this).parent().find('.prestige_cancel').remove();
    });
    $('body').on('click', '.prestige_button', function () {
        $(this).after('<button>UNLOCK</button><div class="button prestige_cancel">Cancel</div>');
        $(this).hide();
    });
    $('body').on('click', '.currently_trending', function () {
        $('#main_base .option#' + $(this).attr('id')).click();
    });
    $('body').on('click', '.flavor .combo_option', function () {
        $('#main_base .option[x-id="' + $(this).attr('x-flavor') + '"]').click();
        $('#main_addon .option[x-id="' + $(this).attr('x-addon') + '"]').click();
        var franken = $(this).attr('x-franken');
        if (franken) {
            $.ajax({
                url: '/last/franken',
                data: { 
                    one: $(this).attr('x-flavor'),
                    two: franken
                },
                dataType: 'json',
                type: 'POST',
                success: function (j) {
                    main('flavour');
                }
            });
        }
    });
    $('body').on('click', '#main_cone .option', function () {
        cached_cone = $(this).attr('id');
        var cached_cone_value_options = {
            'default': 0.0,
            'babycone': 0.10,
            'chocolate': 0.25,
            'sprinkle': 0.35,
            'sugarcone': 0.50,
            'waffle': 0.75,
            'whitechocolate': 1.00,
        };
        cached_cone_value = cached_cone_value_options[cached_cone];
        $('.flavor #main_cone .option.selected').removeClass('selected');
        $(this).addClass('selected');
        var flavor = Icecream.get_flavor(user_me.last_flavor);
        if (typeof flavor !== 'undefined') {
            var f_name = flavor.name.replace(/\s+/g, '');
            $('.icecream').css('background-image', 'url("'+image_prepend+'/' + f_name + '.png"), url("'+image_prepend+'/cones/' + cached_cone + '.png")');
            update_sell_value(); 
        }
    });
    $('body').on('click', '.flavor .option[x-type="addon"]', function () {
        $('.flavor .option[x-type="addon"].selected').removeClass('selected');
        $(this).addClass('selected');
        var addon_name = image_prepend + '/toppings/' + $(this).attr('id').replace(/\W/g, '') + '.png';
        $('.icecream #topping').attr('style', 'background-image: url(' +addon_name + ');');
        $('.icecream #topping').attr('x-addon', $(this).attr('id'));

        if (combos.length === 0 || user_me.last_addon != $(this).attr('x-id') ) {
            user_me.last_addon = $(this).attr('x-id');
            $.ajax({
                url: 'last_flavor',
                data: 'f=' + user_me.last_flavor + '&a=' + user_me.last_addon,
                dataType: 'JSON',
                type: 'POST',
                success: function (j) {
                    combos = j;
                    update_sell_value();
                    Icecream.update_worker_fx();
                }
            });
        }
        var total_value = parseFloat($('#main_base .option.selected').attr('x-value')) + parseFloat($('#main_addon .option.selected').attr('x-value'));
    });
    $('body').on('click', '#main_base .option[x-type="base"]', function () {
        $('.flavor .option[x-type="base"].selected').removeClass('selected');
        $(this).addClass('selected');
        var id = $(this).attr('x-id');
        var flavor = Icecream.get_flavor(id);
        $('.icecream_franken').remove();
        if (user_me.last_flavor === id) {
            $('.icecream, .sell_value').css('display','block');
            var f_name = flavor.name.replace(/\s+/g, '');
            $('.icecream').css('background-image', 'url("'+image_prepend+'/' + f_name + '.png"), url("'+image_prepend+'/cones/'+cached_cone+'.png")');
            if (user_me.last_frankenflavour) {
                var franken = Icecream.get_flavor(user_me.last_frankenflavour);
                 var franken_name = franken.name.replace(/\s+/g, '');
                $('.icecream').prepend('<div class="icecream_franken" style="background-image: url(' + image_prepend + '/' + franken_name + '.png);"></div>');
            }
            update_sell_value();
            init_canvas();
        } else {
            user_me.last_flavor = id;
            user_me.last_frankenflavour = null;
            $.ajax({
                url: 'last_flavor',
                data: 'f=' + user_me.last_flavor + '&a=' + user_me.last_addon,
                dataType: 'JSON',
                type: 'POST',
                success: function (j) {
                    combos = j;
                    update_expertise();
                    update_sell_value();
                    init_canvas();
                }
            });
            $('.icecream').stop().animate({ 'left' : '-12.5%'}, 500, function () {
                $('.icecream, .sell_value').css('display','block'); 
                var f_name = flavor.name.replace(/\s+/g, '');
                $('.icecream').css('background-image', 'url("' + image_prepend + '/' + f_name + '.png"), url("'+image_prepend+'/cones/'+cached_cone+'.png")');
                $('.icecream').animate({ 'left' : '12.5%'}, 1000);
            });
        }
        cached_flavor_index = user_me.flavors.indexOf(user_me.last_flavor);
        update_expertise();
    });
    $('body').on('mouseleave', '#upgrades .unlockable button', function () {
        $('.unlock_update').remove();
    });
    $('body').on('click', '#upgrades .unlockable button', function () {
        var t = $(this).closest('.unlockable').attr('x-type');
        var that = this;
        if (t == 'prestige') {
            game_working = false;
        }
        if (t == 'legendary' && user_me.prestige_level === 0) {
            $(this).append('<div class="unlock_update">Requires 1 level of Prestige.</div>');
            setTimeout(function () {
                $('.unlock_update').remove();
                $('.upgrade_error').removeClass('upgrade_error');
            }, 3000);
            return;
        }
        if ($(this).hasClass('sell')) $(this).addClass('upgrade_sell'); 
        $('.unlock_update').remove();
         $('.upgrade_error').removeClass('upgrade_error');
         $('.upgrade_success').removeClass('upgrade_success');
        $.ajax({
            url : '/unlock',
            data: {
                id: $(this).closest('.unlockable').attr('x-id'),
                type: t,
                sell: $(this).hasClass('sell'),
                amount: $(this).attr('x-amount')
            },
            dataType: 'JSON',
            type: 'POST',
            success: function (j) { 
                if (j.message) {
                    return alert(j.message, 'Result');
                }
                if (j.err) {
                    alert(j.err);
                }
                if (j.error) {
                    if (user_me.is_tooltip) {
                        if (!isNaN(j.error)) {
                            if (j.error > 1000000000) { //billion
                                j.error = 'Need $' + (j.error / 1000000000).toFixed(0) + 'B';
                            } else if (j.error > 1000000) { //Million
                                j.error = 'Need $' + (j.error / 1000000).toFixed(0) + 'M';
                            } else {
                                j.error = 'Need $' + numberWithCommas(j.error);
                            }
                        }
                        $(that).addClass('upgrade_error').append('<div class="unlock_update">' + j.error + '</div>');
                        setTimeout(function () {
                            $('.unlock_update').remove();
                            $('.upgrade_error').removeClass('upgrade_error');
                    }, 1500);
                    }
                } else {
                    if (j.reload) return location.reload(true);
                    if (j.msg) {
                        if (user_me.is_tooltip) {
                            $(that).addClass('upgrade_success').append('<div class="unlock_update">' + j.msg + '</div>');
                            setTimeout(function () {
                                $('.unlock_update').remove();
                                $('.upgrade_success').removeClass('upgrade_success');
                            }, 1500);
                        }
                    }           
                    if ($('.upgrade_success').closest('.unlockable').attr('x-type') == 'base') { 
                        $('#main_base .option_wrapper').remove();
                    }
                    
                }
                if (j.user) {
                    user_me = j.user;
                }
                if (j.success) {
                    $('.hovercard').remove();
                    main(j.success, function () {
                        if ($('.flavor.main_container .expand').hasClass('active')) {
                            Icecream.paginate(cached_page);
                        }
                        Icecream.update_quest_bar();
                    });
                }
                if (j.cow) {
                    cow = j.cow;
                    Icecream.sync_cow();
                    alert('<p>You have adopted a new cow. Cows need to be fed hay to be happy, but a happy cow is a happy life and will help make your ice cream better. Drag hay to your cow to make it happy. Click your cow to see stats.</p>', 'You have adopted ' + cow.name);
                }
            }, 
            error: function (xhr, status, error) {
                $(that).addClass('upgrade_error').append('<div class="unlock_update">Error</div>');
                setTimeout(function () {
                        $('.unlock_update').remove();
                        $('.upgrade_error').removeClass('upgrade_error');
                }, 1500);
            }
        });
    });
    window.onblur = function() {
        window_focus = false;
    };
    window.onresize = function() {
        init_canvas();
    };
    window.onfocus = function() {
        window_focus = true;
        canvas_icecream_sales_dirty = true;
        if (cached_new_messages > 0) {
            $('title').text('Ice Cream Stand');
            cached_new_messages = 0;
        }
    };
    /*
    function load_changelog(offset) {
        $.ajax({
            url: 'https://s3.amazonaws.com/icecreamstand.com/patch.json.gz',
            data: { cache: Math.random() },
            type: 'get',
            dataType: 'json',
            success: function (j) {
                if (!j || !j.notes[offset]) {
                    return alert('<small>No changelog for this patch</small>', 'CHANGELOG - ' + offset);
                }
                var notes = j.notes[offset];
                console.log(notes);
                alert('<div class="changelog_container"><h3>' + notes.title + '</h3>' + notes.changes.join('<br>') + '<p><a href="#" id="prev_chagelog" x-offset="' + (offset+1) + '">View previous changelog</a></p></div>', 'Changelog');
            },
            error: function (err) {
                console.log(err);
                return alert('<small>Error loading changelog for this patch</small>', 'CHANGELOG');
            }
        });
        return false;
    }
    $('body').on('click', '#prev_chagelog', function () {
        load_changelog($(this).attr('x-offset'));
    });
    
    $('body').on('click', '#version_num', function () {
        $('.message_close:last').click();
        load_changelog(0);
        return false;
    });
    */
    $('body').on('click', '.message_close, .darkness', function () {
        if ($(this).hasClass('update')) return;
        $('.message, .darkness, .alert_shadow:last').remove();
        $('.alert_shadow').each(function () {
            var top = $(this).offset().top - window.scrollY;
            var left = parseInt($(this).css('margin-left'));
            var opac = $(this).css('opacity');
            $(this).css('top', top + 20).css('margin-left', left + 20 + 'px').css('opacity', opac + 0.2);
        });
        alert_active = false;
        if (alert_queue.length > 0) { 
            alert(alert_queue[0].msg, alert_queue[0].title);
            alert_queue.shift();
        }
    });
    $('body').on('click', '.add_new[href="new_employee"]', function () {
        $(this).after('<form action="employees" method="POST"><input name="name" placeholder="name"><input name="bio" placeholder="biography"><input name="speed" placeholder="starting leadership, 1-5"><input name="speed" placeholder="starting marketing, 1-5">' +
        '<input name="speed" placeholder="starting analysis, 1-5"><input name="cost" placeholder="cost, 2000-5000"><input type="submit" class="button" value="CREATE"></form>');
        $(this).remove();   
        return false;
    });
    $('body').on('click', '.add_new[href="new_flavor"]', function () {
        $(this).after('<form action="flavors" method="POST"><input name="name" placeholder="flavor name"><input name="description" placeholder="flavor description"><input name="cost" placeholder="cost $200-500"><input name="base_value" placeholder="sell for  +2-3"><input type="submit" class="button" value="CREATE"></form>');
        $(this).remove();   
        return false;
    });
    $('body').on('click', '.add_new[href="new_topping"]', function () {
        $(this).after('<form action="toppings" method="POST"><input name="name" placeholder="topping name"><input name="topping description" placeholder="description"><input name="cost" placeholder="cost $0-300"><input name="base_value" placeholder="sell for +.5-1.5"><input type="submit" class="button" value="CREATE"></form>');
        $(this).remove();   
        return false;
    });  
    $('body').on('click', '.settings_tab', function () {
        var area = $(this).attr('x-area');
        if ( $(this).attr('x-active') === 'false' ) {
            $('.settings_tab[x-active="true"], .settings_area[x-active="true"]').attr('x-active', 'false');
            $(this).attr('x-active', 'true');
            $('.settings_area[x-area="' + area + '"]').attr('x-active', 'true');
        }
    });
    $('body').on('click', '.view_settings', function () {
        alert('<form action="user_update" method="POST" class="alert-form">' +
        '<div class="button_container"><div class="settings_tab" x-area="1" x-active="true">Basic</div><div class="settings_tab" x-area="2" x-active="false">Advanced</div><div class="settings_tab" x-area="3" x-active="false">Email</div></div><div class="settings_area" x-area="1" x-active="true">' +
        '<div class="squish">Username<input type="text" placeholder="USERNAME" name="username" value="' + user_me.name + '"></div>' +
        '<div class="squish">Email ' + ((user_me.email_verified)? '(verified)': '(<a href="verify/resend">resend verification</a>)') + '<input type="text" placeholder="OPTIONAL EMAIL" name="email" value=' + ((user_me.email)? user_me.email : '') + '></div>' +
        '<div class="squish">Password<input type="password" placeholder="OPTIONAL PASSWORD" name="password"></div>' +
        '</div><div class="settings_area" x-area="2" x-active="false">' +
        '<div class="squish">Ignore List (comma seperated)<input type="text" placeholder="ignore list" name="ignore" value="' + ((user_me.ignore)? user_me.ignore : '') + '"></div>' +
        '<div class="squish">Release channel <input type="radio" name="release_channel" value="0" />Main <input type="radio" name="release_channel" value="1" />Beta ' +
        ( (user_me.badges.indexOf(1) === -1)? ' &nbsp; <small>You must be a donor to access Alpha</small>' : '<input type="radio" name="release_channel" value="2" />Alpha') + '</span></div>' +
        '<div class="squish">Language: <a href="/en">English</a> <a href="/jp">Japanese</a>' + '</div>' +
        '<div class="squish"><div class="toggle_outer"><div class="toggle_animations toggle_container">animations off</div>' +
        '<div class="toggle_chat toggle_container">Do not Disturb</div>' + 
        '<div class="toggle_night toggle_container">Night Mode</div>' + 
        '<div class="toggle_tooltips toggle_container">Tooltips</div><div class="toggle_friend_notify toggle_container">Notify when friends come online</div><div class="toggle_badge toggle_container">Display Badge</div><div class="toggle_second_row toggle_container">New below top row</div></div><div class="display_settings"></div>' +
        '</div></div>' +
        '<div class="settings_area" x-area="3" x-active="false"><div class="squish">Email me when...</div><div class="toggle_email_addresschange toggle_container">My email address changes</div></div>' +
        '<input type="submit" value="Update" class="button update" id="settings_update"></form>', __('Update Your Settings'), __('Cancel'));
        $('.display_settings').html('<div class="toggle_display toggle_container" x-id="flavor">Ice Cream</div>' +
        '<div class="toggle_display toggle_container" x-id="quests">Quests</div><br />' +
        '<div class="toggle_display toggle_container" x-id="achievements">Trending and Event</div>' +
        '<div class="toggle_display toggle_container" x-id="chat">Chat</div></div>');


        $('.alert-form input[type="radio"][value="' + user_me.release_channel + '"]').attr('checked', true);
        if (!user_me.display_settings || user_me.display_settings[0] != 0) $('.toggle_display[x-id="flavor"]').addClass('checked');
        if (!user_me.display_settings || user_me.display_settings[1] != 0) $('.toggle_display[x-id="quests"]').addClass('checked');
        if (!user_me.display_settings || user_me.display_settings[2] != 0) $('.toggle_display[x-id="achievements"]').addClass('checked');
        if (!user_me.display_settings || user_me.display_settings[3] != 0) $('.toggle_display[x-id="chat"]').addClass('checked');
        if (user_me.animations_off) $('.toggle_animations').addClass('checked');
        if (user_me.is_tooltips) $('.toggle_tooltips').addClass('checked');
        if (user_me.chat_off) $('.toggle_chat').addClass('checked');
        if (!user_me.badge_off) $('.toggle_badge').addClass('checked');
        if (user_me.is_friend_notify) $('.toggle_friend_notify').addClass('checked');
        if (user_me.is_second_row) $('.toggle_second_row').addClass('checked');
        if (user_me.is_night) $('.toggle_night').addClass('checked');
        if (debug_mode) $('.toggle_debug').addClass('checked');
        if (!game_working) $('.toggle_working').addClass('checked'); 
        return false; 
    });
    $('body').on('click', '.e' + 'as' + 'ter', function () { //please don't abuse this alpha tester!
        var n = $(this).attr('x-num');
        $(this).remove();
        $.ajax({
            url: 'e' + 'as' + 'ter/' + n + '/' + btoa('e at ics' + n + 'pleasedontcheat' + user_me.name),
            type: 'GET',
            dataType: 'text',
            success: function (j) {
                alert(j, 'E' + 'as' + 'te' + 'r' + '!');
                main();
            }
        });
    });
    $('body').on('click', '.view_stats', function () {
        main('stats', function () {
            $('.message > #description').html( format_stats() );
        });
        alert(format_stats(), 'Stats');
        return false;
    });
    function format_stats() {
        return '<table><tr><td>Total money</td><td>$' + numberWithCommas(user_me.total_gold.toFixed(2)) + 
                '</td></tr><tr><td>Today\'s money</td><td>$' + numberWithCommas(user_me.today_gold.toFixed(2)) + 
                '</td></tr><tr><td>This week\'s money</td><td>$' + numberWithCommas(user_me.week_gold.toFixed(2)) + 
                '</td></tr><tr><td>Money from friends</td><td>' + numberWithCommas( parseFloat(user_me.friend_total_gold).toFixed(2) ) +
                '</td></tr><tr><td>Sale Accumulation Record</td><td>' + numberWithCommas( (user_me.highest_accumulation).toFixed(2) ) +
                '</td></tr><tr><td>Flavours</td><td>' + user_me.flavors.length +
                '</td></tr><tr><td>Add-ons</td><td>' + user_me.toppings.length +
                '</td></tr><tr><td>Quests</td><td>' + user_me.quests.length +
                '</td></tr><tr><td>Cow Hay</td><td>' + user_me.cow_clicks +
                '</td></tr><tr><td>Ice cream sold</td><td>' + numberWithCommas(user_me.icecream_sold) +
                '</td></tr><tr><td>Sales every ' + (5 - (user_me.upgrade_machinery*0.25)) + ' seconds</td><td>' + sales_per + 
                '</td></tr><tr><td>Prestige Values: </td><td>' + user_me.prestige_array.join('<br>') +
                '</td></tr></table>';
    }
    $('body').on('click', '#cow_teach', function () { 
        var memory = $('#cow_memory').val();
        cow.memories.push(memory);
        $.ajax({
            url: 'cow/update',
            data: { memory: memory },
            type: 'post',
            dataType: 'json'
        });
        $('.message_close:last').click();
    });
    $('body').on('click', '.vote_box', function () { 
        $(this).css('bottom', -25);
        var flavour = $(this).attr('x-name');
        $.ajax({
            url: 'vote/' + $(this).attr('x-id'),
            dataType: 'json',
            type: 'post',
            success: function (j) {
                if (j.success) {
                    Icecream.update_flavors();
                    _gaq.push(['_trackEvent', 'Flavour', 'Voted for a flavour', flavour]);
                } else if (j.error) {
                    alert(j.error);
                }
            }
        });
    });
    $('body').on('click', '.nav_triangle', function () { 
        if (!$('.main_nav').is(':visible')) {
            $('.main_nav').slideDown(500);
            $(this).removeClass('inactive');
        } else {
            $('.main_nav').slideUp(500);
            $(this).addClass('inactive');
        }
    });
    $('body').on('click', '#message_read', function () { 
        message_read($(this).closest('.new_message').attr('x-id'));
    });
    function message_read(id) {
        console.log('marking ' + id + ' read');
        cache_unread_message = false;
        $.ajax({
            url: 'message/read/' + id,
            dataType: 'json',
            type: 'post',
            success: function (j) { 
                Icecream.sync_friends();
            }
        });
    }
    $('body').on('click', '#message_remove', function () { 
        var message = $(this).parent();
        
        $.ajax({
            url: 'message/remove/' + $(message).attr('x-id'),
            dataType: 'json',
            type: 'post',
            success: function (j) {
                if ( (message).hasClass('new_message') ) $(message).hide();        
                if ($('.message').length > 0) {  
                    $('.friends_button_container').click(); //trigger message alert
                }
            }
        });
    });
    $('body').on('click', '#friend_message_button', function () { 
        $.ajax({
            url: '/message/' + $(this).attr('x-user'),
            data: {message: $('#friend_message_textarea').val()},
            dataType: 'json',
            type: 'post',
            success: function (j) {
                if (j.error) return alert(j.error);
                $('.message_close:last').click();
            }
        });
    });
    $('body').on('click', '.toggle_container', function () { 
        $(this).toggleClass('checked');
        var is_checked = $(this).hasClass('checked');
        if ($(this).hasClass('toggle_animations')) {
            if (disable_animations != is_checked) {
                $.ajax({
                    url: 'toggle_animations',
                    type: 'POST'
                });
                disable_animations = is_checked;
                Icecream.update_worker_fx();
            }
        } else if ($(this).hasClass('toggle_chat')) {
            if (user_me.chat_off != is_checked) { //because disable_chat is when chat is unchecked
                $.ajax({
                    url: 'toggle_chat',
                    type: 'POST'
                });
                user_me.chat_off = is_checked;
                $('#chat_window').text('');
                cached_last_message = '';
                Icecream.sync_chat();
            }
        } else if ($(this).hasClass('toggle_friend_notify')) {
            if (user_me.is_friend_notify != is_checked) { //because disable_chat is when chat is unchecked
                $.ajax({
                    url: 'toggle/friend_notify',
                    type: 'POST'
                });
                user_me.is_friend_notify = is_checked;
                $('#chat_window').text('');
                cached_last_message = '';
                Icecream.sync_chat();
            }
        } else if ($(this).hasClass('toggle_night')) {
            if (user_me.is_night != is_checked) { //because disable_chat is when chat is unchecked
                $.ajax({
                    url: 'toggle/night',
                    type: 'POST',
                    sucess: function(j) {
                        Icecream.main('reload');
                    }
                });
                user_me.is_night = is_checked;
            }
        } else if ($(this).hasClass('toggle_second_row')) {
            if (user_me.is_second_row != is_checked) { //because disable_chat is when chat is unchecked
                $.ajax({
                    url: 'toggle/second_row',
                    type: 'POST',
                    sucess: function(j) {

                    }
                });
                user_me.is_second_row = is_checked;
            }
        } else if ($(this).hasClass('toggle_tooltips')) {
                $.ajax({
                    url: 'toggle_tooltip',
                    type: 'POST'
                });
                user_me.is_tooltip = is_checked;
        } else if ($(this).hasClass('toggle_badge')) {
            user_me.badge_off = is_checked;
             $.ajax({
                url: 'toggle_badge',
                type: 'POST'
            });
        } else if ($(this).hasClass('toggle_display')) {
            $.ajax({
                url: 'toggle_display',
                data: {type: $(this).attr('x-id')},
                type: 'POST',
                success: function (j) {
                    main('repaint');
                }
            });
        } else {
            debug_mode = is_checked;
        }
    });
    /* drag stuff */
    $('body').on('dragstart', '.flavor.main_container .option', function (e) {
        $(this).addClass('drag');
        dragSrcEl = this;
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        e.originalEvent.dataTransfer.setData('text/html', this.outerHTML);
        $('.hovercard').remove();
    });
    $('body').on('dragend', '.flavor.main_container .option', function () {
        $(this).removeClass('drag');
        $('.option.over').removeClass('over');
    });
    $('body').on('dragenter', '.flavor.main_container .option', function () {
        $(this).addClass('over');
    });
    $('body').on('dragleave', '.flavor.main_container .option', function () {
        $(this).removeClass('over');
    });
    $('body').on('dragover', '.flavor.main_container .option', function (e) {
        if (e.preventDefault) {
            e.preventDefault(); // Necessary. Allows us to drop.
        }
        e.originalEvent.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
        return false;
    });
    $('body').on('drop', '.flavor.main_container .option', function (e) {
        // Don't do anything if dropping the same column we're dragging.
        var transfer_data = e.originalEvent.dataTransfer.getData('text/html');
        if (transfer_data == 'hay' || transfer_data == 'rock') return false;
        if (dragSrcEl != this) {
            // Set the source column's HTML to the HTML of the column we dropped on.
            dragSrcEl.outerHTML = this.outerHTML;
            this.outerHTML = transfer_data;
            var switch_1 = $('.option.over').attr('x-id');
            var switch_2 = $('.option.drag').attr('x-id');
            

            var xtype = $(this).attr('x-type');
            if (xtype === 'addon') {
                var switch_1_i = user_me.toppings.indexOf(switch_1);
                var switch_2_i = user_me.toppings.indexOf(switch_2);
                user_me.toppings[switch_1_i] = switch_2;
                user_me.toppings[switch_2_i] = switch_1;
                $.ajax({
                    url: '/switch/addon',
                    data: '1=' + switch_1 + '&2=' + switch_2,
                    dataType: 'JSON',
                    type: 'POST'
                });
            } else if (xtype === 'combo') {
                var switch_1_i = user_me.combos.indexOf(switch_1);
                var switch_2_i = user_me.combos.indexOf(switch_2);
                user_me.combos[switch_1_i] = switch_2;
                user_me.combos[switch_2_i] = switch_1;
                $.ajax({
                    url: '/switch/combo',
                    data: '1=' + switch_1 + '&2=' + switch_2,
                    dataType: 'JSON',
                    type: 'POST'
                });
            } else if (xtype === 'cone') {
                var switch_1_i = user_me.cones.indexOf(switch_1);
                var switch_2_i = user_me.cones.indexOf(switch_2);
                user_me.cones[switch_1_i] = switch_2;
                user_me.cones[switch_2_i] = switch_1;
                $.ajax({
                    url: '/switch/cone',
                    data: '1=' + switch_1 + '&2=' + switch_2,
                    dataType: 'JSON',
                    type: 'POST'
                });
            } else {
                var switch_1_i = user_me.flavors.indexOf(switch_1);
                var switch_2_i = user_me.flavors.indexOf(switch_2);
                user_me.flavors[switch_1_i] = switch_2;
                user_me.flavors[switch_2_i] = switch_1;
                var temp = user_me.flavors_sold[switch_1_i];
                user_me.flavors_sold[switch_1_i] = user_me.flavors_sold[switch_2_i];
                user_me.flavors_sold[switch_2_i] = temp;
                $.ajax({
                    url: '/switch',
                    data: '1=' + switch_1 + '&2=' + switch_2,
                    dataType: 'JSON',
                    type: 'POST'
                });
            }

            if ($('.option.over').parent().hasClass('outofstock')) {
                $('.option.over').parent().removeClass('outofstock');
                $('.option.drag').parent().addClass('outofstock');
            } else if ($('.option.drag').parent().hasClass('outofstock')) {
                $('.option.drag').parent().removeClass('outofstock');
                $('.option.over').parent().addClass('outofstock');
            }
            $('.option.over').removeClass('over');
            $('.option.drag').removeClass('drag');

            update_all_expertise();
            update_sell_value();
            Icecream.update_worker_fx();
        }
        return false;
    });
    $('body').on('keydown', '#new_message input', function () {
        socket.emit('typing');
    });
    $('body').on('submit', '#new_message', function () {
        var t = $('#new_message').find('input[type="text"]').val();
        if (t.substring(0, 3) == '/pm') {
            t = t.substring(4);
            var user = t.substr(0, t.indexOf(' ')+1).trim();
            var message = t.substr(t.indexOf(' ')+1).trim();
            message_user(user, '', message);
            return false;
        }
        var badge = (!user_me.badge_off)? $(this).attr('x-badge') : '';
        var msg = {
            badge: badge,
            text: t
        };
        socket.emit('chat message', msg);
        $('#new_message input[type=\"text\"]').val('').focus();
        //load_message(msg);
        return false;
        $.ajax({ 
            url: 'chat',
            data: {
                text: $(this).find('input[type="text"]').val(),
                badge: badge
            }, 
            dataType: 'JSON',
            type: 'POST',
            timeout: 5000,
            success: function (msg) {
                if (msg.error) {
                    return alert(msg.error);
                }
                if (msg.text) {
                    //var b64 = window.btoa( msg.created_at );
                    cached_last_message = msg.created_at;
                    var div = $('<div />', { 'class': 'chat chat_pending', 'x-id': msg._id});
                    var user_name = $('<span />', { text: msg.user, 'class': 'user_card', 'x-user': msg.user });
                    if (msg.badge) $(user_name).prepend('<img src="' + image_prepend + '/badge_' + msg.badge + '.png" class="chat_badge" />');
                    
                    $(div).prepend($('<span />', { text: msg.text, 'class': 'chat_textbody'}));
                    $(div).prepend(user_name);
                    $('#chat_window').append(div);
                } else {
                    Icecream.sync_chat();
                }
                var objDiv = document.getElementById("chat_window"); //scroll to bottom
                objDiv.scrollTop = objDiv.scrollHeight;
                $('#new_message').fadeTo(500, 1);
            },
            error: function (j) {
                alert('Could not send your message');
                $('#new_message').fadeTo(500, 1);
            }
        });
        setTimeout(function () {
            $('#new_message input[type=\"text\"]').val('').focus();
        }, 100);
        return false;
    });
    $('body').on('click', '.individual_badge', function () {
        var badge = $(this).attr('x-badge');
        $('.badge_selector').css('background-image', 'url("' + image_prepend + '/badge_' + badge + '.png")');
        $('form#new_message').attr('x-badge', badge);
        $.ajax({
            url: 'badge/update/' + badge,
            type: 'post', 
            dataType: 'json',
            success: function (j) {
                user_me.badges = j.badges;
                $('.individual_badge').remove();
                for (var i = 0; i < user_me.badges.length; i++) {
                    var b = user_me.badges[i];
                    $('.badge_inner').append('<img src="' + image_prepend + '/badge_' + b + '.png" class="individual_badge" x-badge="' + b + '" />');
                }
                init_canvas();
            }
        });
    });
    $('body').on('click', '.next_tutorial', function () {
        user_me.tutorial++;
        Icecream.get_tutorial();
        $.ajax({
            url: 'tutorial',
            data: 'tutorial=' + user_me.tutorial,
            dataType: 'JSON',
            type: 'POST',
            success: function (j) {
            }
        });
    });
    $('body').on('click', '.friend_gold', function () {
        $(this).fadeOut(1000, function () {
            $(this).remove();
        });
        $.ajax({
            url: 'redeem_friend',
            dataType: 'JSON',
            success: function (j) {
                if (j.err) return alert(j.err);
                main('friend gold', function () {
                    gold = user_me.gold;
                });
            }
        });
    });
    $('body').on('click', '.complete_quest', function () {
        var that = this;
        $.ajax({
            url: 'complete_quest',
            data: 'id=' + $(this).closest('.quest').attr('x-id'),
            dataType: 'JSON',
            type: 'POST',
            success: function (j) { 
                if (j.error) {
                    $(that).addClass('upgrade_error').append('<div class="unlock_update">' + j.error + '</div>');
                    setTimeout(function () {
                        $('.unlock_update').remove();
                        $('.upgrade_error').removeClass('upgrade_error');
                    }, 2500);
                    return false;
                }
                Icecream.cloud( Math.random() * 2 );
                _gaq.push(['_trackEvent', 'Quest', 'Completed Quest', user_me.quests.length]);
                    if (user_me.quests.length == 2) {
                        $('.quests').addClass('.half_size');
                        cache_event_trend_enable = true;
                        Icecream.update_flavors();
                        Icecream.update_trending();
                    }
                    var id = $(that).closest('.quest').attr('x-id');
                    if (id == '526745240fc3180000000002') {
                        alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">Congratulations! Successfully completed the final quest of the main storyline, earning + $1.00 when a flavor trends or there is an add-on event.<br /><br /><b>Now onward to dynamic quests!</b>', 'Quest Complete'); 
                    } else if (id == '52577a6288983d0000000001') {
                        alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">Congratulations! Successfully completed the quest, in return Joy grants you a workers permit. Bring on the minimum wage!<br /><br /><b>Unlocked Workers</b>', 'Quest Complete'); 
                    } else if (id == '52672bedde0b830000000001') {
                        alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">Congratulations! Successfully completed the quest, in return Joy teaches you trends and events. So much to learn!<br /><br /><b>Unlocked trends and add-on events</b>', 'Quest Complete'); 
                        Icecream.update_trending();
                        Icecream.update_event();
                    } else if (j.name == 'dynamic quest') {
                        alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">Congratulations! Successfully completed the quest, earning + $0.25 when there is an add-on event.<br /><br /><b>The next quest will unlock soon.</b>', 'Quest Complete'); 
                    } else {
                        alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">Congratulations! Successfully completed the quest, earning + $1.00 when there is an add-on event.<br /><br /><b>The next quest will unlock once you have more money.</b>', 'Quest Complete'); 
                    }
                    main('quest');
                    $(that).addClass('upgrade_success');
                    $('.upgrade_success').append('<div class="unlock_update">QUEST COMPLETE</div>');
                    setTimeout(function () {
                        $('.unlock_update').remove();
                         $('.upgrade_success').removeClass('upgrade_success');
                    }, 2500);
            }, 
            error: function (xhr) {
                $(that).addClass('upgrade_error');
                $(that).append('<div class="unlock_update">Error</div>');
                    setTimeout(function () {
                        $('.unlock_update').remove();
                        $('.upgrade_error').removeClass('upgrade_error');
                }, 2500);
            }
        });
    });
    $('body').on('click', '#donate', function () {
        alert('<p>100% of the donations go to making the game better! Leave me feedback with your email and account name and I\'ll let you know what your money was used for and give you a donation badge.</p>' +
            '<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" class="paypal"><input type="hidden" name="cmd" value="_s-xclick">' +
            '<input type="hidden" name="encrypted" value="-----BEGIN PKCS7-----MIIHRwYJKoZIhvcNAQcEoIIHODCCBzQCAQExggEwMIIBLAIBADCBlDCBjjELMAkGA1UEBhMCVVMxCzAJBgNVBAgTAkNBMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MRQwEgYDVQQKEwtQYXlQYWwgSW5jLjETMBEGA1UECxQKbGl2ZV9jZXJ0czERMA8GA1UEAxQIbGl2ZV9hcGkxHDAaBgkqhkiG9w0BCQEWDXJlQHBheXBhbC5jb20CAQAwDQYJKoZIhvcNAQEBBQAEgYBqycKUAa1+ovSjflPGnchSTh/pUdN30LPDkbv+SOeF0PfwkU/dXkTUkU7aECEz7sXVfxMBDlf8A05mRulp3+6/oWqpDoFFJaIjROsU0lKTTc7w6TmfLWQpGd0pS7UGjWz1tNpu5vuH2pm0zbe7MgjFqtg1Grx4U91D+ENkIv+biTELMAkGBSsOAwIaBQAwgcQGCSqGSIb3DQEHATAUBggqhkiG9w0DBwQIYnVWkYxueF6AgaCATpvtUHl6kdq/zQWvqPN8l0AGUkDebydfcHDowTqyg2tUVfaPdC/OijI+oNYNCiuWyHQQROjzxMmAhQq/MfmRw9iG0KMKaBzKfwuoURPXgwiSCxKp2muEQGH7gmyAsjxR8YsEKIt7Yk8tO/lWQVeSmjHU2DTwdtLi3ZTZa/jedmodzJSR492vI+LVVmhBpnRjy0dgFhTy5NaRNqgGOVMroIIDhzCCA4MwggLsoAMCAQICAQAwDQYJKoZIhvcNAQEFBQAwgY4xCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJDQTEWMBQGA1UEBxMNTW91bnRhaW4gVmlldzEUMBIGA1UEChMLUGF5UGFsIEluYy4xEzARBgNVBAsUCmxpdmVfY2VydHMxETAPBgNVBAMUCGxpdmVfYXBpMRwwGgYJKoZIhvcNAQkBFg1yZUBwYXlwYWwuY29tMB4XDTA0MDIxMzEwMTMxNVoXDTM1MDIxMzEwMTMxNVowgY4xCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJDQTEWMBQGA1UEBxMNTW91bnRhaW4gVmlldzEUMBIGA1UEChMLUGF5UGFsIEluYy4xEzARBgNVBAsUCmxpdmVfY2VydHMxETAPBgNVBAMUCGxpdmVfYXBpMRwwGgYJKoZIhvcNAQkBFg1yZUBwYXlwYWwuY29tMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBR07d/ETMS1ycjtkpkvjXZe9k+6CieLuLsPumsJ7QC1odNz3sJiCbs2wC0nLE0uLGaEtXynIgRqIddYCHx88pb5HTXv4SZeuv0Rqq4+axW9PLAAATU8w04qqjaSXgbGLP3NmohqM6bV9kZZwZLR/klDaQGo1u9uDb9lr4Yn+rBQIDAQABo4HuMIHrMB0GA1UdDgQWBBSWn3y7xm8XvVk/UtcKG+wQ1mSUazCBuwYDVR0jBIGzMIGwgBSWn3y7xm8XvVk/UtcKG+wQ1mSUa6GBlKSBkTCBjjELMAkGA1UEBhMCVVMxCzAJBgNVBAgTAkNBMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MRQwEgYDVQQKEwtQYXlQYWwgSW5jLjETMBEGA1UECxQKbGl2ZV9jZXJ0czERMA8GA1UEAxQIbGl2ZV9hcGkxHDAaBgkqhkiG9w0BCQEWDXJlQHBheXBhbC5jb22CAQAwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQUFAAOBgQCBXzpWmoBa5e9fo6ujionW1hUhPkOBakTr3YCDjbYfvJEiv/2P+IobhOGJr85+XHhN0v4gUkEDI8r2/rNk1m0GA8HKddvTjyGw/XqXa+LSTlDYkqI8OwR8GEYj4efEtcRpRYBxV8KxAW93YDWzFGvruKnnLbDAF6VR5w/cCMn5hzGCAZowggGWAgEBMIGUMIGOMQswCQYDVQQGEwJVUzELMAkGA1UECBMCQ0ExFjAUBgNVBAcTDU1vdW50YWluIFZpZXcxFDASBgNVBAoTC1BheVBhbCBJbmMuMRMwEQYDVQQLFApsaXZlX2NlcnRzMREwDwYDVQQDFAhsaXZlX2FwaTEcMBoGCSqGSIb3DQEJARYNcmVAcGF5cGFsLmNvbQIBADAJBgUrDgMCGgUAoF0wGAYJKoZIhvcNAQkDMQsGCSqGSIb3DQEHATAcBgkqhkiG9w0BCQUxDxcNMTMxMDIxMTM0ODM4WjAjBgkqhkiG9w0BCQQxFgQU3lMSqWHF0gYuWLV9NpKHr3rU28IwDQYJKoZIhvcNAQEBBQAEgYCDIB2jz5mw85Z0Mb9XnJSS+0zUsEOAuazKSXGGUQVetRw57WMU2cq3UvDT7znpG2zxCk2ctiqwdP53aL5loRROKSrNu/hY3pFiSfkylZOTCftc6AZLMmtaVbgXSAb7C84ePYHwlbXX80tZoEVf0vI8UCF7jLEWo+C4oBVkTo5XeA==-----END PKCS7-----">' +
            '<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!"><img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1"></form>', 'Donate');
    });
    $('body').on('click', '#invite', function () {
        var url = 'http://icecreamstand.ca/sign_up?refer=' + btoa(user_me.name);
        alert('<p><b>Give your friend this URL</b> to sign up with and get 25% of their money for that day whenever they complete a quest!</p><center><input type"text" id="refer_url" value="' + url + '"></center>', 'Refer a friend');
        $('#refer_url').select().focus();
        return false;
    });
    $('body').on('click', 'user, .user_card', function () {
        get_usercard( $(this).attr('x-user') );
    });
    function get_usercard(user, offsets) {

        $.ajax({
            url: 'user/' + user,
            success: function (j) {
                if (j.error) {
                    alert(j.error, 'Error');
                    return;
                }
                var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
                var friend = 'Add as Friend</div>';
                var friend_enabled = 'true';
                if (user_me.friends && user_me.friends.indexOf(j._id) > -1) {
                    friend = (j.friend)? 'Mutual Friends!' : 'Your Friend';
                    friend_enabled = 'false';
                } else if (j.friend) {
                    friend = 'Return their Friendship';
                }
                var online_status = (j.updated_at === '<1 minute')? 'online' : 'offline';
                var user_cow = '';
                if (j.cow) {
                    user_cow = '<div class="user_cow_inner"><img src="http://static.icecreamstand.ca/cow.png" class="playercard_cow" />';
                    var rainbow = false;
                    if (j.cow.items) {
                        for (var i = 0; i < j.cow.items.length; i++) {
                            if (i > 2) break;
                            var item = j.cow.items[i].split('/')[0].replace(/"/g, '');
                            if (item == 'wings_rainbow') rainbow = true;
                            user_cow = user_cow + '<div x-type="' + item + '" class="cow_attachment type_item"></div>';
                        }
                    }
                    var cow_name = j.cow.name.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
                        return '&#'+i.charCodeAt(0)+';';
                    });
                    user_cow = user_cow + '<div class="user_cow_title" x-rainbow="' + rainbow + '">' + cow_name + '</div></div>';
                }
                alert('<img src="http://www.gravatar.com/avatar/' + j.gravatar + '?s=100&d=http://static.icecreamstand.ca/vanilla_thumb.png" class="gravatar" /><div class="user_info_inner">' +
                '<table>' +
                    '<tr><td><b>Flavors</b>' + j.flavors + '</td><td><b>Add-ons</b>' + j.toppings + '</td></tr>' +
                    '<tr><td><b>Prestige</b>' + j.prestige_level + ' (' + j.prestige_bonus + '%) ' + '</td><td><b>Achievements</b>' + j.achievements + '</td></tr>' +
                    '<tr><td><b>Quests</b>' + j.quests + '</td><td><b>Combos</b>' + j.combos + '</td></tr>' +
                    '<tr><td><b>Carts</b>' + j.carts + '</td><td><b>Employees</b>' + j.employees + '</td></tr>' +
                    '<tr><td><b>Trucks</b>' + j.trucks + '</td><td><b>Robots</b>' + j.robots + '</td></tr>' +
                    '<tr><td><b>Rockets</b>' + j.rockets + '</td><td><b>Aliens</b>' + j.aliens + '</td></tr>' +
                    '<tr><td><b>Coldhands</b>' + j.cold_hands + '</td><td><b>Autopilot</b>' + j.autopilot + '</td></tr>' +
                    '<tr><td><b>Cow level</b>' + Math.floor(j.cow_level) + '</td><td><b>Sold</b> ' + numberWithCommas(j.sold) + '</td></tr>' +
                '</table><div class="user_bottom_panel">' +
                    '<time class="' + online_status + '" title="Last seen ' + j.updated_at + ' ago.">' + online_status + '</time>' +
                    '<div class="button send_message" x-user="' + j.name + '">Message</div>' +
                    '<div class="button add_friend" x-enabled="' + friend_enabled + '" x-user="' + j.name + '">' + friend + '</div>' +
                    '<div class="badges"></div>' +
                '</div><div class="user_cow" x-user="' + j.name + '" x-night="' + j.is_night + '">' + user_cow + '</div>' +
                '<div class="user_icecream" style="background-image: url(' + image_prepend + '/' + j.last_flavor.replace(/\s+/g, '') + 
                '.png), url(' + image_prepend + '/cones/' + j.cone + '.png)"><img src="' + image_prepend + '/toppings/' + j.last_addon.replace(/\s+/g, '') + '.png" class="user_addon" /></div>', j.name.substring(0,1).toUpperCase() + j.name.substring(1) + ', ' + j.title);
                if (j.badges) {
                    var b_len = j.badges.length;
                    for (var i = 0; i < b_len; i++) {
                        $('.message .badges').append('<img src="' + image_prepend + '/badge_' + j.badges[i] + '.png" class="user_info_badge" />');
                    } 
                }
            },
            error: function (j) {
                alert('failed to load user card', 'Error');
            }
        });
    }
    $('body').on('mousemove', '#canvas_sales', function (e) {
        var sales_lastmove_stamp_temp = new Date().getTime();
        if (sales_lastmove_stamp_temp < sales_lastmove_stamp + 250) return;
        sales_lastmove_stamp = sales_lastmove_stamp_temp;
        var x = e.pageX - $('#canvas_sales').offset().left, y = e.pageY - $('#canvas_sales').offset().top;
        var doc = document.documentElement;
        var scroll_top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        for (var i = 0; i < canvas_cache_sales.length; i++) {
            var c = canvas_cache_sales[i];
            var x2 = c[1];
            var y2 = c[2];
            if (within_z(x, x2, y, y2, c[3])) {
                if (!cached_canvas_pointer) {
                    $('#canvas_sales').css('cursor', 'pointer');
                    cached_canvas_pointer = true;
                }
                 return;
            }
        }
        if (cached_canvas_pointer) {
            $('#canvas_sales').css('cursor', 'default');
            cached_canvas_pointer = false;
        }
    });
    $('body').on('mousedown touchend', '#canvas_sales', function (e) {
        //var sales_lastmove_stamp_temp = new Date().getTime();
        //if (sales_lastmove_stamp_temp < sales_lastmove_stamp + 250) return;
        //sales_lastmove_stamp = sales_lastmove_stamp_temp;
        e.preventDefault();
        e.stopPropagation();
        var x = e.pageX - $('#canvas_sales').offset().left, y = e.pageY - $('#canvas_sales').offset().top;
        var doc = document.documentElement;
        var scroll_top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        var click_val = 1 + (user_me.upgrade_coldhands / 4);
        for (var i = 0; i < canvas_cache_sales.length; i++) {
            var c = canvas_cache_sales[i];
            var x2 = c[1];
            var y2 = c[2];
            if (within_z(x, x2, y, y2, c[3])) {
                cache_sell_misses = 0;
                var c_delta = user_me.upgrade_coldhands / 10;
                if (c_delta < 1) c_delta = 1;
                c[0] += c_delta;
                if (c[0] >= 100 + (c[4] * 25) ) {
                    canvas_sales_context.clearRect(c[1] - c[3] - 8, c[2] - c[3] - 8, (c[3]  * 2) + 16, (c[3] * 2) + 16);
                    var new_x = 25 + (Math.random() * 160), new_y = 25 + (Math.random() * 125);
                    var other_icon = canvas_cache_sales[ (i === 0)? 1 : 0 ];
                    while ( within_z(x, new_x+25, y, new_y+25, 50) || within_z(other_icon[1], new_x+25, other_icon[2], new_y+25, 50) ) {
                        new_x = 25 + (Math.random() * 160);
                        new_y = 25 + (Math.random() * 125);
                    }
                    canvas_cache_sales.splice(i, 1);
                    canvas_cache_sales.push( [0, new_x, new_y, 0, Math.floor( Math.random() * 4 )] );
                    if (!cached_canvas_pointer) {
                        $('#canvas_sales').css('cursor', 'pointer');
                        cached_canvas_pointer = true;
                    }
                } else {
                    if (c[3] && c[3] > 10) c[3] -= 2;
                }
                Icecream.canvas_icecream_sales();
                Icecream.icecream_mousedown(click_val);
                do_click(click_val);
                canvas_icecream_sales_dirty = true;
                return false;
            }
        }
        cache_sell_misses++;
        if (cache_sell_misses > 10) {
            canvas_cache_sales = [];
            canvas_icecream_sales_dirty = true;
            canvas_sales_context.clearRect(0, 0, 300, 300);
            setTimeout(function () {
                canvas_sales_context.clearRect(0, 0, 300, 300);
                canvas_cache_sales = [];
                for (var i = 0; i < 2; i++) {
                    var new_x = 25 + (Math.random() * 160), new_y = 25 + (Math.random() * 125);
                    canvas_cache_sales.push( [0, new_x, new_y, 0, Math.floor( Math.random() * 4 )] );
                }
                canvas_icecream_sales_dirty = true;
                cache_sell_misses = 5;
            }, 5000);
            cache_sell_misses = -1000;
        }
        return false;
    });

    function within_z(x, x2, y, y2, z) {
        return (x > x2 - z && x < x2 + z && y > y2 - z && y < y2 + z);
    } 
    function message_user(user, reply, message) {
        if (!user) {
            if (reply) {
                user = reply;
                reply = '';
            }
        }
        if (!message) message = '';
        alert(( (reply)? '<p>' + reply + '</p>' : '' ) + '<textarea id="friend_message_textarea" placeholder="Message">' + message + '</textarea><button x-user="' + user + '" id="friend_message_button">Send</button>', __('Message') +
        ' ' + user.substring(0,1).toUpperCase() + user.substring(1));
        $('#friend_message_textarea').select().focus();
    }
    $('body').on('click', '.new_message_respond', function () {
        var u = $(this).parent().find('.user_card').attr('x-user');
        //$('.message_title > #message_read').click();
        message_read( $(this).parent().attr('x-id') );
        message_user(u);
        return false;
    });
    $('body').on('click', '.friend_reply', function () {
        var u = $(this).attr('x-user');
        var msg = $(this).closest('tr').find('.message_body').text();
        message_user(u, msg);
    });
    $('body').on('click', '#compose_send', function () {
        var u = $('#compose_to').val();
        if (u) {
            message_user(u);
        }
    });
    $('body').on('click', '.view_achievements', function () {
        get_achievements();
        return false;
    });
    $('body').on('click', '.friends_button_container', function () {
        alert('...', 'Private Messages');
        $.ajax({
            url: 'messages',
            dataType: 'JSON',
            type: 'GET',
            success: function(j) {
                messages = j;
                display_messages(0, 5);
            }
        });
    });
    function display_messages(start, length) {
        var m_compiled = '';
        if (messages.length == 0) {
            m_compiled = '<tr><td>-</td><td>You have no messages</td></tr>';
        } else {
            for (var i = 0; i < length; i++) {
                var m = messages[start + i];
                if (m) {
                    var read = (m.is_read)? 'Unread' : 'Read';
                    var d = (new Date(m.created_at)+'').split(' ');
                    m_compiled = m_compiled + '<tr><td id="message_status_' + read + '"><user x-user="' + m.from + '">' + m.from + '</user><time>' + [d[1], d[2], d[4]].join(' ') + '</time></td><td class="message_body">' + m.text.replace(/(<|>)/gi, '') + '</td><td class="message_options" x-id="' + m._id + '">' +
                        '<span id="message_read">Mark ' + read + '</span>' + 
                        '<span class="friend_reply" x-user="' + m.from + '"></span>' + 
                        '<span id="message_remove">X</span>' + 
                        '</td></tr>';
                }
            }
        }
        var msg_control = 'Messages ' + start + ' to ' + (start+length) + ' of ' + messages.length;
        if (start > 0) msg_control = '<message-prev>Back</message-prev>' + msg_control;
        if (start + length < messages.length) msg_control = msg_control + '<message-next>Next</message-next>';
        alert('<table id="message_list">' + m_compiled + '</table><message-controls x-start="' + start + '" x-len="' + length + '">' + msg_control + '</message-controls><div id="compose_message"><input id="compose_to" placeholder="Player"><button id="compose_send">Write</button></div>', 'Private Messages');

    }
    $('body').on('click', 'message-next', function () {
        var start = parseInt($('message-controls').attr('x-start'));
        var length = parseInt($('message-controls').attr('x-len'));
        display_messages(start + length, length);
    });
    $('body').on('click', 'message-prev', function () {
        var start = parseInt($('message-controls').attr('x-start'));
        var length = parseInt($('message-controls').attr('x-len'));
        display_messages(start - length, length);
    });
    $('body').on('click', '.send_message', function () {
        var u = $(this).attr('x-user');
        if (!u) u = $(this).closest('user').attr('x-user');
        if (u) {
            message_user(u);
        } else {
            alert('Could not find player', 'Error');
        }
        return false;
    });
    $('body').on('click', '#feedback', function () {
        message_user('sam');
        return false;
    });
    $('body').on('click', '.friend_delete', function () {
        var user = $(this).closest('user').attr('x-user');
        $.ajax({
            url: 'delete/' + user, 
            success: function (j) {
                $('.friends_counter user').remove();
                Icecream.sync_friends();
            }
        });
    });
    $('body').on('click', '.decline_friendship', function () {
        $('.message_close').click();
    });
    $('body').on('click', '.accept_friendship', function () {
         add_friend( $(this).attr('x-add') );
    });
    $('body').on('click', '.friends_add', function () {
        if ($(this).text() === __('Add')) {
            if ($('.friends_add_text').val() !== '') {
                add_friend( $('.friends_add_text').val() );
            }
            $(this).text(__('Add friend'));
            $('.friends_add_text').hide();
        } else { 
            $('.friends_add_text').val('').show().focus();
            $(this).text(__('Add'));
        }
    });
    $('body').on('click', '.add_friend', function () { //good thing this isn't confusing
        add_friend($(this).attr('x-user'));
        return false;
    });
    function add_friend(name) {
        $.ajax({
            url: 'friend/new',
            data: {friend: name},
            type: 'POST',
            dataType: 'JSON',
            success: function (j) {
                var real_name = name.substring(0, 1).toUpperCase() + name.substring(1);
                if (j.err) return alert(j.err, 'Can not add friend');
                user_me.friends = j.friends;
                cached_online_count = '';
                Icecream.sync_friends(); 
                alert('Added ' + real_name + ' as a friend!', 'New Friend');
            }
        });
    }
    $('#canvas_main').click(function (e) {
        var x = e.pageX, y = e.pageY;
        var doc = document.documentElement;
        var scroll_top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        click_cones(x,e.pageY - scroll_top + 50);
    });
    function click_cones(x,y) {
        var width = 50;
        var height = 120;
        for (var i = 0; i < canvas_drop_cache_len; i++) {
            var c = canvas_drop_cache[i];
            var c_x = c[1];
            var c_y = c[2];
            if (x > c_x && x < c_x + width) {
                if (y > c_y && y < c_y + height) {
                    canvas_drop_context.clearRect(c[1], c[2] - 25, 50 * c[3], 100 * c[3]);
                    canvas_drop_clouds.push({
                        x: c[1],
                        y: c[2] - 10,
                        width: 68.5 * c[3],
                        height: 50 * c[3],
                        speed: (Math.random() < .5)? -5 : 5,
                        variation: Math.floor(Math.random() * 3)
                    });
                    canvas_drop_clouds_len++;
                    canvas_drop_cache.splice(i, 1);
                    canvas_drop_cache_len--;
                    for (var i = 0; i < 2; i++) {
                        $('.icecream').trigger('mousedown');
                    }
                }
            }
        }
    }
    $('body').on('click', '.filter_flavour_options span', function (e) {
        $.ajax({
            url: '/sort_flavour/' + $(this).attr('id'),
            success: function (j) {
                main('sort_flavour', function () {
                    Icecream.paginate(cached_page);
                });
            }
        });
        e.stopPropagation();
    });
    $('body').on('click', '.filter_addon_options span', function (e) {
        $.ajax({
            url: '/sort_addon/' + $(this).attr('id'),
            success: function (j) {
                main('sort_addon', function () {
                    Icecream.paginate(cached_page);
                });
            }
        });
        e.stopPropagation();
    });
    $('body').on('submit', '.ajaxify', function () {
        var update = $(this).attr('x-update');
        var ajax_update = $(this).serialize();
        $.ajax({
            url: $(this).attr('action'),
            data: ajax_update,
            type: $(this).attr('method'),
            success: function (j) {
                if (j.error) return alert(j.error);
                $('.darkness').click();
                if (update === 'refresh') {
                    location.reload();
                }
            },
            error: function(j) {
                console.log(j);
            }
        });
        return false;
    });
    $('body').on('click', '#filter_flavour', function () {
        if ( $('#filter_flavour > div').length === 0) {
            var c = ($('.flavor.main_container .flavor_tab.active').attr('x-id') == 'main_base')? 'filter_flavour_options' : 'filter_addon_options';
            $(this).append('<div class="' + c + '">' + 
                '<span id="base_value">Max Value (ASC)</span><span id="-base_value">Max Value (DESC)</span>' +
                '<span id="name">Name (ASC)</span><span id="-name">Name (DESC)</span>' +
                '</div>');
            $('#filter_flavour > div').slideDown(250);
        } else {
            $('#filter_flavour > div').slideUp(250, function () {
                $(this).remove();
            })
        }
        
    });
    $('body').on('click', '.inventory_clear', function () {
        var num = $(this).attr('x-num');
        cow.items.splice(num, 1);

        $.ajax({
            url: 'cow/update',
            data: { items: cow.items },
            type: 'post',
            dataType: 'json'
        });

        cow_redraw();
        load_cow(cow);
    });
    $('body').on('click', '.user_cow', function () {
        $.ajax({
            url: 'user/' + $(this).attr('x-user') + '/cow',
            dataType: 'json',
            type: 'get',
            success: function (j) {
                load_cow(j);
            }
        });
    });
    $('body').on('click', '.button_cow', function () {
        var action = $(this).attr('x-action');
        if (action == 'rename') {
            alert('<form class="ajaxify" x-update="refresh" action="cow/update" method="post"><p class="p_adopt">Renaming your cow can have severe consequences on its identity and sense of self.</p>' +
                '<input name="name" value="' + cow.name + '"><input type="submit" value="Rename"></form>', 'Rename ' + cow.name);
        } else {
             var days_old = (new Date() - new Date(cow.created_at)) / 86400000;
             if (days_old < 20) {
                return alert('Your cow is too young.', 'I\'m afraid I can\'t let you do that');
             }
             alert('<img src="' + image_prepend + '/icon_breed.png" /><form class="ajaxify" x-update="refresh" action="cow/new" method="post"><p class="p_adopt">What would you like your new cow named?</p><input name="name" value="' + cow.name + '"><input type="submit" value="Adopt" class="button_adopt"></form>', 'Adopting a new Cow');
        }
    });
    $('body').on('click', '.cow', function () {
        if (!cow || !cow.name) return false;
        load_cow(cow);
    });
    
    $('body').on('click', '.login a[href="logout"]', function () {
        alert(__('Are you really sure you want to log out?') + ' <a href="/logout" class="button" id="settings_update" style="margin-bottom:10px;">' + __('Log Out') + '</a>', __('Log Out'), __('Cancel'));
        return false;
    });
    $('body').on('click', '.view_highscores, .refresh_highscores', function () {
        $('.highscores').show();
        var h_type = 'all';
        if ($('#this_week').hasClass('active')) h_type = 'week';
        if ($('#this_day').hasClass('active')) h_type = 'today';
        if ($('#up_and_coming').hasClass('active')) h_type = 'upandcoming';
        if ($('#prestige').hasClass('active')) h_type = 'prestige';
        if ($('#accumulation').hasClass('active')) h_type = 'accumulation';
        if ($('#cowlv').hasClass('active')) h_type = 'cow';
        $.ajax({
            url : '/highscores',
            type : 'GET',
            data : {type: h_type, limit: ($('.active#top_100').length > 0)? 100 : 10},
            dataType: 'JSON',
            success: function (j) {
                $('.highscores ol').html('');
                var u_count = 0;
                var now = new Date();
                var fiveminago = new Date(now.getTime() - 30*60*1000);
                var limit = 10;
                if ($('.active#top_100').length > 0) limit = 100;
                var j_len = j.length;
                for (var i = 0; i < j_len; i++){
                    if (i >= limit) break;
                    var user = j[i];
                    var online = (new Date(user.updated_at).getTime() > fiveminago)? 'online' : 'offline';
                    var gold = 0;
                    if (user.total_gold) gold = user.total_gold;
                    if (user.today_gold) gold = user.today_gold;
                    if (user.week_gold) gold = user.week_gold;
                    if (user.highest_accumulation) {
                        $('.highscores ol').append('<li class="' + online + '"><user x-user="' + user.name + '" class="highscore_user">' + user.name + '</user> ' + ' &nbsp; ' + numberWithCommas(user.highest_accumulation.toFixed(2)) + '</span></li>');
                    } else if (user.cow_level) {
                        if (!user.cow_name) user.cow_name = 'Cow';
                        $('.highscores ol').append('<li class="' + online + '"><user x-user="' + user.name + '" class="highscore_user">' + user.name + '</user> ' + ' &nbsp; ' + user.cow_level.toFixed(2) + ' (' + user.cow_name + ')</span></li>');
                    } else if (user.prestige_bonus) {
                        $('.highscores ol').append('<li class="' + online + '" ><user x-user="' + user.name + '" class="highscore_user">' + user.name + '</user> ' + ' &nbsp; ' + user.prestige_bonus.toFixed(5) + '</span></li>');
                    } else {
                        $('.highscores ol').append('<li class="' + online + '"><user x-user="' + user.name + '" class="highscore_user">' + user.name + '</user> ' + ' &nbsp; <span class="flavor_current">' + numberWithCommas(precise_round(gold,0)) + '</span></li>');
                    }
                }
                init_canvas();
            },
            error: function (j) {
                $('.highscores ol').html('<div>Error loading highscores, please try again</div>');
            }
        });
        return false;
    });
});
function precise_round(num,decimals){
    return Math.round(num*Math.pow(10,decimals))/Math.pow(10,decimals);
}
function numberWithCommas(x) {
    if (!x || typeof x === 'undefined') return '';
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function populate_cones() {
    if (user_me.cones.indexOf('default') === -1 && $('#main_cone img#default').length == 0) {
        $('#main_cone').append('<div class="option_wrapper"><img x-src="' + image_prepend + '/cones/default_thumb.png" id="default" x-id="default" x-type="cone" class="option tooltip" draggable="true" /></div>');
    }
    for (var i = 0; i < user_me.cones.length; i++) {
        if ($('#main_cone img#' + user_me.cones[i]).length === 0) {
            $('#main_cone').prepend('<div class="option_wrapper"><img x-src="' + image_prepend + '/cones/' + user_me.cones[i] + '_thumb.png" id="' + user_me.cones[i] + '" class="option tooltip" x-id="' + user_me.cones[i] + '" x-type="cone" draggable="true" /></div>');
        }
        $('.cones_inner #unlock_cone_' + user_me.cones[i]).remove();
        if (i + 1 === user_me.cones.length) {
            $('#main_cone .option#' +  user_me.cones[i]).click();
        }
    }
    if ( $('.flavor_tab[x-id="main_cone"]').hasClass('active') ) $('.flavor_tab[x-id="main_cone"]').click(); //turn x-src into srcs
    if ($('.cones_inner .unlockable, .cones_inner h3').length === 0) {
        $('.cones_inner').append('<h3>Every cone is unlocked!</h3>');
    }
}
function bind_sockets() {
    socket.on('chat message', function(msg){
            if (msg.add_badge && msg.add_badge_id == user_me._id) {
                user_me.badges.push(msg.add_badge);
                main();
            } 
            load_message(msg);
    });
    socket.on('join', function(msg){
            var id = msg._id;
            if (user_me.is_friend_notify && user_me.friends.indexOf(id) > -1) {
                load_message({ _id: Math.random() * 999999, user: ':', badge: '1', text: msg.name + ' has come online', is_system: true });
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
function cow_hay() {
    if (cache_item_pool.length > 5) return;
    var variance = Math.floor( Math.random() * 4);
    var rand = ( Math.random() * (canvas_width * 0.20) ) + (canvas_width * 0.75); //randomly in the first half 
    var type = (Math.random() < .1)? 'rock' : 'hay';

    var item_chance = (Math.random() + cow.magic_find);
    if (item_chance > 0.8) {
        var drop_table = [];
        var common_drops = ['hat_basic', 'coat_basic', 'accessory_pipe/1/0/0', 'shoes_basic', 'hat_deerstalker', 'shoes_basic', 'shoes_cowboy'];
        var uncommon_drops = ['accessory_monocle/2/0/0/uncommon', 'wings_rainbow/0/0/0/uncommon', 'hat_fedora/1/0/0', 'hat_beerhat/0/0/2/uncommon', 'accessory_lei/0/0/1/uncommon'];
        var rare_drops = ['hat_afro/0/2/0/rare', 'tutu_pink/1/0/1/rare'];

        if (user_me.last_flavor == '523a1948750f2c0000000002' && user_me.last_addon == '525baaf765c3460000000007') {
            uncommon_drops.push('hat_rainbow afro/1/2/1/uncommon');
        }
        if (user_me.last_flavor === '523901fba4cc590000000007' && user_me.last_addon == '525bab2165c3460000000009') {
            rare_drops.push('hat_astronaut/2/0/2/rare');
            rare_drops.push('suit_astronaut/2/0/2/rare');
        }
        if (cached_cone_value == 0.35) { //sprinkle cone's value
            uncommon_drops = 'hat_cone/1/1/1/uncommon';
        }

        if (item_chance > 0.8) drop_table.push.apply(drop_table, common_drops);
        if (item_chance > 0.925) drop_table.push.apply(drop_table, uncommon_drops);
        if (item_chance > 0.975) drop_table.push.apply(drop_table, rare_drops);
        type = drop_table[ Math.floor( Math.random() * drop_table.length ) ];
    }

    var hay = $('<div />', {
        'class': 'item ' + type,
        'x-num': cache_item_pool.length,
        'style': 'left: ' + Math.floor(rand) + 'px',
        'draggable': true,
        'html': '<div class="type_item" x-variance="' + variance + '" x-type="' + type.split('/')[0] + '"></div>'
    });
    hay.appendTo('.background_hill');
    cache_item_pool.push(type);
    var cols = document.querySelectorAll('.item');
    [].forEach.call(cols, function(col) {
        col.addEventListener('dragstart', item_handleDragStart, false);
        col.addEventListener('dragend', item_handleDragEnd, false);
        col.addEventListener('drop', item_handleDrop, false);
        col.addEventListener('dragover', item_handleDragOver, false);
    });
}
function load_cow(c) {
        if (!c) { return alert('Could not find a cow', 'Error'); }
        if (!c.items) { c.items = []; }
        var days_diff = (new Date() - new Date(c.created_at)) / 86400000;
        var days_category = 'Young';
        var button_adopt_text = 'Must be older before you can re-adopt';
        var button_adopt_enabled = 'false';
        if (days_diff > 12) days_category = 'Adult';
        if (days_diff > 32) {
                days_category = 'Old';
                button_adopt_text = 'Adopt a new cow';
                button_adopt_enabled = 'true';
        }
            var cow_buttons = (c._id === cow._id)? '<div class="cow_buttons"><div class="button button_cow" x-action="rename">Rename</div><div class="button button_cow" x-action="adopt" x-enabled="' + button_adopt_enabled + '">' + button_adopt_text + '</div></div>': '';
            var items = '';
            var additional_int = 0, additional_str = 0, additional_con = 0;
            for (var i = 0; i < c.items.length; i++) {
                var item_split = c.items[i].split('/');
                var item = item_split[0].replace(/"/g, '').replace(/ /g, '');
                if (i < 3) {
                    if (item_split[1]) additional_int += parseInt(item_split[1]);
                    if (item_split[2]) additional_str += parseInt(item_split[2]);
                    if (item_split[3]) additional_con += parseInt(item_split[3]);
                }
                items = items + '<div class="inventory_slot"><img src="https://s3.amazonaws.com/icecreamstand.com/items/' + item + '.png" x-pos="' + i + '" x-name="' + c.items[i] + '" class="inventory_thumb tooltip" x-type="item" />' +
                ((c._id == cow._id)? '<div class="inventory_clear" x-num="' + i + '">+</div>' : '') + '</div>';
            }
            var cow_name = c.name.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
                return '&#'+i.charCodeAt(0)+';';
            });
            var intelligence = parseInt(c.intelligence) + parseInt(additional_int);
            var strength = parseInt(c.strength) + parseInt(additional_str);
            c.total_happiness = 100 + Math.floor(intelligence / 2);
            var next_level = Math.ceil( c.level );
            var progress =  100 + ( (c.level - next_level) / .01 );
            alert('<div class="cow_inventory">' + items +
            '</div><div class="cow_stats"><b>Level</b> ' + Math.floor(c.level) + '<br><b class="tooltip" x-type="strength">Strength</b> ' + strength + '<br><b class="tooltip" x-type="constitution">Constitution</b> ' + (parseInt(c.constitution) + parseInt(additional_con)) + '<br><b class="tooltip" x-type="intelligence">Intelligence</b> ' + intelligence + '<br><br>' +
            '<b>Experience</b> ' + c.experience + '<div class="cow_card_experience"><span style="width: ' + progress + '%"></span></div><br><b>Happiness</b> ' + (c.happiness).toFixed(1) + '/' + c.total_happiness + 
            '<div class="cow_card_hapiness"><span style="width: ' + (c.happiness / c.total_happiness / 0.01) + '%"></span></div><br><b>Bonus when happy</b> ' + (strength + 10 + (c.level / 2) ).toFixed(1) + '%<br><b>Age</b> ' + (days_diff).toFixed(1) + ' days (' + days_category + ')' +
            cow_buttons + '</div>', cow_name);

        if (c._id === cow._id) {
            $('.inventory_slot').attr('draggable', true);
            var cols = document.querySelectorAll('.inventory_slot');
            [].forEach.call(cols, function(col) {
                col.addEventListener('dragstart', inventory_handleDragStart, false);
                col.addEventListener('dragend', inventory_handleDragEnd, false);
                col.addEventListener('dragenter', inventory_handleDragEnter, false);
                col.addEventListener('dragleave', inventory_handleDragLeave, false);
                col.addEventListener('drop', inventory_handleDrop, false);
                col.addEventListener('dragover', inventory_handleDragOver, false);
            });
        }
}
function inventory_handleDragStart(e) {
    this.style.opacity = '1'; // this / e.target is the source node.
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('pos', $(this).find('img').attr('x-pos') );
    e.dataTransfer.setData('type', 'move_item' );
    $('.hovercard').remove();
}
function inventory_handleDragEnd(e) {
    $('.over').removeClass('over');
}
function inventory_handleDragEnter(e) {
    $('.over').removeClass('over');
    this.classList.add('over');
}
function inventory_handleDragLeave(e) {
    $('.over').removeClass('over');
}
function inventory_handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}
function inventory_handleDrop(e) {
    console.log('dropping on item -> ' + e.dataTransfer.getData('type'));
    e.preventDefault();
    if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
    }
    if (dragSrcEl != this && String(e.dataTransfer.getData('type')) == 'move_item') {
        var switch_1 = $(this).find('img').attr('x-pos');
        var switch_2 = e.dataTransfer.getData('pos');
        var item_1 = cow.items[switch_1];
        cow.items[switch_1] = cow.items[switch_2];
        cow.items[switch_2] = item_1;
        Icecream.sync_cow(function () {
            update_sell_value();
        }, true);
        cow_redraw();
        load_cow(cow);
    }
    return false;
}
function item_handleDragStart(e) {
    this.style.opacity = '1'; // this / e.target is the source node.
    dragSrcEl = this;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('name', $(this).text() );
    e.dataTransfer.setData('num', $(this).attr('x-num') );
    e.dataTransfer.setData('type', 'item' );

    $('body').css( 'cursor', $(this).css('background-image') + ', move !important' );
    item_remove = true;
}
function item_handleDragEnd(e) {
    console.log('item drag complete, cleaning up');
    $('.over').removeClass('over');
    if (item_remove) {
        var num = parseInt(e.dataTransfer.getData('num') );
        $(this).remove();
        if ( $('.background_hill > .item').length === 0 ) {
            cache_item_pool = [];
        } else {
            cache_item_pool.splice(num, 1);
            for (var i = num; i <= cache_item_pool.length; i++) {
                $('.background_hill > .item[x-num="' + i + '"]').attr('x-num', i - 1);
            }
        }
    }
    $('body').css('cursor', '');
}
function item_handleDrop(e) {
    console.log('dropping on item');
    $('body').css('cursor', '');
    if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
    }
    item_remove = false;
    return false;
}
function cow_handleDrop(e) {
    console.log('dropping on cow');
    $('body').css('cursor', '');
    if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.

    }
    if (dragSrcEl != this && String(e.dataTransfer.getData('type')) == 'item') {
        var num = parseInt(e.dataTransfer.getData('num') );
        var item = cache_item_pool[ num ];
        $(dragSrcEl).remove();
        console.log(cache_item_pool);
        if (item == 'rock') {
            $(this).append('<div class="icecream_float cow_float float_failure">:(</div>');
            $('.cow_float').animate({
                    top: -50
                }, 1000, function () {
                    $(this).remove();
                });
            cow.happiness -= 30;
            if (cow.happiness < 0) cow.happiness = 0;
            update_sell_value();
        } else if (item == 'hay') { //make the cow happy
            if (cow.happiness >= cow.total_happiness)  {
                $(this).append('<div class="icecream_float cow_float">:|</div>');
                $('.cow_float').animate({
                    top: -50
                }, 1000, function () {
                    $(this).remove();
                });
            cow.happiness = cow.total_happiness;
            return false;
            }
            if (cow.happiness > 90) {
                update_sell_value();
            }
            cow.happiness += 10;
            if (cow.happiness > cow.total_happiness)  cow.happiness = cow.total_happiness;
            user_me.cow_clicks++;
            $(this).trigger('mouseout').trigger('mouseover');
            $(this).append('<div class="icecream_float cow_float float_success">:)</div>');
            $('.cow_float').animate({
                top: -50
            }, 1000, function () {
                $(this).remove();
            });
            
            
        } else {
            if (!cow.items) cow.items = [];
            if (cow.items.indexOf( item ) == -1) {
                cow.items.push( item );
            }
            achievement_register('545dad616c43abdf66d01472');
            // if (item == 'wings_bat' && user_me.badges.indexOf(7) == -1) {
            //     alert('<img src="' + image_prepend + '/badge_7.png" /><p>You have found the halloween badge! Congratulations.', 'New Badge!');
            //     user_me.badges.push(7);
            //     main('badges');
            // }
            $.ajax({
                url: 'cow/update',
                data: { items: cow.items },
                type: 'post',
                dataType: 'json'
            });
            cow_redraw();
        }
        cow.experience += 1;
        cow.level = 100 * ( cow.experience / ( cow.experience + 1000 ) );
        var next_level = Math.ceil( cow.level );
        var progress =  100 + ( (cow.level - next_level) / .01 );
        $('.cow_level_bar > #experience').css('width', progress + '%');
        $('.cow_level_bar > #happiness').css('width', (cow.happiness / cow.total_happiness / 0.01) + '%');
        Icecream.sync_cow();
    }
    return false;
}
function item_handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}
function item_handleDragEnter(e) {
    $('.over').removeClass('over');
    this.classList.add('over');
}
function item_handleDragLeave(e) {
    $('.over').removeClass('over');
}
function update_sell_value() {
    var total_value = 0;
    var f_len = flavors.length;
    var average_sale = 0;
    var t_len = toppings.length;
    var current_flavor;
    var is_combo = false;
    cache_combo = null;
    for (var i = 0; i < t_len; i++) {
        var t = toppings[i];
        if (t._id == user_me.last_addon) { 
            total_value += t.value;
            cached_addon_value = t.value;
        }
        for (var j = 0; j < 5; j++) {
            if (typeof user_me.toppings[j] == 'string' && user_me.toppings[j] == t._id) {
                var t_value = t.value;
                cached_worker_addon_value[j] = t_value;
                break;
            }
        }
    }
    $('.banner#trending, .banner#event, .banner#combo').remove();


    //current equipped flavour
    current_flavor = Icecream.get_flavor(user_me.last_flavor);;
    cached_flavor_value = current_flavor.value;

    var base = parseFloat(cached_flavor_value);
    if (user_me.last_frankenflavour) {
        var franken_flavour = Icecream.get_flavor(user_me.last_frankenflavour);
        base = (cached_flavor_value + franken_flavour.value) * 0.75;
    }
    base = base + cached_cone_value;
    if (user_me.last_flavor === trending_flavor && trending_bonus) base = base + parseFloat(trending_bonus);
    if (user_me.last_addon === trending_addon && trending_addon) base = base + parseFloat(user_me.trend_bonus);
    for (var k = 0; k < combos.length; k++) {
        var combo = combos[k];
        if (!combo.franken_id) combo.franken_id = null;
        if (combo.topping_id === user_me.last_addon && ((combo.flavor_id === user_me.last_flavor &&  combo.franken_id == user_me.last_frankenflavour) 
        || (combo.franken_id === user_me.last_flavor &&  combo.flavor_id == user_me.last_frankenflavour)) ) {
            base += parseFloat(combo.value);
            $('.current_flavor').text(__(combo.name));
            is_combo = true;
            $('.sell_value').append('<img src="' + image_prepend + '/banner_combo.png" class="banner" id="combo" />'); 
            cache_combo = combo;
        }
    }
    var expertise_bonus =  base * (.1 * cached_expertise);
    var prestige_bonus = base * (user_me.prestige_bonus / 100);
    var f_value = base + prestige_bonus + expertise_bonus;
    total_value += f_value;

    for (var i = 0; i < f_len; i++) {
        var flavor = flavors[i];
        for (var j = 0; j < 5; j++) {
            if (typeof user_me.flavors[j] == 'string' && user_me.flavors[j] == flavor._id) {
                var base = flavor.value;
                if (flavor._id === trending_flavor && trending_bonus != '') {
                    base = base + parseFloat(trending_bonus);
                    $('#main_base .option_wrapper').eq(j).append('<img src="' + image_prepend + '/banner_trending_small.png" class="banner small" id="trending" />');
                }
                if (user_me.toppings[j] === trending_addon && trending_addon) {
                    base = base + parseFloat(user_me.trend_bonus);
                    $('#main_base .option_wrapper').eq(j).append('<img src="' + image_prepend + '/banner_event_small.png" class="banner small" id="trending" />');
                }
                for (var k = 0; k < combos.length; k++) {
                    var combo = combos[k];
                    if (combo.flavor_id === user_me.flavors[j] && combo.topping_id === user_me.toppings[j]) {
                        base += parseFloat(combo.value);
                        $('#main_base .option_wrapper').eq(j).append('<img src="' + image_prepend + '/banner_combo_small.png" class="banner small" id="combo" />'); 
                        break;
                    }
                }
                var expertise_bonus = base * ( .1 * parseInt($('#main_base .option_wrapper').eq(j).find('.expertise_level').text()) );
                if (isNaN(expertise_bonus)) { console.log('NaN expertise'); expertise_bonus = 0; }
                var prestige_bonus =  base * (user_me.prestige_bonus / 100);
                var f_value = cached_worker_addon_value[j] + base + expertise_bonus + prestige_bonus;
                //console.log('updating f_value: ' +','+ cached_addon_value +','+ flavor.value +','+ expertise_value +','+ user_me.prestige_bonus);
                cached_worker_sell_value[j] = f_value;
                cached_worker_base_value[j] = flavor.value;
                average_sale += f_value;
                break;
            }
        }
    }
    if (!is_combo) {
        if (user_me.last_frankenflavour) {
            console.log('updating current flavour name (franken)');
            $('.current_flavor').html( get_franken( user_me.last_flavor, user_me.last_frankenflavour ).name);
        } else {
            if (current_flavor) {
                var addon_name = ($('#main_addon .selected').attr('id'))?  __('with') + ' ' + $('#main_addon .selected').attr('id') : '';
                console.log('updating current flavour name to ' + current_flavor.name + ' / ' + addon_name);
                $('.current_flavor').html(current_flavor.name + ' <br/>' + addon_name);
            }
        }
    }
    if (user_me.last_flavor === trending_flavor && trending_flavor != '') {
        $('.sell_value').append('<img src="' + image_prepend + '/banner_trending.png" class="banner" id="trending" />'); 
    }
    if (user_me.last_addon === trending_addon && trending_addon != '') {
        $('.sell_value').append('<img src="' + image_prepend + '/banner_event.png" class="banner" id="event" />'); 
    }
    cached_sell_value = parseFloat(total_value).toFixed(2);
    $('.current_value').text( cached_sell_value );

    

    var ice_creams_sold = (user_me.flavors.length >= 5)? 5 : user_me.flavors.length;
    cached_worker_value = average_sale / ice_creams_sold;

    var cow_bonus = (cow.total_bonus && cow.happiness >= 90)? cached_worker_value * ( cow.total_bonus * 0.01 ) : 0;
    cached_cowbonus_value = cow_bonus;

    cached_worker_total = (cached_worker_value + cow_bonus);
    if (isNaN(cached_worker_value)) {
        console.log('avg sale is nan: ' + cached_sell_value);
    } else {
        var sales_time = (5 - (user_me.upgrade_machinery*0.25));
        var income_per_minute = ((sales_per/sales_time)* cached_worker_total *60) + (user_me.upgrade_autopilot * 6 * cached_sell_value); //do NOT remove the outer ( )s
        $('.gold_sales span').text( numberWithCommas( (income_per_minute).toFixed(0)) );
    }
    Icecream.update_quest_bar();
} 

function update_worker_tiers() {

    sales_per = user_me.carts + (user_me.employees*2) + (user_me.trucks*3) + (user_me.robots*5) + (user_me.rockets*10) + (user_me.aliens*15) ;
    $('#unlock_machine .cost').text(numberWithCommas(15000 + (user_me.upgrade_machinery * 150000)));
    $('#unlock_machine .sale_level').text(user_me.upgrade_machinery);
    $('#unlock_research .cost').text(numberWithCommas(50 + (user_me.upgrade_flavor * user_me.upgrade_flavor * 100)));
    $('#unlock_addon .cost').text(numberWithCommas(75 + (user_me.upgrade_addon * user_me.upgrade_addon * 100)));
    $('#unlock_heroic .cost').text(numberWithCommas(1000000 + (3000000 * user_me.upgrade_heroic))); 
    $('#unlock_legendary .cost').text(numberWithCommas(50000000 + (100000000 * user_me.upgrade_legendary))); 
    $('#unlock_autopilot .unlock_text span').text(numberWithCommas( (250 * (user_me.upgrade_autopilot+1) * (user_me.upgrade_autopilot+1)) + parseInt(Math.pow(1.05, user_me.upgrade_autopilot*2)) ));
    $('#unlock_autopilot .sale_level').text(user_me.upgrade_autopilot);
    $('#unlock_coldhands .unlock_text span').text(numberWithCommas( (250 * (user_me.upgrade_coldhands+1) * (user_me.upgrade_coldhands+1)) + parseInt(Math.pow(1.05, user_me.upgrade_coldhands*2)) ));
    $('#unlock_coldhands .sale_level').text(user_me.upgrade_coldhands);
    $('#unlock_cart .unlock_text span').text(numberWithCommas( (25 + (Math.pow(user_me.carts, 2) / 4)) ));
    $('#unlock_cart .sale_level').text(user_me.carts);
    $('#unlock_employee .unlock_text span').text(numberWithCommas(  (150 + (user_me.employees * 100)) ));
    $('#unlock_employee .sale_level').text(user_me.employees);
    $('#unlock_truck .unlock_text span').text(numberWithCommas(  (1000 + (user_me.trucks * user_me.trucks * 50)) ));
    $('#unlock_truck .sale_level').text(user_me.trucks);
    $('#unlock_robot .unlock_text span').text(numberWithCommas( (5000 + (user_me.robots * user_me.robots * 100)) ));
    $('#unlock_robot .sale_level').text(user_me.robots);
    $('#unlock_rocket .unlock_text span').text(numberWithCommas( (50000 + (user_me.rockets * user_me.rockets * 500)).toFixed(2) ));
    $('#unlock_rocket .sale_level').text(user_me.rockets);
    $('#unlock_alien .unlock_text span').text(numberWithCommas( (500000+(30 * Math.pow(user_me.aliens,2.5))).toFixed(2) ));
    $('#unlock_alien .sale_level').text(user_me.aliens);
    $('#unlock_prestige .sale_level').text(user_me.prestige_level);
    $('#unlock_frankenflavour .sale_level').text(user_me.upgrade_frankenflavour);
    if (user_me.upgrade_machinery > 0) $('.option[x-type="machine"]').show();
    if (user_me.upgrade_machinery === 10) $('#unlock_machine').hide();
    if (user_me.upgrade_coldhands === 100) $('#unlock_coldhands').hide();
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
    if (user_me.employees < 25) {
        $('#unlock_truck').addClass('locked');
    } else {
        $('#unlock_truck').removeClass('locked');
    }
    if (user_me.trucks < 50) {
        $('#unlock_robot').addClass('locked');
    } else {
        $('#unlock_robot').removeClass('locked');
    }
    if (user_me.robots < 100) {
        $('#unlock_rocket').addClass('locked');
    } else {
        $('#unlock_rocket').removeClass('locked');
    }
    if (user_me.rockets < 250) {
        $('#unlock_alien').addClass('locked');
    } else {
        $('#unlock_alien').removeClass('locked');
    }
    if (user_me.upgrade_frankenflavour > 0) {
        $('#frankenflavour_tab').show();
    }
    if (user_me.upgrade_legendary == 2) $('#unlock_legendary .cost,#unlock_legendary button').hide();
    if (user_me.carts > 50) achievement_register('52b535fd174e8f0000000001');
    if (user_me.carts >= 250) achievement_register('52b53613174e8f0000000002');
    if (user_me.carts == 1000 && user_me.employees == 1000 &&
        user_me.trucks == 1000 && user_me.robots == 1000 && 
        user_me.rockets == 1000 && user_me.aliens == 1000) achievement_register('537bebae2b2b13b56a283b44');
}
function main_flavours(update_type, callback) {
     $.ajax({
        url : '/flavors',
        data: { sort: 'cost', limit: (user_me.upgrade_flavor + 1) * 3 },
        type: 'GET',
        dataType: 'JSON',
        success: function (j) {
            $('#upgrades .flavors_inner').text('');
            if (true || update_type === 'sort_flavour') { 
                $('#main_base .option_wrapper').remove();
            }
                flavors = j; //.sort(function(a, b){ if(a.name < b.name) return -1; if(a.name > b.name) return 1; return 0; });
                    var my_flavors = user_me.flavors.length;
                    var flav_len = flavors.length;
                    for (var i = my_flavors - 1; i >= 0; i--) {
                        var flavor = user_me.flavors[i];
                        for (var j = 0; j < flav_len; j++) {
                            if (flavors[j]._id === flavor) { flavor = flavors[j]; break; }
                        }
                        var f_name = flavor.name.replace(/\s+/g, '');
                        if ($('#main_base .option#' + f_name).length === 0) {
                            var src_attr = (i < 5)? 'src' : 'x-src'; 
                            $('#main_base').prepend('<div class="option_wrapper' + ((flavor.value === 0.10)? ' outofstock' : '') + '"><img ' + src_attr + '="' + image_prepend + '/' + f_name+ '_thumb.png" draggable="true" id="' + f_name + '" ' + ' x-id="' + flavor._id + '" class="option tooltip" x-base-value="' + flavor.base_value + '" x-value="' + flavor.value + '" x-type="base" /></div>');
                        }
                    }
                    for (var j = 0; j < flav_len; j++) {
                        var flavor = flavors[j];  
                        if (user_me.flavors.indexOf(flavor._id) === -1) {
                            var f_name = flavor.name.replace(/\s+/g, '');
                            $('#upgrades .flavors_inner').append('<div class="unlockable" id="' + flavor.name + '" x-id="' + flavor._id + '" x-type="base"><img src="' + image_prepend + '/' + f_name + '_thumb.png" class="tooltip" /><div class="unlock_text">' + __(flavor.name) + ' <span class="cost">' + numberWithCommas(flavor.cost) + '</span></div><button>Unlock</button></div>');
                        }
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
                        } else if (user_me.upgrade_legendary < 2) {
                            var src = $('#unlock_legendary img').attr('x-src');
                            if (src) {
                                $('#unlock_legendary img').attr('src', src);
                                $('#unlock_legendary img').removeAttr('x-src');
                            }
                            $('#upgrades .flavors_inner').html($('#unlock_legendary')[0].outerHTML);
                        } else {
                            $('#upgrades .flavors_inner').html('<h3>' + __('Every flavour is unlocked!') + '</h3>');
                        }
                    }
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
                        update_sell_value();
                        Icecream.update_worker_fx();
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
            $('#upgrades .toppings_inner').text('');
            if (true || update_type === 'sort_addon') { 
                $('#main_addon .option_wrapper').remove();
            }
            var top_len = user_me.toppings.length;
            for (var i = top_len -1; i >= 0; i--) {
                var topping = Icecream.get_addon(user_me.toppings[i]);
                if ($('.option[x-id="' + topping._id + '"]').length == 0) {
                    var topping_name = topping.name.replace(/\s+/g, '');
                    var src_attr = (i < 5)? 'src' : 'x-src'; 
                    $('.flavor div#main_addon').prepend('<div class="option_wrapper"><img ' + src_attr + '="' + image_prepend + '/toppings/' + topping_name + '_thumb.png" id="' + topping.name + '" x-id="' + topping._id + '" class="option tooltip" x-value="' + topping.value + '" x-type="addon" /></div>');
                }
            }
            for (var i = 0; i < toppings.length; i++) {
                var topping = toppings[i];  
                if (user_me.toppings.indexOf(topping._id) === -1) {
                    $('#upgrades .toppings_inner').append('<div class="unlockable" id="' + topping.name + '" x-id="' + topping._id + '" x-type="addon"><img src="' + image_prepend + '/toppings/' + topping.name.replace(/\s+/g, '') + '_thumb.png" class="tooltip" /><div class="unlock_text">' + __(topping.name) + ' <span class="cost">' + numberWithCommas(topping.cost) + '</span></div><button>' + __('Unlock') + '</button></div>');
                }
            }
            if ($('#main_addon .base_active').length === 0) $('#main_addon').prepend('<div class="base_active"></div>');
            if (first_time) {
                first_time = false;
                if (!user_me.chat_off) {
                    socket = io('http://icecreamstand.ca', { query: "id=" + user_me._id + '&name=' + user_me.name  });
                    bind_sockets();
                }
                if (user_me.friends.length < 2 && Math.random() < .25 && user_me.total_gold > 200 && !user_me.is_guest) {
                    setTimeout(function () {
                        $.ajax({
                            url: '/suggestion/user',
                            dataType: 'json',
                            success: function(j) {
                                alert('<p>Add some friends and help them out!</p><p>Would you like to add <b class="user_card" x-user="' + j.user + '">' + j.user + '</b> as a friend?<div class="button_container button_friendship_container">' +
                            '<div class="button decline_friendship">No thanks</div><div class="button accept_friendship" x-add="' + j.user + '">Sure!</div></div>', 'Ice Cream Stand is better with friends!');
                            }
                        });
                    }, 2500);
                }
                if (user_me.badges) {
                    for (var i = 0; i < user_me.badges.length; i++) {
                            var b = user_me.badges[i];
                            $('.badge_inner').append('<img src="' + image_prepend + '/badge_' + b + '.png" class="individual_badge" x-badge="' + b + '" />');
                    }
                    if (user_me.badges[0]) $('.badge_selector').css('background-image', 'url("' + image_prepend + '/badge_' + user_me.badges[0] + '.png")');
                }
                $('form#new_message').attr('x-badge', user_me.badges[0]);
                var cols = document.querySelectorAll('.cow');
                [].forEach.call(cols, function(col) {
                    col.addEventListener('dragover', item_handleDragOver, false);
                    col.addEventListener('drop', cow_handleDrop, false);
                    col.addEventListener('dragenter', item_handleDragEnter, false);
                    col.addEventListener('dragleave', item_handleDragLeave, false);
                });
                trend_event_active = true;
                Icecream.get_tutorial();
                var canvas = document.getElementById("canvas_main");
                canvas_drop_context = canvas.getContext("2d");
                var canvas = document.getElementById("canvas_sales");
                canvas_sales_context = canvas.getContext("2d");

                var eye_height = Math.random() * 100;
                canvas_cache_sales.push( [0, 50, 25 + eye_height, 16, 0] );
                canvas_cache_sales.push( [0, 125, 25 + eye_height, 16, 0] );

                setInterval(function () { Icecream.canvas_icecream_sales()}, 100);
                setInterval(function () { Icecream.canvas_icecream_drop(); }, 50);
                interval_gold = setInterval(function () { Icecream.update_gold()}, 500);
                setInterval(function () { 
                    if (is_deep_sleep) return;
                    Icecream.sync_friends();
                    Icecream.update_trending();
                    Icecream.get_quest();
                    Icecream.update_flavors();
                    Icecream.cloud( Math.random() * 2 );
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
                }, 100);
                interval_sell = setInterval(function () {
                    Icecream.process_clicks();
                }, 2000);
                var channel = ['Main', 'Beta', 'Alpha'];
                $('#version_info').html('<a href="/stats" id="online_count" target="_blank">-</a> <a href="http://blog.samgb.com/tag/ice-cream-stand/" target="_blank" id="version_num">' + __('View Changelog ') + '</a> V' + version + ' ' + channel[user_me.release_channel]);
            }
            Icecream.update_worker_fx();
            if (!is_deep_sleep &&  cached_machinery !== user_me.upgrade_machinery) {
                clearInterval(interval_employees);
                interval_employees = setInterval(function () {
                    Icecream.employees_working();
                }, 5000);
                cached_machinery = user_me.upgrade_machinery;
                Icecream.get_quests();
                $('.flavor .option[x-id="' + user_me.last_flavor + '"]').eq(0).click();  
                $('.flavor .option[x-id="' + user_me.last_addon + '"]').eq(0).click();
                if (user_me.last_addon == 'undefined') $('#main_addon .option').eq(0).click();
            }
            if ($('#upgrades .toppings_inner').text().length == 0) {
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
                } else if (user_me.upgrade_legendary < 2) {
                    var src = $('#unlock_legendary img').attr('x-src');
                    if (src) {
                        $('#unlock_legendary img').attr('src', src);
                        $('#unlock_legendary img').removeAttr('x-src');
                    }
                    $('#upgrades .toppings_inner').html($('#unlock_legendary')[0].outerHTML);
                } else {
                    $('#upgrades .toppings_inner').html('<h3>' + __('Every add-on is unlocked!') + '</h3>');
                }
            }
            if (callback && typeof callback === 'function') {
                callback();
            }
        } //end success call
    });
}
function main(update_type, callback) {
    console.log('main() type: ' + update_type);

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
            if (!j.badges) j.badges = [];
            if (!j.cones) j.cones = [];
            if (!j.ignore) {
                j.ignore = '';
            } else {
                j.ignore_list = j.ignore.split(',');
            }
            if (!j.upgrade_coldhands) j.upgrade_coldhands = 0;
            if (j.upgrade_coldhands > 100) j.upgrade_coldhands = 100;
            if (!j.badge_off) j.badge_off = false;
            if (j.is_night) $('body:not(.night)').addClass('night');
            $('.friend_gold').remove();
            if (j.friend_gold) {
                $('.floating_footer').append('<div class="friend_gold"><span class="money_icon">' + numberWithCommas( (j.friend_gold).toFixed(0) ) + '</span><img src="' + image_prepend + '/moneybag.png" id="moneybag" /></div>');
            }
            user_me = j;
            if (!gold) gold = user_me.gold;
            disable_animations = user_me.animations_off;
            if (disable_animations) {
                $('#glow').hide();
            }
            if (update_type && (update_type === 'badges')) {
                $('.badge_inner .individual_badge').remove();
                if (user_me.badges) {
                    for (var i = 0; i < user_me.badges.length; i++) {
                            var b = user_me.badges[i];
                            $('.badge_inner').append('<img src="' + image_prepend + '/badge_' + b + '.png" class="individual_badge" x-badge="' + b + '" />');
                    }
                    if (user_me.badges[0]) $('.badge_selector').css('background-image', 'url("' + image_prepend + '/badge_' + user_me.badges[0] + '.png")');
                }
            }
            if (user_me.release_channel > 0) debug_mode = true;
            if (user_me.is_guest && user_me.total_gold > 100) {
                $('body').append('<h4 class="inline-message view_settings" id="guest" style="cursor:pointer;">' + __('Set a name and password!') + '<br />' +
                '<small>' + __('Secure your account, hover over your name at the bottom left and click settings') + '</small></h4>'); 
            }
            $('.login #name').text(j.name).attr('x-user', j.name).prepend('<span class="name_tri_up"></span>').css('display', 'inline-block');
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
            if (user_me.quests.length > 1 || (user_me.quests[0] && user_me.quests[0].split('&')[1] == '0')) $('.tab#employees').removeClass('locked');
            if (user_me.quests.length > 2 || (user_me.quests[1] && user_me.quests[1].split('&')[1] == '0')) {
                if (!cache_event_trend_enable) {
                    cache_event_trend_enable = true;
                    Icecream.update_event();
                    $('.trending_and_events.main_container').removeClass('hidden');
                }
            }
            cached_flavor_length = user_me.flavors.length;
            get_prestige_bonus(user_me);   
            if (update_type && (update_type === 'cart' || update_type === 'employee' || update_type === 'truck' || update_type === 'robot' || update_type === 'rocket' || update_type === 'alien' || update_type === 'repaint' )) {
                Icecream.update_worker_fx();
                update_sell_value();
                if (callback && typeof callback === 'function') callback();
                return;
            }
            if (update_type && (update_type === 'quest')) {
                console.log('getting quests...');
                Icecream.get_quests();
                Icecream.get_quest();
                return;
            }
            populate_cones();
            main_flavours(update_type, callback);
        },
        error: function (j) {
            if (game_working) {
                game_working = false;
                connect_fails++;
                if (connect_fails > 20) {
                    connect_fails = 20;
                }
                var timeout = connect_fails * 10;
                $('.inline-message').remove();
                $('body').append('<h4 class="inline-message" id="updated">Connectivity issue<br /><small>' + __('Trying again in') + ' ' + timeout + ' ' + __('seconds') + '</small></h4>'); 
                for (var i = 0; i <= timeout; i++) {
                    setTimeout("Icecream.reconnect(" + (timeout - i) + ")", 1000 * i);
                }
            }
        }
    });
}
function get_prestige_bonus(user) {
    var x = user.gold;
    var gold_bonus = 25 * (x / (x + 1000000));
    if (gold_bonus > 25) gold_bonus = 25;
    var x2 = user.flavors.length + user.toppings.length;
    var unlock_bonus = (x2 / 174) * 25; 
    var ret = parseFloat(gold_bonus + unlock_bonus).toFixed(5);
    $('#prestige_amount').text(ret);
    return ret;
}
function sell_icecream(amount, workers) {
    if (workers) {
        //replace sold out ice cream
        var outofstock = -1;
        var i = Math.floor( Math.random() * 5 );
        if (cached_worker_base_value[i] > 0.1 && !disable_animations && window_focus && canvas_drop_cache_len < 30 && i < user_me.flavors.length) {
            var i_x = (Math.random() * canvas_width) * 0.25;
            canvas_drop_cache.push([i, (Math.random() > 0.5)? i_x : canvas_width - i_x, -90 + (-100 * i), 1]);
            canvas_drop_cache_len = canvas_drop_cache.length;
        }

        if (outofstock > -1 && user_me.flavors.length > 5) {
            console.time('sell_icecream oos');
            var f = $('#main_base .option_wrapper').eq(outofstock);
            var f_outer = $(f)[0].outerHTML;
            var f_value = parseFloat($(f).find('.option').attr('x-base-value'));
            var new_place = 5;
            var f2 = '';
            for (var i = 5; i < user_me.flavors.length; i++) {
                //var i_value = parseFloat($('#main_base .option_wrapper').eq(i).find('.option').attr('x-base-value'));
                if (!$('#main_base .option_wrapper').eq(i).hasClass('outofstock')) {
                    new_place = i;
                    f2 = $('#main_base .option_wrapper').eq(i).find('.option').attr('x-id')
                    break;
                }
            }
            console.log('.. new place: ' + new_place);
            $.ajax({
                url: '/switch',
                data: {
                    1:$(f).find('.option').attr('x-id'),
                    2:f2
                },
                dataType: 'JSON',
                type: 'POST',
            });
            
            //switch in flavors list
            var start = user_me.flavors[outofstock];
            var start_sold = user_me.flavors_sold[outofstock];
            user_me.flavors[outofstock] = user_me.flavors[new_place]; 
            user_me.flavors[new_place] = start;
            user_me.flavors_sold[outofstock] = user_me.flavors_sold[new_place]; 
            user_me.flavors_sold[new_place] = start_sold;
            
            if (!$('#main_base .option_wrapper')[new_place]) return;
            $(f)[0].outerHTML = $('#main_base .option_wrapper')[new_place].outerHTML;
            $('#main_base .option_wrapper')[new_place].outerHTML = f_outer;
            update_all_expertise();
            update_sell_value();
            Icecream.update_worker_fx();
        }
        var net_gold = parseFloat(sales_per * (cached_worker_total) );
        user_me.gold += parseFloat(sales_per * cached_worker_total);
        if (cow && cow.happiness > 0) {
            if (Math.random() < 0.8) {     
                cow_hay();
            }
            if (Math.random() < 0.5) {
                var decrease_by = (cow.constitution / 50);
                if (decrease_by > .9) decrease_by = 0.9;
                cow.happiness -= 1 - decrease_by;
                $('.cow_level_bar > #happiness').css('width', (cow.happiness / cow.total_happiness / 0.01) + '%');
            }
        }
    }   
    $.ajax({
        url : '/me',
        data: {
            g: user_me.gold,
            d: cached_worker_total,
            a: amount,
            addon: cached_addon_value,
            ta: (trending_addon == user_me.last_addon),
            c: (cache_combo)?cache_combo.value : 'false',
            e: cached_expertise,
            w: workers,
            t: trending_bonus,
            cbv: cached_flavor_value,
            cone: cached_cone_value,
            fp: cached_flavor_index,
            ha: cache_sell_float,
            cc: user_me.cow_clicks, //cow clicks
            ds: (is_deep_sleep)? is_deep_sleep : null,
            v: version,
        },
        dataType: 'JSON',
        type: 'POST',
        timeout: 5000,
        success: function (j) { 
            connect_fails = 0;
            if ( $('.inline-message#animations, .inline-message#updated').length > 0 ) { setTimeout("$('.inline-message').remove();", 10000); }
            if (j.reload) {
                location.reload(); 
                return true;
            }
            if (j.error) {
                $('.inline-message').remove();
                $('body').append('<h4 class="inline-message" id="animations">Beep Boop<br /><small>' + j.error + '</small></h4>'); 
                return;
            }
            if (j.notice && debug_mode) {
                $('.inline-message').remove();
                $('body').append('<h4 class="inline-message" id="animations">Notice<br /><small>' + j.notice + '</small></h4>'); 
                return;
            }
            if (j.gold) {
                user_me.gold = parseFloat(j.gold);
            }
            if (j.quest) {
                Icecream.get_quest();
            }
            if (j.trend) {
                var left = 75000 - parseInt(j.trend);
                if (left > 0) {
                    $('#trend_left').text(numberWithCommas(75000 - j.trend) + ' left');
                    $('#trend_sold_inner').css('width', ((j.trend / 75000.00) * 100) + '%');
                }
            }
            if (j.ifr) {
                main('flavor');
            }
            if (j._id && j.value) {
                var f_len = flavors.length;
                for (var i = 0; i < f_len; i++) {
                    var flavor = flavors[i];
                    if (flavor._id == j._id) {
                        if (flavor.value != j.value) {
                            flavor.value = j.value;
                            update_sell_value();
                            return;
                       }
                   }
                }
            }
            if (j.cow) {
                user_me.cow_level = j.cow;
            }
        },
        error: function (j) {
            connect_fails++;
            if (connect_fails > 2 && game_working) {
                main('reconnect_test');
            }
        }
    });  
}
function alert(msg, title) {
    if (alert_active && alert_current) {
        if (alert_current.title === title) {
            $('.message #description').html(msg);
            alert_current.msg = msg;
            var height_diff = win_height - $('.message').height();
            alert_current.top = (height_diff < 0)? 0 : height_diff / 2;
            $('.message').css('top', alert_current.top);
            return;
        }
        $('body').append('<div class="alert_shadow" style="top: ' + alert_current.top + 'px;"><h4>' + alert_current.title + '</h4><span id="description">' + alert_current.msg + '</span></div>');
        $('.alert_shadow').each(function () {
            var top = $(this).offset().top - window.scrollY;
            var left = parseInt($(this).css('margin-left'));
            var opac = $(this).css('opacity');
            $(this).css('top', top - 20).css('margin-left', left - 20 + 'px').css('opacity', opac - 0.2);
        });
        alert_queue.unshift( Object.create(alert_current) );
        console.log(alert_queue);
    }
    alert_current = { 'msg': msg, 'title': title };
    alert_active = true;
    $('.hovercard').remove();
    if (typeof title == 'undefined') title = __('New Message');
    $('.message, .darkness').remove();
    $('body').append('<div class="message"><div class="message_close">x</div><h4 id="title">' + title + '</h4><span id="description">' + msg + '</span></div></div><div class="darkness"></div>');
    var height_diff = win_height - $('.message').height();
    alert_current.top = (height_diff < 0)? 0 : height_diff / 2;
    $('.message').css('top', alert_current.top);
}
function achievement(title, msg) {
    $('.achievement_bubble').remove();
    if (typeof title == 'undefined') title = 'unlocked';
    $('body').append('<div class="achievement_bubble"><img src="' + image_prepend + '/achievement_thumb.png" /><span id="title">' + __('Achievement') + ': ' + title + '</span><span id="description">' + msg + '</span></div>');
    setTimeout("$('.achievement_bubble').fadeOut(1000);", 10000);
}
function parse_dynamic(quest) {
    quest = quest.substring(2).split('&')[0].split(',');
    var base = [
        '[disaster]! Help [name] the [title] by selling [amount] [type] flavour ice cream cones.',
        '[disaster]! Help [name] the [title] by selling [amount] of the current trending flavour ([type]).',
        '[name] the [title] wants the perfect cone. Reach expertise 10 with [type] flavour',
        '[title] [name] needs you to sell [amount] [type] flavour ice cream cones. He says: "[disaster]."'
    ];
    var disaster = [
        'There\'s a huge flood and the ice cream supply factories are closing down',
        'Global warming is leading to a shortage of ice cream',
        'The ice cream republic is passing a bill that will outlaw ice cream',
        'Ice cream has been banned from schools, causing a black market ice cream trade to spring up',
        'Gandhi threatens your ice cream stand with nuclear war if his appetite isn\'t quenched',
        'Sic Semper Tyrannis! An evil tryant has just been revealed to be allergic to ice cream',
        'He who controls the ice cream controls the universe',
        'Sell! Sell! Sell!',
        'Ice cream is HOT right now. Quickly before it melts',
        'Plutonians love Ice Cream (and being told pluto is a planet), they are also very rich',
        'Gotham is in trouble. A clown is holding hostages ransom and demands ice cream',
        'An icey king has taken the Princess hostage. You must rescue her',
        'A giant is rampaging across the countryside. Calm her down with some ice cream',
        'The cold has become a real bother for me. Please sort that out'
    ];
    var name = ['Sam', 'Jordi', 'Shai', 'Nubbins', 'Skulk', 'Doran', 'Cassia', 'Maaaaarrrrr', 'Ben', 'Tim', 'Kip', 'Mon Mon', 'Soup', 'Jenkins', 'Hatty', 'Davos', 'Joffery', 'Tyrion', 'Jessica', 'Scroopy Noopers', 'Morty', 'PJ'];
    var title = ['Glutonious', 'Malcontent', 'Stupendous', 'Enchanter', 'Visionary', 'Golden', 'Grumpy', 'Aged', 'Unfortunate', 'Sweet-tooth', 'Artist', 'Magician', 'Cold', 'Stone Cold'];
    var type = Icecream.get_flavor(quest[4]).name;
    return base[ quest[0] ].
        replace('[disaster]', disaster[ quest[1] ]).
        replace('[name]', name[ quest[2] ]).
        replace('[title]', title[ quest[3] ]).
        replace('[type]', type).
        replace('[amount]', numberWithCommas(quest[5]) );
}
function achievement_register(id) {
    var a_len = user_me.achievements.length;
    for (var i = 0; i < a_len; i++) {
        if (user_me.achievements[i] === id) return;
    }
    user_me.achievements.push(id);
    $.ajax({
        url: 'register_achievement',
        data: 'id=' + id,
        dataType: 'JSON',
        type: 'POST',
        success: function (j) {
            if (j.name && j.description) {
                achievement(j.name, j.description);
            } else {
                console.log(j);
            }
        }
    });
}
function get_achievements() {
    alert('. . .', 'Achievements');
    $.ajax({
        url: 'achievements',
        dataType: 'JSON',
        type: 'GET',
        success: function (j) {
            var text_unlocked = '';
            var text_locked = '';
            var a_len = j.length;
            var b_len = user_me.achievements.length;
            for (var i = 0; i < a_len; i++) {
                var a = j[i];
                var unlocked = false;
                for (var p = 0; p < b_len; p++) {
                    if (user_me.achievements[p] === a._id) {
                        unlocked = true;
                        break;
                    }
                }
                if (unlocked) {
                    text_unlocked = text_unlocked + '<div><b>' + a.name + '</b> ' + a.description + '</div>';
                } else {
                    text_locked = text_locked + '<div><b>' + a.name + '</b> ' + a.description + '</div>';
                }
            }
            alert('<h5>Achievement points: ' + (user_me.achievements.length * 10) + '</h5><div class="achievements_unlocked">' + text_unlocked + '</div><h5>Remaining Achievements...</h5><div class="achievements_locked">' + text_locked + '</div>', 'Achievements');
        }
    });
}
function update_expertise(cb) {
    if (cached_flavor_value == 0 || cached_flavor_index === -1) { console.log('expertise bp1'); return; }
    var sold = user_me.flavors_sold[cached_flavor_index];
    //console.log('expertise sold: '  +sold + ' index: ' + cached_flavor_index);
    var expertise = 0;
    var sales_needed = 0;
    var last_sale = 0;
    for (var i = 0; i <= 15; i++) {
        var cost = expertise_reqs[i] + last_sale;
        if (i == 15 || sold < cost) {
            expertise = i;
            if (i < 15) {
                sales_needed = cost;
            } else {
                sales_needed = 0;
                sold = 0;
                last_sale = 0;
            }
            break;
        } else {
            last_sale = cost;
        }
    }
    if (cached_expertise != expertise) {
        if (expertise == 1) achievement_register('52857dd1def8030000000001');
        if (expertise == 5) achievement_register('5287a8051834ee0000000003');
        if (expertise == 10) achievement_register('5287a7dd1834ee0000000002');
        if (expertise == 15) achievement_register('53eac41538574559408a53e1');
        Icecream.update_worker_fx();
        cached_expertise = expertise;
        $('#main_base .option[x-id="' + user_me.last_flavor + '"]').parent().find('.expertise_level').text(expertise);
        update_sell_value();
    }
    var remaining = 100 * ((sold-last_sale) / (sales_needed-last_sale));
    var info_stats;
    if (expertise == 15) {
        remaining = 100;
        info_stats = 'MAX';
    } else {
        info_stats = numberWithCommas(sold-last_sale) + ' / ' + numberWithCommas(sales_needed-last_sale);
    }
    if ($('.expertise_bar_outer').length == 0) {
        $('.sell_value').after('<div class="expertise_bar_outer tooltip" x-type="expertise"><div class="expertise_bar_inner" style="height: ' + (100-remaining) + '%;"></div><div class="expertise_hover">' + info_stats + '</div><div class="expertise_number">' + expertise + '</div><div class="expertise_ball"></div></div>');
    } else {
        $('.expertise_bar_inner').css('height', (100-remaining) + '%');
        $('.expertise_number').text(expertise);
        $('.expertise_hover').text(info_stats);
    }
    if (cb && typeof cb === 'function') {
        cb();
    }
}
function update_all_expertise() {
    var f_len = user_me.flavors.length;
    for (var j = 0; j < f_len; j++) {
        var f = $('#main_base .option').eq(j);
        var last_sale = 0;
        for (var i = 0; i <= 15; i++) {
            var cost = expertise_reqs[i] + last_sale;
            if (user_me.flavors_sold[j] < cost || i == 15) {
                if (f.parent().find('.expertise_level').length == 0) {
                    f.after('<div class="expertise_level">' + i + '</div>');
                } else {
                    f.parent().find('.expertise_level').text(i);
                }
                break;
            } else {
                last_sale = cost;
            }
        }
    }
}
function do_click(a) {
    cache_sell_num += a;
    user_me.gold += parseFloat(cached_sell_value);
    if (cached_flavor_index > -1) {
        user_me.flavors_sold[cached_flavor_index] = parseInt(user_me.flavors_sold[cached_flavor_index]) + a;
        update_expertise(function () {
            Icecream.update_quest_bar();
        });
    }
}
function init_canvas() {
    console.log('init canvas');
    $('.background_hill').hide();
    win_height = window.innerHeight;
    doc_height = $(document).height();
    canvas_width = $('#canvas_main').width();
    $('canvas').each(function () {
        $(this).attr('width', $(this).width());
        $(this).attr('height', $(this).height());
    });
    $('.background_hill').css('top', doc_height - 100).show();
    canvas_cache_width = parseInt($('canvas#canvas_main').attr('width'));
    if (typeof canvas_cache_cone != 'object' || !canvas_cache_cone.complete) {
        canvas_cache_cone = new Image();
        canvas_cache_cone.src = image_prepend + "/cone_thumb.png";
    }
    var cloud_type = '';
    if (user_me && user_me.badges && user_me.badges[0] === 4) cloud_type = '_hell';
    canvas_cache_cloud[0] = new Image();
    canvas_cache_cloud[0].src = image_prepend + "/heartcloud" + cloud_type + ".png";
    
    canvas_cache_cloud[1] = new Image();
    canvas_cache_cloud[1].src = image_prepend + "/heartcloud2" + cloud_type + ".png";
    
    canvas_cache_cloud[2] = new Image();
    canvas_cache_cloud[2].src = image_prepend + "/cloud_2b.png";

    canvas_cache_sale_cold = new Image();
    canvas_cache_sale_cold.src = image_prepend + "/sell_cold_sprite.png";

    canvas_cache_workers[6] = new Image();
    canvas_cache_workers[6].src = image_prepend + "/" + $('#main_base .option.selected').attr('id') + '.png';

    canvas_cache_addon[6] = document.getElementById("topping");
    canvas_icecream_sales_dirty = true;
}
function get_franken_info() {
        var f_1 = $('.col_3.franken_left .option').attr('x-id');
        var f_2 = $('.col_3.franken_right .option').attr('x-id');
        if (!f_1 || !f_2) {
            return 'Select your flavours';
        }        
        var f = get_franken(f_1, f_2);
        return '<span id="franken_name">' + f.name + '</span><br>$' + f.value + '<br>Duration: 20 minutes';
}
function get_franken(id_1, id_2) {
        var f_1, f_2;
        for (var i = 0; i < flavors.length; i++) {
            var f = flavors[i];
            if (id_1 === f._id) f_1 = f;
            if (id_2 === f._id) f_2 = f;
            if (f_1 && f_2) break;
        }
        if (!f_1 || !f_2) return {
            name: 'Mystery',
            value: '?'
        };
        var f_1_half = f_1.name.substring( 0, f_1.name.length / 2);
        var f_2_half = f_2.name.substring(f_2.name.length / 2);
        var compiled_value = ((f_1.value + f_2.value) * .75).toFixed(2);
        return {
            name: f_1_half + f_2_half,
            value: compiled_value
        };
}
function get_franken_image() {
        var f_1 = $('.col_3.franken_left .option').attr('src');
        var f_2 = $('.col_3.franken_right .option').attr('src');
        if (!f_1 || !f_2) {
            return '&lt; - - - - - &gt;';
        }
        return '<div class="franken_composite"><div class="franken_img" style="background-image: url(' + f_1 + ')"></div><div class="franken_img second" style="background-image: url(' + f_2 + ');"></div></div>';
}
function cow_item_stats() {
    if (!cow.experience) cow.experience = 1;
    if (!cow.happiness) cow.happiness = 75;
    var int_mod = 0, str_mod = 0, magicfind_mod = 0;;
    for (var j = 0; j < cow.items.length; j++) {
        var split = cow.items[j].split('/');
        if (split[1]) int_mod += parseInt(split[1]);
        if (split[2]) str_mod += parseInt(split[2]);
        if (split[0] == 'hat_jester' || split[0] == 'accessory_marotte') {
            magicfind_mod += .05;
        }
        if (j == 2) break;
    }
    cow.magic_find = magicfind_mod;
    cow.total_bonus = 10 + (cow.level / 2) + cow.strength + str_mod;
    cow.total_happiness = 100 + Math.floor((cow.intelligence + int_mod) / 2);

    var days_old = (new Date() - new Date(cow.created_at)) / 86400000;
    if (days_old > 20 && cow.memories.length == 0) {
    alert('<p>If your cow could talk, what would it say? </p><textarea id="cow_memory"></textarea>' + 
        '<input type="submit" class="button" value="Teach" id="cow_teach">', 'Teaching ' + cow.name + ' to talk');
    }
}
function cow_redraw() {
    $('#unlock_cow, .cow > .cow_attachment').remove();
    if (cow.items) {
        for (var i = 0; i < cow.items.length; i++) {
            var item = cow.items[i].split('/')[0].replace(/"/, '');
            $('.cow').append('<div class="cow_attachment type_item" x-type="' + item + '">');
            if (i === 2) break;
        }
    }
    $('.cow_level_bar').remove();
    var next_level = Math.ceil( cow.level  );
    var progress =  100 + ( (cow.level - next_level) / .01 );
    $('.cow').prepend('<div class="cow_level_bar"><span id="experience" style="width: ' + progress + '%;"></span><span id="happiness" style="width: ' + (cow.happiness / cow.total_happiness / 0.01) + '%"></span></div>');
}
function __(input) {
    if (lang === 'en') return input;
    var resp = cached_language[input];
    if (!resp) {
        console.log('language cache miss for: ' + input);
        resp = cached_language[input] = input;
    }
    return resp;
}
function load_message(msg) {
    if (!msg.user) { return console.log('No user attached to this message'); }
    if ($('.chat[x-id="' + msg._id + '"]').length > 0) { return console.log('Message already loaded'); }
    if (user_me.ignore_list && user_me.ignore_list.indexOf(msg.user) > -1) {
        return false;
    }
    if (!window_focus) { 
        cached_new_messages++;
        var msg_alert = (cached_new_messages == 1)? __('Chat Message') : __('Chat Messages');
        document.title = cached_new_messages + ' ' + msg_alert + ' - ' + __('Ice Cream Stand');
    }
    if (cache_unread_message) {
        var msg_alert = __('Unread Message!');
        document.title = msg_alert + ' - ' + __('Ice Cream Stand');
    }

    var div = $('<div />', {
        'class': 'chat ' + ((msg.is_admin)? 'admin':'normal') + (msg.is_system? ' message_system':''),
        'x-id': msg._id,
        'title': msg.created_at
    });
    $(div).prepend($('<span />', { html: msg.text.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
        return '&#'+i.charCodeAt(0)+';';
    }).replace( /(https?:\/\/[^\s]*)/g, '<a href="$1" target="_blank">$1</a>'), 'class': 'chat_textbody'}));
    var user_name = $('<span />', { text: msg.user, 'class': 'user_card', 'x-user': msg.user });
    if (msg.badge) $(user_name).prepend('<img src="' + image_prepend + '/badge_' + msg.badge + '.png" class="chat_badge" />');
    $(div).prepend(user_name);
    $('#chat_window').append(div);

    var msg_len = $('#chat_window > .chat').length;
    var max_len = $('.chat.main_container .expand').hasClass('active')? 75 : 10;
    while (msg_len > max_len) {
        $('#chat_window > .chat:first').remove();
        msg_len--;
    }
}

/* public methods */
return {
    paginate: function(index) {
        var len = $('.inner_flavor_container:visible .option_wrapper').length;
        if (len < 20) { 
            $('.filter_box').remove();
            $('.inner_flavor_container:visible .option_wrapper:visible img[x-src]').each(function () { //lazy load them images
                var img = $(this);
                var xsrc = $(img).attr('x-src');
                if (typeof xsrc !== 'undefined') {
                    $(img).attr('src', xsrc);
                    $(img).removeAttr('x-src'); 
                }
            });
            return;
        }
        cached_page = index;
        var offset = 5;
        var page_len = Math.ceil((len - offset) / 15) - 1;
        if (index > page_len) index = page_len;
        if (index < 0) index = 0;
        $('.filter_box').remove();
        $('.inner_flavor_container:visible .option_wrapper').show();
        
        $('.inner_flavor_container:visible .option_wrapper').slice(((index + 1) * 15) + offset, len).hide();
        if (index > 0) $('.inner_flavor_container:visible .option_wrapper').slice(offset, ((index + 1) * 15) - 10).hide();

        $('.inner_flavor_container:visible .option_wrapper:visible img[x-src]').each(function () { //lazy load them images
            var img = $(this);
            var xsrc = $(img).attr('x-src');
            if (typeof xsrc !== 'undefined') {
                $(img).attr('src', xsrc);
                $(img).removeAttr('x-src'); 
            }
        });
         $('.inner_flavor_container:visible').after('<div class="filter_box"><div id="filter_flavour"></div><div class="filter_prev button" onclick="Icecream.paginate(' + (index-1) + ')"><img style="height: 20px;" src="' + image_prepend + '/arrow.svg"></div><div class="filter_next button" onclick="Icecream.paginate(' + (index+1) + ')"><img style="height: 20px;" src="'+image_prepend+'/arrow_right.svg"></div></div>');
        if (index == 0) $('.filter_prev').css('opacity', '0.5');
        if (index == page_len) $('.filter_next').css('opacity', '0.5');
        for (var i = index - 2; i < index + 3; i++) {
            if (i >= 0 && i <= page_len) {
                $('.filter_box').append('<span class="filter_page ' + ((i == index)? 'active' : '') + '" onclick="Icecream.paginate(' + i + ')">' + (i+1) + '</span>');
            } else {
                $('.filter_box').append('<span class="filter_page" onclick="Icecream.paginate(0)" style="opacity: 0">0</span>');
            }
        }
    },
    employees_working: function() {
        if (sales_per > 0 && game_working) {
            sell_icecream(sales_per, true);
        }
    },
    update_quest_bar: function() {
        if (!user_me.quests || user_me.quests.length === 0) return false;
        var last_quest = user_me.quests[user_me.quests.length - 1];
        var progress;
        var quest_split = last_quest.split('&');

        if (last_quest.substring(0,1) === '!') { //dynamic
            var starting_point = parseInt(quest_split[2]);
            var dynamic = quest_split[0].split(',');
            var cost = parseInt(dynamic[5]);
            var type = dynamic[4];
            var current = user_me.flavors.indexOf( type );
            var current_sold = (current > -1)? user_me.flavors_sold[ current ] : 0;
            progress = 100 * ((current_sold - starting_point) / cost);
        } else {
            var real_cost = parseInt(quest_split[2]);
            if (quest_split[0] === '52577a6288983d0000000001') {
                var position_of_strawberry = user_me.flavors.indexOf('5238d9d376c2d60000000002');
                if (position_of_strawberry > -1) {
                    var flavor_sold = user_me.flavors_sold[position_of_strawberry];
                    progress = 100 * (flavor_sold / expertise_reqs[real_cost-1]);
                }
            } else if (quest_split[0] === '52672bedde0b830000000001') {
                progress = 100 * (user_me.carts / real_cost);
            } else if (quest_split[0] === '52672dea3a8c980000000001') {
                progress = 100 * (user_me.combos.length / real_cost);
            } else if (quest_split[0] === '526744f40fc3180000000001') {
                progress = 100 * (user_me.trucks / real_cost);
            } else if (quest_split[0] === '526745240fc3180000000002') {
                var num_above_100 = 0;
                var f_len = user_me.flavors_sold.length;
                for (var i = 0; i < f_len; i++) {
                    if (user_me.flavors_sold[i] > 99) num_above_100++;
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
        if (is_deep_sleep || disable_animations || !window_focus || canvas_drop_clouds_len > 10 - num) return;
        for (var i = 0; i < num; i++) {
            var speed = (Math.floor(Math.random() * 4) - 2);
            if (speed === 0) speed = 1;
            var w = 200 + (Math.random() * 175);
            var x = (speed > 0)? 0-w : canvas_cache_width;
            canvas_drop_clouds.push({
                x: x,
                y: Math.floor(Math.random() * canvas_cache_height) - 300,
                width: w,
                height: w * 0.75,
                speed: speed,
                variation: Math.floor( Math.random() * 3 )
            });
        }
        canvas_drop_clouds_len = canvas_drop_clouds.length;
    },
    canvas_icecream_sales: function() {
        if (!canvas_icecream_sales_dirty) { return false; }
        var update = false;
        var clen = canvas_cache_sales.length;
        for (var i = 0; i < clen; i++) {
            var c = canvas_cache_sales[i];
            canvas_sales_context.clearRect(c[1] - 26 - 2, c[2] - 26 - 2, 54, 54);
        }
        for (var i = 0; i < clen; i++) {
            var c = canvas_cache_sales[i];
            canvas_sales_context.beginPath();
            canvas_sales_context.globalAlpha= (c[0] < 1)? 0.3 : 0.5;
            canvas_sales_context.arc(c[1], c[2], c[3] + 8, 0, 2 * Math.PI, false);
            canvas_sales_context.fillStyle = 'white';
            canvas_sales_context.fill();
            canvas_sales_context.beginPath();
            canvas_sales_context.arc(c[1],c[2], (c[3] / 2) + 8,-0.5 * Math.PI, ( (c[0] / (50 + (12.5 * c[4])) ) - 0.5 ) * Math.PI);
            canvas_sales_context.lineWidth = c[3];
            canvas_sales_context.stroke();
            canvas_sales_context.globalAlpha=1;
            if (canvas_cache_sale_cold.complete) {
                canvas_sales_context.drawImage(
                    canvas_cache_sale_cold,  //img
                    32 * c[4], 0, //clip x, y
                    32,32, //clip width, height
                    c[1] - c[3], c[2] - c[3], //x, y
                    c[3] * 2, c[3] * 2 //width, height
                );
            }
            if (c[3] < 16) {
                c[3] += 2;
                update = true;
            }
        }
        if (canvas_cache_sale_cold.complete) canvas_icecream_sales_dirty = update; //only mark it painted if the cube is loaded
    },
    canvas_icecream_drop: function() {
        if (disable_animations || !window_focus) return false;
        
        for (var j = 0; j < canvas_drop_clouds_len; j++) {
            var c = canvas_drop_clouds[j];
            canvas_drop_context.clearRect(c.x, c.y, c.width, c.height);
        }
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
        for (var j = 0; j < canvas_drop_clouds_len; j++) {
            var c = canvas_drop_clouds[j];
            c.x += c.speed;
            canvas_drop_context.drawImage(canvas_cache_cloud[c.variation], c.x, c.y, c.width, c.height);
            if ((c.x > canvas_cache_width && c.speed > 0) || (c.x < 0 - c.width && c.speed < 0)) { 
                canvas_drop_context.clearRect(c.x, c.y, c.width, c.height);
                canvas_drop_clouds.splice(j,1);
                j--;
                canvas_drop_clouds_len--;
            }
        }
    },
    update_gold: function() {
        if ((sales_per === 0 || gold >= user_me.gold)) {
            gold = user_me.gold;
        } else {
            gold += (cached_worker_total / (50 - user_me.upgrade_machinery * 3)) + ((user_me.gold - gold) / 10);
        }
        var new_gold = numberWithCommas( (gold).toFixed(2) );
        $('body > .gold').text(new_gold);
        if (cached_new_messages === 0) {
            if (cache_unread_message) {
                $('title').text('Unread Message Ice Cream Stand');
            } else {
                $('title').text('$' + new_gold + ' Ice Cream Stand');
            }
        }
    },
    icecream_mousedown: function(amount) {
        //there are 3 do_click's below - please don't take advantage of them (pretty please)

        if ($('.icecream > .icecream_float').length > 0) {
            cache_sell_float += amount * cached_sell_value;
            cache_sell_float_num++;
            var c_new = numberWithCommas( (cache_sell_float).toFixed(2) );
            $('.icecream > .icecream_float').stop().css('top', 100 + Math.random() * 20).find('b').text( c_new );
            if (cache_sell_float_num === 10) {
                $('#icecream_float_text').remove();
                $('.icecream').append('<div id="icecream_float_text">Icey! (+2)</div>');
                amount += 2;
                do_click(2);
                $('#icecream_float_text').animate({ 'top': '0' }, 1000, function () { $(this).remove() });
            }
            if (cache_sell_float_num === 30) {
                $('#icecream_float_text').remove();
                $('.icecream').append('<div id="icecream_float_text">Stone Cold! (+5)</div>');
                amount += 5;
                do_click(5);
                $('#icecream_float_text').animate({ 'top': '0' }, 1000, function () { $(this).remove() });
            }
            if (cache_sell_float_num === 100) {
                $('#icecream_float_text').remove();
                $('.icecream').append('<div id="icecream_float_text">Frozen! (+10)</div>');
                amount += 10;
                do_click(10);
                $('#icecream_float_text').animate({ 'top': '0' }, 1000, function () { $(this).remove() });
            }
            if (!cache_sell_float_record && cache_sell_float > user_me.highest_accumulation) {
                $('#icecream_float_text').remove();
                $('.icecream').append('<div id="icecream_float_text">New Record!</div>');
                $('#icecream_float_text').animate({ 'top': '0' }, 1000, function () { $(this).remove() });
                user_me.highest_accumulation = cache_sell_float;
                cache_sell_float_record = true;
            }
        } else {
            cache_sell_float_record = false;
            cache_sell_float = amount * cached_sell_value;
            cache_sell_float_num = 0;
            $('.icecream').append('<div class="icecream_float"><img src="http://static.icecreamstand.ca/coins2.svg" class="money_float" /><b>' + numberWithCommas( (cache_sell_float).toFixed(2) ) + '</b></div>');
        }
        //var color_i = (cache_sell_float_num / 2 > color_pool.length - 1)? color_pool.length - 1: Math.floor(cache_sell_float_num/2);
        $('.icecream > .icecream_float').css('color', '#' + color_pool[Math.floor( Math.random() * color_pool.length )]).animate({ 'top': '0' }, 600 - cache_sell_float_num, 'easeInQuint', function () { $(this).remove() });
        if (!disable_animations && window_focus && canvas_drop_cache_len < 50) {
            if (amount == 1) {
                 canvas_drop_cache.push([6, parseInt((Math.random() * canvas_width) / 50) * 50, 90 * Math.floor(Math.random() * -3), 1]);
            } else {
                canvas_drop_cache.push([6, parseInt((Math.random() * canvas_width) / 50) * 50, 90 * Math.floor(Math.random() * -3), 1.5]);
            }
            canvas_drop_cache_len = canvas_drop_cache.length;
        }
        if (false && trending_flavor != '' && user_me.last_flavor === trending_flavor) {
            var left = parseInt($('.trending #trend_left').text().replace(/,/g, ''));
            if (left - amount > 0) {
                var delta = (amount > 79)? 80 : amount;
                $('.trending #trend_left').text(numberWithCommas( (left - delta).toFixed(0) ) + ' left');
            }
        }
        return false;
    },
    process_clicks: function() {
        if (process_clicks_iteration >= 10) { //TODO: timegate this to every 10s
            if (game_working && user_me.upgrade_autopilot > 0) {
                do_click(user_me.upgrade_autopilot);
                Icecream.icecream_mousedown(user_me.upgrade_autopilot);
            }
            process_clicks_iteration = 0;
        } else {
            process_clicks_iteration += 2;
        }
        if (cache_sell_num == 0) {
            if (!window_focus) {
                if (cache_sell_inactive > 10) {
                    if (!is_deep_sleep) Icecream.deep_sleep();
                } else {
                    cache_sell_inactive++;
                }
            } else {
                cache_sell_inactive = 0;
            }
            return;
        }
        
        user_me.icecream_sold += cache_sell_num;
        sell_icecream(cache_sell_num, false);
        if (user_me.tutorial === 0) {
            user_me.tutorial++;
            Icecream.get_tutorial();
            $.ajax({
                url: 'tutorial',
                data: 'tutorial=' + user_me.tutorial,
                dataType: 'JSON',
                type: 'POST'
            });
        }
        if (user_me.icecream_sold >= 2000000) { achievement_register('5280ef1cb61b420000000009'); }
        if (user_me.icecream_sold >= 1000000) { achievement_register('5280ef12b61b420000000008'); }
        else if (user_me.icecream_sold >= 500000) {  achievement_register('5280ef02b61b420000000006'); }
        else if (user_me.icecream_sold >= 100000) {  achievement_register('5280eee1b61b420000000004'); }
        else if (user_me.icecream_sold >= 10000) {  achievement_register('5280eeeab61b420000000005'); }
        else if (user_me.icecream_sold >= 1000) {  achievement_register('5280ee78b61b420000000003'); }
        else if (user_me.icecream_sold >= 100) {  achievement_register('5280ee5fb61b420000000001'); }
        cache_sell_num = 0;
        if (window_focus) {
            cache_sell_inactive = 0;
            if (is_deep_sleep) Icecream.deep_sleep();
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
                var addon_amount = (user_me.trend_bonus).toFixed(2);
                if (j._id) {
                    trending_addon = j._id;
                    var desc = (j.event)? j.event : j.event = j.name + ' is HOT!';
                    if ($('.event_title[x-id="' + trending_addon + '"]').length == 0) {
                        $('.event #event_name').text( __(desc) );
                        $('.event #trend_time').html('<span id="trend_bonus" class="money_icon">' + addon_amount + '</span><div class="clock"><img src="'+image_prepend+'/clock_hand.svg" class="clock_hand" /></div><span class="event_time">' + x +
                        '</span>').show();
                    }

                    var seconds_left = (60 - x) + ( parseInt(j.mins) * 60 );
                    for (var i = seconds_left; i >= 0; i--) {
                        setTimeout("Icecream.update_clock('.event_time', " + i + ");" , 1000 * (seconds_left - i));
                    }

                    clearInterval(interval_events);
                    interval_events = setInterval(function() {
                        Icecream.update_event();
                    }, (seconds_left && seconds_left > 2)? seconds_left * 1000 : 60000);
                } else {
                    $('.event #event_name').html('<span id="noevent">There is currently no add-on event</span>');
                    $('.event #trend_time').text('');
                    trending_addon = '';
                }
                update_sell_value();
            }
        });
    },
    update_flavors: function() {
        if (!cache_event_trend_enable) return false;
        $.ajax({
            url : '/flavors',
            data: { sort: '-votes last_trend_at', limit: 5, show_mine: true },
            type: 'GET',
            dataType: 'JSON',
            success: function (j) {
                //flavors = j;
                var f_len = j.length;
                $('.vote_container').html('');
                for (var i = 0; i < f_len; i++) {
                    var flavor = j[i];
                    if (i < 5) {
                        if (!flavor.votes) flavor.votes = 0;
                        $('.vote_container').append('<div class="vote_box tooltip" x-id="' + flavor._id + '" x-name="' + flavor.name + '"><img src="http://static.icecreamstand.ca/' + flavor.name.replace(/\s+/g, '') + '_thumb.png" title="' + flavor.name + '" /><b>' + flavor.votes + '</b></div>');
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
    sync_cow: function(cb, is_sync_items) {
        if (!game_working) { return; }
        if (cow && cow.name) {
            var d = { h: cow.happiness, experience: cow.experience };
            if (is_sync_items) {
                d.items = cow.items;
                var all_rares = true;
                for (var i = 0; i < 2; i++) {
                    var item = cow.items[i];
                    if (item) {
                        var rarity = cow.items[i].split('/')[4];
                        if (!rarity || rarity != 'rare') {
                            all_rares = false;
                            break;
                        }
                    }
                }
                if (all_rares) {
                    register_achievement('545dad806c43abdf66d01473');
                }
            }
            $.ajax({
                url: '/cow/update',
                data: d,
                dataType: 'json',
                type: 'post',
                success: function (j) {
                    if (j && j.name) {
                        var total_happiness
                        cow = j;

                        cow_item_stats();
                        if (cb && typeof cb == 'function') {
                            cb();
                        }
                    }
                }
            });
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
                        } else {
                            //draw in background
                            var items = '';
                            for (var j = 0; j < temp_cow.items.length; j++) {
                                var item = temp_cow.items[j];
                                items = items + '<div x-type="' + item + '" class="cow_attachment type_item"></div>';
                                if (j === 2) break;
                            }
                            $('.background_hill').append('<div class="cow_background" x-id="' + temp_cow._id + '" title="' + temp_cow.name + '" x-num="' + i + '">' + items + '</div>');
                        }
                    }
                }
            });
        }
    },
    sync_chat: function() {
        if (!$('.chat.main_container').is(':visible') || !game_working) { return; }
        if (user_me.chat_off) { 
            $('#chat_window').html('<div class="chat_disclaimer">' +
            '<br><p>' + __('Do Not Disturb is <b>On</b>.') + '<br><br></p>' +
            '<p>' + __('If you like the Ice Cream Stand') + ', <span id="invite">' + __('invite your friends') + '</span></p><span class="button">' + __('I Understand') + '</span></div>');
            $('.chat_disclaimer .button').click(function () {
                $('.chat_disclaimer').remove();
                $.ajax({
                    url: 'toggle_chat',
                    type: 'POST'
                });
                user_me.chat_off = false;
                Icecream.sync_chat();
                cached_last_message = '';
            });
            return;
        }
        var expanded = $('.chat.main_container .expand').hasClass('active')? 75 : 10;
        $.ajax({
            url: 'chat',
            data: {
                expanded: expanded
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
            $('.inline-message#updated').html('Connectivity issue<br /><small>Trying again in ' + i + ' seconds</small>');
            return;
        }
        $('.inline-message#updated').html('Connectivity issue<br /><small>Reconnecting...</small>');
        game_working = true;
        main('reconnect', function () {
            $('.inline-message').remove();
        });
    },
    deep_sleep: function () {
        return false;
        is_deep_sleep = !is_deep_sleep;
        var employees_period = 5000 - (user_me.upgrade_machinery * 250);
        var multiplier = (is_deep_sleep)? 10 : 1;
        clearInterval(interval_employees);
        interval_employees = setInterval(function () { Icecream.employees_working(); }, employees_period * multiplier);
    },
    sync_friends: function() {
    if ($('#message_list').length > 0) return false;
    $.ajax({
        url: 'online', 
        data: 'cache=' + Math.random(),
        success: function (j) {
            $('.new_message').remove();
            messages = j.messages;
            if (j.messages && j.messages.length > 0) {
                cache_unread_message = false;
                for (var i = 0; i < messages.length; i++) {
                     var msg = j.messages[i];
                    if (!msg.is_read) {
                        cache_unread_message = true;
                        var msg_popup = $('<div />', {'class': 'new_message', 'text': msg.text, 'x-id': msg._id});
                        if (msg.text == 'Added you as a friend!') {
                            $(msg_popup).append('<div class="new_message_respond" x-user="' + msg.from + '">Say Hello!</div>');
                        } else {
                            $(msg_popup).append('<div class="new_message_respond" x-user="' + msg.from + '">Reply</div>');
                        }
                        $(msg_popup).prepend('<div class="message_title">New Message!<span id="message_read">x</span></div><b class="user_card" x-user="' + msg.from + '">' + msg.from + '</b> ');
                        $(msg_popup).append('<span class="triangle-down"></span>');
                        $('.floating_footer').append(msg_popup);
                        break;
                    }
                }

            }
            var now = new Date();
            var fiveminago = new Date(now.getTime() - 30*60*1000);
            var friend_count = 0;
            var f_l = j.friends.length;
            for (var i = 0; i < f_l; i++) {
                var user = j.friends[i];
                var online = (new Date(user.updated_at).getTime() > fiveminago)? 'online' : 'offline'; 
                var user_container = $('.friends_counter user[x-user="' + j.friends[i].name + '"]');
                if (user_container.length === 0) {
                    var usertag = $('<user />', { text: j.friends[i].name, 'class': online, 'x-user': j.friends[i].name });
                    usertag.append('<span class="friend_options"><span class="friend_delete"></span></span>');
                    $( (online == 'online')? '.friends_list_online' : '.friends_list_offline' ).append(usertag);
                } else {
                    if (online == 'online' && user_container.parent().hasClass('friends_list_offline')) {
                        user_container.detach().appendTo('.friends_list_online');
                    } 
                    if (online == 'offline' && user_container.parent().hasClass('friends_list_online')) {
                        user_container.detach().appendTo('.friends_list_offline');
                    } 
                    user_container.attr('class', online);
                }
                if (online === 'online') { friend_count++; }
            }
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
            /*
            $('.chat_container_list').text('');
            for (var i = 0; i < j.length; i++) {
                var u = j[i].name;
                var div = $('<div />', { text: u, 'class': 'user_card', 'x-user' :  u});
                if (u.indexOf('guest_') > -1) {
                    $('.chat_container_list').append(div);
                } else {
                    $('.chat_container_list').prepend(div);
                }
            } */
            if (j.c > cached_online_peak) cached_online_peak = j.c;
            $('#online_count').text(j.c + ' ' + __('Playing')).attr('x-peak', cached_online_peak);
        }
    });
    },
    get_quest: function () {
        $.ajax({
            url : 'new_quest',
            dataType: 'JSON',
            success: function (j) {
                if (j && j.name && $('.quests.main_container:visible').length > 0) {
                    var reward = 'Extra $1 add-on event bonus';
                    if (j.name == 'Bargaining Time') reward = 'Unlock Workers';
                    if (j.name == 'Delusions of Grandeur') reward = 'Unlock Trends and Events';
                    if (j.dynamic_quest) {
                        reward = 'Extra <span class="money_icon">0.25</span> add-on event bonus';
                        j.description = parse_dynamic(j.dynamic_quest);
                    } 
                    alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">' + j.description.replace(/\n/g, '<br>') + '<br /><br /><b>' + __('Reward') + '</b> ' + reward, __('New Quest') + '! ' + j.name);
                    main('quest'); 
                }
            }
        });
},
get_quests: function() {
    console.log('getting quests');
    if (user_me.quests.length == 0) {
        $('.quest_default').remove(); 
        $('.quest_list').append('<p class="quest_default">You aren\'t currently on any quests...</p>');
        return;
    }
    $.ajax({
        url : 'quests',
        dataType: 'JSON',
        success: function (j) {
            if (!j) return false;
            quests = j;
            var q_len = user_me.quests.length - 1;
            var last_quest = user_me.quests[q_len].split('&');
            $('.quest_default').remove(); 
            for (var i = 0; i <= q_len; i++) {
                var q = user_me.quests[i];
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
                    var user_progress = user_me.quests[i].split('&');
                    if (user_progress[2]) {
                        var cost = user_progress[2];
                        quest.description = quest.description.replace('[cost]', cost);
                    }
                    $('.quest_list').prepend('<div class="quest" x-num="' + i + '" x-id="' + quest._id + '">' +
                    '<div class="quest_body">' + quest.description + '</div></div>');
                    
                    
                    if (user_progress[1] != '0') {
                        if (quest.level == 0) {
                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Become an expert ' + ((cost)? cost : 5 )+ ' with her favourite flavor<br /><b>Reward</b> Unlock Workers</div>');
                        }
                        if (quest.level == 1) {
                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Buy ' + cost + ' carts<br /><b>Reward</b> Unlock Trends</div>');
                        }
                        if (quest.level == 2) { 
                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Discover ' + cost + ' combos<br /><b>Reward</b> + <span class="money_icon">1.00</span> event bonus</div>');
                        }
                        if (quest.level == 3) {
                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Buy ' + ((cost)? cost : 2 ) + ' trucks<br /><b>Reward</b> Unlock Frankenflavours</div>');
                        }
                        if (quest.level == 4) {
                            $('.quest:first .quest_body').append('<div class="quest_goal"><b>Goal</b>: Sell 100 of ' + ((cost)? cost : 5 ) + ' flavors<br /><b>Reward</b>: Unlocks next prestige tier, + $1 event bonus</div>');
                        }
                        $('.quest[x-id="' + quest._id + '"]').append('<div class="button complete_quest"><div id="complete_quest_progress"></div><b>' + __('Complete') + ' ' + quest.name + '</b></div>');
                    } else {
                        $('.quest[x-id="' + quest._id + '"]').append('<center><img src="'+image_prepend+'/star.png" class="quest_star" /><b>' + __('Completed') + ' ' + quest.name + '</b></center>');
                    }
                }
            }
            if (user_me.quests.length == 20 && last_quest[1] == '0') {
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
    if (!cache_event_trend_enable) {
        console.log('cache event trend enable is OFF');
        return;
    }
    $.ajax({
        url: '/trending',
        data: 'cache=' + Math.random(),
        dataType: 'JSON',
        type: 'GET',
        success: function (j) {
            trending_flavor = j.flavour_id;
            var flavour;
            for (var i = 0; i < flavors.length; i++) {
                if (flavors[i]._id === trending_flavor) {
                    flavour = flavors[i];
                    break;
                }
            }
            trending_bonus = j.bonus.toFixed(2);
            $('.trending #trend_bonus').text(trending_bonus);
            $('.trend_title').text(j.flavour_name);
            if (flavour) {
                update_sell_value();
                if ($('.currently_trending[x-id="' + trending_flavor + '"]').length == 0) {
                    $('.trending .currently_trending_container').html('<span class="currently_trending tooltip" x-type="base" x-id="' + trending_flavor + '" id="' + j.flavour_name.replace(/\s+/g, '') + 
                    '"><img src="' + image_prepend + '/' + j.flavour_name.replace(/\s+/g, '') + '_thumb.png" class="trending_img active" /></span></span>');
                } else {
                    $('.trending #trend_bonus').text(trending_bonus).show();
                }
            } else {
                $('.trending .currently_trending_container').html('<span class="currently_trending tooltip" x-type="base" x-id="' + trending_flavor + '" id="' + j.flavour_name.replace(/\s+/g, '') + 
                    '"><img src="' + image_prepend + '/' + j.flavour_name.replace(/\s+/g, '') + '_thumb.png" class="trending_img active trending_locked" /></span></span>');
            }
            $('#trend_left').html(numberWithCommas(75000 - j.total_sold) + ' left');
            $('#trend_sold_inner').css('width', ((j.total_sold / 75000.00) * 100) + '%');
        }
    });
},
update_clock: function(item, seconds_left) { 
    var mins = Math.floor(seconds_left / 60);
    var secs = seconds_left % 60;
    $(item).text(mins + ':' + ((secs < 10)? '0' + secs : secs));
    if (seconds_left == 0) {
        if (item == '.event_time') {
            $('.event #event_name').html('<span id="noevent">There is currently no add-on event</span>');
            $('.event #trend_time').text('');
            trending_addon = '';
        }
    }
},
update_worker_fx: function() {
    $('.wrapper_addon_thumb').remove();
    for (var i = 0; i < 5; i++) {
        var topping = user_me.toppings[i];
        if (topping) {
            var t_len = toppings.length;
            for (var j = 0; j < t_len; j++) {
                if (toppings[j]._id === topping) {
                    topping = toppings[j].name;
                    break;
                }
            }
            $('#main_base .option_wrapper').eq(i).append('<img src="'+image_prepend+'/toppings/' + topping.replace(/\s+/g, '') + '_thumb.png" class="wrapper_addon_thumb" />');
        }
    }
    if (disable_animations || !game_working) return;

    for (var last_worker_fx = 0; last_worker_fx < 5; last_worker_fx++) {
        var icecream_to_fx = $('#main_base .option').eq(last_worker_fx);
         var addon_to_fx = $('#main_addon .option').eq(last_worker_fx);
            if (sales_per === 0 || typeof cached_worker_sell_value[last_worker_fx] != 'number' || isNaN(cached_worker_sell_value[last_worker_fx])) {
                return;
            }
            if ( $(icecream_to_fx).length > 0) {
                $(icecream_to_fx).parent().find('.icecream_float').remove();
                $(icecream_to_fx).parent().prepend('<div class="icecream_float">' + precise_round(cached_worker_sell_value[last_worker_fx],2).toFixed(2) + '</div>');
                $('.icecream_particle[x-id="' + $(icecream_to_fx).attr('id') + '"]').remove();
                canvas_cache_workers[last_worker_fx] = new Image();
                canvas_cache_workers[last_worker_fx].src = image_prepend + "/" + icecream_to_fx.attr('id') + '.png';
            }
            if ($(addon_to_fx).length > 0) {
                canvas_cache_addon[last_worker_fx] = new Image();
                canvas_cache_addon[last_worker_fx].src = image_prepend + "/toppings/" + addon_to_fx.attr('id').replace(/\s+/g, '') + '_thumb.png';
            }
    }
},
get_tutorial: function() {
    $('.tutorial').remove();
    if (user_me.tutorial == 0) {
        $('body').append('<div class="tutorial tutorial_0"><h2>' + __('Click Ice Cubes') + '</h2><p class="tutorial_text">' +
            __('This sells your Ice Cream and gets you money.') + '<br><b>' + __('Try it out by clicking the blue cubes to the left!') +
            '</b></p><div class="triangle-left"></div></div>');
    }
    if (user_me.tutorial == 1) {
        $('body').append('<div class="tutorial tutorial_2"><h2>' + __('Buy All The Things') + '</h2>' +
        __('Unlock upgrades! Research new flavours, add-ons, and cones.') + '<div class="button next_tutorial">' + __("Let's Start") + '</div><div class="triangle-right"></div></div>');
    }
    if (user_me.total_gold > 500 && user_me.tutorial == 2) {
        $('body').append('<div class="tutorial tutorial_3" style="top: ' + (window.innerHeight / 2) + 'px;"><h2>' + __('Sharing is caring') + '</h2>' +
        __('If you enjoy Ice Cream Stand <b>please tell your friends</b>. Any time someone you invite completes a quest, you earn money!') +
        '<div class="clearfix"></div><div class="button next_tutorial">' + __('No thanks :*(') + '</div><div id="invite" class="button next_tutorial">' + __('Sure') + '</div></div>');
    } else if (user_me.tutorial == 2) { 
        setTimeout("Icecream.get_tutorial()", 60000); //not enough gold, check in a minute
    }
},
get_flavor: function(id) {
    var f_len = flavors.length;
    for (var i = 0; i < f_len; i++) {
        if (flavors[i]._id === id) {
            return flavors[i];
        }
    }
    return { name: 'mystery'};
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
    return { name: 'mystery'};
},
};

})(); //end encapsulate
