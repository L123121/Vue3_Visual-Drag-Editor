/**
 * 编辑器自定义事件
 */

interface EventFunctions {
  redirect: (url: string) => void
  alert: (msg: string) => void
}

const events: EventFunctions = {
  redirect(url: string): void {
    if (url) {
      window.location.href = url
    }
  },

  alert(msg: string): void {
    if (msg) {
      // eslint-disable-next-line no-alert
      window.alert(msg)
    }
  },
}

/**
 * Vue 2 mixins 兼容层（已废弃，保留向后兼容）
 * @deprecated 请直接使用 events 对象
 */
const mixins = {
  methods: events,
}

interface EventListItem {
  key: string
  label: string
  event: (param: string) => void
  param: string
}

const eventList: EventListItem[] = [
  {
    key: 'redirect',
    label: '跳转事件',
    event: events.redirect,
    param: '',
  },
  {
    key: 'alert',
    label: 'alert 事件',
    event: events.alert,
    param: '',
  },
]

export { mixins, events, eventList }
