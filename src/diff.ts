import * as core from '@actions/core'
import { runCommand } from './utils'

export type DiffConfiguration = {
    /**
     * REQUIRED WHEN RUNNING APP: command-line for executing
     * your app or a cloud assembly directory (e.g. "node
     * bin/my-app.js"). Can also be specified in cdk.json or
     * ~/.cdk.json
     */
    app?: string
    /**
     * Define an environment that the CDK Stacks will use
     * Will set the `ENVIRONMENT` so it will be available in typescript cdk by `process.env.ENVIRONMENT`
     */
    environment?: string
}

export const diff = async (config: DiffConfiguration) => {
    let stackNames: string[] = []
    const stackStatus: any = {}
    const environment = config.environment
        ? `ENVIRONMENT=${config.environment}`
        : ''

    try {
        const listResult = await runCommand(`${environment} npx cdk list`)
        stackNames = listResult.trim().split('\n')
        console.log(stackNames)
    } catch (error) {
        core.error(error as string)
    }

    try {
        const output = await runCommand(`${environment} npx cdk diff`)

        const lines = output.split('\n')

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (line.startsWith('Stack ')) {
                const name = line.split(' ')[1]

                i += 1 // Skip the next lines

                if (lines[i].includes('There were no differences')) {
                    stackStatus[name] = false // No changes
                } else {
                    stackStatus[name] = true // Changes
                }
            }
        }

        console.log(stackStatus)
    } catch (error) {
        core.error(error as string)
    }
}
