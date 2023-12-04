import jwt from 'jsonwebtoken'
const accessTokenSecret = process.env.APP_SECRET

export function signAccessToken(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign({ payload }, accessTokenSecret, {
    }, (err, token) => {
      if (err) {
        reject("Something went wrong")
      }
      resolve(token)
    })
  })
}

export function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, accessTokenSecret, (err, payload) => {
      if (err) {
        const message = err.name == 'JsonWebTokenError' ? 'Unauthorized' : err.message
        return reject(message)
      }
      resolve(payload)
    })
  })
}

//accesstoken is the token that is uniquely assigned to the user
//later front end will check if the token is valid or not