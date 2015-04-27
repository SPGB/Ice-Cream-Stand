function load_cow(c, user) {
        if (!c) { return alert('Could not find a cow', 'Error'); }
        if (!c.items) { c.items = []; }
        var days_diff = (new Date() - new Date(c.created_at)) / 86400000;
        var days_category = 'Baby';
        var button_adopt_enabled = 'false';
        if (c.level > 5 && days_diff > 12) days_category = 'Adult';
        if (c.level > 5 && days_diff > 32) {
                days_category = 'Old';
                button_adopt_enabled = 'true';
        }
        var cow_buttons = (c._id === cow._id)? '<div class="button button_cow" x-action="rename">Rename</div><div class="button button_cow" x-action="skin">Skin</div><div class="button button_cow" x-action="adopt" x-enabled="' + button_adopt_enabled + '">' + __('Re-adopt') + '</div>': '';
        if (user) {
            cow_buttons = '<user x-user="' + user.name + '">View ' + user.name + '\'s profile</user>';
        }
        var items = '';
        var equipped = '';
        var set_temp = [];
        var additional_int = 0, additional_str = 0, additional_con = 0;
        if (c.level < 5) {
                c.skin = 'baby'; 
        } else {
            for (var i = 0; i < c.items.length; i++) {
                    if (c.items[i]) {
                        var item_split = c.items[i].split('/');
                        var item = item_split[0].replace(/"/g, '').replace(/ /g, '');
                        if (i < 3) {
                            if (item_split[1]) additional_int += Number(item_split[1]);
                            if (item_split[2]) additional_str += Number(item_split[2]);
                            if (item_split[3]) additional_con += Number(item_split[3]);
                            if (item_split[6]) { //set
                                if (set_temp.indexOf(item_split[0]) === -1) set_temp.push(item_split[0]);
                            }
                        }

                        if (i < 4) {
                            equipped = equipped + '<div class="cow_attachment type_item" x-type="' + item_split[0] + '"></div>';
                        }
                        items = items + '<div class="inventory_slot" x-item="' + item + '"><img src="https://s3.amazonaws.com/icecreamstand.com/items/' + item + '.png" x-pos="' + i + '" x-name="' + c.items[i] + '" class="inventory_thumb tooltip" x-type="item" />' +
                        ((c._id == cow._id)? '<div class="inventory_clear" x-num="' + i + '">+</div>' : '') + '</div>';
                    }
            }
            if (set_temp.length == 3) {
                additional_int += 2;
                additional_str += 2;
                additional_con += 2;
            }
        }
            var cow_name = c.name.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
                return '&#'+i.charCodeAt(0)+';';
            });
            var intelligence = Number(c.intelligence) + Number(additional_int);
            var strength = Number(c.strength) + Number(additional_str);
            var constitution = Number(c.constitution) + Number(additional_con);

            c.total_happiness = 100 + Math.floor(intelligence / 2);
            var next_level = Math.ceil( c.level );
            var progress =  100 + ( (c.level - next_level) / .01 );
            if (c.happiness > c.total_happiness) c.happiness = c.total_happiness;

            alert('<div class="cow_inventory">' + items + '</div><div class="cow_stats"><b class="tooltip cow_card_stat" x-type="strength">Strength</b> ' + strength + '<br><b class="tooltip cow_card_stat" x-type="constitution">Constitution</b> ' + constitution + '<br><b class="tooltip cow_card_stat" x-type="intelligence">Intelligence</b> ' + intelligence + '<br><br>' +
            '<b>Experience</b><div class="cow_card_experience" title="' + c.experience + '"><span style="width: ' + progress + '%"></span></div><br><b>Happiness</b>' + 
            '<div class="cow_card_hapiness" title="' + (c.happiness).toFixed(1) + '/' + c.total_happiness + '"><span style="width: ' + (c.happiness / c.total_happiness / 0.01) + '%"></span></div><br><b>Bonus when happy</b> ' + (strength + 10 + (c.level / 2) ).toFixed(1) + '%<br><b>Age</b> ' + (days_diff).toFixed(1) + ' days (' + days_category + ')' +
            '<div class="cow_card_cow"><div class="cow_body" x-skin="' + c.skin + '"></div>' + equipped + '</div><div class="cow_buttons">' + cow_buttons + '</div></div>', cow_name + ', lvl ' + Math.floor(c.level));

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
function cow_hay(is_from_cube) {
    if ( (!is_from_cube && cache_item_pool.length > 5) || !cow) { return; }
    var variance = Math.floor( Math.random() * 4);
    var rand = ( Math.random() * ((canvas_width * 0.25) - 225) ) + 25 + (canvas_width * 0.75); //randomly in the first half 
    var type = (Math.random() < 0.1)? 'rock' : 'hay';

    if (type === 'rock') {
        variance = (Math.random() < 0.1)? 2 :1;
    }
    if (type == 'hay') {
       // if (user.epic_id && Math.random() < 0.25) {
       //      type = (user.epic_id == '5481119c19e7a1c726d1b3f7')? 'snowflake' : 'candycane';
       //  } 
    }
    var item_chance = (Math.random() + cow.magic_find);
    if (is_from_cube) item_chance += 0.9;
    if (item_chance > 0.8 && cow.level > 5 && (cow.items.length < 12 || Math.random() < 0.5)) {
        var drop_table = [];
        var common_drops = ['hat_basic', 'coat_basic', 'accessory_pipe/1/0/0', 'shoes_basic', 'hat_deerstalker', 'shoes_basic', 'shoes_cowboy'];
        var uncommon_drops = ['accessory_monocle/2/0/0/uncommon', 'wings_rainbow/1/0/0/uncommon', 'hat_fedora/-1/0/0/uncommon', 'hat_beerhat/0/0/2/uncommon', 'accessory_lei/0/0/1/uncommon',
        'dress_lace/1/1/1/uncommon'];
        var rare_drops = ['hat_afro/0/2/0/rare', 'hat_crown/2/0/1/rare', 'tutu_pink/1/0/1/rare'];

        if (user.last_flavor == '523a1948750f2c0000000002' && user.last_addon == '525baaf765c3460000000007') {
            uncommon_drops.push('hat_rainbow afro/1/2/1/uncommon');
        }
        if (user.last_flavor == '524dd6ce8c8b720000000002' && user.last_frankenflavour == '52390634971a180000000003') {
            uncommon_drops.push('wings_bat/1/0/1/uncommon');
        }
        if (user.last_flavor === '523901fba4cc590000000007' && user.last_addon == '525bab2165c3460000000009') {
            rare_drops.push('hat_astronaut/2/0/2/rare');
            rare_drops.push('suit_astronaut/2/0/2/rare');
        }
        if (user.is_night && user.last_flavor == '524dd72e8c8b720000000005' && user.last_addon == '525bab2165c3460000000009' && user.last_frankenflavour == '5238fd44523fdc0000000004') {
            rare_drops.push('suit_batcow/2/1/1/rare');
        }
        if (user.last_addon == '523d5c51fbdef6f047000025') {
            rare_drops.push('hat_golden afro/3/0/0/rare/Fnm04');
        }
        if (user.last_flavor == '524d0e141320310000000005' && user.last_frankenflavour == '523d5e603095960000000001' && user.last_addon == '523d5727fbdef6f04700000c' && Math.random() < 0.2) {
            rare_drops.push('pet_blair/2/2/2/rare/Creeperkitty');
        }
        if (cow && cow.items && cow.items.length > 3 && cow.items[0].indexOf('pet_blair') === 0 && 
            cow.items[1].indexOf('pet_blair') === 0 && 
            cow.items[2].indexOf('pet_blair') === 0) {

            rare_drops.push('pet_shiba/2/2/2/rare/Animefandk/doge (3)');
            rare_drops.push('coat_fauxfur/3/0/1/rare/Animefandk/doge (3)');
            rare_drops.push('boots_fauxfur/0/3/1/rare/Animefandk/doge (3)');
        }
        if (user.last_flavor == '525baa7865c3460000000006' && user.last_frankenflavour == '523903de9e47060000000002' && user.last_addon == '523d5dbf171d3e0000000005') {
            rare_drops.push('mask_cthulhu/2/2/1/rare/Grakmarr');
        }
        if (new Date().getHours() < 2) { //12am to 1am
            rare_drops.push('hat_wolf/2/2/1/rare/wolfcry');
        }

        //dino grabber
        var is_top_15expertise = (user.flavors_sold.length > 4);
        for (var i = 0; i < user.flavors_sold.length; i++) {
            var sold = user.flavors_sold[i];
            if (sold < 6076015) is_top_15expertise = false;
            if (i == 4) break;
        }

        if (is_top_15expertise && cow.magic_find > 0.1) {
            rare_drops.push('grabber_dino/-1/3.5/0/rare');
        }

        if (is_from_cube && user.last_addon == '523d5abafbdef6f047000020' && user.last_flavor == '524d0d1e1320310000000004') {
            rare_drops.push('hat_mercow/2/2/-1/rare');
            rare_drops.push('accessory_mercow/2/-1/2/rare');
            rare_drops.push('tail_mercow/-1/2/2/rare');
        }

        if (cached_cone == 'sprinkle') { //sprinkle cone's value
            uncommon_drops.push('hat_cone/1/1/1/uncommon');
        }

        if (item_chance > 0.8 && !is_from_cube) drop_table.push.apply(drop_table, common_drops);
        if (item_chance > 0.925 && !is_from_cube) drop_table.push.apply(drop_table, uncommon_drops);
        if (item_chance > 0.975) drop_table.push.apply(drop_table, rare_drops);
        type = drop_table[ Math.floor( Math.random() * drop_table.length ) ];
    }

    var hay = $('<div />', {
        'class': 'item tooltip_click ' + type,
        'x-num': cache_item_pool.length,
        'x-name': type,
        'x-type': 'item',
        'x-from-cube': is_from_cube,
        'style': 'bottom: 300px; opacity: 0; left: ' + Math.floor(rand) + 'px',
        'draggable': true,
        'html': '<div class="type_item" x-variance="' + variance + '" x-type="' + type.split('/')[0] + '"></div>'
    });
    hay.appendTo('.background_hill').animate({ bottom: 0, opacity: 2}, 1000);
    cache_item_pool.push(type);

    var cols = document.querySelectorAll('.item');

    [].forEach.call(hay, function(col) {
        col.addEventListener('dragstart', item_handleDragStart, false);
        col.addEventListener('dragend', item_handleDragEnd, false);
        col.addEventListener('drop', item_handleDrop, false);
        col.addEventListener('dragover', item_handleDragOver, false);
    });
}