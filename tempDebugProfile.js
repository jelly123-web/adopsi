const http = require('http')

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body ? Buffer.byteLength(body) : 0,
      },
    }

    const req = http.request(options, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString()
        resolve({ statusCode: res.statusCode, body: text })
      })
    })

    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

;(async () => {
  try {
    const get = await request('GET', '/api/superadmin/profile')
    console.log('GET', get.statusCode)
    console.log(get.body)

    const put = await request('PUT', '/api/superadmin/profile', {
      admin_name: 'Super Admin',
      admin_email: 'superadmin@gmail.com',
      admin_avatar: '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    console.log('PUT', put.statusCode)
    console.log(put.body)
  } catch (err) {
    console.error('ERR', err.message)
    console.error(err)
  }
})()
