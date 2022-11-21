import { BaseCommand, flags } from '@adonisjs/core/build/standalone'

export default class BackupCreate extends BaseCommand {
  public static commandName = 'backup:create'
  public static description = 'Generate application backup'
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
    const appRoot = this.application.cliCwd || this.application.appRoot
    const {default: path} = await import('path')
    const {default: Backup} = await import('../src/Backup')
    const backupConfig = this.application.container.resolveBinding('Adonis/Core/Config').get('backup')
    
    // generate
    const backupGen = new Backup(this.application, backupConfig.paths, backupConfig.models)
    const backup = await backupGen.create()

    // save
    const p = backup.exportPath || backupGen.getBackupsPath()
    const name = (this.name ?? new Date().toISOString()) + '.' + (backupConfig.extName || 'adonisbkp')

    await backup.writeZipPromise(path.join(appRoot, p, name))
    
    this.logger.success(`Backup completed: ${p}/${name}.`, 'BACKUP')
  }
}