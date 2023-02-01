import * as core from '@actions/core'
import { runCommand } from './utils'

export type AssetsConfiguration = {
    /**
     * Stacks where assets should be published from
     */
    stacks: Array<string>
}

export const assets = async (config: AssetsConfiguration) => {
    const AWS_ACCESS_KEY_ID = `AWS_ACCESS_KEY_ID='${process.env['AWS_ACCESS_KEY_ID']}'`
    const AWS_SECRET_ACCESS_KEY = `AWS_SECRET_ACCESS_KEY='${process.env['AWS_SECRET_ACCESS_KEY']}'`
    const AWS_REGION = `AWS_REGION='${process.env['AWS_REGION']}'`

    try {
        config.stacks.map(async (_: any, i: number) => {
            const assetFilePath = `${config.stacks[i]}.assets.json`

            const result = await runCommand(
                `${AWS_ACCESS_KEY_ID} ${AWS_SECRET_ACCESS_KEY} ${AWS_REGION} node node_modules/cdk-assets/bin/cdk-assets publish -p cdk.out/${assetFilePath}`
            )
            core.debug(result)
        })
    } catch (error) {
        core.error(error as string)
    }
}
