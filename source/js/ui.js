
//Vars
var version = '1.52';
var version_name = 'Vanilla Vacation';

var channel = ['Main', 'Beta', 'Alpha'];
var cow;
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
var cache_sell_num = 0;
var cache_sell_inactive = 0;
var sales_per = 0; //number of sales every 5 secs
var dragSrcEl = null;
var last_worker_fx = 0; //0 through 4
var map_control_active = '';
var connect_fails = 0;
var quests = {};
var trend_event_active = false;
var debug_mode = false;
var window_focus = true;
var background_animation_num = 0;
var expertise_reqs = [15,50,150,300,600,900,1600,2400,4000,10000,50000, 95000, 225000, 1000000, 5000000, 10000000];
var cached_expertise = 0;

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
var typing_cache = {};

var is_cube = false;
var cache_cube_time;
var cache_cube_money;
var cache_cube_multiplier = 1;
var cache_cube_interval;
var cache_first_win_avail = false;
var cache_rooms_avail = [];
var cache_buffs = [];
var event_time_left = 0;
var cache_worker_sales_to_send = 0; //if AFK these will pile up
var epic_last_attack;
var quest_interval;
var cache_chapter;
var cache_civvie_attack = 0;
var messages_afk = ['is back in Ice Creamtopia', 'is baaaccckkkk', ' returns', 'joins us mortals', 'makes an appearance', 'has been summoned', 'apparates', 'appears out of thin air', 'emerges from the shadows',
'is back', 'swoops in', 'dances into view', 'wiggles about', 'pops out of a bush', 'can be sensed nearby', 'jumps out of the hay', 'rolled a natural 20', 'rolled a natural 1'];

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
    me_callback(user, 'start');
    bind_scoopling();

    $('#upgrades.section-side').remove();
    
    $('body').on('click', '.lore_pback, .lore_pnext', function () {
        $('.message_close:visible').click();
        lore_load_page( Number($(this).attr('x-page')) );
    });
    $('body').on('click', '.lore_chap_pback, .lore_chap_pnext', function () {
        $('.message_close:visible').click();
        lore_load_chapter( Number($(this).attr('x-page')) );
    });
    $('body').on('click', '.share_frankenflavour', function () {
        var flavour_1 = $('.franken_left img').attr('x-id');
        var flavour_2 = $('.franken_right img').attr('x-id');
        if (!flavour_1 || !flavour_2) {
            toast('Please select both flavours', 'Error');
            return false;
        }
        $.ajax({
            url: '/facebook/share/frankenflavour/' + flavour_1 + '/' + flavour_2,
        });
        $(this).html('<i class="fa fa-facebook"></i> Thank you!');
        return false;
    });
    $('body').on('click', '.lore_view_chapter', function () {
        $.ajax({
            url: '/chapter/' + $(this).attr('x-id'),
            dataType: 'json',
            success: function (chapter) {
                cache_chapter = chapter;
                lore_load_page(0);
            }
        });
    });
    function lore_load_page(page) {
        if (page < 0) page = 0;
        var words = cache_chapter.text.split(' ');
        var max_pages = Math.floor(words.length / 140);
        if (page > max_pages) page = max_pages;
        var current_page = page;
        var current_text = words.slice(current_page * 140, (current_page * 140) + 140).join(' ').replace(/\n/g, '<br>');
        var page_controls = '<div class="lore_page_controls"><div class="lore_pback button" x-page="' + (page - 1) + '">Previous Page</div>' +
                '<b>' + (current_page+1) + ' of ' + (max_pages+1) + '</b><div class="lore_pnext button" x-page="' + (page + 1) + '" x-is-max="' + (page == max_pages) + '">Next Page</div></div>';

        alert('<p class="lore_p">' + current_text + '</p>' + page_controls + (page == max_pages? get_easter_bunny(5) : ''), cache_chapter.title);
        $('.message').addClass('fullscreen');
    }
    function lore_load_chapter(offset) {
        $.ajax({
            url: '/chapters',
            data: { offset: offset },
            dataType: 'json',
            success: function (chapters) {
                var compiled = '';
                for (var i = 0; i < chapters.length; i++) {
                    var chapter = chapters[i];
                    compiled = compiled + '<div class="lore_view_chapter" x-id="' + chapter._id + '"><div class="lore_bubble"></div>' +
                    ( (chapter.badge_id)? '<img src="' + image_prepend + '/badges/' + chapter.badge_id + '.png" class="chapter_badge" />' : '') + 
                    '<div class="lore_inner"><b>' + 
                    chapter.title + '</b>' + chapter.saga + '</div></div>';
                }
                var page_controls = '';
                var total_chapters = user.chapters_unlocked.length;
                var current_page = (offset/6);
                if (chapters.length === 0) {
                    compiled = '<center>No chapters unlocked yet.</center>';
                } else {
                    page_controls = '<div class="lore_chapter_controls"><div class="lore_chap_pback button" x-page="' + (offset - 6) + '">Previous Page</div>' +
                    '<b>' + (current_page+1) + ' of ' + (Math.floor(total_chapters/6)+1) + '</b><div class="lore_chap_pnext button" x-page="' + (offset + 6) + '" x-is-max="' + (current_page == Math.floor(total_chapters/6)) + '">Next Page</div></div>';
                }
                alert(compiled + page_controls, '<img class="lore_in_title" src="http://static.icecreamstand.ca/lore_noglow.png"> Lore Journal');
            }
        });
    }
    $('body').on('click', '.lore, [x-link="lore"]', function () {
        lore_load_chapter(0);
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
        if (cached_page > 0) cached_page = 0;
        //Icecream.paginate(cached_page);
        if (xid == 'main_franken') {
            $('#main_franken').remove();
            var share = '<a href="/facebook/share/frankenflavour" class="button button_facebook share_frankenflavour" x-require-facebook="true"><i class="fa fa-facebook"></i> Share Frankenflavour</a>';
            // if (!user.facebook_token) {
            //     share = '<a href="/auth/facebook">class="button button_facebook"><i class="fa fa-facebook"></i> Connect</a>';
            // }
            
            $('.flavor').append('<div class="inner_flavor_container" id="main_franken">' +
                '<div class="col_3 franken_left"><div class="option_wrapper" x-franken="franken_left"></div></div>' +
                '<div class="col_3 franken_center"><b>&lt; - - - - - &gt;</b><p>Select your flavours<br><br></p><button class="button_green">Combine!</button>' +
                '<br><br>' + share + get_easter_bunny(3) + '</div><div class="col_3 franken_right"><div class="option_wrapper" x-franken="franken_right"></div></div></div>');
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
        
        $('.option_wrapper[x-franken="' + $(this).closest('.franken_selector').attr('x-franken') + '"]').html('<img x-type="base" x-value="' + f.value + '" x-base-value="' + f.base_value + '" class="option tooltip" x-id="' + f._id + '" id="' + f_name + '" src="' + image_prepend + '/flavours/thumb/' + f_name + '.png.gz">');
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
                user.last_flavor = f_1;
                user.last_frankenflavour = f_2;
                user.last_frankenflavour_at = new Date();
                main('base');
                _gaq.push(['_trackEvent', 'Flavour', 'Combined a frankenflavour', $('#franken_name').text()]);
            }
        });
    });
    $('body').on('click', '#main_franken .option_wrapper', function (e) {
        $('.franken_selector').remove();
        $('.flavor.main_container').after('<div class="franken_selector" x-franken="' + $(this).attr('x-franken') + '"><div class="selector_nav"><div class="col_3 active" x-show="selector_normal">Normal</div><div class="col_3" x-show="selector_heroic">Heroic</div><div class="col_3" x-show="selector_legendary">Legendary</div></div>' +
            '<p id="selector_normal"></p><p id="selector_heroic" style="display: none;"></p><p id="selector_legendary" style="display: none;"></p><div class="franken_close">Close</div></div>');
        var f_len = flavors.length;
        for (var i = 0; i < f_len; i++) {
            if (i < (24 * 3) ) {
                $('.franken_selector p#selector_normal').append('<div class="franken_option">' + flavors[i].name + '</div>');
            } else if (i < (27 * 3) && user.upgrade_frankenflavour >= 2) {
                $('.franken_selector p#selector_heroic').append('<div class="franken_option">' + flavors[i].name + '</div>');
            } else if (user.upgrade_frankenflavour == 3) {
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
        $('.page_wrap').hide();
        if (!$(this).hasClass('active')) {
            cached_page = 0;
            $('#main_base, #main_addon, #main_combo, #main_cone').addClass('expanded').css('overflow', 'visible');
            //Icecream.paginate(cached_page);
            $(this).text('Minimize').addClass('active');
        } else {
            $('#main_base, #main_addon, #main_combo, #main_cone').removeClass('expanded').css('overflow', 'hidden');
            $(this).text('Expand').removeClass('active');
            //$('.filter_box').remove();
            cached_page = null;
        }
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
    });

    $('body').on('click', '.tooltip_click', function () {
        $(this).addClass('tooltip').trigger('mouseover');
    });
    
    $('body').on('click', '.inline-message', function () {
        $(this).hide();
    });
    $('body').on('mouseover', '.worker_increment', function () {
        var unlockable = $(this).closest('.unlockable');
        var amount = Number( $(this).attr('x-amount') );

        var type = unlockable.attr('x-type').replace('sales_', '');
        var current_level = Number( unlockable.find('.sale_level').text() );
        if (current_level >= 1000) {
            unlockable.find('.cost')[0].textContent = 'Maxed';
            return;
        }
        var cost = 0, real_amount = 0;
        for (var i = current_level; i < current_level + amount; i++) {
            var temp_cost = get_cost(i, type);
            cost += temp_cost;
            real_amount++;
            if (cost > user.gold || i >= 1000) break;
        }

        unlockable.find('.cost')[0].textContent = numberWithCommas( Math.floor(cost) ) + ' (x' + real_amount + ')';
    });
    bind_tooltips();

    $('body').on('click', '.prestige_cancel', function () {
        $(this).parent().find('.button').show();
        $(this).parent().find('button').remove();
        $(this).parent().find('.prestige_cancel').remove();
    });
    $('body').on('click', '.button_quest', function () {
        $('.message_close:last').click();
    });
    $('body').on('click', '.prestige_button', function () {
        $(this).after('<button>Confirm</button><div class="button prestige_cancel">Cancel</div>' + get_easter_bunny(9));
        $(this).hide();
    });
    $('body').on('click', '.currently_trending', function () {
        flavour_switch( $(this).attr('x-id') );
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
    $('body').on('click', '#main_cone .option_wrapper', function () {
        var new_cone = $(this).find('.option').attr('x-id');
        if (cached_cone && cached_cone == new_cone) return false;

        cached_cone = $(this).find('.option').attr('x-id');
        var cached_cone_value_options = {
            'default': 0.0,
            'baby': 0.10,
            'waffle': 0.25,
            'chocolate': 0.50,
            'whitechocolate': 0.75,
            'sugar': 1,
            'sprinkle': 1.25,
            'mintycat': 1.5,
            'doublechocolate': 1.75
        };
        cached_cone_value = cached_cone_value_options[cached_cone];
        $('.flavor #main_cone .selected').removeClass('selected');
        $(this).addClass('selected');
        $('.icecream').attr('x-cone', cached_cone).css('background-image', 'url("'+image_prepend+'/cones/' + cached_cone + '.png.gz")');

        update_sell_value('main cone'); 
    });
    $('body').on('click', '#main_addon .option_wrapper', function () {
        //$('#main_addon .option_wrapper').removeClass('selected');
        //$(this).addClass('selected');
        
        addon_switch($(this).find('.option').attr('x-id'));    
    });
    $('body').on('click', '#main_base .option_wrapper', function () {
        // $('.flavor #main_base .option_wrapper').removeClass('selected');
        // $(this).addClass('selected');
        flavour_switch( $(this).find('.option').attr('x-id'));
    });
    $('body').on('mouseleave', '#upgrades .unlockable button', function () {
        $('.unlock_update').remove();
    });
    $('body').on('click', '#upgrades .unlockable button', function () {
        if (is_cube) {
            cubebar_end();
            $(this).attr('x-cube-pend', true);
            setTimeout(function () {
                $('button[x-cube-pend]').click().removeAttr('x-cube-pend');
            }, 500);
        }
        var t = $(this).closest('.unlockable').attr('x-type');
        var that = this;
        if (t == 'prestige') {
            game_working = false;
        }
        if (t == 'legendary' && user.prestige_level === 0) {
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
                    if (user.is_tooltip) {
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
                        if (user.is_tooltip) {
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
                    user = j.user;
                }
                if (j.success) {
                    $('.hovercard').remove();
                    main(j.success, function () {
                        if ($('.flavor.main_container .expand').hasClass('active')) {
                            Icecream.paginate(cached_page);
                        }
                        Icecream.update_quest_bar();
                        if (j.success == 'cone') {
                            populate_cones();
                        }
                    });
                }
                if (j.cow) {
                    cow = j.cow;
                    Icecream.sync_cow();
                    alert('<p>You have adopted a new cow. Cows need to be fed hay to be happy, but a happy cow is a happy life and will help make your ice cream better. Drag hay to your cow to make it happy. Click your cow to see stats.</p>', 'You have adopted ' + cow.name);
                }
            }
        });
    });
    window.onblur = function() {
        window_focus = false;
        if (is_cube) cubebar_end();
    };
    window.onresize = function() {
        init_canvas();
    };
    window.onfocus = function() {
        window_focus = true;
        canvas_icecream_sales_dirty = true;
        cache_unread_mention = false;
        if (cached_new_messages > 0) {
            $('title').text('Ice Cream Stand');
            cached_new_messages = 0;
        }
        if (is_deep_sleep) Icecream.deep_sleep();
    };
    $('body').attr('x-scroll-down', window.pageYOffset > 400);
    $(document).scroll(function () {
        $('body').attr('x-scroll-down', window.pageYOffset > 400);
    });
    $('body').on('click', '.message_close, .darkness.faded_in', function () {
        if ($(this).hasClass('update')) return;
        var scr = document.body.scrollTop;
        console.log('Reseting location hash');
        window.location.hash = ' ';
        document.body.scrollTop = scr;
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
    $('body').on('click', '.settings_tab', function () {
        var area = $(this).attr('x-area');
        if ( $(this).attr('x-active') !== 'true' ) {
            $('.settings_tab[x-active="true"], .settings_area[x-active="true"]').attr('x-active', 'false');
            $(this).attr('x-active', 'true');
            $('.settings_area[x-area="' + area + '"]').attr('x-active', 'true');
        }
        if ($(this).attr('x-type') == 'shop') {
            Icecream.shop_paginate(0);
        }
    });
    $('body').on('click', '.view_settings', function () {
        var email_hint = '(optional)</span>';
        var additional_connections = '';
        var random_flavour = Icecream.get_flavor( user.flavors[ Math.floor( Math.random() * user.flavors.length ) ] );
        if (user.email_verified) { 
            email_hint = 'verified!';
            if (!user.facebook_token) additional_connections = '<div class="squish"><a href="auth/facebook" class="button button_facebook"><i class="fa fa-facebook"></i> Connect Facebook</a></div>';
        } else if (user.email) { email_hint = '<a href="verify/resend">resend verification</a>'; }
        var select_combined = '';
        for (var i = 0; i < user.titles.length; i++) {
            select_combined = select_combined + '<option>' + user.titles[i] + '</option>';
        }
        var backgrounds = ['default', 'retro', 'fallen', 'attack on the castle', 'winter'];
        var background_compiled = '';
        for (var i = 0; i < backgrounds.length; i++) {
            background_compiled = background_compiled + '<div class="background_option tooltip' + ( (backgrounds[i] == user.active_background)? ' active' : '') + '" x-type="background" x-value="' + backgrounds[i] + '"></div>';
        }
        alert('<form action="user/update" method="POST" class="alert-form">' +
        '<div class="button_container" x-for="settings"><a href="http://en.gravatar.com/" target="_blank" title="Set your avatar through Gravatar" class="settings_avatar" style="background-image: url(' + image_prepend + '/flavours/thumb/' + random_flavour.name + '.png.gz)"></a><div class="settings_tab" x-area="1" x-active="true">Basic</div><div class="settings_tab" x-area="2" x-active="false">Advanced</div>' +
        '<div class="settings_tab" x-area="3" x-active="false">Animations</div><div class="settings_tab" x-area="4" x-active="false">Emails</div><div class="settings_tab" x-area="5" x-active="false">Display</div></div><div class="settings_area" x-area="1" x-active="true">' +
        '<div class="squish">Player Name<input type="text" placeholder="USERNAME" name="username" value="' + user.name + '"></div>' +
        '<div class="squish">Password <span class="setting_hint">(optional)</span><input type="password" placeholder="Password (optional)" name="password"></div>' +
        '<div class="squish">Email <span class="setting_hint">' + email_hint + '</span><input type="text" placeholder="Email (optional)" name="email" value=' + ((user.email)? user.email : '') + '></div>' +
        additional_connections + '</div><div class="settings_area" x-area="2" x-active="false">' +
        '<div class="squish">Ignore List (comma seperated)<input type="text" placeholder="ignore list" name="ignore" value="' + ((user.ignore)? user.ignore : '') + '"></div>' +
        '<div class="squish">Release channel <input type="radio" name="release_channel" value="0" />Main <input type="radio" name="release_channel" value="1" />Beta ' +
        ( (user.badges.indexOf(1) === -1)? ' &nbsp; <small>You must be a donor to access Alpha</small>' : '<input type="radio" name="release_channel" value="2" />Alpha') + '</span></div>' +
        '<div class="squish">Title: <select>' + select_combined + '</select></div>' +
        '<div class="squish">Language: <a href="/lang/en">English</a> <a href="/lang/jp">Japanese</a> <a href="/lang/ru">Russian</a>' + '</div>' +
        '<div class="squish"><div class="toggle_outer">' +
        '<div class="toggle_container" x-key="chat_off">Disable Chat</div>' + 
        '<div class="toggle_container" x-key="is_night">Night Mode</div>' + 
        '<div class="toggle_container" x-key="is_display_friendcows">Display friends cows</div>' + 
        '<div class="toggle_container" x-key="is_tooltip">Tooltips</div><div class="toggle_container" x-key="is_friend_notify">Notify on friend activity</div>' +
        '<div class="toggle_container" x-key="badge_off">Hide Badge</div><div class="toggle_container" x-key="is_second_row">New below top row</div><div class="toggle_container" x-key="is_auto_daynight">Auto day/night</div></div><div class="display_settings"></div>' +
        '</div></div>' +
        '<div class="settings_area" x-area="3" x-active="false">' +
        '<div class="squish"><div class="toggle_container" x-key="is_animation_clouds">Clouds</div></div>' +
        '<div class="squish"><div class="toggle_container" x-key="is_animation_cones">Falling Cones</div></div>' +
        '<div class="squish"><div class="toggle_container" x-key="is_animation_workers">Worker Sales</div></div>' +
        '<div class="squish"><div class="toggle_container" x-key="is_animation_money">Money Updates</div></div><br>' +
        '<div class="squish"><div class="toggle_container" x-key="is_animation_lore">Lore books</div></div><br>' +
        '</div><div class="settings_area" x-area="4" x-active="false">' +
        '<div class="squish"><div class="toggle_container" x-key="is_email_holiday">Email me with Holiday Events</div></div>' +
        '<div class="squish"><div class="toggle_container" x-key="is_email_holiday">Email me when my password changes</div></div>' +
        '<div class="squish"><div class="toggle_container" x-key="is_email_message">Email me when my messages go unread</div></div>' +
        '<br><br></div><div class="settings_area" x-area="5" x-active="false">' +
        '<div class="squish">Background: <br>' + background_compiled + '</div><br><br>' +
        '</div><input type="submit" value="Update" class="button update" id="settings_update"></form>', __('Update Your Settings'), __('Cancel'));
        
        $('.display_settings').html('<div class="toggle_display toggle_container" x-id="flavor">Ice Cream</div>' +
        '<div class="toggle_display toggle_container" x-id="quests">Quests</div><br />' +
        '<div class="toggle_display toggle_container" x-id="achievements">Trending and Event</div>' +
        '</div>');


        $('.alert-form input[type="radio"][value="' + user.release_channel + '"]').attr('checked', true);
        if (!user.display_settings || user.display_settings[0] != 0) $('.toggle_display[x-id="flavor"]').addClass('checked');
        if (!user.display_settings || user.display_settings[1] != 0) $('.toggle_display[x-id="quests"]').addClass('checked');
        if (!user.display_settings || user.display_settings[2] != 0) $('.toggle_display[x-id="achievements"]').addClass('checked');
        if (!user.display_settings || user.display_settings[3] != 0) $('.toggle_display[x-id="chat"]').addClass('checked');

        $('.toggle_container[x-key]').each(function () {
            var key = $(this).attr('x-key');
            if (user[key]) $(this).addClass('checked');
        });
        // if (debug_mode) $('.toggle_debug').addClass('checked');
        // if (!game_working) $('.toggle_working').addClass('checked'); 
        return false; 
    });
    $('body').on('click', '.e' + 'as' + 'ter', function () { //please don't abuse this alpha tester!
        var n = $(this).attr('x-num');
        $(this).remove();
        $.ajax({
            url: 'e' + 'as' + 'ter/' + n + '/' + btoa('e at ics' + n + 'pleasedontcheat' + user.name),
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
        return '<table class="align_right"><tr><td>Total money</td><td>$' + numberWithCommas(user.total_gold.toFixed(2)) + 
                '</td></tr><tr><td>Total money this prestige</td><td>$' + numberWithCommas(user.total_prestige_gold.toFixed(2)) + 
                '</td></tr><tr><td>Today\'s money</td><td>$' + numberWithCommas(user.today_gold.toFixed(2)) + 
                '</td></tr><tr><td>This week\'s money</td><td>$' + numberWithCommas(user.week_gold.toFixed(2)) + 
                '</td></tr><tr><td>Money from friends</td><td>' + numberWithCommas( parseFloat(user.friend_total_gold).toFixed(2) ) +
                '</td></tr><tr><td>Sale Accumulation Record</td><td>' + numberWithCommas( (user.highest_accumulation).toFixed(2) ) +
                '</td></tr><tr><td>Ice Cube Time Record</td><td>' + Math.floor( user.accumulation_time / 60 ) + ':' + (user.accumulation_time % 60) + 
                '</td></tr><tr><td>Flavours</td><td>' + user.flavors.length +
                '</td></tr><tr><td>Add-ons</td><td>' + user.toppings.length +
                '</td></tr><tr><td>Quests</td><td>' + user.quests.length +
                '</td></tr><tr><td>Ice cream sold</td><td>' + numberWithCommas(user.icecream_sold) +
                '</td></tr><tr><td>Sales every ' + (5 - (user.upgrade_machinery*0.25)) + ' seconds</td><td>' + sales_per + 
                '</td></tr><tr><td>Hours since first win ice cube bonus:</td><td> ' +  ( ( new Date() - new Date(user.last_icecube_at) ) / 1000 / 60 / 60 ).toFixed(2) + ' Hours' + 
                '</td></tr><tr><td>Prestige Values: </td><td>' + user.prestige_array.join('<br>') +
                '</td></tr></table>';
    }
    $('body').on('click', '#cow_teach', function () { 
        var memory = $('#cow_memory').val();
        cow.memories.push(memory);
        socket.emit('cow/update', {
            memory: memory
        });
        $('.message_close:last').click();
    });
    $('body').on('click', '.vote_box', function () { 
        $(this).css('bottom', -10);
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
    $('body').on('click', '.friends_list_title > small', function () { 
        var current_status = $(this).parent().next().attr('x-state');
        if (current_status == 'hidden') {
            $(this)[0].textContent = 'Hide';
            $(this).parent().next().attr('x-state', 'visible');
        } else {
            $(this)[0].textContent = 'Show';
            $(this).parent().next().attr('x-state', 'hidden');
        }
    });
    $('body').on('click', '#message_read', function () { 
        $(this).closest('.new_message').hide();
        message_read($(this).closest('.new_message').attr('x-id'));
    });
    $('body').on('click', '#message_mark_read', function () { 
        message_read($(this).closest('.message_options').attr('x-id'));

    });
    function message_read(id) {
        console.log('marking ' + id + ' read');
        cache_unread_message = false;
        $.ajax({
            url: 'message/read/' + id,
            dataType: 'json',
            type: 'post',
            success: function (j) { 
                Icecream.sync_messages();
                if ($('message-controls').length > 0) {
                    var start = parseInt($('message-controls').attr('x-start'));
                    display_messages(start);
                }
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
        var user = $(this).attr('x-user');
        $.ajax({
            url: '/message/' + user,
            data: {message: $('#friend_message_textarea').val()},
            dataType: 'json',
            type: 'post',
            success: function (j) {
                if (j.error) return alert(j.error);
                $('.message_close:last').click();
                socket.emit('message', { to: user });
            }
        });
    });
    $('body').on('click', '.background_option', function () { 
        var v = $(this).attr('x-value');
        $('.background_option.active').removeClass('active');
        $(this).addClass('active');
        $('body').attr('x-background', v);
        $.ajax({
            url: 'toggle/background',
            data: { value: v },
            type: 'POST'
        });
    });
    $('body').on('click', '.toggle_container', function () { 
        $(this).toggleClass('checked');
        var key = $(this).attr('x-key');
        if (key) {
            $.ajax({
                url: 'toggle',
                data: { toggle: $(this).attr('x-key') },
                type: 'POST',
                dataType: 'json',
                success: function (j) {
                    if (j.err) return alert(j.err);
                    user[key] = !user[key];
                    if (key == 'chat_off') {
                        $('#chat_window').text('');
                        cached_last_message = '';
                        Icecream.sync_chat();
                    } else if (key == 'is_night') {
                        if (user[key]) {
                            $('body').addClass('night');
                        } else {
                            $('body').removeClass('night');
                        }
                    }
                }
            });
        }
        var is_checked = $(this).hasClass('checked');
        if ($(this).hasClass('toggle_display')) {
            $.ajax({
                url: 'toggle_display',
                data: {type: $(this).attr('x-id')},
                type: 'POST',
                success: function (j) {
                    main('repaint', function () {
                        init_canvas();
                    });
                }
            });
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
            if (!xtype) xtype = $(this).parent().attr('x-type');
            if (xtype === 'addon') {
                var switch_1_i = user.toppings.indexOf(switch_1);
                var switch_2_i = user.toppings.indexOf(switch_2);
                user.toppings[switch_1_i] = switch_2;
                user.toppings[switch_2_i] = switch_1;
                $.ajax({
                    url: '/switch/addon',
                    data: '1=' + switch_1 + '&2=' + switch_2,
                    dataType: 'JSON',
                    type: 'POST'
                });
            } else if (xtype === 'combo') {
                var switch_1_i = user.combos.indexOf(switch_1);
                var switch_2_i = user.combos.indexOf(switch_2);
                user.combos[switch_1_i] = switch_2;
                user.combos[switch_2_i] = switch_1;
                $.ajax({
                    url: '/switch/combo',
                    data: '1=' + switch_1 + '&2=' + switch_2,
                    dataType: 'JSON',
                    type: 'POST'
                });
            } else if (xtype === 'cone') {
                var switch_1_i = user.cones.indexOf(switch_1);
                var switch_2_i = user.cones.indexOf(switch_2);
                user.cones[switch_1_i] = switch_2;
                user.cones[switch_2_i] = switch_1;
                $.ajax({
                    url: '/switch/cone',
                    data: '1=' + switch_1 + '&2=' + switch_2,
                    dataType: 'JSON',
                    type: 'POST'
                });
            } else {
                var switch_1_i = user.flavors.indexOf(switch_1);
                var switch_2_i = user.flavors.indexOf(switch_2);
                user.flavors[switch_1_i] = switch_2;
                user.flavors[switch_2_i] = switch_1;
                var temp = user.flavors_sold[switch_1_i];
                user.flavors_sold[switch_1_i] = user.flavors_sold[switch_2_i];
                user.flavors_sold[switch_2_i] = temp;
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
            update_sell_value('main base drop');
            Icecream.update_worker_fx('flavour drop');
        }
        return false;
    });
    $('body').on('keydown', '#new_message input', function () {
        socket.emit('typing', { room: user.room });
    });

    $('body').on('click', '.chat_popout', function () {

        game_working = false;
        socket.emit('disconnect');
        $('body').append('<div class="white_overlay"><strong>Switch to Chat Popout</small></strong>' +
        '<i class="fa fa-times"></i></div>');
        $('.white_overlay i').click(function () {
            $('.white_overlay').fadeOut(250, function() {
                window.location.reload(true);
            });
        });
        window.open('http://icecreamstand.ca/chat','Chat','width=600,height=800');
        return false;
    });
    $('body').on('click', '.individual_badge', function () {
        var badge = $(this).attr('x-badge');
        $('.badge_selector').css('background-image', 'url("' + image_prepend + '/badges/' + badge + '.png")');
        $('form#new_message').attr('x-badge', badge);
        $.ajax({
            url: 'badge/update/' + badge,
            type: 'post', 
            dataType: 'json',
            success: function (j) {
                user.badges = j.badges;
                $('.individual_badge').remove();
                for (var i = 0; i < user.badges.length; i++) {
                    var b = user.badges[i];
                    $('.badge_inner').append('<img src="' + image_prepend + '/badges/' + b + '.png" class="individual_badge" x-badge="' + b + '" />');
                }
                init_canvas();
            }
        });
    });
    $('body').on('click', '.next_tutorial, .tutorial_shadow', function () {
        user.tutorial++;
        Icecream.get_tutorial();
        $.ajax({
            url: 'tutorial',
            data: 'tutorial=' + user.tutorial,
            dataType: 'JSON',
            type: 'POST',
            success: function (j) {
            }
        });
    });
    $('body').on('click', '.img_inline', function () {
        var state = $(this).text();
        if (state == 'view') {
            $(this)[0].textContent = 'hide';
            $(this).after('<img class="img_inline_after" src="' + $(this).attr('x-href') + '" />');
        } else {
            $(this)[0].textContent = 'view';
            $(this).next('.img_inline_after').remove();
        }
        init_canvas();
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
                    gold = user.gold;
                });
            }
        });
    });
    $('body').on('click', '.complete_quest', function () {
        if (is_cube) {
            $(this).attr('x-queue', 'true');
            cubebar_end();
            setTimeout(function () {
                $('[x-queue]').removeAttr('x-queue').click();
            }, 500);
            return false;
        }
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
                _gaq.push(['_trackEvent', 'Quest', 'Completed Quest', user.quests.length]);
                    if (user.quests.length == 2) {
                        $('.quests').addClass('.half_size');
                        cache_event_trend_enable = true;
                        Icecream.update_flavors();
                        Icecream.update_trending();
                    }
                    var id = $(that).closest('.quest').attr('x-id');
                    if (id == '526745240fc3180000000002') {
                        alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">Congratulations! Successfully completed the final quest of the main storyline, earning + $1.00 when a flavor trends or there is an add-on event.<br /><br /><b>Now onward to dynamic quests!</b>', 'Quest Complete'); 
                    } else if (id == '52577a6288983d0000000001') {
                        alert('<div class="quest_image_container" x-type="icecream"><img class="quest_princess" src="' + image_prepend + '/flavours/strawberry.png.gz"></div>Congratulations! Successfully completed the quest, in return Joy grants you a workers permit. Bring on the minimum wage!<br /><br /><b>Unlocked Workers</b>', 'Quest Complete'); 
                        if (user.prestige_level === 0) {
                            Icecream.sync_chat();
                        }
                    } else if (id == '52672bedde0b830000000001') {
                        alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">Zing! Successfully completed the quest, in return Joy teaches you trends and events. So much to learn!<br /><br /><b>Unlocked trends and add-on events</b>', 'Quest Complete'); 
                        Icecream.update_trending();
                        Icecream.update_event();
                    } else if (id == '52672dea3a8c980000000001' && !cow) {
                        $.ajax({
                            url: '/unlock',
                            data: { type: 'adopt_cow' },
                            dataType: 'json',
                            type: 'POST',
                            success: function(j) {
                                $(this).attr('x-loading', false);
                                if (j.error) return alert(j.error, 'Error');
                                cow = null;
                                $('.cow')[0].textContent = '';
                                Icecream.sync_cow();
                                alert('<p><b>You have unlocked a cow!</b> Feed cows hay (by dragging to improve their happiness.</p>' +
                                    '<p>A happy cow will give you a bonus to ice cream production. Your cow will become an adult once it hits level 5, allowing you to equip items.</p>', 'Adopted!');
                            }
                        });
                    } else if (j.name == 'dynamic quest') {
                        alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">Boo-Yah! Successfully completed the quest, earning + $0.25 when there is an add-on event.<br /><br /><b>The next quest will unlock soon.</b>', 'Quest Complete'); 
                    } else {
                        alert('<img class="quest_princess" src="' + image_prepend + '/princess_quest.png">Huzzah! Successfully completed the quest, earning + $1.00 when there is an add-on event.<br /><br /><b>The next quest will unlock soon.</b>', 'Quest Complete'); 
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
    $('body').on('click', '.donate_once', function () {
        $('.donate_anchor').show();
        $(this).hide();
    });
    $('body').on('click', '.link_underline[x-link="winter"]', function () {
        document.location.hash = '#!event/winter';
        tooltip_winter();
    });
    $('body').on('click', '#donate, .link_underline[x-link="donate"], .next_tutorial[x-link="donate"]', function () {
        document.location.hash = '#!donate';
        alert('<p><b>100% of the donations go to making the game better!</b> Leave a note with your player name to earn a donation badge, access to alpha, and exclusive donor items*. <br><small>You must reach out to us to claim monthly donor rewards.</small></p>' +
        '<p>Alpha channel lets you see changes as they are being made and added to the game, before anyone else. </p> ' +
        '<a href="http://www.patreon.com/icecream" target="_blank" class="button donate_button">Support Ice Cream Stand</a> <small class="donate_once" x-section="1">Click here to make a one-time donation</small>' +
        '<div class="donate_anchor" x-anchor="1" style="display: none;">' +
        '<p>Donor Rewards for one-time donations are the same as ongoing donations viewable here: <a href="http://www.patreon.com/icecream" target="_blank">http://www.patreon.com/icecream</a></p>' + 
        '<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">' + 
        '<input type="hidden" name="cmd" value="_donations">' + 
        '<input type="hidden" name="business" value="48U9KJ3T3UWK2">' + 
        '<input type="hidden" name="lc" value="CA">' + 
        '<input type="hidden" name="item_name" value="Ice Cream Stand">' + 
        '<input type="hidden" name="currency_code" value="USD">' + 
        '<input type="hidden" name="bn" value="PP-DonationsBF:btn_donateCC_LG.gif:NonHosted">' + 
        '<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">' + 
        '<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">' + 
        '</form></div> or <a href="https://www.coinbase.com/SamGallagher" target="_blank">donate via Bitcoin</a>', 'Donate');
    });
    $('body').on('click', '#invite, .link_underline[x-link="invite"], .next_tutorial[x-link="invite"]', function () {
        document.location.hash = '#!invite';
        var url = 'http://icecreamstand.ca/sign_up?refer=' + btoa(user.name);
        alert('<p><b>Give your friend this URL</b> to sign up with and get 25% of their money for that day whenever they complete a quest!</p><center><input type"text" id="refer_url" value="' + url + '"></center>', 'Refer a friend');
        $('#refer_url').select().focus();
        return false;
    });
    $('body').on('click', 'user, .user_info_tab', function () {
        $('.user_info_tab_active').removeClass('user_info_tab_active');
        $(this).addClass('user_info_tab_active');
        $('.playercard_anchor').hide();
        $('.playercard_anchor[x-anchor="' + $(this).attr('x-section') + '"]').fadeIn(250);
    });
    $('body').on('click', '.cube_collect.button', function () {
        cubebar_end();
    });
    $('body').on('click', 'user, .user_card', function () {
        if ($(this).attr('x-cow')) {
            $.ajax({
                url: '/cow/' + $(this).attr('x-cow'),
                dataType: 'json',
                success: function (j) {
                    load_cow(j.cow, j.user);
                }
            });
            return;
        }
        get_usercard( $(this).attr('x-user') );
    });
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
    $('body').on('click', '.view_credits', function () {
        $.ajax({
            url: 'https://s3.amazonaws.com/icecreamstand.com/credits.json.gz',
            data: { cache: Math.random() },
            dataType: 'json',
            success: function (j) {
                var compiled = '';
                for (var key in j) {
                    compiled = compiled + '<div class="credits_entry"><b>' + key + '</b> ' + j[key] + '</div>'; 
                }
                alert( 'Special thanks to:<br>' + compiled + get_easter_bunny(8), 'Credits');
            }
        });
        return false;
    });
    $('body').on('click', '.thread_user', function () {
        if ($(this).hasClass('thread_active')) {
            get_usercard( $(this).attr('x-user') );
            return false;
        }
        view_thread( $(this).attr('x-user') );
    });
    $('body').on('focus', '.thread_reply', function () {
        $(this).find('input').show();
    });
    $('body').on('submit', '.thread_reply', function () {
        var user = $('.thread_user.thread_active').attr('x-user');
        $.ajax({
            url: '/message/' + user,
            data: {message: $(this).find('textarea').val()},
            dataType: 'json',
            type: 'post',
            success: function (j) {
                if (j.error) return alert(j.error);
                socket.emit('message', { to: user });
                view_thread( user );
            }
        });
        return false;
    });
    $('body').on('click', '[x-require-facebook]', function () {
        if (!user.facebook_token) {
            window.open('http://icecreamstand.ca/auth/facebook','Link Facebook - Ice Cream Stand','scrollbars=no,width=650,height=500');
            game_working = false;
            socket.emit('disconnect');
            $('body').append('<div class="white_overlay"><strong>Please link your Facebook</small></strong>' +
            '<i class="fa fa-times"></i></div>');
            $('.white_overlay i').click(function () {
                $('.white_overlay').fadeOut(250, function() {
                    window.location.reload(true);
                });
            });
            return false;
        }
    });
    $('body').on('click', '.thread_controls', function () {
        var docked = $('.mailbox_thread').attr('x-docked');
        var new_bool = !Boolean(docked == 'true' );
        $('.mailbox_thread').attr('x-docked', new_bool );
        $(this).find('i').attr('class', (new_bool)? 'fa fa-arrow-up' : 'fa fa-arrow-down');
    });

    $('body').on('click', '.friends_button_container', function () {
        alert('<div class="mailbox_container">' + 
            '<div class="mailbox_list"></div>' +
            '<div class="mailbox_thread" x-docked="true"></div></div>', 'Mail Box');
        $('.message').addClass('extended');
        $.ajax({
            url: 'messages/read',
            dataType: 'JSON',
            type: 'GET',
            success: function(j) {
                //messages = j;
                var threads = 0;
                for (var i = 0; i < j.length; i++) {
                    var msg = j[i];
                    if ($('.mailbox_list > .thread_user[x-user="' + msg.from + '"]').length === 0) {
                        var construct = $('<div />', {
                            'class': 'thread_user',
                            'x-user': msg.from,
                            'x-read': Boolean(msg.is_read),
                            'text': msg.from
                        });
                        if (msg.badge_id) construct.prepend('<img src="' + image_prepend + '/badges/' + msg.badge_id + '.png" />');
                        $('.mailbox_list').append(construct);
                        if (i === 0) view_thread(msg.from);
                        threads++;
                    }
                    if (threads === 12) break; 
                }
                alert_update();
                //display_messages(0);
            }
        });
    });
    function view_thread(from) {
        $('.thread_active').removeClass('thread_active');
        $('.mailbox_list > .thread_user[x-user="' + from + '"]').addClass('thread_active');
        $('.mailbox_thread')[0].textContent = '';
        $.ajax({
            url: 'messages/read/' + from + '/' + user.name,
            dataType: 'json',
            success: function(messages) {
                var len = messages.length;
                for (var i = 0; i < len; i++) {
                    var msg = messages[i];
                    var construct = $('<div />', {
                        'class': 'thread_msg',
                        'x-align': (from == msg.from)? 'left' : 'right',
                        'x-read': Boolean(msg.is_read),
                        text: msg.text
                    });
                    if (i > 5) construct.hide();
                    $('.mailbox_thread').prepend(construct);
                    
                }
                if (len > 5) $('.mailbox_thread').prepend('<div class="thread_controls"><b>' + (len - 6) + '</b><i class="fa fa-arrow-up"></i></div>');
                $('.mailbox_thread').prepend('<div class="thread_controls_down"><b></b><i class="fa fa-arrow-down"></i></div>');
                $('.mailbox_thread').append('<form action="message" method="post" class="thread_msg thread_reply" x-align="right"><textarea></textarea>' +
                    '<input type="submit" class="button button_green" value="Send" style="display: none;"></div>');
                $('.mailbox_thread').scrollTop( 10000 );
                alert_update();
            }
        });
    }
    function display_messages(start, length) {
        if (!length) length = 5;
        console.log('displaying messages ' + start + ' - ' + (start+length));
        $.ajax({
        url: 'messages', 
        data: { 'start': start },
        success: function (messages) {
            var m_compiled = '';
            var len = messages.length;
            if (len == 0) {
                m_compiled = '<tr><td>-</td><td>You have no messages</td></tr>';
            } else {
                for (var i = 0; i < len; i++) {
                    var m = messages[i];
                    if (m) {
                        var read = (m.is_read)? 'Unread' : 'Read';
                        var d = (new Date(m.created_at)+'').split(' ');
                        var badge = (m.badge_id)? '<img src="' + image_prepend + '/badges/' + m.badge_id + '.png" class="message_badge" />' : '';
                        m_compiled = m_compiled + '<tr><td id="message_status_' + read + '"><user x-user="' + m.from + '">' + badge + m.from + '</user><time>' + [d[1], d[2], d[4]].join(' ') + '</time></td><td class="message_body">' + m.text.replace(/(<|>)/gi, '') + '</td><td class="message_options" x-id="' + m._id + '">' +
                            '<span id="message_mark_read">Mark ' + read + '</span>' + 
                            '<span class="friend_reply" x-user="' + m.from + '"></span>' + 
                            '<span id="message_remove">X</span>' + 
                            '</td></tr>';
                    }
                    if (i >= length) break;
                }
            }
            var msg_control = 'Messages ' + start + ' to ' + (start+length);
            if (start > 0) msg_control = '<message-prev>Back</message-prev>' + msg_control;
            if (len === 5) msg_control = msg_control + '<message-next>Next</message-next>';
            alert('<table id="message_list">' + m_compiled + '</table><message-controls x-start="' + start + '" x-len="' + length + '">' + msg_control + '</message-controls><div id="compose_message"><input id="compose_to" placeholder="Player"><button id="compose_send">Write</button></div>', 'Private Messages');
            
        }
        });
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
    $('body').on('click', '.mobile_menu', function () {
        $('#upgrades.section-side, .mobile_menu').toggleClass('active');
        if ($(this).hasClass('active')) window.scrollTo(0,0);
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
        return false;
    });
    $('body').on('click', '.decline_friendship', function () {
        $('.message_close').click();
    });
    $('body').on('click', '.accept_friendship', function () {
         add_friend( $(this).attr('x-add') );
    });
    $('body').on('click', '.friends_add', function () {
        if ($(this).text() === __('Search')) {
            if ($('.friends_add_text').val() !== '') {
                get_usercard( $('.friends_add_text').val() );
            }
            $(this).html('<i class="fa fa-search"></i>');
            $('.friends_add_text').hide();
        } else { 
            $('.friends_add_text').val('').show().focus();
            $(this).text(__('Search'));
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
                user.friends = j.friends;
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
                        variation: Math.floor(Math.random() * 4)
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
                main('sort_flavour', function (j) {
                    //user.flavors = j;
                    location.reload(true);
                });
            }
        });
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    });
    $('body').on('click', '.filter_addon_options span', function (e) {
        $.ajax({
            url: '/sort_addon/' + $(this).attr('id'),
            success: function (j) {
                location.reload(true);
            }
        });
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    });
    $('body').on('submit', '.ajaxify', function () {
        var update = $(this).attr('x-update');
        var ajax_update = $(this).serialize();
        $.ajax({
            url: $(this).attr('action'),
            data: ajax_update,
            type: $(this).attr('method'),
            success: function (j) {
                if (j.err) return alert(j.err);
                $('.message_close').click();
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
    $('body').on('click', '.filter', function () {
        if ( $('.filter > div').length === 0) {
            var c = ($('.flavor.main_container .flavor_tab.active').attr('x-id') == 'main_base')? 'filter_flavour_options' : 'filter_addon_options';
            $(this).append('<div class="' + c + '">' + 
                '<span id="base_value">Max Value (ASC)</span><span id="-base_value">Max Value (DESC)</span>' +
                '<span id="name">Name (ASC)</span><span id="-name">Name (DESC)</span>' +
                '</div>');
            $('.filter > div').slideDown(250);
        } else {
            $('.filter > div').slideUp(250, function () {
                $(this).remove();
            });
        }
        
    });
    $('body').on('click', '.inventory_clear', function () {
        var num = Number( $(this).attr('x-num') );
        var max_items = $('.cow_inventory > .inventory_slot').length;
        for (var i = num; i < max_items; i++) {
            var clear = $('.inventory_clear[x-num="' + i + '"]');
            clear.attr('x-num', Number(clear.attr('x-num')) - 1);
        }
        $(this).parent('.inventory_slot').remove();
        cow.items.splice(num, 1);

        Icecream.sync_cow(function () {
            cow_redraw();
            //load_cow(cow);
        }, true);
    });
    $('body').on('click', '.user_cow_title, .cow_background', function () {
        $.ajax({
            url: 'cow/' + $(this).attr('x-id'),
            dataType: 'json',
            type: 'get',
            success: function (j) {
                load_cow(j.cow, j.user);
            }
        });
    });
    $('body').on('click', '.cow_skin', function () {
        $('.cow_skin.selected').removeClass('selected');
        $(this).addClass('selected');
        var num = parseInt($(this).attr('x-num'));
        cow.skin = (isNaN(num))? 'default' : cow.skins_unlocked[ num ];
        Icecream.sync_cow(function () {
            cow_redraw();
            alert_queue = [];
            $('.alert_shadow, .message').remove();
            load_cow(cow);
        }, true);
    });
    $('body').on('click', '.button_cow', function () {
        var action = $(this).attr('x-action');
        if (action == 'rename') {
            alert('<form class="ajaxify" x-update="refresh" action="cow/update" method="post"><p class="p_adopt">Renaming your cow can have severe consequences on its identity and sense of self.</p>' +
                '<input name="name" value="' + cow.name + '" maxlength="20"><input type="submit" value="Rename"></form>', 'Rename ' + cow.name);
        } else if (action == 'skin') {
            var available = '<div class="cow_skin" x-id="default"></div>';
            if (cow.skins_unlocked) {
                for (var i = 0; i < cow.skins_unlocked.length; i++) {
                    if (cow.skins_unlocked[i]) available = available + '<div class="cow_skin" x-num="' + i + '" x-id="' + cow.skins_unlocked[i].toLowerCase().replace(/\s/g, '') + '"></div>';
                }
            }
            alert(available, 'Cow Skins');
            if (!cow.skin) cow.skin = 'default';
            $('.cow_skin[x-id="' + cow.skin + '"]').addClass('selected');
        } else {
             var days_old = (new Date() - new Date(cow.created_at)) / 86400000;
             if (days_old < 20) {
                return alert('Your cow is too young, it must be at least 20 days old.', 'I\'m afraid I can\'t let you do that' + get_easter_bunny(7));
             }
             if (cow.level < 30) {
                return alert('Your cow is too weak, it must be much stronger first! At least level 30.', 'I\'m afraid I can\'t let you do that' + get_easter_bunny(7));
             }
             alert('<img src="https://s3.amazonaws.com/icecreamstand.com/icon_breed.png" /><form class="ajaxify cow_readopt" x-update="refresh" action="cow/new" method="post"><p class="p_adopt">' +
                'Re-adoption Improves the potential stats of your new cow by 1 for every cow you have owned.<br>' +
                'This is a big commitment, if you are ready.. what would you like your new cow to be named?' + get_easter_bunny(7) +
                '</p>Name: <input name="name" value="' + cow.name + '"><input type="submit" value="Adopt" class="button_adopt"><br>' + 
                '<small x-require-facebook="true"><input type="checkbox" name="fb_adopt_share" id="fb_adopt_share"><label for="fb_adopt_share"> Share on Facebook</label></small></form>', 'Adopting a new Cow');
        }
    });
    $('body').on('click', '.cow', function () {
        if (!cow || !cow.name) return false;
        load_cow(cow);
    });
    
    $('body').on('click', '.unlockable_ajax', function () {
        var upgrade = $(this).attr('x-upgrade');
        var cost = Number($(this).attr('x-cost') );

        if (cost > user.gold) return alert('Not enough money', 'Error');

        user.gold -= cost;
        $.ajax({
            url: '/unlock',
            data: { type: upgrade },
            type: 'post',
            success: function(j) {
                main('upgrade');
            }
        });
        $('.message_close').click();
    });
    $('body').on('click', '.type_item[x-variance="2"][x-type="rock"]', function () {
        alert_inline(this, "Coooooooo");
        return false;
    });
    $('body').on('keydown', '#new_message input[type="text"]', function (e) {
        var keyCode = e.keyCode || e.which; 

        if (keyCode == 9) { //tab
            e.preventDefault();
            $('.mention_suggestion.active').click();
        }
        if (keyCode == 40) { //down arrow
            $('.mention_suggestion.active').next().addClass('active');

            if ($('.mention_suggestion.active').length == 2) $('.mention_suggestion.active:first').removeClass('active');
            e.preventDefault();
            return false;
        }
        if (keyCode == 38) { //down arrow
            $('.mention_suggestion.active').prev().addClass('active');
            if ($('.mention_suggestion.active').length == 2) $('.mention_suggestion.active:last').removeClass('active');
            e.preventDefault();
            return false;
        }
        var text = ($(this).val() + String.fromCharCode(keyCode)).toLowerCase();
        
        if ($(this).data('cache') == text) return;
        $('.mention_suggestion_box').remove();
        $(this).data('cache', text);
        if (!text.match(/@([^\s]*)$/) ) return;
        var at_split = text.split('@');
        var at_split_tail = at_split[at_split.length - 1].replace(/[^a-zA-Z0-9_]/gi, '');
        var construct = $('<div />', {
            'class': 'mention_suggestion_box'
        });
        var list = [];
        var f_len = cache_friends.length;
        for (var i = 0; i < f_len; i++) {
            var potential = cache_friends[i];
            if (potential.name.indexOf(at_split_tail) === 0) {
                list.push(potential);
                if (list.length > 5) break;
            }
        }
        list.sort(function(a,b){
            return new Date(b.updated_at) - new Date(a.updated_at);
        });

        for (var i = 0; i < list.length; i++) {
            var updated_at = new Date(list[i].updated_at);
            construct.append('<div class="mention_suggestion ' + ( (i === 0)? 'active' : '' ) + ' ' + ( (new Date() - updated_at < 30*60*1000)? 'online' : 'offline' ) + '" x-away="' + list[i].is_away + '">' + list[i].name + '</div>');
        }

        $('.mention_suggestion_box').remove();
        $(this).after(construct);
    });
    $('body').on('click', '.mention_suggestion', function () {
        var input = $('#new_message input[type="text"]');
        var text = input.val().replace(/@([^\W]*)$/, '@' + $(this).text());
        input.val(text);
        $('.mention_suggestion_box').remove();
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
        if ($('#accumulation_time').hasClass('active')) h_type = 'accumulation_time';
        if ($('#trend_today').hasClass('active')) h_type = 'trend_today';
        if ($('#cowlv').hasClass('active')) h_type = 'cow';
        $.ajax({
            url : '/highscores',
            type : 'GET',
            data : {type: h_type, limit: ($('.active#top_100').length > 0)? 100 : 10, show: ($('.active#show_friends').length > 0)? 'friends' : ''},
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
                    if (user.today_trending) gold = user.today_trending;

                    if (user.highest_accumulation) {
                        $('.highscores ol').append('<li class="' + online + '"><user x-user="' + user.name + '" class="highscore_user">' + user.name + '</user> ' + ' &nbsp; ' + numberWithCommas(user.highest_accumulation.toFixed(2)) + '</span></li>');
                    } else if (user.accumulation_time) {
                        var minutes = Math.floor(user.accumulation_time / 60);
                        var seconds = (user.accumulation_time % 60).toFixed(2);
                        $('.highscores ol').append('<li class="' + online + '"><user x-user="' + user.name + '" class="highscore_user">' + user.name + '</user> ' + ' &nbsp; ' + minutes + ':' + ((seconds < 10)? '0' + seconds : seconds)  + '</span></li>');
                    } else if (user.level) {
                        $('.highscores ol').append('<li><user x-cow="' + user._id + '" class="highscore_user">' + user.name + '</user> ' + ' &nbsp; ' + user.level.toFixed(2) + '</span></li>');
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
