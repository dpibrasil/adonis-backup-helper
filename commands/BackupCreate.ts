import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import Logger from '@ioc:Adonis/Core/Logger'
import {v4 as uuid} from 'uuid'
import AdmZip from 'adm-zip'
import path from 'path'

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
    const backupConfig = this.application.container.resolveBinding('Adonis/Core/Config').get('backup.backupConfig')
    const zip = new AdmZip()

    // make backup from models
    const backupModels: any = []
    for (const modelName of backupConfig.models) {
      Logger.debug('[BACKUP] Gerando backup do modelo: ' + modelName)
      const { default: Model } = await import('App/Models/' + modelName)
      const items = (await Model.all()).map(m => m.toJSON())
      backupModels.push({modelName, items})
    }
    zip.addFile('models.json', Buffer.from(JSON.stringify(backupModels), 'utf-8'))

    // make backup from paths
    for (const pathIndex in backupConfig.paths) {
      const config = {originalPath: backupConfig.paths[pathIndex]}
      Logger.debug('[BACKUP] Gerando backup do caminho: ' + config.originalPath)
      const folderPathInBkp = 'paths/' + pathIndex
      zip.addLocalFolder(backupConfig.paths[pathIndex], folderPathInBkp)
      zip.addFile(folderPathInBkp + path.sep + 'config.json', Buffer.from(JSON.stringify(config), 'utf-8'))
    }

    // save
    const p = this.application.resolveNamespaceDirectory('backups')
    const name = (this.name ?? uuid()) + '.adonisbkp'

    this.generator
      .addFile(name, { pattern: 'pascalcase', form: 'singular' })
      .stub(zip.toBuffer().toString())
      .destinationDir(p || 'app/Backups')
      .useMustache()
      .appRoot(this.application.cliCwd || this.application.appRoot)
  }
}