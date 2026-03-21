import { EventEmitter } from 'events'
import { AppState } from '../shared/types'
import { ANIM_READY_DISPLAY, ANIM_CANCELLED_DISPLAY } from '../shared/constants'

type Transition = { from: AppState; to: AppState }

const VALID: Record<AppState, AppState[]> = {
  [AppState.IDLE]:       [AppState.LISTENING],
  [AppState.LISTENING]:  [AppState.PROCESSING, AppState.CANCELLED],
  [AppState.PROCESSING]: [AppState.READY, AppState.CANCELLED],
  [AppState.READY]:      [AppState.IDLE],
  [AppState.CANCELLED]:  [AppState.IDLE],
}

export class AppStateMachine extends EventEmitter {
  private current: AppState = AppState.IDLE
  private autoTimer: NodeJS.Timeout | null = null

  get state(): AppState { return this.current }

  // ── Public semantic API ──────────────────────────────────────────────────

  startListening() {
    this.transition(AppState.LISTENING)
  }

  stopListening() {
    this.transition(AppState.PROCESSING)
  }

  cancel() {
    this.transition(AppState.CANCELLED)
    this.scheduleAutoIdle(ANIM_CANCELLED_DISPLAY)
  }

  textReceived(text: string) {
    if (this.transition(AppState.READY)) {
      this.emit('textReady', text)
      this.scheduleAutoIdle(ANIM_READY_DISPLAY)
    }
  }

  timeout() {
    if (this.current === AppState.PROCESSING) {
      this.cancel()
    }
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private transition(to: AppState): boolean {
    if (!VALID[this.current].includes(to)) {
      console.warn(`[fsm] invalid transition ${this.current} → ${to}`)
      return false
    }
    const ev: Transition = { from: this.current, to }
    this.current = to
    this.emit('stateChange', ev)
    console.log(`[fsm] ${ev.from} → ${ev.to}`)
    return true
  }

  private scheduleAutoIdle(ms: number) {
    if (this.autoTimer) clearTimeout(this.autoTimer)
    this.autoTimer = setTimeout(() => {
      this.transition(AppState.IDLE)
      this.autoTimer = null
    }, ms)
  }
}

// Singleton
export const fsm = new AppStateMachine()
