import * as core from '@actions/core'
import * as aws from 'aws-sdk'
import pLimit from 'p-limit'
import * as fs from 'fs'
import * as path from 'path'
import { parseParameters, pickOption, runCommand } from './utils'
import { deployStack, getStackOutputs } from './deployStack'

export type Configuration = {
    capabilities?: string
    roleARN?: string
    disableRollback?: boolean
    timeoutInMinutes?: number
    tags?: aws.CloudFormation.Tags
    terminationProtection?: boolean
    parameterOverrides?: string
    noEmptyChangeSet?: boolean
    noExecuteChangeSet?: boolean
    noDeleteFailedChangeSet?: boolean
}

export type DeployConfig = {
    stacks: Array<string>
    concurrency?: number
}

export type TaskConfig = {
    stack: string
}

// The custom client configuration for the CloudFormation clients.
const clientConfiguration = {
    customUserAgent: 'aws-cloudformation-github-deploy-for-github-actions'
}

export const deploy = async (config: Configuration & DeployConfig) => {
    const {
        concurrency,
        stacks,
        capabilities,
        roleARN,
        disableRollback,
        timeoutInMinutes,
        tags,
        terminationProtection,
        parameterOverrides,
        noEmptyChangeSet,
        noExecuteChangeSet,
        noDeleteFailedChangeSet
    } = config
    try {
        const cfn = new aws.CloudFormation({ ...clientConfiguration })
        const limit = pLimit(concurrency || 5)

        const tasks = config.stacks.map((_: any, i: number) =>
            limit(() =>
                task(cfn, {
                    stack: stacks[i],
                    capabilities,
                    roleARN,
                    disableRollback,
                    timeoutInMinutes,
                    tags,
                    terminationProtection,
                    parameterOverrides,
                    noEmptyChangeSet,
                    noExecuteChangeSet,
                    noDeleteFailedChangeSet
                }).catch((err: any) => {
                    core.error(`${stacks[i]}: Error`)
                    throw err
                })
            )
        )

        await Promise.all(tasks)
    } catch (err) {
        if (err instanceof Error || typeof err === 'string') {
            core.setFailed(err)
            // @ts-ignore
            core.debug(err.stack)
        }
    }
}

const getTemplateBody = (stack: string) => {
    const { GITHUB_WORKSPACE = __dirname } = process.env

    core.debug(`${stack}: Loading Stack template`)

    const file = `cdk.out/${stack}.template.json`
    const filePath = path.isAbsolute(file)
        ? file
        : path.join(GITHUB_WORKSPACE, file)

    return fs.readFileSync(filePath, 'utf8')
}

const task = async (
    cfn: aws.CloudFormation,
    config: Configuration & TaskConfig
): Promise<void> => {
    // CloudFormation Stack Parameter for the creation or update
    const params: aws.CloudFormation.Types.CreateStackInput = {
        StackName: config.stack,
        TemplateBody: getTemplateBody(config.stack),
        EnableTerminationProtection: config.terminationProtection,
        RoleARN: config.roleARN,
        DisableRollback: config.disableRollback,
        TimeoutInMinutes: config.timeoutInMinutes,
        Tags: config.tags
    }

    if (config.capabilities) {
        params.Capabilities = [
            ...config.capabilities.split(',').map(cap => cap.trim())
        ]
    }

    if (config.parameterOverrides) {
        params.Parameters = parseParameters(config.parameterOverrides.trim())
    }

    const stackId = await deployStack(
        cfn,
        params,
        config.noEmptyChangeSet,
        config.noExecuteChangeSet,
        config.noDeleteFailedChangeSet
    )
    core.setOutput(`${config.stack}-stack-id`, stackId || 'UNKNOWN')

    if (stackId) {
        const outputs = await getStackOutputs(cfn, stackId)
        for (const [logicalId, value] of outputs) {
            core.setOutput(`${config.stack}_output_${logicalId}`, value)
        }
    }
}
