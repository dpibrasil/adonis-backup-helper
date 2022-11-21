import {ApplicationContract} from '@ioc:Adonis/Core/Application'

export default class BackupProvider {
    public static needsApplication = true

    constructor(protected app: ApplicationContract) {}

    public register() {
        this.app.container.singleton('DPI/Backup', (data) => {
            console.log(data)
        })
    }
}