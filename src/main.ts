import * as core from '@actions/core'
import * as aws from 'aws-sdk'
import { runCommand } from './utils'
import { getConfiguration } from './inputs'
import { synth } from './synth'
import { assets } from './assets'
import { deploy } from './deploy'
import { diff } from './diff'

export type CreateStackInput = aws.CloudFormation.Types.CreateStackInput
export type CreateChangeSetInput = aws.CloudFormation.Types.CreateChangeSetInput
export type InputNoFailOnEmptyChanges = '1' | '0'
export type InputCapabilities =
    | 'CAPABILITY_IAM'
    | 'CAPABILITY_NAMED_IAM'
    | 'CAPABILITY_AUTO_EXPAND'

async function installCdk() {
    try {
        const result = await runCommand('npm install -g aws-cdk')
        core.debug(result)
    } catch (error) {
        core.error(error as string)
    }
}

export async function run(): Promise<void> {
    const config = getConfiguration()

    core.debug(config.synth)

    if (!config.synth && !config.assets && !config.deploy) {
        core.setFailed(
            'You must specify one type of job, either `synth: true` or `deploy: true`'
        )
    }

    await installCdk()

    if (config.synth) {
        await synth(config)
        await diff(config)
    } else if (config.deploy) {
        await assets(config)
        await deploy(config)
    } else if (config.diff) {
        await diff(config)
    }
}

/* istanbul ignore next */
if (require.main === module) {
    run()
}
