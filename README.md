# cdk-github-deploy

Deploys AWS cdk stacks in parallel. This is forked from https://github.com/widdix/aws-cloudformation-github-deploy. This github action is trying to make it easier and faster to deploy cdk stacks.

This will run `cdk synth` to generate templates to `cdk.out`, then deploy the templates in parallel, based on `aws-cloudformation-github-deploy`.

## TODO:

* Action needs to stop when CloudFormation triggers an error
* Need to handle assets 

## Usage

To deploy a single stack:

```yaml
- uses: johnny-human/cdk-github-deploy@v1
  with:
    name: StackA
    parameter-overrides: Param1=a1,Param2=a2
```

To dedploy multiple stacks in parallel:

```yaml
- uses: johnny-human/cdk-github-deploy@v1
  with:
    name: |
      StackA
      StackB
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
    parameter-overrides: |
      Param1=a1,MyParam2=a2

      Param1=c1
```
