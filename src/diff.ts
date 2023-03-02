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
    const AWS_ACCESS_KEY_ID = `AWS_ACCESS_KEY_ID='${process.env['AWS_ACCESS_KEY_ID']}'`
    const AWS_SECRET_ACCESS_KEY = `AWS_SECRET_ACCESS_KEY='${process.env['AWS_SECRET_ACCESS_KEY']}'`
    const AWS_REGION = `AWS_REGION='${process.env['AWS_REGION']}'`

    let stackNames: string[] = []
    const stackStatus: any = {}
    const environment = config.environment
        ? `ENVIRONMENT=${config.environment}`
        : ''

    // try {
    //     const listResult = await runCommand(`${environment} npx cdk list`)
    //     stackNames = listResult.trim().split('\n')
    //     console.log(stackNames)
    // } catch (error) {
    //     core.error(error as string)
    // }

    const output = await runCommand(
        `${AWS_ACCESS_KEY_ID} ${AWS_SECRET_ACCESS_KEY} ${AWS_REGION} ${environment} npx cdk diff`
    )

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
}
