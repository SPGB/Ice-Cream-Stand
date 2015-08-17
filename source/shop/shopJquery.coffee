$ ->

    $('body').on 'click', '.shop_button', ->
        item = $(this).attr('x-item')
        is_skin = $(this).attr('x-is-skin') is 'true'
        is_badge = $(this).attr('x-is-badge') is 'true'
        cost = parseInt $(this).attr('x-cost')

        if !isNaN(cost) and user.gold < cost
            return toast '<p>You need more money to buy this item!</p>', 'Can not Afford'

        if !cow
            return toast '<p>"Come back when you have a cow."</p><p>Who said that? You only see a cart.</p>', 'A talking cart?'

        if item && !is_skin && !is_badge
            if cow.items.length >= 12
                toast('<p>Your inventory is full</p>', 'Inventory Full')
            else
                toast('<p>Success! You have purchased <b class="tooltip" x-type="item" x-name="' + item + '">' + item.replace(/_/g, ' - ') + '</b> for ' + cow.name + '.</p>', 'Purchased')
            return

        if is_skin && cow.skins_unlocked && cow.skins_unlocked.indexOf(item) > -1
            return toast '<p>You already own the <b>' + item + '</b> cow skin.</p>', 'Already own'

        $.ajax {
            url: '/shop/item',
            data: { item: item },
            dataType: 'json',
            type: 'post',
            success: (j) ->
                if j.error then return alert j.error
                if !isNaN cost then user.gold = user.gold - parseInt(cost)
                if j.gamble
                    cow = {}
                    Icecream.sync_cow ->
                        cow_redraw()
                        update_sell_value('shopping')

                    return alert('<p>Success! You have found a <b class="tooltip" x-type="item" x-name="' + j.gamble + '">' + j.gamble.split('/')[0].replace(/_/g, ' - ') + '</b> for ' + j.cow.name + '.</p>', 'Mystery Item')

                if j.unlocked_skin
                    if !cow.skins_unlocked then cow.skins_unlocked = []
                    cow.skins_unlocked.push j.unlocked_skin
                    return alert('<p>Success! You have unlocked the <b>' + j.unlocked_skin + '</b> skin for ' + cow.name + '.</p>', 'Skin Unlocked')

                if j.unlocked_badge
                    user.badges.push msg.add_badge
                    main()
                    return alert('<p>Success! You have unlocked a new badge.</p>', 'Badge Unlocked')

                cow = j
                cow_redraw()
                main()
        }

    # $('body').on 'click', '.shop', ->
    #     $.ajax {
    #         url: 'https://s3.amazonaws.com/icecreamstand.com/shop.json.gz'
    #         data: { 'cache': Math.random() }
    #         dataType: 'json'
    #         success: (items) ->
    #             compiled = '<tr><td><img src="https://s3.amazonaws.com/icecreamstand.com/gamble.png" class="tooltip inventory_thumb" x-type="gamble" /> Mystery Item' +
    #                 '</td><td><div class="shop_button button" x-cost="250000"><span class="money_icon is_white">250,000</span></div></td></tr>'
    #             skin_compiled = ''
    #             badge_compiled = ''
    #             for i, item of items
    #                 cost = item.cost
    #                 if !cost or isNaN cost then cost = 0

    #                 if item.type is 'skin'
    #                     skin_compiled = shop_skin_add skin_compiled, i, item
    #                 else if item.type is 'badge'
    #                     badge_compiled = shop_badge_add badge_compiled, i, item
    #                 else if item['match-name']
    #                     if item['match-name'] is user.name then compiled = shop_item_add compiled, i, item

    #                 else if item['match-badge']
    #                     if user.badges && user.badges.indexOf item['match-badge'] > -1 then compiled = shop_item_add compiled, i, item

    #                 else if item['match-epic']
    #                     if user.epic_id and user.epic_id is item['match-epic'] and (!item['match-epic-collected'] or user.epic_collected > item['match-epic-collected'])
    #                         compiled = shop_item_add(compiled, i, item)
    #                 else
    #                     compiled = shop_item_add compiled, i, item

    #             compiled_tabs = ''
    #             for i in shopTabs
    #                 compiled_tabs = compiled_tabs + "<div class='settings_tab' x-area='shop_tab_#{i}' x-type='shop'>#{i}</div>"

    #             alert('<div class="shop_nab button_container">' + compiled_tabs + '</div>' +
    #                 '<table class="shop_table settings_area" x-active="true" x-index="0" x-page="5" x-area="shop_tab_items">' + compiled + '</table>' +
    #                 '<table class="shop_table settings_area" x-area="shop_tab_skins" x-index="0" x-page="3">' + skin_compiled + '</table>' +
    #                 '<table class="shop_table settings_area" x-area="shop_tab_badges" x-index="0" x-page="5">' + badge_compiled + '</table>' +
    #                 '<div class="shop_page_container"><div onclick="Icecream.shop_paginate(-1)" class="filter_prev button"><img src="http://static.icecreamstand.ca/arrow.svg"></div>' +
    #                 '<div onclick="Icecream.shop_paginate(1)" class="filter_next button"><img src="http://static.icecreamstand.ca/arrow_right.svg"></div></div>', 'Bovine Boutique')

    #             shop_page()
    #         error: (err, e) ->
    #             alert('The shop is closed.', 'Come back later!')
    #     }

    # shop_page = ->
    #     $('.shop_table tr:gt(5)').hide()
    #     alert_update()

    shop_item_add = (compiled, i, item) ->
        compiled + '<tr><td><img src="https://s3.amazonaws.com/icecreamstand.com/items/' + i.replace(/\s/g, '') + '.png" class="tooltip inventory_thumb" x-type="item" x-name="' + i + '/' + item.int + '/' + item.str + '/' + item.con + '/' + item.rarity + '" /> ' + i.replace(/_/g, ' - ') +
        '</td><td><div class="shop_button button" x-cost="' + item.cost + '" x-item="' + i + '"><span class="money_icon is_white">' + numberWithCommas(item.cost) + '</span></div></td></tr>'

    shop_badge_add = (compiled, i, item) ->
        console.log(item)
        badge = item.badge
        compiled + '<tr><td><img src="https://s3.amazonaws.com/icecreamstand.com/badges/' + badge + '.png" class="inventory_thumb" x-type="badge" /> ' + i.replace(/_/g, ' - ') +
        '</td><td><div class="shop_button button" x-cost="' + item.cost + '" x-item="' + i + '" x-is-badge="true"><span class="money_icon is_white">' + numberWithCommas(item.cost) + '</span></div></td></tr>'

    shop_skin_add = (compiled, i, item) ->
        console.log('displaying skin: ' + i)
        req = ''
        if item['match-expertise']
            flavour = Icecream.get_flavor( item['match-expertise'] )
            req = 'Requires level 15 expertise with ' + flavour.name

        if item['match-item']
            req = 'Requires the item: ' + item['match-item']

        if item['match-badge']
            req = 'Requires the badge: <img src="' + image_prepend + '/badges/' + item['match-badge'] + '.png" width="25" />'

        if item.note
            req = item.note

        return compiled + '<tr><td class="skin_td"  x-background="' + item.background + '"><img src="https://s3.amazonaws.com/icecreamstand.com/skins/' + i.replace(/\s/g, '').toLowerCase() + '.png" class="tooltip inventory_thumb thumb_wide" x-type="skin" x-name="' + i + '" /></td><td>' + i.replace(/_/g, ' - ') + '<div class="item_req">' + req + '</div>' +
        '</td><td><div class="shop_button button" x-cost="' + item.cost + '" x-item="' + i + '" x-is-skin="true" x-unlocked="' + (cow.skins_unlocked && cow.skins_unlocked.indexOf(i) > -1) + '"><span class="money_icon is_white">' + numberWithCommas(item.cost) + '</span></div></td></tr>'