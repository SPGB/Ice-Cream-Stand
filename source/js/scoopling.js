function bind_scoopling() {
$('body').on('click', '.icecream', function (e) {
    if (is_cube || $('.cube_infobar').length > 0) return false;
    _gaq.push(['_trackEvent', 'Ice Cube', 'Start']);
    is_cube = true;
    cache_cube_time = new Date();
    cache_cube_money = 0;
    cache_sell_float_record = false;
    cache_sell_float_num = 0;
    cache_cube_multiplier = 1;
    $('.cube_infobar').remove();
    $('#canvas_sales').show();
    $('.icecream').prepend('<div class="cube_infobar"><div class="cube_collect button"><span class="money_icon infocube_money">0</span></div></div>');
    //$('.infocube_multiplier')[0].textContent = cache_cube_multiplier + 'x' + ( (cache_first_win_avail)? ' +2x' : '');

    cache_cube_interval = setInterval(function () {
        cubebar_update();
    }, 50);

        var eye_height = Math.random() * 100;
        canvas_cache_sales = []; //progress, x, y, size, variation
        cube_new();

    });
    
    $('body').on('mousemove', '#canvas_sales', function (e) {
        return false; //dont care about this
        if (!is_cube) return false;
        var sales_lastmove_stamp_temp = new Date().getTime();
        if (sales_lastmove_stamp_temp < sales_lastmove_stamp + 100) return false;
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
                 return false;
            }
        }
        if (cached_canvas_pointer) {
            $('#canvas_sales').css('cursor', 'default');
            cached_canvas_pointer = false;
        }
    });
    $('body').on('click', '#canvas_sales', function (e) {
        if (!is_cube) return false;
        e.preventDefault();
        e.stopPropagation();
        var x = e.pageX - $('#canvas_sales').offset().left, y = e.pageY - $('#canvas_sales').offset().top;
        //var doc = document.documentElement;
        //var scroll_top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        
        var cube_len = canvas_cache_sales.length;
        for (var i = 0; i < cube_len; i++) {
            var c = canvas_cache_sales[i];
            var x2 = c[1];
            var y2 = c[2];

            if (within_z(x, x2, y, y2, 30)) {
                cache_sell_misses = 0;

                if (c[4] <= 1) { //clicked the right one
                    canvas_cache_sales = [];
                    canvas_sales_context.clearRect(0, 0, 400, 400);
                    //canvas_sales_context.clearRect(c[1] - 26 - 2, c[2] - 26 - 2, 54, 54);
                    cube_new();
                } else if (c[4] > 7) {
                    var minus = Math.floor( cache_cube_money / 2 );
                    cache_cube_money = minus;
                    canvas_cache_sales = [];
                    canvas_sales_context.clearRect(0, 0, 400, 400);
                    cube_new();
                    icecream_mousedown(0, e.pageX, e.pageY, -1 * minus);
                    return false;
                } else {
                    c[4]--;
                    if (c[3] && c[3] > 10) c[3] -= 20;
                }

                var daily_mult = (cache_first_win_avail)? 2 : 1;
                var num_of_clicks = (1 + (user.upgrade_coldhands / 4)) * cache_cube_multiplier * daily_mult;
                Icecream.canvas_icecream_sales();

                icecream_mousedown(num_of_clicks, e.pageX, e.pageY);
                do_click(num_of_clicks);
                return false;
            }
        }

    cache_sell_misses++;
    if (cache_sell_misses > 10) {
            canvas_cache_sales = [];
            canvas_sales_context.clearRect(0, 0, 400, 400);
            setTimeout(function () {
                canvas_sales_context.clearRect(0, 0, 400, 400);
                canvas_cache_sales = [];
                for (var i = 0; i < 2; i++) {
                    var new_x = 25 + (Math.random() * 160), new_y = 25 + (Math.random() * 125);
                    canvas_cache_sales.push( [1, new_x, new_y, 0, Math.floor( Math.random() * 4 )] );
                }
                cache_sell_misses = 5;
            }, 5000);
            cache_sell_misses = -1000;
    }
    return false;
});

}

