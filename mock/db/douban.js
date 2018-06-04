const Mock = require('mockjs')
// const Random = Mock.Random;

const data = Mock.mock({
  'sliders|3-5': [{
    'id|+1': 1,
    'img': '@image(350x100, @color)',
    'url': '#'
  }],
  'products|6': [{
    'id|+1': 1,
    'src': '@image(500x500, @color)',
    'url': 'detail/',
    'title|8-20': '@cword',
    'newPrice': '￥@integer(100, 5000)',
    'oldPrice': '￥@integer(100, 5000)'
  }],
  'shops|10-20': [{
    'id|+1': 1,
    'icon': '@image(300x300, @color)',
    'name': '@cname',
    'introduction': '@ctitle',
    'products|2': [{
      'id|+1': 1,
      'src': '@image(500x500, @color)',
      'url': 'detail/',
      'title|8-20': '@cword',
      'newPrice': '￥@integer(100, 5000)',
      'oldPrice': '￥@integer(100, 5000)'
    }],
    'url': '#'
  }]
})

module.exports = data
