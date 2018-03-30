import { Response, Headers } from "node-fetch";
import { ServerResponse, OutgoingHttpHeaders } from "http";

function createWhatWgHeaders(headers: Map<string, Array<string>>): Headers {
  const whatWgHeaders = new Headers();
  Object.entries(headers).forEach(([name, values]) => {
    values.forEach(value => {
      whatWgHeaders.append(name, value);
    })
  });
  return whatWgHeaders;
}

export async function interceptResponse(serverResponse: ServerResponse): Promise<Response> {
  return new Promise<Response>(resolve => {
    const buffers: Array<Buffer> = [];
    const headers: Map<string, Array<string>> = new Map();
    let status: number;
    let statusText: string;

    const write = serverResponse.write.bind(serverResponse);
    const end = serverResponse.end.bind(serverResponse);
    const setHeader = serverResponse.setHeader.bind(serverResponse);
    const removeHeader = serverResponse.removeHeader.bind(serverResponse);
    const writeHead = serverResponse.writeHead.bind(serverResponse);

    function captureWrite(
      chunk: Buffer | string,
      arg2: string | (() => void) = () => {},
      arg3: (() => void) = () => {}
    ): Boolean {
      if (typeof chunk === "string") {
        buffers.push(Buffer.from(chunk, arg2 as string));
        arg3();
      } else {
        buffers.push(chunk);
        (arg2 as () => void)();
      }
      return true;
    }

    function captureEnd(
      data?: string | Buffer,
      arg2: string | (() => void) = () => {},
      arg3: (() => void) = () => {}
    ) {
      if (typeof data === "string" || data instanceof Buffer) {
        captureWrite(data, arg2, arg3);
      }

      const finalBuffer = Buffer.concat(buffers);

      // restore write and end methods so actual response can be written
      serverResponse.write = write.bind(serverResponse);
      serverResponse.end = end.bind(serverResponse);
      serverResponse.setHeader = setHeader.bind(serverResponse);
      serverResponse.removeHeader = removeHeader.bind(serverResponse);
      serverResponse.writeHead = writeHead.bind(serverResponse);

      resolve(new Response(finalBuffer, {
        status,
        statusText,
        headers: createWhatWgHeaders(headers)
      }));
    }

    function captureSetHeader(name: string, value: string | [string]) {
      headers.set(name, Array.isArray(value) ? value : [value]);
    }

    function captureRemoveHeader(name: string) {
      headers.delete(name);
    }

    function captureWriteHead(statusCode: number, arg2?: string | OutgoingHttpHeaders, arg3?: OutgoingHttpHeaders) {
      const headerValueIntoArray = value => Array.isArray(value) ? value : [(typeof value === 'number' ? value.toString() : value)];
      const addHeaders = (httpHeaders: OutgoingHttpHeaders) => {
        if (httpHeaders) {
          Object.entries(httpHeaders).filter(([value]) => value === undefined).forEach(([name, value]) => {
            if (headers.has(name)) {
              if (Array.isArray(value)) {

              }
              headers.get(name).unshift(...headerValueIntoArray(value));
            }
            else {
              headers.set(name, headerValueIntoArray(value));
            }
          });
        }
      }
      status = statusCode;
      if (typeof arg2 === 'string') {
        statusText = arg2 as string;
        addHeaders(arg3);
      }
      else {
        addHeaders(arg2);
      }
    }

    serverResponse.write = captureWrite.bind(serverResponse);
    serverResponse.end = captureEnd.bind(serverResponse);
    serverResponse.setHeader = captureSetHeader.bind(serverResponse);
    serverResponse.removeHeader = captureRemoveHeader.bind(serverResponse);
    serverResponse.writeHead = captureWriteHead.bind(serverResponse);
  });
}
export default interceptResponse;
