import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// ---------------------------------------------------------------------------
// Policy 1: Pulumi state bucket (tightly scoped to known bucket name)
// ---------------------------------------------------------------------------
const stateBucketPolicy = new aws.iam.Policy("kubegram-deploy-state-bucket", {
  name: "KubegramDeployStateBucket",
  description: "Allows the Kubegram CI user to bootstrap and use the Pulumi state S3 bucket",
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PulumiStateBucketBootstrap",
        Effect: "Allow",
        Action: [
          "s3:HeadBucket",
          "s3:CreateBucket",
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
        ],
        Resource: "arn:aws:s3:::kubegram-pulumi-state",
      },
      {
        Sid: "PulumiStateBucketObjects",
        Effect: "Allow",
        Action: [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:ListBucketVersions",
        ],
        Resource: [
          "arn:aws:s3:::kubegram-pulumi-state",
          "arn:aws:s3:::kubegram-pulumi-state/*",
        ],
      },
    ],
  }),
});

// ---------------------------------------------------------------------------
// Policy 2: Site bucket (Pulumi appends a random suffix, so wildcard on name)
// ---------------------------------------------------------------------------
const siteBucketPolicy = new aws.iam.Policy("kubegram-deploy-site-bucket", {
  name: "KubegramDeploySiteBucket",
  description: "Allows the Kubegram CI user to manage the static-site S3 bucket and its contents",
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "SiteBucketManagement",
        Effect: "Allow",
        Action: [
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketAcl",
          "s3:PutBucketAcl",
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:DeleteBucketPolicy",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetBucketOwnershipControls",
          "s3:PutBucketOwnershipControls",
          "s3:GetBucketWebsite",
          "s3:PutBucketWebsite",
          "s3:DeleteBucketWebsite",
          "s3:GetBucketTagging",
          "s3:PutBucketTagging",
          "s3:DeleteBucketTagging",
          // Pulumi reads these back on every refresh cycle
          "s3:GetBucketCORS",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketReplication",
          "s3:GetAccelerateConfiguration",
          "s3:GetLifecycleConfiguration",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketObjectLockConfiguration",
        ],
        // Pulumi names site buckets kubegram-ui-bucket-<suffix>
        Resource: "arn:aws:s3:::kubegram-ui-*",
      },
      {
        Sid: "SiteBucketObjects",
        Effect: "Allow",
        Action: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl",
          "s3:ListBucket",
        ],
        Resource: [
          "arn:aws:s3:::kubegram-ui-*",
          "arn:aws:s3:::kubegram-ui-*/*",
        ],
      },
    ],
  }),
});

// ---------------------------------------------------------------------------
// Policy 3: ACM, Route53, CloudFront
// These services either use global ARNs or don't support resource-level scoping.
// ---------------------------------------------------------------------------
const infraPolicy = new aws.iam.Policy("kubegram-deploy-infra", {
  name: "KubegramDeployACMRoute53CloudFront",
  description: "Allows the Kubegram CI user to manage ACM certs, Route53 records, and the CloudFront distribution",
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "ACM",
        Effect: "Allow",
        Action: [
          "acm:RequestCertificate",
          "acm:DescribeCertificate",
          "acm:GetCertificate",
          "acm:DeleteCertificate",
          "acm:AddTagsToCertificate",
          "acm:RemoveTagsFromCertificate",
          "acm:ListTagsForCertificate",
        ],
        Resource: "*",
      },
      {
        Sid: "Route53",
        Effect: "Allow",
        Action: [
          "route53:ListHostedZones",
          "route53:ListHostedZonesByName",
          "route53:GetHostedZone",
          "route53:ChangeResourceRecordSets",
          "route53:ListResourceRecordSets",
          "route53:GetChange",
        ],
        Resource: "*",
      },
      {
        Sid: "CloudFront",
        Effect: "Allow",
        Action: [
          "cloudfront:CreateDistribution",
          "cloudfront:GetDistribution",
          "cloudfront:GetDistributionConfig",
          "cloudfront:UpdateDistribution",
          "cloudfront:DeleteDistribution",
          "cloudfront:TagResource",
          "cloudfront:UntagResource",
          "cloudfront:ListTagsForResource",
          "cloudfront:CreateFunction",
          "cloudfront:GetFunction",
          "cloudfront:UpdateFunction",
          "cloudfront:DeleteFunction",
          "cloudfront:PublishFunction",
          "cloudfront:DescribeFunction",
          // Used by the deploy.yml cache-invalidation step after every deploy
          "cloudfront:CreateInvalidation",
        ],
        Resource: "*",
      },
    ],
  }),
});

