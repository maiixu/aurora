import { EventEmitter } from 'events'
import { readConfig } from './aurora-config'
import { transcribeWithEc2Whisper } from './transcribe-ec2'
import { transcribeWithOpenAI } from './transcribe-openai'

export function transcribe(wavBuffer: Buffer): EventEmitter {
  const cfg = readConfig()
  if (cfg.backend === 'openai') {
    const key = cfg.openaiApiKey ?? ''
    if (!key) {
      const emitter = new EventEmitter()
      setImmediate(() => emitter.emit('error', new Error('OpenAI API key not set — configure it in ~/.aurora/config.json')))
      return emitter
    }
    return transcribeWithOpenAI(wavBuffer, key)
  }
  return transcribeWithEc2Whisper(wavBuffer)
}
