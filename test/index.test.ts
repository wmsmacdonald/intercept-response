import "mocha";
import { expect } from "chai";
import {
  interceptResponse,
  writeWhatWgResponse,
  incomingMessageToWhatWgRequest,
  //incomingMessageToWhatWgRequest
} from "../src";
import * as http from "http";
import fetch, { Response, Headers } from "node-fetch";

const PORT = 8585;

describe("index", () => {
  describe("interceptResponse", () => {
    let server;
    afterEach(() => {
      server.close();
    });
    it("captures response body", done => {
      server = http.createServer(({}, res) => {
        interceptResponse(res)
          .then(async whatWgResponse => {
            const body = await whatWgResponse.text();
            expect(body).to.equal("someData");
            res.end("");
            done();
          })
          .catch(done);
        res.writeHead(200);
        res.end("someData");
      });

      server.listen(PORT);

      fetch(`http://localhost:${PORT}`);
    });
  });
  describe("writeWhatWgResponse", () => {
    let server;
    beforeEach(() => {
      server = http.createServer(({}, res) => {
        writeWhatWgResponse(res, new Response('response body', {
          status: 200,
          statusText: 'OK',
          headers: new Headers()
        }))
      });
      server.listen(PORT);
    });
    afterEach(() => {
      server.close();
    });
    it("responds to client", async () => {
      const response = await fetch(`http://localhost:${PORT}`);
      expect(response.status).to.equal(200);
      expect(response.statusText).to.equal('OK');
      expect(await response.text()).to.equal('response body');
    });
  });
  describe("incomingMessageToWhatWgRequest", () => {
      let server;
    afterEach(() => {
      server.close();
    });

    it('converts to corresponding WhatWG Request', done => {
      server = http.createServer((req, res) => {
        res.end('');

        const request = incomingMessageToWhatWgRequest(req);
        expect(request.url).to.equal('/')
        expect(request.method).to.equal('GET')
        done();
      });
      server.listen(PORT);
      fetch(`http://localhost:${PORT}`);
    });
  });
});
