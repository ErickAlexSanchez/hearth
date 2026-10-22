import type { LogFields, LogValue, Logger } from '@/ports/logger'

const SENSITIVE_KEY = /secret|token|password|authorization|cookie|body|text|content|message|prompt|reply|signature/i
const DATABASE_URL = /postgres(?:ql)?:\/\//i

export function createJsonLogger(write: (line: string) => void = defaultWrite): Logger {
  const emit = (level: 'info' | 'error', event: string, fields: LogFields): void => {
    const safe: Record<string, LogValue> = {
      time: new Date().toISOString(),
      level,
      event,
    }
    for (const [key, value] of Object.entries(fields)) {
      if (SENSITIVE_KEY.test(key)) continue
      if (typeof value === 'string' && DATABASE_URL.test(value)) continue
      safe[key] = value
    }
    write(`${JSON.stringify(safe)}\n`)
  }
  return {
    info(event, fields) {
      emit('info', event, fields)
    },
    error(event, fields) {
      emit('error', event, fields)
    },
  }
}

function defaultWrite(line: string): void {
  process.stdout.write(line)
}
