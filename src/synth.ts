import * as core from '@actions/core'
import { runCommand } from './utils'

export type SynthConfiguration = {
    /**
     * Name or path of a node package that extend the CDK features
     * -p, --plugin
     */
    plugin?: Array<string>
    /**
     * Do not construct stacks with warnings
     * --strict
     */
    strict?: boolean
    /**
     * ARN of Role to use when invoking CloudFormation
     * -r, --role-arn
     */
    roleArn?: string
    /**
     * Define an environment that the CDK Stacks will use
     * Will set the `ENVIRONMENT` so it will be available in typescript cdk by `process.env.ENVIRONMENT`
     */
    environment?: string
}

export const synth = async (config: SynthConfiguration) => {
    const AWS_ACCESS_KEY_ID = `AWS_ACCESS_KEY_ID='${process.env['AWS_ACCESS_KEY_ID']}'`
    const AWS_SECRET_ACCESS_KEY = `AWS_SECRET_ACCESS_KEY='${process.env['AWS_SECRET_ACCESS_KEY']}'`
    const AWS_REGION = `AWS_REGION='${process.env['AWS_REGION']}'`

    const stackStatus: any = {}

    const environment = config.environment
        ? `ENVIRONMENT=${config.environment}`
        : ''

    const plugin =
        config.plugin && config.plugin.length > 0
            ? config.plugin.map((p: string) => `-p ${p}`).join(' ')
            : ''

    const roleArn = config.roleArn ? `-r ${config.roleArn}` : ''

    const strict = config.strict ? '--strict' : ''

    try {
        const result = await runCommand(
            `${AWS_ACCESS_KEY_ID} ${AWS_SECRET_ACCESS_KEY} ${AWS_REGION} ${environment} npx cdk diff -o cdk.out ${plugin} ${roleArn} ${strict} --no-color`
        )
        core.debug(result)

        const lines = result.split('\n')

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
