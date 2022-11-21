import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import * as sinkStatic from '@adonisjs/sink'
import { join } from 'path'

function makeConfig(projectRoot: string, app: ApplicationContract, sink: typeof sinkStatic)
{
    const configDir = app.directoriesMap.get('config') || 'config'
    const configPath = join(configDir, 'backup.ts')
    const template = new sink.files.MustacheFile(projectRoot, configPath, join(__dirname, 'templates', 'backup.txt'))

    if (template.exists())
    {
        sink.logger.action('create').skipped(`${configPath} already exists.`)
    } else {
        template.apply().commit()
        sink.logger.action('create').succeeded(configPath)
    }
}

export default async function instructions(projectRoot: string, app: ApplicationContract, sink: typeof sinkStatic)
{
    makeConfig(projectRoot, app, sink)
}