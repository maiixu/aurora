import { EventEmitter } from 'events'
import { transcribeWithEc2Whisper } from './transcribe-ec2'

export function transcribe(wavBuffer: Buffer): EventEmitter {
  return transcribeWithEc2Whisper(wavBuffer)
}
