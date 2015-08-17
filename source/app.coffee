image_prepend = 'http://static.icecreamstand.ca'
cones = [
  { name: 'baby', cost: '1000' }
  { name: 'waffle',   cost: '100000' }
  { name: 'chocolate',    cost: '50000000' }
  { name: 'whitechocolate',   cost: '1000000000' }
  { name: 'sugar',    cost: '5000000000' }
  { name: 'sprinkle', cost: '20000000000' }
  { name: 'mintycat', cost: '200000000000' }
  { name: 'doublechocolate',  cost: '500000000000' }
]
workers = [
  { name: 'cart', cost: '0' }
  { name: 'employee', cost: '0' }
  { name: 'truck',    cost: '0' }
  { name: 'robot',    cost: '0' }
  { name: 'rocket',   cost: '0' }
  { name: 'alien',    cost: '0' }
]
flavors = []
socket = null

ics = angular.module('ics', [])

angular.module('ics')
  .controller('highscores', ($scope) ->
  )
  .controller('quests', ($scope) ->
  )
  .controller('events', ($scope) ->
  )
  .controller('trends', ($scope) ->
  )
  .config ($sceDelegateProvider) ->
    $sceDelegateProvider.resourceUrlWhitelist [
      'self'
      'http://static.icecreamstand.ca/**'
      'https://s3.amazonaws.com/icecreamstand.com/**'
    ]

  .filter 'img_sanitize', ->
    (input) ->
      input.replace /\W+/g, ''

  .filter 'number_commas', ->
    (input) ->
      if !input || typeof input is 'undefined' then return '0'
      input.toString().replace /\B(?=(\d{3})+(?!\d))/g, ","

  .filter 'item_image', ->
    (input) ->
      if !input || typeof input is 'undefined' then return '?'
      input.toString().replace(/\s/g, "")

  .filter 'item_name', ->
    (input) ->
      if !input || typeof input is 'undefined' then return '?'
      input.toString().replace(/_/g, " ").split(' ').reverse().join(' ')

  .filter 'startFrom', ->
    (input, start) ->
      start = +start #This forces it into an int
      input.slice start