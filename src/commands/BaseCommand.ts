import { CommandType, type Command } from './types'

/**
 * 命令基类 - 提供默认实现
 */
export abstract class BaseCommand implements Command {
  description = ''
  type: CommandType = CommandType.BATCH
  abstract execute(): void
  abstract undo(): void

  timestamp: number = Date.now()
  mergeable: boolean = false
  data: Record<string, unknown> = {}

  redo(): void {
    this.execute()
  }

  /**
   * 检查是否可以与另一个命令合并
   */
  canMergeWith(_other: Command, _mergeTimeWindow: number): boolean {
    return false
  }

  /**
   * 与另一个命令合并
   */
  merge(_other: Command): Command {
    return this
  }
}
