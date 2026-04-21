/**
 * 事件总线 - 简单的发布订阅模式实现
 * Vue 3 移除了 $on $off $emit，使用此类替代
 */

type EventCallback = (...args: unknown[]) => void

class EventBus {
  private events: Record<string, EventCallback[]> = {}

  /**
   * 订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  /**
   * 取消订阅事件
   * @param event 事件名称
   * @param callback 回调函数（可选，不传则清空该事件所有监听器）
   */
  off(event: string, callback?: EventCallback): void {
    if (!this.events[event]) return

    if (!callback) {
      this.events[event] = []
    } else {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param args 传递给回调的参数
   */
  emit(event: string, ...args: unknown[]): void {
    if (!this.events[event]) return
    this.events[event].forEach(cb => cb(...args))
  }

  /**
   * 一次性订阅事件（触发后自动取消）
   * @param event 事件名称
   * @param callback 回调函数
   */
  once(event: string, callback: EventCallback): void {
    const wrapper: EventCallback = (...args) => {
      this.off(event, wrapper)
      callback(...args)
    }
    this.on(event, wrapper)
  }
}

export default new EventBus()