// ---------------------------------------------------------------------------
// Group: attach all three policies
// ---------------------------------------------------------------------------
const deployGroup = new aws.iam.Group("kubegram-deployers", {
  name: "kubegram-deployers",
});

const _attachState = new aws.iam.GroupPolicyAttachment("attach-state-bucket-policy", {
  group: deployGroup.name,
  policyArn: stateBucketPolicy.arn,
});

const _attachSite = new aws.iam.GroupPolicyAttachment("attach-site-bucket-policy", {
  group: deployGroup.name,
  policyArn: siteBucketPolicy.arn,
});

const _attachInfra = new aws.iam.GroupPolicyAttachment("attach-infra-policy", {
  group: deployGroup.name,
  policyArn: infraPolicy.arn,
});

// ---------------------------------------------------------------------------
// User: programmatic access only (no console login)
// An admin runs `pulumi up` once to create this user, then copies the
// exported accessKeyId / secretAccessKey into GitHub Actions secrets.
// ---------------------------------------------------------------------------
const ciUser = new aws.iam.User("kubegram-ci", {
  name: "kubegram-ci",
  tags: {
    Purpose: "GitHub Actions CI deployment",
    ManagedBy: "Pulumi",
  },
});

const _ciMembership = new aws.iam.UserGroupMembership("kubegram-ci-membership", {
  user: ciUser.name,
  groups: [deployGroup.name],
});

// Access key — treat the secret as a Pulumi secret so it never appears in plaintext logs
const ciAccessKey = new aws.iam.AccessKey("kubegram-ci-key", {
  user: ciUser.name,
});

// ---------------------------------------------------------------------------
// Admin policy: needed for the one-time bootstrap run that creates kubegram-ci.
// Attach this to the admin user/role along with the three policies above.
// All actions are scoped to the kubegram-*/Kubegram* naming convention.
// ---------------------------------------------------------------------------
const adminIAMPolicy = new aws.iam.Policy("kubegram-admin-iam", {
  name: "KubegramAdminIAM",
  description: "Allows an admin to create and manage the kubegram-ci IAM user, group, policies, and access keys. Required for the first-time pulumi up that bootstraps kubegram-ci.",
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "IAMPolicies",
        Effect: "Allow",
        Action: [
          "iam:CreatePolicy",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicyVersion",
          "iam:ListPolicyVersions",
          "iam:DeletePolicy",
          "iam:SetDefaultPolicyVersion",
        ],
        Resource: "arn:aws:iam::*:policy/Kubegram*",
      },
      {
        Sid: "IAMGroups",
        Effect: "Allow",
        Action: [
          "iam:CreateGroup",
          "iam:GetGroup",
          "iam:DeleteGroup",
          "iam:ListGroupPolicies",
          "iam:AttachGroupPolicy",
          "iam:DetachGroupPolicy",
          "iam:ListAttachedGroupPolicies",
          // AddUserToGroup / RemoveUserFromGroup are checked against BOTH the user
          // and the group resource — must be allowed here as well as in IAMUsers.
          "iam:AddUserToGroup",
          "iam:RemoveUserFromGroup",
        ],
        Resource: "arn:aws:iam::*:group/kubegram-*",
      },
      {
        Sid: "IAMUsers",
        Effect: "Allow",
        Action: [
          "iam:CreateUser",
          "iam:GetUser",
          "iam:DeleteUser",
          "iam:TagUser",
          "iam:UntagUser",
          "iam:ListUserTags",
          "iam:AddUserToGroup",
          "iam:RemoveUserFromGroup",
          "iam:ListGroupsForUser",
        ],
        Resource: "arn:aws:iam::*:user/kubegram-*",
      },
      {
        Sid: "IAMAccessKeys",
        Effect: "Allow",
        Action: [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:ListAccessKeys",
          "iam:UpdateAccessKey",
        ],
        Resource: "arn:aws:iam::*:user/kubegram-*",
      },
    ],
  }),
});

