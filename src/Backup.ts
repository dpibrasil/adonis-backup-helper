import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { ApplicationContract } from '@ioc:Adonis/Core/Application';

class Backup {

    protected models: string[]
    protected paths: string[]
    protected application: ApplicationContract

    constructor(application: ApplicationContract, paths: string[], models: string[])
    {
        this.application = application
        this.paths = paths
        this.models = models
    }

    getAppRoot()
    {
      return this.application.cliCwd || this.application.appRoot
    }

    async create()
    {
        const zip = new AdmZip()
        const appRoot = this.getAppRoot()

        // make backup from models
        const backupModels: {modelName: string, items: object[]}[] = []
        for (const modelName of this.models) {
          const { default: Model } = await import(path.join(appRoot,'App', 'Models', modelName))
          const items = (await Model.all()).map(m => m.$original)
          this.application.logger.debug(`Creating backup from model ${modelName} (${items.length} rows found)`, 'BACKUP')
          backupModels.push({modelName, items})
        }
        zip.addFile('models.json', Buffer.from(JSON.stringify(backupModels), 'utf-8'))
    
        // make backup from paths
        for (const pathIndex in this.paths) {
          const config = {originalPath: this.paths[pathIndex]}
          this.application.logger.debug(`Creating backup from path "${config.originalPath}"`, 'BACKUP')
          const folderPathInBkp = 'paths/' + pathIndex
          zip.addLocalFolder(this.paths[pathIndex], folderPathInBkp)
        }
        zip.addFile('paths.json', Buffer.from(JSON.stringify(Object.entries(this.paths)), 'utf-8'))

        return zip
    }

    async restore(backupPath: string, clearModels: boolean, clearPaths: boolean, overridePaths = true)
    {
      this.application.logger.info('Initializating backup restore process. Do not stop the application.')
      const zip = new AdmZip(backupPath)

      const models = JSON.parse(zip.readAsText(zip.getEntry('models.json'), 'utf8'))
      const paths = JSON.parse(zip.readAsText(zip.getEntry('paths.json'), 'utf8'))

      // ignore foreign keys
      const Database = await this.application.container.resolveBinding('Adonis/Lucid/Database').transaction({})
      await Database.rawQuery("SET session_replication_role = 'replica';")

      for (const model of models) {
        const { default: Model } = await import(path.join(this.getAppRoot(), 'App', 'Models', model.modelName))

        // delete model items
        if (clearModels) {
          await Database.rawQuery(`DELETE FROM ${Model.table}`)
        }

        // restore models
        this.application.logger.info(`Restoring ${model.items.length} ${model.modelName} Model.`)
        await Model.updateOrCreateMany('id', model.items)
      }

      // ignore foreign keys
      await Database.rawQuery("SET session_replication_role = 'origin';")

      await Database.commit()

      for (const dir of paths) {
        const zipPathName = 'paths/' + dir[0]

        // clear folder
        if (clearPaths) {
          fs.rmSync(dir[1], { force: true, recursive: true })
        }

        const entries = zip.getEntries().filter(e => e.entryName.includes(zipPathName))
        this.application.logger.info(`Restoring path ${dir[0]}: ${dir[1]}. ${entries.length} items found.`)
        
        // restore files
        for (const entry of entries) {
          const newPath = entry.entryName.replace(zipPathName, dir[1])
          if (overridePaths) fs.rmSync(newPath, { force: true, recursive: true })
          zip.extractEntryTo(entry, newPath.replace(path.basename(entry.entryName), ''), overridePaths)
        }
      }
    }

    getBackupsPath()
    {
      return this.application.resolveNamespaceDirectory('backups') || 'App/Backups'
    }
}

export default Backup;