/** HELPERS **/
function icecream_mousedown(amount, x, y, override) {

        if (!cache_cube_multiplier) cache_cube_multiplier = 1;

        if (!override) {
            cache_sell_float = amount * cached_sell_value; // * cache_cube_multiplier * daily_mult;
            cache_cube_money += cache_sell_float;
            cache_sell_float_num++;
            var c_new = numberWithCommas( (cache_sell_float).toFixed(2) );
            

            if (isNaN(cache_sell_float)) {
                return console.log('float value is NaN (' + amount + ' ' + cached_sell_value + ' ' + cache_cube_multiplier + ')');
            }
            if (cache_sell_float_num === 10) {
                    $('#icecream_float_text').remove();
                    $('.icecream').append('<div id="icecream_float_text">Icey x2</div>');
                    $('#icecream_float_text').animate({ 'top': '0' }, 1000, function () { $(this).remove() });
                    cache_cube_multiplier = 2;
            } else if (cache_sell_float_num === 30) {
                    $('#icecream_float_text').remove();
                    $('.icecream').append('<div id="icecream_float_text">Stone Cold x3</div>');
                    $('#icecream_float_text').animate({ 'top': '0' }, 1000, function () { $(this).remove() });
                    cache_cube_multiplier = 3;
             } else if (cache_sell_float_num === 100) {
                    $('#icecream_float_text').remove();
                    $('.icecream').append('<div id="icecream_float_text">Frosty x4</div>');
                    $('#icecream_float_text').animate({ 'top': '0' }, 1000, function () { $(this).remove() });
                    cache_cube_multiplier = 4;
             } else if (cache_sell_float_num === 150) {
                    $('#icecream_float_text').remove();
                    $('.icecream').append('<div id="icecream_float_text">Frozen! x5</div>');
                    $('#icecream_float_text').animate({ 'top': '0' }, 1000, function () { $(this).remove() });
                    cache_cube_multiplier = 4;
            }
            //if (is_cube) $('.infocube_multiplier')[0].textContent = cache_cube_multiplier + 'x' + ( (cache_first_win_avail)? ' +2x' : '');
            if (!cache_sell_float_record && cache_cube_money > user.highest_accumulation) {
                    cache_sell_float_record = true;
            }
        }
        var floater = $('<div />', {
            'class': 'icecream_float',
            'text': (override)? override : numberWithCommas( (cache_sell_float).toFixed(2) )
        });
        $('body').append(floater);
        $(floater).css('color', '#' + color_pool[Math.floor( Math.random() * color_pool.length )]).animate({ 'margin-top': '-100' }, 500, function () { $(this).remove() });
        if (x && y) {
            $(floater).css('top', y).css('left', x - 30);
        }
        if (user.is_animation_cones && window_focus && canvas_drop_cache_len < 50) {
            if (amount == 1) {
                 canvas_drop_cache.push([6, parseInt((Math.random() * canvas_width) / 50) * 50, 90 * Math.floor(Math.random() * -3), 1]);
            } else {
                canvas_drop_cache.push([6, parseInt((Math.random() * canvas_width) / 50) * 50, 90 * Math.floor(Math.random() * -3), 1.5]);
            }
            canvas_drop_cache_len = canvas_drop_cache.length;
        }
        return false;
}

function do_click(a) {
    cache_sell_num += a;
    //user.gold += parseFloat(cached_sell_value) * a;
    if (cached_flavor_index > -1) {
        user.flavors_sold[cached_flavor_index] = parseInt(user.flavors_sold[cached_flavor_index]) + a;
        update_expertise(function () {
            Icecream.update_quest_bar();
        });
    }
}

function within_z(x, x2, y, y2, z) {
    return (x > x2 - z && x < x2 + z && y > y2 - z && y < y2 + z);
} 

