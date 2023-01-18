import pLimit from 'p-limit'
import * as path from 'path'
import * as core from '@actions/core'
import * as aws from 'aws-sdk'
import * as fs from 'fs'
import { deployStack, getStackOutputs } from './deploy'
import { isUrl, parseNumber, parseParameters, runCommand } from './utils'
import { getConfiguration } from './inputs'

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

export type Options = {
    // template: string
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

// The custom client configuration for the CloudFormation clients.
const clientConfiguration = {
    customUserAgent: 'aws-cloudformation-github-deploy-for-github-actions'
}

export async function task(
    cfn: aws.CloudFormation,
    options: Options
): Promise<void> {
    console.log(options)
    const { GITHUB_WORKSPACE = __dirname } = process.env
    // Setup CloudFormation Stack
    let templateBody
    let templateUrl

    // if (isUrl(options.template)) {
    //     core.debug(
    //         `${options.stackName}: Using CloudFormation Stack from Amazon S3 Bucket`
    //     )
    //     templateUrl = options.template
    // } else {
    core.debug(`${options.stackName}: Loading CloudFormation Stack template`)
    const template = `cdk.out/${options.stackName}.template.json`
    const templateFilePath = path.isAbsolute(template)
        ? template
        : path.join(GITHUB_WORKSPACE, template)
    templateBody = fs.readFileSync(templateFilePath, 'utf8')
    // }

    // CloudFormation Stack Parameter for the creation or update
    const params: CreateStackInput = {
        StackName: options.stackName,
        ...(options.roleARN !== undefined && { RoleARN: options.roleARN }),
        ...(options.notificationARNs !== undefined && {
            NotificationARNs: options.notificationARNs
        }),
        DisableRollback: true,
        ...(options.timeoutInMinutes !== undefined && {
            TimeoutInMinutes: options.timeoutInMinutes
        }),
        TemplateBody: templateBody,
        TemplateURL: templateUrl,
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

async function installCdk() {
    try {
        const result = await runCommand('npm install -g aws-cdk')
        console.log(result)
    } catch (error) {
        console.error(error)
    }
}

async function buildCdk() {
    try {
        const result = await runCommand('npx cdk synth')
        console.error(result)
    } catch (error) {
        console.error(error)
    }
}

export async function run(): Promise<void> {
    try {
        const cfn = new aws.CloudFormation({ ...clientConfiguration })
        const options = getConfiguration()

        const concurrency = parseNumber(
            core.getInput('concurrency', {
                required: false
            })
        )
        const limit = pLimit(concurrency || 5)

        await installCdk()
        await buildCdk()

        const tasks = options.stackName.map((_: any, i: number) =>
            limit(() =>
                task(cfn, {
                    // template: options.template[i],
                    stackName: options.stackName[i],
                    capabilities: pickOption(options.capabilities, i),
                    roleARN: pickOption(options.roleARN, i),
                    notificationARNs: pickOption(options.notificationARNs, i),
                    disableRollback: pickOption(options.disableRollback, i),
                    timeoutInMinutes: pickOption(options.timeoutInMinutes, i),
                    tags: pickOption(options.tags, i),
                    terminationProtection: pickOption(
                        options.terminationProtection,
                        i
                    ),
                    parameterOverrides: pickOption(
                        options.parameterOverrides,
                        i
                    ),
                    noEmptyChangeSet: pickOption(options.noEmptyChangeSet, i),
                    noExecuteChangeSet: pickOption(
                        options.noExecuteChangeSet,
                        i
                    ),
                    noDeleteFailedChangeSet: pickOption(
                        options.noDeleteFailedChangeSet,
                        i
                    )
                }).catch(err => {
                    core.error(`${options.stackName[i]}: Error`)
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

/* istanbul ignore next */
if (require.main === module) {
    run()
}
