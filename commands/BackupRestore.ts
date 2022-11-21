import { BaseCommand, flags } from '@adonisjs/core/build/standalone'

export default class BackupRestore extends BaseCommand {
  public static commandName = 'backup:restore'
  public static description = 'Restore backup'
  public static settings = {
    loadApp: true,
  }

  @flags.string({
    name: 'name',
    alias: 'n',
    description: 'Defines the name from backup',
  })
  public name: string
  /**
   * Execute command
   */
  public async run(): Promise<void> {
    const {default: fs} = await import('fs')
    const {default: path} = await import('path')
    const {default: Backup} = await import('../src/Backup')

    const backupGen = new Backup(this.application, [], [])
    const backupConfig = this.application.container.resolveBinding('Adonis/Core/Config').get('backup')
    const p = backupConfig.exportPath || backupGen.getBackupsPath()
    const backups: string[] = fs.readdirSync(p)
    const backupName = await this.prompt.choice('Select backup to restore', backups.map(name => ({name})))

    const clearModels = await this.prompt.confirm('Delete models from database before restoring?')
    const clearPaths = await this.prompt.confirm('Clear paths before restore paths?')
    const overridePaths = await this.prompt.confirm('Override files if already exists?')

    await backupGen.restore(path.join(p, backupName), clearModels, clearPaths, overridePaths)
  }
}