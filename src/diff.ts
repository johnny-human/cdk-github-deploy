import * as core from '@actions/core'
import { runCommand } from './utils'

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

    try {
        // Run cdk diff and get the list of stacks with changes
        const result = await runCommand(
            `${environment} npx cdk diff --app "${config.app}" | grep 'Resources' | awk '{print $2}'`
        )

        console.log(result)
    } catch (error) {
        core.error(error as string)
    }
}
