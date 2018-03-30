import 'mocha';
import { expect } from 'chai';
import interceptResponse from '../src';
import * as http from 'http';
import fetch from 'node-fetch';

const PORT = 8585;

describe('index', () => {
  describe('interceptResponse', () => {
    let server;
    afterEach(() => {
      server.close();
    });
    it('captures response body', function(done) {
      server = http.createServer(({}, res) => {
        interceptResponse(res).then(async whatWgResponse => {
          const body = await whatWgResponse.text();
          expect(body).to.equal('someData');
          res.end('');
          done();
        }).catch(done);
        res.writeHead(200);
        res.end('someData');
      });

      server.listen(PORT);

      fetch(`http://localhost:${PORT}`);
    });
  });
});