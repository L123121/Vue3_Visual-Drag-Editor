// Vue 3 移除了 $on $off $emit，使用简单的发布订阅模式替代
class EventBus {
    constructor() {
        this.events = {}
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = []
        }
        this.events[event].push(callback)
    }

    off(event, callback) {
        if (!this.events[event]) return
        if (!callback) {
            this.events[event] = []
        } else {
            this.events[event] = this.events[event].filter(cb => cb !== callback)
        }
    }

    emit(event, ...args) {
        if (!this.events[event]) return
        this.events[event].forEach(cb => cb(...args))
    }
}

export default new EventBus()
