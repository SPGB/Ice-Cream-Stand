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
        //if (is_cube) $('.infocube_multiplier')[0].textContent = cache_cube_multiplier + 'x' + ( (cache_first_win_avail)? ' +2x' : '');
        if (!cache_sell_float_record && cache_cube_money > user.highest_accumulation) {
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

function flavour_switch( id ) {
        var flavor = Icecream.get_flavor(id);
        $('.icecream, .sell_value').css('display','block');
        var f_name = flavor.name.replace(/\s+/g, '');

        if (user.last_flavor === id) {
            $('.icecream_franken, .icecream_flavour').remove();
            $('.icecream').css('url("'+image_prepend+'/cones/'+ cached_cone +'.png.gz")');
            $('.icecream').prepend('<div class="icecream_flavour" x-name="' + f_name + '" x-new="true" style="background-image: url(https://s3.amazonaws.com/icecreamstand.com/flavours/' + f_name + '.png.gz);"></div>');
            if (user.last_frankenflavour) {
                var franken = Icecream.get_flavor(user.last_frankenflavour);
                var franken_name = franken.name.replace(/\s+/g, '');
                $('.icecream').prepend('<div class="icecream_franken" x-name="' + franken_name + '" x-new="true" style="background-image: url(https://s3.amazonaws.com/icecreamstand.com/flavours/' + franken_name + '.png.gz);"></div>');
                $('.icecream_flavour').attr('x-franken-half', true);
            }
            update_sell_value('main base');
            init_canvas();
        } else {
            user.last_flavor = id;
            user.last_frankenflavour = null;
            $.ajax({
                url: 'last_flavor',
                data: 'f=' + user.last_flavor + '&a=' + user.last_addon,
                dataType: 'JSON',
                type: 'POST',
                success: function (j) {
                    combos = j;
                    update_expertise();
                    update_sell_value('main base');
                    init_canvas();
                }
            });
            $('.icecream').stop().animate({ 'left' : '-100%'}, 250, function () {
                $('.icecream_franken, .icecream_flavour').remove();
                 $('.icecream').prepend('<div class="icecream_flavour" x-name="' + f_name + '" x-new="true" style="background-image: url(https://s3.amazonaws.com/icecreamstand.com/flavours/' + f_name + '.png.gz);"></div>');
                $('.icecream').animate({ 'left' : '0'}, 500);
            });
        }
        cached_flavor_index = user.flavors.indexOf(user.last_flavor);
        update_expertise();
}

function addon_switch(id) {
        var addon = Icecream.get_addon( id );
        var is_new = new_art_addons.indexOf( addon.name ) > -1;
        var addon_name = (is_new)? image_prepend + '/addons/' + addon.name.replace(/\W/g, '') + '.png.gz' : image_prepend + '/toppings/' + addon.name.replace(/\W/g, '') + '.png';

        $('.icecream #topping').attr('style', 'background-image: url(' +addon_name + ');');
        $('.icecream #topping').attr('x-addon', addon.name).attr('x-new-art', is_new);

        if (combos.length === 0 || user.last_addon != id ) {
            user.last_addon = id;
            $.ajax({
                url: 'last_flavor',
                data: 'f=' + user.last_flavor + '&a=' + user.last_addon,
                dataType: 'JSON',
                type: 'POST',
                success: function (j) {
                    for (var i = 0; i < j.length; i++) {
                        if (user.combos.indexOf( j[i]._id ) == -1) {
                            user.combos.push( j[i]._id );
                            toast('Unlocked the <b>' + j[i].name + '</b> combo!', 'Combo Unlocked');
                        }
                    }
                    combos = j;
                    update_sell_value('main addon');
                    Icecream.update_worker_fx('addon click');
                }
            });
        }
}

function combos_load() {
    return false;
    var that = this;
    $.ajax({
        url : '/combos',
        type: 'GET',
        dataType: 'JSON',
        success: function (j) {
            combos = j;

                            var combo_len = user.combos.length;
                            $('#main_combo p.help_text').remove();
                            if (combo_len == 0) {
                                $('#main_combo').append('<p class="help_text">Certain combinations of Ice Cream provide bonuses. Mix and match to discover new combos.</p>');
                            }
                            for (var i = 0; i < combo_len; i++) {
                                var combo_id = user.combos[i];
                                if ($('.combo_option[x-id="' + combo_id + '"]').length === 0) {
                                    var combo = Icecream.get_combo(combo_id);
                                    if (combo.name == 'mystery') {
                                        console.log('combo load - mystery combo');
                                    } else {
                                        var combo_franken = null;
                                        var flavor = Icecream.get_flavor(combo.flavor_id);
                                        var addon = Icecream.get_addon(combo.topping_id);
                                        if (combo.franken_id) combo_franken = Icecream.get_flavor(combo.franken_id);
                                        var is_new_addon = new_art_addons.indexOf(addon.name) > -1;
                                        var addon_url = (is_new_addon)? image_prepend + '/addons/thumb/' + addon.name.replace(/\W/g, '') + '.png.gz' : image_prepend + '/toppings/' + addon.name.replace(/\W/g, '') + '.png';
                                        var div = $('<div />', {
                                                'class': 'combo_option tooltip option', 
                                                'x-type': 'combo', 
                                                'x-id': combo_id, 
                                                'x-addon': addon._id, 
                                                'x-flavor': flavor._id,
                                                'x-franken': combo.franken_id,
                                                'x-value': combo.value,
                                                'x-name': combo.name,
                                                'x-new-art': is_new_addon,
                                                'draggable': true,
                                                'style': 'background-image:url(' + addon_url + '), url('+image_prepend+'/flavours/thumb/' + flavor.name.replace(/\s+/g, '') + '.png.gz)',
                                                'html': combo.name + ( (combo_franken)? '<div class="combo_split" style="background-image: url('+image_prepend+'/flavours/thumb/' + combo_franken.name.replace(/\s+/g, '') + '.png.gz)"></div>' : '')
                                        });

                                        $('.flavor div#main_combo').prepend(div);
                                        $(div).wrap('<div class="option_wrapper"></div>');
                                    }
                                }
                            }
            }
    }); //end combos call
}