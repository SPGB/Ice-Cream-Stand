angular.module('ics')
.factory('expertiseService', function() {
    return {
        get_level: function (sales) {
            var last_sale = 0;
            for (var i = 0; i <= 15; i++) {
                var cost = expertise_reqs[i] + last_sale;
                if (sales < cost || i == 15) {
                    return i;
                }
                last_sale = cost;
            }
        }
    };
});

//LEGACY
function update_expertise(cb) {
    if (cached_flavor_value == 0 || cached_flavor_index === -1) { console.log('expertise bp1'); return; }
    var sold = user.flavors_sold[cached_flavor_index];
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
        //$('#main_base .option[x-id="' + user.last_flavor + '"]').parent().find('.expertise_level').text(expertise);
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
        if (user.total_gold === 0) {
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
    var f_len = user.flavors.length;
    for (var j = 0; j < f_len; j++) {
        //var f = $('#main_base .option').eq(j);
        var last_sale = 0;
        for (var i = 0; i <= 15; i++) {
            var cost = expertise_reqs[i] + last_sale;
            if (user.flavors_sold[j] < cost || i == 15) {
                // if (f.parent().find('.expertise_level').length == 0) {
                //     f.after('<div class="expertise_level">' + i + '</div>');
                // } else {
                //     f.parent().find('.expertise_level').text(i);
                // }
                break;
            } else {
                last_sale = cost;
            }
        }
    }
}