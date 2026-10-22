export interface CoachResponder {
  reply(input: { userText: string }): AsyncIterable<string>
}
