import { ModelObject } from "@ioc:Adonis/Lucid/Orm"

export type BackupConfig = {
    models: ModelObject[],
    paths: string[],
    encrypt: boolean,
    encryptKey: string
}