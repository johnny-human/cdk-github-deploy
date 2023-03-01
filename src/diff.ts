import * as core from '@actions/core'
import { runCommand } from './utils'
import { bootstrapCdkToolkit } from './cdk-reverse-engineered'
import * as cfnDiff from '@aws-cdk/cloudformation-diff'

export type StackRawDiff = {
    stackName: string
    rawDiff: cfnDiff.TemplateDiff
    logicalToPathMap: Record<string, string>
}

export const getRawDiff = async (): Promise<StackRawDiff[]> => {
    const cdkToolkit = await bootstrapCdkToolkit()
    return cdkToolkit.getDiffObject({
        stackNames: []
    })
}

export type DiffConfiguration = {
    /**
     * REQUIRED WHEN RUNNING APP: command-line for executing
     * your app or a cloud assembly directory (e.g. "node
     * bin/my-app.js"). Can also be specified in cdk.json or
     * ~/.cdk.json
     */
    app: string
    /**
     * Define an environment that the CDK Stacks will use
     * Will set the `ENVIRONMENT` so it will be available in typescript cdk by `process.env.ENVIRONMENT`
     */
    environment?: string
}

export const diff = async (config: DiffConfiguration) => {
    const environment = config.environment
        ? `ENVIRONMENT=${config.environment}`
        : ''

    // const rawDiffs = await getRawDiff()
    // for (const rawDiff of rawDiffs) {
    //     if (rawDiff.rawDiff.isEmpty) {
    //         return {
    //             stackName: rawDiff.stackName,
    //             raw: 'There were no differences',
    //             diff: []
    //         }
    //     }
    // }

    try {
        // Run cdk diff and get the list of stacks with changes
        const result = await runCommand(
            `${environment} npx cdk diff --app "${config.app}" --json > diff.json`
        )

        console.log(result)
    } catch (error) {
        core.error(error as string)
    }
}
