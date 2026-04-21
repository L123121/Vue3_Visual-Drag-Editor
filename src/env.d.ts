/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

// Element Plus 全局类型
declare module 'element-plus'

// ace-builds 类型声明
declare module 'ace-builds' {
  export function edit(el: string | HTMLElement): Ace.Editor
  export namespace Ace {
    interface Editor {
      setValue(value: string): void
      getValue(): string
      setTheme(theme: string): void
      setSession(session: EditSession): void
      getSession(): EditSession
      on(event: string, callback: () => void): void
      destroy(): void
    }
    interface EditSession {
      setMode(mode: string): void
      getValue(): string
      on(event: string, callback: () => void): void
    }
  }
}

// 扩展 Window 接口
interface Window {
  ace: unknown
}
