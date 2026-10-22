import { ReadableStream, TransformStream, WritableStream } from 'node:stream/web'
import { TextDecoder, TextEncoder } from 'node:util'
import { MessagePort } from 'node:worker_threads'

// MessagePort lets undici load under jsdom. MessageChannel is left unset so
// React's scheduler keeps its setTimeout fallback; a Node MessageChannel
// would stay open and stop Jest from exiting.
Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
  ReadableStream,
  TransformStream,
  WritableStream,
  MessagePort,
})
