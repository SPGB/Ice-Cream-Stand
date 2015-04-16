function lazy_load(image) {
    var xsrc = $(image).attr('x-src');
    if (typeof xsrc !== 'undefined') {
        $(image).attr('src', xsrc);
        $(image).removeAttr('x-src'); 
    }
}
function get_cost(x, type) {
    if (type == 'cart') return 25 + (Math.pow(x, 2) / 4);
    if (type == 'employee') return 150 + (x * 100);
    if (type == 'truck') return 1000 + (x * x * 50);
    if (type == 'robot') return 5000 + (x * x * 100);
    if (type == 'rocket') return 50000 + (x * x * 500);
    if (type == 'alien') return 500000+(30 * Math.pow(x,2.5));
    if (type == 'autopilot') return (250 * (x+1) * (x+1)) + Math.pow(1.05, x*2);
    if (type == 'coldhands') return 250 * Math.pow(x*2,1.6);
    if (type == 'silo') return 500000+(30 * Math.pow(x,6));
}

function buff_add(buff, text) {
    if (cache_buffs.indexOf(buff) !== -1) return;
    cache_buffs.push(buff);
    $('.buff_container').append('<div class="buff tooltip" x-type="buff" x-id="' + buff + '" x-hover-text="' + text + '"></div>');
}
function buff_remove(buff) {
    if (cache_buffs.indexOf(buff) == -1) return;
    cache_buffs.splice(cache_buffs.indexOf(buff), 1);
    $('.buff[x-id="' + buff + '"]').remove();
}
function get_prestige_bonus(user) {
    var x = user.total_prestige_gold;
    var gold_bonus = 25 * (x / (x + 1000000));
    if (gold_bonus > 25) gold_bonus = 25;
    var x2 = user.flavors.length + user.toppings.length;
    var unlock_bonus = (x2 / 180) * 25; 
    var ret = parseFloat(gold_bonus + unlock_bonus).toFixed(5);
    $('#prestige_amount').text(ret);
    return ret;
}
function sell_icecream(amount, workers) {
    if (!game_working) return;
    
    if (workers) {
        //replace sold out ice cream
        var outofstock = -1;
        var i = Math.floor( Math.random() * 5 );
        if (cached_worker_base_value[i] > 0.1 && window_focus && canvas_drop_cache_len < 30 && i < user_me.flavors.length) {
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
            update_sell_value('sell icecream');
            Icecream.update_worker_fx('sell icecream');
        }
        var net_gold = parseFloat(sales_per * (cached_worker_total) );
        user_me.gold += parseFloat(sales_per * cached_worker_total);

        console.log('worker sales (' + amount + '), backlog: '  + cache_worker_sales_to_send);
        socket.emit('sell/worker', {
            g: user_me.gold,
            d: cached_worker_total,
            a: amount,
            ds: is_deep_sleep,
            v: version,
            dsq: cache_worker_sales_to_send //sleeping queue
        });
        if (cache_worker_sales_to_send > 0) cache_worker_sales_to_send = 0;
    } else {
        console.log('ice cream sale (' + amount + ')');
        socket.emit('sell', {
            g: user_me.gold,
            d: cached_worker_total,
            a: amount,
            addon: cached_addon_value,
            ta: (trending_addon == user_me.last_addon),
            c: (cache_combo)? cache_combo.value : 'false',
            e: cached_expertise,
            t: trending_bonus,
            cbv: cached_flavor_value,
            cone: cached_cone_value,
            fp: cached_flavor_index,
            ds: is_deep_sleep,
            v: version,
        });
    }
}
function toast(msg, title, is_sticky) {
    var toast_id = 'toast' + Math.random();
    if (!title) title = 'Notice';
    $('.inline-message').remove();
    $('body').append('<h4 class="inline-message" id="' + toast_id + '">' + title + '<br /><small>' + msg + '</small></h4>'); 
    if (!is_sticky) {
        setTimeout(function () {
            $('.inline-message').slideUp(500, function () { $(this).remove() });
        }, 5000);
    }
}
function alert(msg, title) {
    if (is_cube || $('#friend_message_textarea').length > 0) {
        alert_queue.unshift( { 'msg': msg, 'title': title } );
        return false;
    }
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
    $('body').append('<div class="message"><div class="message_close"><i class="fa fa-times"></i></div><h4 id="title">' + title + '</h4><span id="description">' + msg + '</span></div></div><div class="darkness"></div>');
    var height_diff = win_height - $('.message').height();
    alert_current.top = (height_diff < 0)? 0 : height_diff / 2;
    $('.message').css('top', alert_current.top);
}
function alert_update() {
    var alert_current = $('.message:visible');
    var height_diff = win_height - alert_current.height();
    alert_current.top = (height_diff < 0)? 0 : height_diff / 2;
    $('.message').css('top', alert_current.top);
}
function alert_inline(elem, msg) {
    $('.alert_inline').remove();
    $(elem).prepend('<div class="alert_inline">' + msg + '<div class="triangle-down"></div></div>');
    setTimeout(function () {
        $('.alert_inline').remove();
    }, 2500);
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
        '[disaster]! Help [name] the [title] by feeding your cow [amount] bushels of hay.',
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
    var title = ['Glutinous', 'Malcontent', 'Stupendous', 'Enchanter', 'Visionary', 'Golden', 'Grumpy', 'Aged', 'Unfortunate', 'Sweet-tooth', 'Artist', 'Magician', 'Cold', 'Stone Cold'];
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
                    text_unlocked = text_unlocked + get_achievement_text(a);
                } else {
                    text_locked = text_locked + get_achievement_text(a);
                }
            }
            alert('<h5>Achievement points: ' + (user_me.achievements.length * 10) + '</h5><div class="achievements_unlocked">' + text_unlocked + '</div><h5>Remaining Achievements...' + get_easter_bunny(10) + '</h5><div class="achievements_locked">' + text_locked + '</div>', 'Achievements');
        }
    });
}
function get_achievement_text(a) {
    return '<div class="achievements_container" x-id="' + a._id + '"><div class="achievement_badge">' + ((a.badge_id)? '<img src="' + image_prepend + '/badges/' + a.badge_id + '.png" />' : '') + '</div><div class="achievement_descript"><b>' + a.name + '</b>' + a.description + '</div></div>';
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
        Icecream.update_worker_fx('expertise');
        cached_expertise = expertise;
        $('#main_base .option[x-id="' + user_me.last_flavor + '"]').parent().find('.expertise_level').text(expertise);
        update_sell_value('expertise');
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
        if (user_me.total_gold === 0) {
            $('.expertise_bar_outer').css('opacity', 0.25);
        }
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
    user_me.gold += parseFloat(cached_sell_value) * a;
    if (cached_flavor_index > -1) {
        user_me.flavors_sold[cached_flavor_index] = parseInt(user_me.flavors_sold[cached_flavor_index]) + a;
        update_expertise(function () {
            Icecream.update_quest_bar();
        });
    }
}
function init_canvas() {
    console.log('init canvas');
    //$('.background_hill').hide();
    if ( doc_height != $(document).height() ) {
        //console.log('canvas -> updating hills');
        win_height = window.innerHeight;
        doc_height = $(document).height();
        canvas_width = $('#canvas_main').width();
        $('canvas[x-resize]').each(function () {
            $(this).attr('width', $(this).width());
            $(this).attr('height', $(this).height());
        });
    
        var chat_height = $('.chat.main_container').height(); //($('.chat.main_container').attr('x-expand') == 'true')? $('.chat.main_container').height() : 460;
        if (!$('.chat.main_container').is(':visible')) chat_height = 0;
        //$('.background_hill').css('top', $(document).height() - $('.chat.main_container:visible').height() + chat_height - 152);
        canvas_cache_width = parseInt($('canvas#canvas_main').attr('width'));
        if ( cached_cone && !canvas_cache_cone ) {
            canvas_cache_cone = new Image();
            canvas_cache_cone.src = image_prepend + '/cones/thumb/' + cached_cone + '.png.gz';
        }
    }
    //$('.background_hill').show();
    var cloud_type = '';
    for (var i = 0; i < 4; i++) {
        if (!canvas_cache_cloud[i]) {
            canvas_cache_cloud[i] = new Image();
            canvas_cache_cloud[i].src = image_prepend + '/clouds/cloud_' + (i+1) + '.png';
        }
    }

    if (!canvas_cache_sale_cold) {
        canvas_cache_sale_cold = new Image();
        //canvas_cache_sale_cold.src = image_prepend + "/sell_cold_sprite.png";
        canvas_cache_sale_cold.src = image_prepend + '/scoopling_spritesheet.png';
    }

    if (!canvas_cache_workers[6]) {
        var current_flavour = Icecream.get_flavor(user_me.last_flavor);
        if (current_flavour) {  
            canvas_cache_workers[6] = new Image();
            canvas_cache_workers[6].src = image_prepend + "/flavours/thumb/" + current_flavour.name.replace(/\s+/g, '') + '.png.gz';
            canvas_cache_addon[6] = document.getElementById("topping");
        } else {
            console.log('could not find img[6]: ' + user_me.last_flavor);
        }
    }
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
        
        var compiled_value = ((f_1.value + f_2.value) * .75).toFixed(2);
        return {
            name: helper_franken_name(f_1.name, f_2.name),
            value: compiled_value
        };
}
function helper_franken_name(name1, name2) {
    var f_1_half = name1.substring( 0, name1.length / 2);
    var f_2_half = name2.substring(name2.length / 2);
    return f_1_half + f_2_half;
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
    var int_mod = 0, str_mod = 0, con_mod = 0, magicfind_mod = 0, afro_count = 0, crown_count = 0;
    var set_temp = [];

    for (var j = 0; j < cow.items.length; j++) {
        if (cow.items[j]) {
            var split = cow.items[j].split('/');
            if (j < 3) {
                if (split[1]) int_mod += Number(split[1]);
                if (split[2]) str_mod += Number(split[2]);
                if (split[3]) con_mod += Number(split[3]);
                if (split[0] == 'hat_jester' || split[0] == 'accessory_marotte') {
                    magicfind_mod += .05;
                }
                if (split[6]) { //set
                    if (set_temp.indexOf(split[0]) === -1) set_temp.push(split[0]);
                }

            }
            if (split[0].indexOf('afro') > -1) afro_count++;
            if (split[0].indexOf('crown') > -1) crown_count++;
        } else {
           cow.items.splice(j, 1);
           j--;
        }
    }
    if (set_temp.length == 3) {
        int_mod += 2;
        str_mod += 2;
        con_mod += 2;
    }

    cow.con_mod = con_mod;
    cow.magic_find = magicfind_mod;
    cow.total_bonus = 10 + (cow.level / 2) + cow.strength + str_mod;
    cow.total_happiness = 100 + Math.floor((cow.intelligence + int_mod) / 2);

    var days_old = (new Date() - new Date(cow.created_at)) / 86400000;
    if (days_old > 20 && cow.memories.length == 0) {
    alert('<p>If your cow could talk, what would it say? </p><textarea id="cow_memory"></textarea>' + 
        '<input type="submit" class="button" value="Teach" id="cow_teach">', 'Teaching ' + cow.name + ' to talk');
    }

    if (afro_count === 12) achievement_register('546b81c020a4efc62a12e68d');
    if (crown_count === 12) achievement_register('547c13af8ea9309921367dca');
}
function cow_redraw() {
    $('#unlock_cow, .cow > .cow_attachment, .cow > .cow_body').remove();
    if (cow.items && cow.level >= 5) {
        for (var i = 0; i < cow.items.length; i++) {
            var item = cow.items[i].split('/')[0].replace(/"/, '');
            $('.cow').append('<div class="cow_attachment type_item" x-type="' + item + '">');
            if (i === 3) break;
        }
    }
    if (cow.level < 5) cow.skin = 'baby';
    $('.cow_level_bar').remove();
    var next_level = Math.ceil( cow.level  );
    var progress =  100 + ( (cow.level - next_level) / .01 );
    if (!cow.skin) cow.skin = 'default';
    $('.cow').prepend('<div class="cow_body" x-skin="' + cow.skin + '"></div><div class="cow_level_bar"><progress id="experience" value="' + progress + '" max="100"></progress><progress id="happiness" value="' + cow.happiness + '" max="' + cow.total_happiness + '" x-full="' + (cow.happiness == cow.total_happiness) + '"></progress></div>');
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
    if (user_me.chat_off) return false;
    if (!msg.user) { return console.log('No user attached to this message'); }
    if ($('.chat[x-id="' + msg._id + '"]').length > 0) { return console.log('Message already loaded'); }
    if (user_me.ignore_list && user_me.ignore_list.indexOf(msg.user) > -1) {
        return false;
    }
    if (!window_focus) { 
        cached_new_messages++;
        var msg_alert = (cached_new_messages == 1)? __('Chat Message') : __('Chat Messages');
        document.title = cached_new_messages + ' ' + msg_alert + ' - ' + __('Ice Cream Stand');

        if (msg.text.toLowerCase().indexOf('@' + user_me.name) > -1) {
            cache_unread_mention = true;
            document.title = msg.user.substring(0,1).toUpperCase() + msg.user.substring(1) + ' ' + __('mentioned you') + '! - ' + __('Ice Cream Stand');
        }
    }
    if (cache_unread_message) {
        var msg_alert = __('Unread Message!');
        document.title = msg_alert + ' - ' + __('Ice Cream Stand');
    }

    var div_classes = [];
    if (msg.is_system) div_classes.push('message_system');
    if (msg.is_admin) div_classes.push('admin');
    if (msg.badge == 8) div_classes.push('chat_mod');
    var div = $('<div />', {
        'class': 'chat ' + div_classes.join(' '),
        'x-id': msg._id,
        'title': msg.created_at
    });
    var construct = $('<span />', { 
        html: msg.text.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
            return '&#'+i.charCodeAt(0)+';';
            })
            .replace( /(https?:\/\/[^\s]*)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/(^| )@([^\W]*)/g, ' <div class="user_card" x-user="$2">@$2</div>')
            .replace(/:party:/g, ' <img src="' + image_prepend + '/party.png" class="party_icon" />')
            .replace(/:easter:/g, ' <img src="' + image_prepend + '/easter/chocbunny.png" class="party_icon" />'),
        'class': 'chat_textbody'
    });

    construct.find('a').each(function () {
        var href = $(this).attr('href');
        var href_end = href.substring(href.length - 4);
        if (href_end == '.png' || href_end == '.jpg' || href_end == '.gif') {
            $(this).after('<div class="img_inline" x-href="' + $(this).attr('href') + '">view</div>');
        }
    });
    $(div).prepend(construct);
    var user_name = $('<span />', { text: msg.user, 'class': 'user_card', 'x-user': msg.user });
    if (msg.badge) {
        $(user_name).prepend('<img src="' + image_prepend + '/badges/' + msg.badge + '.png" class="chat_badge" />');
    }
    if (msg.text.indexOf(':party:') > -1) {
        $(construct).css('color', '#' + color_pool[ Math.floor( Math.random() * color_pool.length)] ).css('font-weight', 'bold');
    }
    $(div).prepend(user_name);
    $('#chat_window').append(div);

    var msg_len = $('#chat_window > .chat').length;
    var max_len = $('.chat.main_container .expand').hasClass('active')? 75 : 15;
    while (msg_len > max_len) {
        $('#chat_window > .chat:first').remove();
        msg_len--;
    }
    //init_canvas();
}
function friend_list_add(user, status) { //status is either 0: away, 1: afk, 2: online
    var user_container = $('.friends_counter user[x-user="' + user + '"]');

    if (user_container.length === 0) {
        var usertag = $('<user />', {
            'class': (status > 0)? 'online' : 'offline',
            'x-away': (status == 1),
            'x-user': user,
            'html': '<span class="friend_options"><span class="friend_delete"></span></span>' + user
        });

        var list;

        if (status == 1) { 
            list = '.friends_list_away'; }
        else if (status == 2) { 
            list = '.friends_list_online'; }
        else { 
            list = '.friends_list_offline';
        }

        $( list ).append(usertag);
    } else {
        user_container.attr('class', (status > 0)? 'online' : 'offline');
        if (status == 1) {
            user_container.attr('x-away', true);
            user_container.detach().appendTo('.friends_list_away');
        }
        else if (status == 2) {
            user_container.attr('x-away', false);
            user_container.detach().appendTo('.friends_list_online');
        } 
        else {
            user_container.detach().appendTo('.friends_list_offline');
        }
    }
}
function populate_easter() {
    $('.footer_cows').append( get_easter_bunny(1) );
}
function get_easter_bunny(num) {
    return '';
    if (user_me.easter2.indexOf(num) !== -1) return '';
    return '<a href="' + get_easter_url(user_me.name, num) + '" class="easter_hunt"><img src="' + image_prepend + '/easter/easter' + num + '.png" /></a>';
}
function get_easter_url(name, number) {
    var str = 'e2 at ics' + number + 'pleasedontcheat' + name;
    return '/easter/' + number + '/' + btoa(str);
}
function get_usercard(user) {
        history.pushState({}, "Player - " + user, "/#!u/" + user);
        $.ajax({
            url: 'user/' + user.toLowerCase(),
            success: function (j) {
                if (j.error) {
                    alert(j.error, 'Error');
                    return;
                }
                if (!j.prestige_level) j.prestige_level = 0;
                if (!j.prestige_bonus) j.prestige_bonus = 0;
                var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
                var friend = 'Add Friend</div>';
                var friend_enabled = 'true';
                if (user_me.friends && user_me.friends.indexOf(j._id) > -1) {
                    friend = (j.friend)? 'Mutual Friend' : 'Your Friend';
                    friend_enabled = 'false';
                } else if (j.friend) {
                    friend = 'Return Friends';
                }
                var online_status = (j.updated_at === '<1 minute')? 'online' : 'offline';
                var user_cow = '';
                if (j.cow) {
                    var rainbow = false;

                    if (j.cow.level < 5) {
                        j.cow.skin = 'baby';
                    } else {
                        if (j.cow.items) {
                            for (var i = 0; i < j.cow.items.length; i++) {
                                if (i > 3) break;
                                if (j.cow.items[i]) {
                                    var item = j.cow.items[i].split('/')[0].replace(/"/g, '');
                                    if (item == 'wings_rainbow') rainbow = true;
                                    user_cow = user_cow + '<div x-type="' + item + '" class="cow_attachment type_item"></div>';
                                }
                            }
                        }
                    }
                    user_cow = '<div class="user_cow_inner"><div class="cow_body" x-skin="' + j.cow.skin + '" />' + user_cow + '</div>';
                }
                var created = (j.created_at)? new Date(j.created_at) : new Date();
                var created_diff = new Date() - created;
                var created_days = Math.floor(created_diff / 1000 / 60 / 60 / 24);
                var defaults = ['http://static.icecreamstand.ca/flavours/vanilla.png',
                'http://static.icecreamstand.ca/flavours/strawberry.png',
                'http://static.icecreamstand.ca/flavours/blueberry.png'];
                var default_img = defaults[0];
                if (j.quests > 2) default_img = defaults[1];
                if (j.prestige_level > 1) default_img = defaults[2];
                var is_new_art = new_art_addons.indexOf(j.last_addon) > -1;
                var addon_url = is_new_art? image_prepend + '/addons/thumb/' + j.last_addon.replace(/\s+/g, '') + '.png.gz' : image_prepend + '/toppings/' + j.last_addon.replace(/\s+/g, '') + '.png';
                var cow_cards = '';
                for (var i = 0; i < j.cows.length; i++) {
                    cow_cards = cow_cards + '<div class="user_cow_title" x-num="' + i + '" x-id="' + j.cows[i]._id + '">' + j.cows[i].name + '<span class="cow_card_level">lv' + Math.floor(j.cows[i].level) + '</span></div>';
                }
                var badges_compiled = '';
                var badge_avatar = '';
                if (j.badges && j.badges.length > 0) {
                    var b_len = j.badges.length;
                    for (var i = 0; i < b_len; i++) {
                        badges_compiled = badges_compiled + '<img src="' + image_prepend + '/badges/' + j.badges[i] + '.png" class="user_info_badge" />';
                    } 
                    badge_avatar = '<img src="' + image_prepend + '/badges/' + j.badges[0] + '.png" class="user_badge_avatar" />';
                }
                alert('<div class="user_info_sash"><div class="badges">' + badges_compiled + '</div></div>' +
                    '<div class="user_info_inner"><div class="user_info_nav">' +
                    '<div class="user_info_tab user_info_tab_active" x-section="1">Player</div>' +
                    '<div class="user_info_tab" x-section="2">Store</div><div class="user_info_tab" x-section="3">Stats</div></div>' +
                '<div class="playercard_anchor" x-anchor="1" style="display: block;"><table><tr><td style="text-align:center;">' + 
                '<img src="http://www.gravatar.com/avatar/' + j.gravatar + '?s=200&d=' + default_img + '" class="gravatar" />' +
                '<div class="button send_message" x-user="' + j.name + '">Message</div>' +
                '<div class="button add_friend" x-enabled="' + friend_enabled + '" x-user="' + j.name + '">' + friend + '</div></td>' +
                '<td><div class="user_icecream_holder"><div class="user_icecream" style="background-image: url(' + image_prepend + '/flavours/thumb/' + j.last_flavor.replace(/\s+/g, '') + 
                '.png.gz), url(' + image_prepend + '/cones/' + j.cone + '.png.gz)"><img src="' + addon_url + '" x-new-art="' + is_new_art + '" class="user_addon" /></div></div>' +
                '</td></tr></table></div><div class="playercard_anchor" x-anchor="2"><table>' +
                    '<tr><td><b>Carts</b> ' + j.carts + '</td><td><b>Employees</b> ' + j.employees + '</td></tr>' +
                    '<tr><td><b>Trucks</b> ' + j.trucks + '</td><td><b>Robots</b> ' + j.robots + '</td></tr>' +
                    '<tr><td><b>Rockets</b> ' + j.rockets + '</td><td><b>Aliens</b> ' + j.aliens + '</td></tr>' +
                    '<tr><td><b>Coldhands</b> ' + j.cold_hands + '</td><td><b>Autopilot</b> ' + j.autopilot + '</td></tr>' +
                '</table></div>' +
                '<div class="playercard_anchor" x-anchor="3"><table>' +
                    '<tr><td><b>Flavors</b> ' + j.flavors + '</td>' +
                    '<td><b>Add-ons</b> ' + j.toppings + '</td></tr>' +
                    '<td><b>Prestige</b> ' + j.prestige_bonus + '% </td>' +
                    '<td><b>Quests</b> ' + j.quests + '</td></tr>' +
                    '<td><b>Combos</b> ' + j.combos + '</td>' +
                    '<td><b>Player for</b> ' + created_days + ' days</td></tr>' +
                    '<td><b>Channel</b> ' + j.release_channel + '</td>' +
                    '<td><b>Ice Cube time</b> ' + Math.floor(j.accumulation_time / 60) + ':' + (j.accumulation_time % 60).toFixed(1) + '</td></tr>' +
                    '<td><b>Sold</b> ' + numberWithCommas(j.sold) +
                    ((user_me.is_mod || user_me.is_admin)? '<td><b>ID</b> <small>' + j._id + '</small>': '') +
                '</td></tr></table></div>' +
                '<div class="playercard_anchor" x-anchor="4">Achievements</div>' +
                '<div class="user_bottom_panel">' +
                    '<time class="' + online_status + '" title="Last seen ' + j.updated_at + ' ago." x-away="' + j.is_away + '"></time>' +
                '</div>' +
                '<div class="user_cow" x-user="' + j.name + '" x-night="' + j.is_night + '">' + cow_cards + user_cow + '</div>', badge_avatar + ' ' + j.name.substring(0,1).toUpperCase() + j.name.substring(1) + ', ' + j.title);
                

            },
            error: function (j) {
                alert('failed to load user card', 'Error');
            }
        });
}
function precise_round(num,decimals){
    return Math.round(num*Math.pow(10,decimals))/Math.pow(10,decimals);
}
function numberWithCommas(x) {
    if (!x || typeof x === 'undefined') return '0';
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function populate_cones() {
    if (!user_me.cones) user_me.cones = [];
    user_me.cones.push('default');
    for (var i = 0; i < user_me.cones.length; i++) {
        var c = user_me.cones[i];
        if (c == 'babycone') c = 'baby';
        if (c == 'sugarcone') c = 'sugar';
        if ($('#main_cone img[x-id="' + c + '"]').length === 0) {
            $('#main_cone').prepend('<div class="option_wrapper tooltip" x-type="cone" draggable="true"><img x-src="' + image_prepend + '/cones/thumb/' + c + '.png.gz" x-type="cone" id="' + c + '" class="option" x-id="' + c + '" /></div>');
        }
        $('.cones_inner .unlockable[x-type="cone"][x-id="' + c + '"]').remove();
    }

    //wrap
    $('#main_cone.inner_flavor_container .option_wrapper').each(function () {
        if ($(this).parent().is('.page_wrap')) $(this).unwrap();
    });
    var elems = $('#main_cone.inner_flavor_container .option_wrapper:gt(4)');
    for(var i = 0; i < elems.length; i+=15) {
        elems.slice(i, i+15).wrapAll("<div class='page_wrap' x-page='" + Math.floor(i / 15) + "' style='display:none;'></div>");
    }

    setTimeout(function () { $('#main_cone .option_wrapper:first').click(); }, 100);
    if ( $('.flavor_tab[x-id="main_cone"]').hasClass('active') ) $('.flavor_tab[x-id="main_cone"]').click(); //turn x-src into srcs
    if ($('.cones_inner .unlockable, .cones_inner h3').length === 0) {
        $('.cones_inner').append('<h3>Every cone is unlocked!</h3>');
    } else {
        $('.cones_inner .unlockable').show();
        $('.cones_inner .unlockable:gt(2)').hide();
    }
}
function message_display(msg) {
    cache_unread_message = true;
    var msg_popup = $('<div />', {'class': 'new_message', 'text': msg.text, 'x-id': msg._id});
    if (msg.text == 'Added you as a friend!') {
            $(msg_popup).append('<div class="new_message_respond" x-user="' + msg.from + '">Say Hello!</div>');
    } else {
            $(msg_popup).append('<div class="new_message_respond" x-user="' + msg.from + '">Reply</div>');
    }
    var badge_img = (msg.badge_id)? '<img src="' + image_prepend + '/badges/' + msg.badge_id + '.png" class="new_msg_badge" />' : '';
    $(msg_popup).prepend('<div class="message_title">New Message!<span id="message_read"><i class="fa fa-times"></i></span></div>' + badge_img + '<b class="user_card" x-user="' + msg.from + '">' + msg.from + '</b> ');
    $(msg_popup).append('<span class="triangle-down"></span>');
   $('.floating_footer').append(msg_popup);
}
function change_room(room) {
    if (cache_rooms_avail.length > 0 && cache_rooms_avail.indexOf(room) == -1) return false;
    if (room != user_me.room) {
        setTimeout(function () {
            Icecream.sync_chat();
        }, 1000);
    }
    user_me.room = room;
    cached_rooms[room] = 0;
    var sleep_data = { sleep: false, room: room };
    socket.emit('sleep', sleep_data);

    $('.current_room')[0].textContent = room;
    $('.chat_rooms .hidden').remove();
    $('.chat_rooms').attr('x-unread', false).append('<div class="hidden"></div>');

    if (cache_rooms_avail.length === 0) {
        if (user_me.shadow_ban) {
            cache_rooms_avail.push('swamp');
        } else {
            cache_rooms_avail.push('default');
            cache_rooms_avail.push('bug reports');
            cache_rooms_avail.push('suggestions');
            if (user_me.prestige_bonus > 90) cache_rooms_avail.push('Roleplay Closet');
            if (user_me.is_admin || user_me.is_mod) cache_rooms_avail.push('Mod Only');
            if (user_me.is_admin || user_me.is_mod) cache_rooms_avail.push('swamp');
            if (user_me.badges && user_me.badges.indexOf(1) !== -1) cache_rooms_avail.push('donor lounge');
        }
    }
    for (var i = 0; i < cache_rooms_avail.length; i++) {
        $('.chat_rooms .hidden').append(change_room_format( cache_rooms_avail[i] ));
    }
    $('.chat_room_option[x-id="' + user_me.room + '"]').addClass('active');
    console.log( cache_rooms_avail );
}
function change_room_format(room) {
    if (!cached_rooms[room]) cached_rooms[room] = 0;
    if (cached_rooms[room] > 0) $('.chat_rooms').attr('x-unread', true);
    return '<div class="chat_room_option" x-id="' + room + '">' + room + ' <span class="chat_count">' + cached_rooms[room] + '</span></div>';
}