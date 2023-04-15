const fs = require('fs')

const posts = JSON.parse(fs.readFileSync('posts.json', 'utf-8'))

posts.forEach((post, i) => {
  const state = post['cap:geocode'].value[1]['#'].split(' ')[0].substring(0, 2)
  console.log(state)
})