function cubebar_update() {
        if (!is_cube) return;
        var cube_len = canvas_cache_sales.length;
        if (cube_len === 0) return;
        var time_delta = (new Date() - cache_cube_time) / 1000;
        var mins = Math.floor( time_delta / 60 );
        var seconds = (time_delta % 60).toFixed(1);

        //$('.infocube_time')[0].textContent = ((mins < 10)? '0' : '') + mins + ':' + ((seconds < 10)? '0' : '') + seconds;
        $('.infocube_money')[0].textContent = numberWithCommas( (cache_cube_money).toFixed(0) );

        var speed = cache_sell_float_num / 50;
        if (speed > 10) speed = 10;
        for (var i = 0; i < cube_len; i++) {
            var c = canvas_cache_sales[i];
            if (c && c[4] < 8) { //dont update rocks
                c[0] -= 1 + speed;
                if (c[0] < 0 - speed) {
                    canvas_cache_sales = [];
                    cache_cube_multiplier = 1;
                    canvas_sales_context.clearRect(0, 0, 400, 400);
                    cube_new();
                }
            }
        }
    }
    function cubebar_end() {
        is_cube = false;
        console.log('... ending ice cubes');

        var data = { 
            a: cache_cube_money,
            t: (new Date() - cache_cube_time) / 1000,
            is_first_win: cache_first_win_avail,
            flavour: user.last_flavor,
            addon: user.last_addon,
            sold: user.flavors_sold[cached_flavor_index]
        };
        console.log(data);
        socket.emit('accumulation', data);
        $('.cube_infobar').slideUp(500, function () {
            $('.cube_infobar').remove();
            $('#canvas_sales').hide();
            canvas_cache_sales = [];
            canvas_sales_context.clearRect(0, 0, 400, 400);
        });

        clearInterval(cache_cube_interval);
        
        cache_cube_multiplier = 1;
        if (cache_sell_float_record) {
            var new_record = $('<div />', {
                id: 'icecream_float_text', text: 'New Record ' + numberWithCommas( (cache_cube_money).toFixed(0) )
            });
            $('.icecream').append(new_record);
            $(new_record).animate({ 'top': '0' }, 3000, function () { $(this).remove() });
            user.highest_accumulation = cache_cube_money;
        }
        if (cache_first_win_avail) {
            cache_first_win_avail = false;
            buff_remove('firstwin');
        }
        if (alert_queue.length > 0) {
            for (var i = 0; i < alert_queue.length; i++) {
                var a = alert_queue[i];
                alert(a.msg, a.title);
            }
            alert_queue = [];
        }

        //sync money
        user.icecream_sold += cache_sell_num;
        user.gold += cache_cube_money;
        //sell_icecream(cache_sell_num, false);
        cache_sell_num = 0;
        cache_cube_money = 0;
        cache_cube_time = 0;

        if (user.icecream_sold >= 2000000) { achievement_register('5280ef1cb61b420000000009'); }
        if (user.icecream_sold >= 1000000) { achievement_register('5280ef12b61b420000000008'); }
        else if (user.icecream_sold >= 500000) {  achievement_register('5280ef02b61b420000000006'); }
        else if (user.icecream_sold >= 100000) {  achievement_register('5280eee1b61b420000000004'); }
        else if (user.icecream_sold >= 10000) {  achievement_register('5280eeeab61b420000000005'); }
        else if (user.icecream_sold >= 1000) {  achievement_register('5280ee78b61b420000000003'); }
        else if (user.icecream_sold >= 100) {  achievement_register('5280ee5fb61b420000000001'); }

        if (user.quests.length === 0) Icecream.get_quest('cubes');

        if (user.tutorial === 0) {
            user.tutorial++;
            Icecream.get_tutorial();
            $.ajax({
                url: 'tutorial',
                data: 'tutorial=' + user.tutorial,
                dataType: 'JSON',
                type: 'POST'
            });
        }
    }
    function cube_collision(x, y) {
        for (var i = 0; i < canvas_cache_sales.length; i++) {
            var other = canvas_cache_sales[i];
            if ( within_z(other[1], x, other[2], y, 50) ) {
                //console.log('cube/collision: yes');
                return true;
            }
        }
        return false;
    }
    function cube_new(is_rock) {
        var new_x = 190, new_y = 175;

        if (cache_cube_multiplier > 1) {
            do {
                new_x = 65 + (Math.random() * 275);
                new_y = 65 + (Math.random() * 275);
                //console.log(new_x + ',' + new_y);
            } while ( cube_collision(new_x, new_y) );
        }

        if (is_rock) {
            canvas_cache_sales.push( [ 150, new_x, new_y, 30, Math.floor( Math.random() * 7 ) + 8 ] );
            return;
        } else {
            var progress = Math.floor(cache_sell_float_num / 10);
            if (progress > 6) progress = 6;
            canvas_cache_sales.unshift( [100, new_x, new_y, 30, progress + 1] );
            if (progress > 2) {
                cube_new(true);
            }
            if (progress > 5) {
                cube_new(true);
            }
            if (progress === 7) {
                cube_new(true);
            }
            
        }
    }