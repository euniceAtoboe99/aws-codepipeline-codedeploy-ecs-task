# AWS CodePipeline + CodeDeploy + ECS Demo

A small Node.js web application packaged as a Docker image and deployed to Amazon ECS on AWS Fargate. AWS CodePipeline coordinates the workflow, AWS CodeBuild builds and pushes the image to Amazon ECR, and the CodeDeployToECS action performs a blue/green deployment.

> **Deployment record:** This repository contains the application and deployment configuration. Update the evidence and reflection sections after running the pipeline in your AWS sandbox. Do not claim a deployment succeeded until you have verified the live endpoint.

## Architecture

```text
GitHub (source) -> CodePipeline -> CodeBuild -> Amazon ECR
                                      |              |
                                      +--------------+-> CodeDeployToECS -> ECS Fargate
                                                                          (blue/green)
```

- **CodePipeline** detects source changes and passes artifacts between stages.
- **CodeBuild** builds the Docker image, pushes it to ECR, and emits `imageDetail.json`.
- **CodeDeploy** replaces the task-definition image placeholder and shifts the Application Load Balancer from the old ECS task set to the new one.
- **Amazon ECS/Fargate** runs the container without managing EC2 hosts.

## Repository files

| File | Purpose |
|---|---|
| `app.js`, `package.json` | Minimal HTTP app and health endpoint at `/health` |
| `Dockerfile` | Container image definition |
| `buildspec.yml` | Build, tag, push to ECR, and produce the image artifact |
| `taskdef.json` | Fargate task-definition template for CodeDeploy |
| `appspec.yaml` | ECS service and load-balancer details for CodeDeploy |

## Prerequisites

- AWS sandbox with permission to use ECR, ECS, CodeDeploy, CodePipeline, CodeBuild, IAM, and an Application Load Balancer.
- One AWS Region selected for all resources.
- A GitHub connection available to CodePipeline (AWS CodeConnections).
- An ECR repository named `ecs-bluegreen-demo` in that Region.
- An ECS task execution role named `ecsTaskExecutionRole` with the AWS managed `AmazonECSTaskExecutionRolePolicy` attached.

## Deployment outline

1. **Create ECR repository:** In Amazon ECR, create a private repository named `ecs-bluegreen-demo`.
2. **Prepare the task role:** In IAM, create or confirm `ecsTaskExecutionRole` and attach `AmazonECSTaskExecutionRolePolicy`. In `taskdef.json`, replace `ACCOUNT_ID` with the 12-digit AWS account ID. Keep `IMAGE1_NAME`; CodeDeploy replaces it using the image artifact.
3. **Create the load balancer:** Create an internet-facing Application Load Balancer and two target groups (`blue` and `green`) with target type **IP**, port `8080`, and the same VPC. Create an HTTP listener on port `80` pointing to the blue target group. Allow inbound HTTP in the ALB security group. Allow port `8080` from the ALB security group in the ECS task security group.
4. **Create the ECS service:** Create a Fargate cluster and register the task definition. Create the ECS service with the **CodeDeploy** deployment controller, desired count `1`, the ALB listener, and the blue target group. Use subnets in the ALB VPC and assign a task security group.
5. **Create CodeDeploy resources:** Create a CodeDeploy application using the **Amazon ECS** compute platform. Create its deployment group for the ECS cluster/service, select the production listener and both target groups, and use the all-at-once deployment configuration for this demo.
6. **Create the CodeBuild project:** Use the GitHub repository as source, enable **privileged mode** so Docker can build, and use `buildspec.yml`. Give its service role ECR authentication and image push permissions for `ecs-bluegreen-demo` (plus CloudWatch Logs permissions). Set the project Region to the same Region as ECR.
7. **Create the CodePipeline:** Add a GitHub source action for the `main` branch. Add a CodeBuild action using the project above and save its output artifact as `BuildArtifact`. Add a deploy action with provider **Amazon ECS (Blue/Green) / CodeDeployToECS** and configure:
   - `ApplicationName`: your CodeDeploy application
   - `DeploymentGroupName`: your ECS deployment group
   - `TaskDefinitionTemplateArtifact`: `SourceArtifact`
   - `TaskDefinitionTemplatePath`: `taskdef.json`
   - `AppSpecTemplateArtifact`: `SourceArtifact`
   - `AppSpecTemplatePath`: `appspec.yaml`
   - `Image1ArtifactName`: `BuildArtifact`
   - `Image1ContainerName`: `web`
8. Run the pipeline. Wait for build and deployment to succeed. Open the ALB DNS name in a browser and confirm the demo page loads. Also check `/health` returns `ok`.
9. Change the page text in `app.js`, commit the change to GitHub, and confirm that a second pipeline run creates and deploys a new task set.

The CodeDeploy ECS blue/green action expects an image artifact and task-definition/AppSpec templates. Its official action reference describes the required artifact names and placeholders: [AWS CodePipeline ECS blue/green action](https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-ECSbluegreen.html).

## Validation and evidence to add

After the deployment, add your own screenshots here or in an `evidence/` folder:

- Successful CodePipeline execution showing Source, Build, and Deploy stages.
- CodeBuild log showing the image was pushed to ECR.
- ECS service showing the running task and CodeDeploy deployment controller.
- CodeDeploy deployment showing success and traffic shift.
- Browser showing the app through the ALB DNS name, plus `/health` response.

**Observed deployment result:** _Fill in the date, Region, pipeline run status, and ALB test result after verifying them._

## Challenges and resolutions

Record only challenges you actually encountered. Use this table during the lab:

| Challenge observed | What you checked | Resolution and result |
|---|---|---|
| _Add your actual issue_ | _Console page or log message_ | _What you changed and whether it worked_ |

Common checks if a stage fails: confirm all resources are in the same Region; check that CodeBuild is in privileged mode and has ECR push permissions; confirm the ECR repository name and task-definition account ID; ensure the task security group permits traffic from the ALB; and verify that the CodeDeploy deployment group has the correct ECS service, listener, and two target groups.


## AWS references

- [CodePipeline ECS blue/green deploy action](https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-ECSbluegreen.html)
- [CodeDeploy AppSpec reference](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file.html)
- [ECS blue/green deployment overview](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/create-blue-green.html)
