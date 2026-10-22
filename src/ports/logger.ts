export type LogValue = string | number | boolean | null

export type LogFields = Record<string, LogValue>

export interface Logger {
  info(event: string, fields: LogFields): void
  error(event: string, fields: LogFields): void
}
