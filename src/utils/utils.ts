import type { ComponentStyle } from '@/types'

/**
 * 深拷贝函数
 * 使用 structuredClone 替代原有实现，支持 Date、RegExp、Map、Set 等特殊对象
 */
export function deepCopy<T>(target: T): T {
  if (target === null || typeof target !== 'object') {
    return target
  }

  // 使用 structuredClone 处理 Date、RegExp、Map、Set 等
  try {
    return structuredClone(target)
  } catch {
    // fallback for non-cloneable objects (如函数、DOM节点等)
    if (Array.isArray(target)) {
      return target.map(item => deepCopy(item)) as T
    }

    const result = {} as T
    for (const key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        result[key] = deepCopy(target[key])
      }
    }
    return result
  }
}

/**
 * 交换数组元素
 * @param arr 目标数组
 * @param i 第一个索引
 * @param j 第二个索引
 */
export function swap<T>(arr: T[], i: number, j: number): void {
  const temp = arr[i]
  arr[i] = arr[j]
  arr[j] = temp
}

/**
 * DOM 选择器
 * @param selector CSS 选择器
 * @returns 匹配的元素或 null
 */
export function $<T extends Element = Element>(selector: string): T | null {
  return document.querySelector<T>(selector)
}

/**
 * 不阻止拖放的组件列表
 */
const components = ['VText', 'RectShape', 'CircleShape'] as const

/**
 * 判断组件是否阻止拖放
 * @param component 组件名称
 * @returns 是否阻止拖放
 */
export function isPreventDrop(component: string): boolean {
  return !components.includes(component as typeof components[number]) && !component.startsWith('SVG')
}
