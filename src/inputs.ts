import * as core from '@actions/core'
import { parseTags, parseString, parseNumber, parseMultiline } from './utils'

export function getConfiguration(): any {
    const options: any = {}

    options.stacks = parseMultiline(core.getInput('stacks', { required: false }))

    options.synth = !!+core.getInput('synth', { required: false })

    options.deploy = !!+core.getInput('deploy', { required: false })

    options.capabilities = core.getInput('capabilities', { required: false })

    options.parameterOverrides = core.getInput('parameter-overrides', {
        required: false
    })

    options.noEmptyChangeSet = !!+core.getInput('no-fail-on-empty-changeset', {
        required: false
    })

    options.noExecuteChangeSet = !!+core.getInput('no-execute-changeset', {
        required: false
    })

    options.noDeleteFailedChangeSet = !!+core.getInput(
        'no-delete-failed-changeset',
        {
            required: false
        }
    )

    options.disableRollback = !!+core.getInput('disable-rollback', {
        required: false
    })

    options.timeoutInMinutes = parseNumber(
        core.getInput('timeout-in-minutes', {
            required: false
        })
    )

    options.roleARN = parseString(
        core.getInput('role-arn', {
            required: false
        })
    )

    options.tags = parseTags(
        core.getInput('tags', {
            required: false
        })
    )

    options.terminationProtection = !!+core.getInput('termination-protection', {
        required: false
    })

    options.environment = core.getInput('environment', {
        required: true
    })

    options.concurrency = parseNumber(
        core.getInput('concurrency', {
            required: false
        })
    )

    process.env['AWS_REGION'] = core.getInput('aws-region')
    process.env['AWS_ACCESS_KEY_ID'] = core.getInput('aws-access-key-id')
    process.env['AWS_SECRET_ACCESS_KEY'] = core.getInput(
        'aws-secret-access-key'
    )

    return options
}
