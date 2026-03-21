import { transcribeWithEc2Whisper } from './transcribe-ec2'

export async function transcribe(wavBuffer: Buffer): Promise<string> {
  return transcribeWithEc2Whisper(wavBuffer)
}
