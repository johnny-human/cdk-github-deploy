# cdk-github-deploy

Deploys AWS cdk stacks in parallel

## Usage

To deploy a single stack:

```yaml
- uses: johnny-human/cdk-github-deploy@v1
  with:
    name: StackA
    template: a.yaml
    parameter-overrides: Param1=a1,Param2=a2
```

To dedploy multiple stacks in parallel:

```yaml
- uses: johnny-human/cdk-github-deploy@v1
  with:
    name: |
      StackA
      StackB
    template: |
      a.yaml
      b.yaml
    parameter-overrides: |
      MyParam1=a1,MyParam2=a2
      MyParam1=b1
```

To dedploy multiple stacks in parallel using the same settings for all stacks:

```yaml
- uses: johnny-human/cdk-github-deploy@v1
  with:
    name: |
      StackA
      StackB
      StackC
    template: |
      a.yaml
      b.yaml
      c.yaml
    disable-rollback: "1" # applies to all three stacks
```

To dedploy multiple stacks in parallel passing in no values for a specific stack using a empty line:

```yaml
- uses: johnny-human/cdk-github-deploy@v1
  with:
    name: |
      StackA
      StackB
      StackC
    template: |
      a.yaml
      b.yaml
      c.yaml
    parameter-overrides: |
      Param1=a1,MyParam2=a2

      Param1=c1
```

The action can be passed a CloudFormation Stack `name` and a `template` file. The `template` file can be a local file existing in the working directory, or a URL to template that exists in an [Amazon S3](https://aws.amazon.com/s3/) bucket. It will create the Stack if it does not exist, or create a [Change Set](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html) to update the Stack.

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## Example

```yaml
name: Deploy

on: [push]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/configure-aws-credentials@v1-node16
        with:
          # ...
          aws-region: us-east-1
      - id: core
        uses: johnny-human/cdk-github-deploy@v1
        with:
          name: StackA
          template: a.yaml
          parameter-overrides: Param1=a1,MyParam2=a2
      - uses: johnny-human/cdk-github-deploy@v1
        with:
          name: |
            StackB
            StackC
          template: |
            b.yaml
            c.yaml
          parameter-overrides: |

            Param1=${{ steps.core.outputs.StackA_output_AlertTopicArn }}
```
