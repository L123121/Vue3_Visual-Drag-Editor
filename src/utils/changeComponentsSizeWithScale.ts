import { deepCopy } from '@/utils/utils'
import { useStore } from '@/store'
import { divide, multiply } from 'mathjs'
import type { ComponentData } from '@/types'

/**
 * 需要根据缩放比例调整的属性
 */
const needToChangeAttrs: (keyof ComponentData['style'])[] = [
  'top',
  'left',
  'width',
  'height',
  'fontSize',
  'padding',
]

/**
 * 根据比例缩放组件尺寸
 * @param scale 目标缩放比例
 * @param snapshotData 快照数据（可选）
 */
export default function changeComponentsSizeWithScale(
  scale: number,
  snapshotData: ComponentData[] | null = null
): ComponentData[] | void {
  const store = useStore()
  const componentData = snapshotData || deepCopy(store.componentData)

  componentData.forEach(component => {
    Object.keys(component.style).forEach(key => {
      const styleKey = key as keyof ComponentData['style']
      if (needToChangeAttrs.includes(styleKey)) {
        let newKey: number

        if (snapshotData) {
          // 根据比例计算新的属性值
          const lastScale = (snapshotData[0] as ComponentData & { lastScale?: number }).lastScale
          newKey = ((component.style[styleKey] as number) / (lastScale || 100)) * scale
        } else {
          // 否则根据当前画布的比例计算新的属性值
          newKey =
            ((component.style[styleKey] as number) / store.canvasStyleData.scale) * scale
        }

        newKey = Number(newKey.toFixed(4))

        if (styleKey === 'top' || styleKey === 'left') {
          component.style[styleKey] = newKey
        } else {
          component.style[styleKey] = newKey === 0 ? 1 : newKey
        }
      }
    })
  })

  if (snapshotData) {
    return componentData
  }

  store.setComponentData(componentData)

  // 更新后的组件数据
  if (store.curComponentIndex !== null) {
    store.setCurComponent({
      component: componentData[store.curComponentIndex],
      index: store.curComponentIndex,
    })
  }

  // 更新画布的比例
  store.setCanvasStyle({
    ...store.canvasStyleData,
    scale,
  })
}

/**
 * 需要根据缩放比例调整的属性（不包含位置）
 */
const needToChangeAttrs2: (keyof ComponentData['style'])[] = [
  'width',
  'height',
  'fontSize',
  'padding',
]

/**
 * 根据缩放比例调整单个组件尺寸
 * @param component 组件数据
 */
export function changeComponentSizeWithScale(component: ComponentData): void {
  const store = useStore()

  Object.keys(component.style).forEach(key => {
    const styleKey = key as keyof ComponentData['style']
    if (needToChangeAttrs2.includes(styleKey)) {
      if (styleKey === 'fontSize' && component.style[styleKey] === '') return

      component.style[styleKey] = format(
        component.style[styleKey] as number,
        store.canvasStyleData.scale
      )
    }
  })
}

/**
 * 格式化缩放值
 * @param value 原始值
 * @param scale 缩放比例
 * @returns 缩放后的值
 */
function format(value: number, scale: number): number {
  return multiply(value, divide(parseFloat(String(scale)), 100)) as number
}
