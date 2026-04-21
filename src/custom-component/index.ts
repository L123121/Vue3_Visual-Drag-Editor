import { defineAsyncComponent, type App } from 'vue'

/**
 * 普通组件列表
 */
const components = [
  'CircleShape',
  'Picture',
  'VText',
  'VButton',
  'Group',
  'RectShape',
  'LineShape',
  'VTable',
  'VChart',
] as const

/**
 * SVG 组件列表
 */
const svgs = ['SVGStar', 'SVGTriangle'] as const

type ComponentName = (typeof components)[number]
type SvgName = (typeof svgs)[number]

/**
 * 安装自定义组件
 * @param app Vue 应用实例
 */
export default function install(app: App): void {
  // 注册普通组件
  components.forEach((key: ComponentName) => {
    app.component(
      key,
      defineAsyncComponent(() => import(`@/custom-component/${key}/Component.vue`))
    )
    app.component(
      `${key}Attr`,
      defineAsyncComponent(() => import(`@/custom-component/${key}/Attr.vue`))
    )
  })

  // 注册 SVG 组件
  svgs.forEach((key: SvgName) => {
    app.component(
      key,
      defineAsyncComponent(() => import(`@/custom-component/svgs/${key}/Component.vue`))
    )
    app.component(
      `${key}Attr`,
      defineAsyncComponent(() => import(`@/custom-component/svgs/${key}/Attr.vue`))
    )
  })
}
