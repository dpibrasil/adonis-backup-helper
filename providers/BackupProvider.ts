import {ApplicationContract} from '@ioc:Adonis/Core/Application'

export default class BackupProvider {
    public static needsApplication = true

    constructor(protected app: ApplicationContract) {}

    public register() {
        this.app.container.singleton('DPI/Backup', () => {
            // register backup
            this.app.container.singleton('Adonis/DPI/Backup', async () => {
                const backupConfig = this.app.container.resolveBinding('Adonis/Core/Config').get('backup')
                const {default: Backup} = await import('../src/Backup')
                return new Backup(this.app, backupConfig.paths, backupConfig.models)
            })
        })
    }
}