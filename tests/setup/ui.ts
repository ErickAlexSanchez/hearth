import '@testing-library/jest-dom'
import { fetch, Headers, Request, Response } from 'undici'

Object.assign(globalThis, { fetch, Headers, Request, Response })
