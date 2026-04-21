import type { ComponentStyle } from '@/types'

/**
 * 命令接口 - 所有命令必须实现
 */
export interface Command {
  /** 执行命令 */
  execute(): void
  /** 撤销命令 */
  undo(): void
  /** 重做命令（默认调用 execute） */
  redo(): void
  /** 命令描述，用于调试和显示 */
  description: string
  /** 命令类型，用于合并判断 */
  type: CommandType
  /** 时间戳，用于操作合并的时间窗口判断 */
  timestamp: number
  /** 是否可合并 */
  mergeable: boolean
  /** 命令执行数据（仅保存增量变更） */
  data: Record<string, unknown>
  /** 是否可在给定时间窗口内与另一个命令合并 */
  canMergeWith(other: Command, mergeTimeWindow: number): boolean
  /** 与另一个命令合并 */
  merge(other: Command): Command
}

/**
 * 命令类型枚举
 */
export enum CommandType {
  // 组件操作
  ADD_COMPONENT = 'ADD_COMPONENT',
  DELETE_COMPONENT = 'DELETE_COMPONENT',
  MOVE_COMPONENT = 'MOVE_COMPONENT',
  RESIZE_COMPONENT = 'RESIZE_COMPONENT',
  ROTATE_COMPONENT = 'ROTATE_COMPONENT',

  // 图层操作
  LAYER_UP = 'LAYER_UP',
  LAYER_DOWN = 'LAYER_DOWN',
  LAYER_TOP = 'LAYER_TOP',
  LAYER_BOTTOM = 'LAYER_BOTTOM',

  // 组合操作
  COMPOSE = 'COMPOSE',
  DECOMPOSE = 'DECOMPOSE',

  // 样式操作
  STYLE_CHANGE = 'STYLE_CHANGE',

  // 批量操作
  BATCH = 'BATCH',
  CLEAR_CANVAS = 'CLEAR_CANVAS',
  IMPORT_DATA = 'IMPORT_DATA',
  RESTORE_VERSION = 'RESTORE_VERSION',

  // 粘贴操作
  PASTE = 'PASTE',

  // 剪切操作
  CUT_COMPONENT = 'CUT_COMPONENT',
}

/**
 * 样式变更数据
 */
export interface StyleChange {
  componentId: string
  key: string
  oldValue: unknown
  newValue: unknown
}

/**
 * 组件位置数据
 */
export interface PositionData {
  componentId: string
  oldStyle: Partial<ComponentStyle>
  newStyle: Partial<ComponentStyle>
}

/**
 * 命令管理器配置
 */
export interface CommandManagerConfig {
  maxStackSize: number
  mergeTimeWindow: number
}
