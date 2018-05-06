const pathToRegexp = require('path-to-regexp')

{
  let keys = []
  let re = pathToRegexp('/foo/:bar', keys)
  // console.log(keys)
  // console.log(re)
}

{
  let keys = []
  let re = pathToRegexp('/foo/*', keys)
  console.log(re)
  console.log(re.test('/foo'))
  console.log(re.test('/foo/'))
  console.log(re.test('/foo/a'))
}