angular.module('ics')
.filter 'chat_sanitize', ($sce) ->
  (input) ->
    input = String(input)
    .replace /[\u00A0-\u9999<>\&]/gim, (i) ->
      "&##{i.charCodeAt(0)};"
    .replace /(https?:\/\/[^\s]*)/g, (href) ->
      href_end = href.substring href.length - 4
      output = "<a href='#{href}' target='_blank'>#{href}</a>"
      if href_end is '.png' or href_end is '.jpg' or href_end is '.jpeg' or href_end is '.gif' then output = output + "<div class='img_inline' x-href='#{href}'>view</div>"
      output
    .replace /(^| )@([^\W]*)/g, ' <div class="user_card" x-user="$2">@$2</div>'
    .replace /:party:/g, '<img src="' + image_prepend + '/party.png" class="party_icon" />'
    .replace /:easter:/g, '<img src="' + image_prepend + '/easter/chocbunny.png" class="party_icon" />'

    $sce.trustAsHtml input