# intercept-response
Collects writes to Node.js http.ServerResponse and resolves to node-fetch Response

### interceptResponse(res)
* res: [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) - Node.js request object that you want to intercept
(response does not get sent)
* returns Promise\<[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)\> - resolves to [node-fetch](https://github.com/bitinn/node-fetch) `Response` that corresponds to the written response


```javascript
const { interceptResponse } = require('intercept-response');

const http = require('http');

http.createSever((req, res) => {
  interceptResponse(res)
    .then(fetchResponse => fetchResponse.text())
    .then(text => assert(text === 'response body'));
    
  res.writeHead(200);  
  res.end('response body');
});
```
