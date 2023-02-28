import pLimit from 'p-limit'
import * as path from 'path'
import * as core from '@actions/core'
import * as aws from 'aws-sdk'
import * as fs from 'fs'
import { deployStack, getStackOutputs } from './deployStack'
import {
    isUrl,
    parseTags,
    parseString,
    parseNumber,
    parseARNs,
    parseParameters,
    getTemplateBody
} from './utils'

export type CreateStackInput = aws.CloudFormation.Types.CreateStackInput
export type CreateChangeSetInput = aws.CloudFormation.Types.CreateChangeSetInput
export type InputNoFailOnEmptyChanges = '1' | '0'
export type InputCapabilities =
    | 'CAPABILITY_IAM'
    | 'CAPABILITY_NAMED_IAM'
    | 'CAPABILITY_AUTO_EXPAND'

export type Inputs = {
    [key: string]: string
}

// The custom client configuration for the CloudFormation clients.
const clientConfiguration = {
    customUserAgent: 'aws-cloudformation-github-deploy-for-github-actions'
}

export async function task(
    cfn: aws.CloudFormation,
    options: {
        stackName: string
        capabilities?: string
        roleARN?: string
        notificationARNs?: string[]
        disableRollback?: boolean
        timeoutInMinutes?: number
        tags?: aws.CloudFormation.Tags
        terminationProtection?: boolean
        parameterOverrides?: string
        noEmptyChangeSet?: boolean
        noExecuteChangeSet?: boolean
        noDeleteFailedChangeSet?: boolean
    }
): Promise<void> {
    const { GITHUB_WORKSPACE = __dirname } = process.env
    // Setup CloudFormation Stack

    // CloudFormation Stack Parameter for the creation or update
    const params: CreateStackInput = {
        StackName: options.stackName,
        ...(options.roleARN !== undefined && { RoleARN: options.roleARN }),
        ...(options.notificationARNs !== undefined && {
            NotificationARNs: options.notificationARNs
        }),
        DisableRollback: options.disableRollback,
        ...(options.timeoutInMinutes !== undefined && {
            TimeoutInMinutes: options.timeoutInMinutes
        }),
        TemplateBody: getTemplateBody(options.stackName),
        ...(options.tags !== undefined && { Tags: options.tags }),
        EnableTerminationProtection: options.terminationProtection
    }

    if (options.capabilities) {
        params.Capabilities = [
            ...options.capabilities.split(',').map(cap => cap.trim())
        ]
    }

    if (options.parameterOverrides) {
        params.Parameters = parseParameters(options.parameterOverrides.trim())
    }

    const stackId = await deployStack(
        cfn,
        params,
        options.noEmptyChangeSet,
        options.noExecuteChangeSet,
        options.noDeleteFailedChangeSet
    )
    core.setOutput(`${options.stackName}_stack-id`, stackId || 'UNKNOWN')

    if (stackId) {
        const outputs = await getStackOutputs(cfn, stackId)
        for (const [logicalId, value] of outputs) {
            core.setOutput(`${options.stackName}_output_${logicalId}`, value)
        }
    }
}

function pickOption<Type>(arr: Type[], i: number): Type | undefined {
    if (arr.length === 0) {
        return undefined
    }
    if (arr.length === 1) {
        return arr[0]
    }
    return arr[i]
}

// we don't use core.getMultilineInput() because it filters out empty lines
function parseMultiline(str: string): string[] {
    if (str === undefined) {
        // some tests pass undefined instead of an empty string as core.getInput() would do
        return ['']
    }
    return str.split('\n')
}

export async function deploy(config: any): Promise<void> {
    try {
        const cfn = new aws.CloudFormation({ ...clientConfiguration })

        const concurrency = parseNumber(
            core.getInput('concurrency', {
                required: false
            })
        )
        const limit = pLimit(concurrency || 5)

        const tasks = config.stacks.map((_: any, i: number) =>
            limit(() =>
                task(cfn, {
                    stackName: config.stacks[i],
                    capabilities: pickOption(config.capabilities, i),
                    roleARN: pickOption(config.roleARN, i),
                    notificationARNs: pickOption(config.notificationARNs, i),
                    disableRollback: pickOption(config.disableRollback, i),
                    timeoutInMinutes: pickOption(config.timeoutInMinutes, i),
                    tags: pickOption(config.tags, i),
                    terminationProtection: pickOption(
                        config.terminationProtection,
                        i
                    ),
                    parameterOverrides: pickOption(
                        config.parameterOverrides,
                        i
                    ),
                    noEmptyChangeSet: pickOption(config.noEmptyChangeSet, i),
                    noExecuteChangeSet: pickOption(
                        config.noExecuteChangeSet,
                        i
                    ),
                    noDeleteFailedChangeSet: pickOption(
                        config.noDeleteFailedChangeSet,
                        i
                    )
                }).catch(err => {
                    core.error(`${config.stacks[i]}: Error`)
                    throw err
                })
            )
        )

        await Promise.all(tasks)
    } catch (err) {
        if (err instanceof Error || typeof err === 'string') {
            core.setFailed(err)
            // @ts-ignore
            console.debug(err.stack)
        }
    }
}