// ---------------------------------------------------------------------------
// Admin infra policy: same infrastructure permissions as the CI user, packaged
// for the one-time bootstrap run. Attach this + KubegramAdminIAM to Kubegram_Admin
// before the first `pulumi up`. After bootstrap, kubegram-ci handles all deploys.
// ---------------------------------------------------------------------------
const adminInfraPolicy = new aws.iam.Policy("kubegram-admin-infra", {
  name: "KubegramAdminInfrastructure",
  description: "Grants Kubegram_Admin the infrastructure permissions needed for the first-time pulumi up (S3, ACM, Route53, CloudFront).",
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PulumiState",
        Effect: "Allow",
        Action: [
          "s3:HeadBucket",
          "s3:CreateBucket",
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:ListBucketVersions",
        ],
        Resource: [
          "arn:aws:s3:::kubegram-pulumi-state",
          "arn:aws:s3:::kubegram-pulumi-state/*",
        ],
      },
      {
        Sid: "SiteBucket",
        Effect: "Allow",
        Action: [
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:GetBucketLocation",
          "s3:GetBucketAcl",
          "s3:PutBucketAcl",
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:DeleteBucketPolicy",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetBucketOwnershipControls",
          "s3:PutBucketOwnershipControls",
          "s3:GetBucketWebsite",
          "s3:PutBucketWebsite",
          "s3:DeleteBucketWebsite",
          "s3:GetBucketTagging",
          "s3:PutBucketTagging",
          "s3:DeleteBucketTagging",
          // Pulumi reads these back on every refresh cycle
          "s3:GetBucketCORS",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketReplication",
          "s3:GetAccelerateConfiguration",
          "s3:GetLifecycleConfiguration",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketObjectLockConfiguration",
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl",
          "s3:ListBucket",
        ],
        Resource: [
          "arn:aws:s3:::kubegram-ui-*",
          "arn:aws:s3:::kubegram-ui-*/*",
        ],
      },
      {
        Sid: "ACM",
        Effect: "Allow",
        Action: [
          "acm:RequestCertificate",
          "acm:DescribeCertificate",
          "acm:GetCertificate",
          "acm:DeleteCertificate",
          "acm:AddTagsToCertificate",
          "acm:RemoveTagsFromCertificate",
          "acm:ListTagsForCertificate",
        ],
        Resource: "*",
      },
      {
        Sid: "Route53",
        Effect: "Allow",
        Action: [
          "route53:ListHostedZones",
          "route53:ListHostedZonesByName",
          "route53:GetHostedZone",
          "route53:ChangeResourceRecordSets",
          "route53:ListResourceRecordSets",
          "route53:GetChange",
        ],
        Resource: "*",
      },
      {
        Sid: "CloudFront",
        Effect: "Allow",
        Action: [
          "cloudfront:CreateDistribution",
          "cloudfront:GetDistribution",
          "cloudfront:GetDistributionConfig",
          "cloudfront:UpdateDistribution",
          "cloudfront:DeleteDistribution",
          "cloudfront:TagResource",
          "cloudfront:UntagResource",
          "cloudfront:ListTagsForResource",
          "cloudfront:CreateFunction",
          "cloudfront:GetFunction",
          "cloudfront:UpdateFunction",
          "cloudfront:DeleteFunction",
          "cloudfront:PublishFunction",
          "cloudfront:DescribeFunction",
          "cloudfront:CreateInvalidation",
        ],
        Resource: "*",
      },
    ],
  }),
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export const iamUserArn = ciUser.arn;
export const iamGroupArn = deployGroup.arn;
// Attach BOTH adminPolicyArn + adminInfraPolicyArn to Kubegram_Admin before the first pulumi up.
// After bootstrap, the kubegram-ci user handles all subsequent deploys via GitHub Actions.
export const adminPolicyArn = adminIAMPolicy.arn;
export const adminInfraPolicyArn = adminInfraPolicy.arn;

// Copy these two values into GitHub → Settings → Secrets and variables → Actions
export const accessKeyId = ciAccessKey.id;
export const secretAccessKey = pulumi.secret(ciAccessKey.secret);
