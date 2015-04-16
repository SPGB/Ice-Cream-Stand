var canvas_cache_width = 0;
var canvas_cache_height = 0;
var canvas_drop_cache = [];
var canvas_drop_cache_len = 0;
var canvas_drop_clouds = [];
var canvas_drop_clouds_len = 0;
var cached_page = null;
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

function icecream_mousedown(amount, x, y) {
        //there are 3 do_click's below - please don't take advantage of them (pretty please)
        if (!cache_cube_multiplier) cache_cube_multiplier = 1;
        //var daily_mult = (cache_first_win_avail)? 2 : 1;
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
        if (is_cube) $('.infocube_multiplier')[0].textContent = cache_cube_multiplier + 'x' + ( (cache_first_win_avail)? ' +2x' : '');
        if (!cache_sell_float_record && cache_cube_money > user_me.highest_accumulation) {
                cache_sell_float_record = true;
        }
        var floater = $('<div />', {
            'class': 'icecream_float',
            'text': numberWithCommas( (cache_sell_float).toFixed(2) )
        });
        $('body').append(floater);
        $(floater).css('color', '#' + color_pool[Math.floor( Math.random() * color_pool.length )]).animate({ 'margin-top': '-100' }, 500, function () { $(this).remove() });
        if (x && y) {
            $(floater).css('top', y).css('left', x - 30);
        }
        if (user_me.is_animation_cones && window_focus && canvas_drop_cache_len < 50) {
            if (amount == 1) {
                 canvas_drop_cache.push([6, parseInt((Math.random() * canvas_width) / 50) * 50, 90 * Math.floor(Math.random() * -3), 1]);
            } else {
                canvas_drop_cache.push([6, parseInt((Math.random() * canvas_width) / 50) * 50, 90 * Math.floor(Math.random() * -3), 1.5]);
            }
            canvas_drop_cache_len = canvas_drop_cache.length;
        }
        return false;
}