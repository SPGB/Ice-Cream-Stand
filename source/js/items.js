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
            update_sell_value('inventory drop');
        }, true);
        cow_redraw();
        load_cow(cow);
    }
    return false;
}
function item_handleDragStart(e) {
    var num = parseInt($(this).attr('x-num'));
    if (cache_item_pool[ num ] != $(this).attr('x-name')) {
        alert('pickup ERROR - found ' + cache_item_pool[ num ] + ' but picked up ' + $(this).attr('x-name'), 'Error' );
        $(this).remove();
        return false;
    }

    if ($(this).attr('x-name') == 'rock' && $(this).find('.type_item').attr('x-variance') == 2) {
        alert_inline(this, 'Coooooooo');
    }
    this.style.opacity = '1'; // this / e.target is the source node.
    dragSrcEl = this;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('num', num );
    e.dataTransfer.setData('type', 'item' );

    $('body').css( 'cursor', $(this).css('background-image') + ', move !important' );
    $('.hovercard').remove();
    item_remove = true;
}
function item_handleDragEnd(e) {
    console.log('item drag complete, cleaning up, ' + item_remove);
    $('.over').removeClass('over');
    if (item_remove) {
        item_handle_remove( $(this) );
    }
    $('body').css('cursor', '');
}
function item_handle_remove(e) {
    var num = parseInt( $(e).attr('x-num') );
    console.log('removing ' + num);
    if (isNaN(num)) return false;
    $(e).remove();
    if ( $('.background_hill > .item').length === 0 ) {
        cache_item_pool = [];
    } else {
        cache_item_pool.splice(num, 1);
        console.log(cache_item_pool);
        for (var i = num; i <= cache_item_pool.length; i++) {
            $('.background_hill > .item[x-num="' + i + '"]').attr('x-num', i - 1);
        }
    }

    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }
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
function silo_handleDrop(e) {
    $('body').css('cursor', '');
    if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
    }
    if (dragSrcEl != this && String(e.dataTransfer.getData('type')) == 'item') {
        var num = parseInt( e.dataTransfer.getData('num') );
        var item = cache_item_pool[ num ];
        if (item == 'hay') {
            $(this).append('<div class="icecream_float cow_float float_hay">+1</div>');
            $('.cow_float').animate({ top: -50 }, 1000, function () { $(this).remove(); });
            user_me.silo_hay++;
            if (user_me.silo_hay > 175 + (25 * user_me.upgrade_silo_hay)) user_me.silo_hay = 175 + (25 * user_me.upgrade_silo_hay);
            $('.silo_bar').css('height', user_me.silo_hay / (175 + (25 * user_me.upgrade_silo_hay)) / 0.01 );
            item_handle_remove( e );
            Icecream.sync_cow();
        } else if (item != 'rock') {
            console.log(item);
            if (item.indexOf('rare') > -1) {
                item_remove = false;
                return false;
            }
            var sell_value = 100;
            $(this).append('<div class="icecream_float cow_float float_hay">$' + sell_value + '</div>');
            $('.cow_float').animate({ top: -50 }, 1000, function () { $(this).remove(); });
            user_me.gold += sell_value;
            socket.emit('item/sell', { value: sell_value });
            item_handle_remove( e );
        }
    }
}
function cow_handleDrop(e) {
    
    $('body').css('cursor', '');
    if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.

    }
    if (dragSrcEl != this && String(e.dataTransfer.getData('type')) == 'item') {
        var num = parseInt( e.dataTransfer.getData('num') );
        var item = cache_item_pool[ num ];
        console.log('dropping ' + item + ' (' + num + ') on cow');
        if (item == 'rock') {
            $(this).append('<div class="icecream_float cow_float float_failure">-30</div>');
            $('.cow_float').animate({ top: -50 }, 1000, function () { $(this).remove(); });
            cow.happiness -= 30;
            if (cow.happiness < 0) cow.happiness = 0;
            update_sell_value('cow drop: rock');
        } else if (item == 'hay') { //make the cow happy
            if (cow.happiness >= cow.total_happiness)  {
                cow.happiness = cow.total_happiness;
                $(this).append('<div class="icecream_float cow_float">+0</div>');
            } else {
                if (cow.happiness > 90) { update_sell_value('cow drop: hay'); }
                cow.happiness += 10;
                if (cow.happiness > cow.total_happiness)  cow.happiness = cow.total_happiness;
                $(this).trigger('mouseout').trigger('mouseover');
                $(this).append('<div class="icecream_float cow_float float_success">+10</div>');
            }
            $('.cow_float').animate({ top: -50 }, 1000, function () { $(this).remove(); });
        } else if (item == 'snowflake') {
            $(this).append('<div class="icecream_float cow_float"><img src="https://s3.amazonaws.com/icecreamstand.com/event/collectable_snowflake.png" /></div>');
            $('.cow_float').animate({
                    top: -50
            }, 1000, function () {
                $(this).remove();
            });
            socket.emit('epic');
            user_me.epic_collected += 10;
            $('.user_epic_collected').text(user_me.epic_collected);
        } else if (item == 'candycane') {
            $(this).append('<div class="icecream_float cow_float"><img src="https://s3.amazonaws.com/icecreamstand.com/event/collectable_candycane.png" /></div>');
            $('.cow_float').animate({
                    top: -50
            }, 1000, function () {
                $(this).remove();
            });
            socket.emit('epic');
            user_me.epic_collected += 10;
            $('.user_epic_collected').text(user_me.epic_collected);
        } else if (item) {
            if (!cow.items) cow.items = [];
            if (cow.items.length >= 12) {
                item_remove = false;
                return alert('<p>Your cow can\'t carry any more.</p>', 'Inventory Full');
            }
            cow.items.push( item );
            achievement_register('545dad616c43abdf66d01472');
            Icecream.sync_cow(function () {
                cow_redraw();
            }, true);
            return false;
        }
        cow.experience += 1;
        if (cow.happiness < 0) cow.happiness = 0;
        var next_level = Math.ceil( cow.level );
        var progress =  100 + ( (cow.level - next_level) / 0.01 );
        $('.cow_level_bar > #experience').attr('value', progress);
        $('.cow_level_bar > #happiness').attr('x-full', (cow.happiness == cow.total_happiness) ).attr('value', cow.happiness );
        Icecream.sync_cow();
        item_handle_remove( e );
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