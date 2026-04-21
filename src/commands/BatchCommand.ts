import { BaseCommand } from './BaseCommand'
import { CommandType, type Command } from './types'

/**
 * 批量命令 - 用于将多个命令组合成一个原子操作
 */
export class BatchCommand extends BaseCommand {
  type = CommandType.BATCH
  mergeable = false

  private commands: Command[] = []

  constructor(description: string = '批量操作') {
    super()
    this.description = description
  }

  addCommand(command: Command): void {
    this.commands.push(command)
  }

  execute(): void {
    this.commands.forEach(cmd => cmd.execute())
  }

  undo(): void {
    // 反向撤销
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo()
    }
  }
}
