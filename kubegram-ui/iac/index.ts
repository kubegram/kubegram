import * as fs from "fs";
import * as nodepath from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { S3BucketFolder } from "@pulumi/synced-folder";
import "./iam"; // IAM group, user, and policies for the kubegram-ci deploy user

const config = new pulumi.Config();
const distPath = config.get("distPath") || "../dist";
const domainName = "kubegram.com";
const wwwDomain = `www.${domainName}`;

// ACM certificates for CloudFront MUST be in us-east-1 regardless of default region
const usEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

// Look up existing Route53 hosted zone (must be created manually before running pulumi up)
const zone = aws.route53.getZone({ name: domainName });

// S3 bucket for static website hosting
const bucket = new aws.s3.Bucket("kubegram-ui-bucket", {
  website: {
    indexDocument: "index.html",
    errorDocument: "index.html",
  },
});

// AWS S3 blocks public access by default since April 2023 — must be disabled
// before attaching a public bucket policy or using public-read ACLs.
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("kubegram-ui-public-access", {
  bucket: bucket.id,
  blockPublicAcls: false,
  blockPublicPolicy: false,
  ignorePublicAcls: false,
  restrictPublicBuckets: false,
});

// AWS disabled ACLs on new buckets by default — re-enable them so S3Folder
// can set public-read on each uploaded object.
const bucketOwnershipControls = new aws.s3.BucketOwnershipControls("kubegram-ui-ownership", {
  bucket: bucket.id,
  rule: { objectOwnership: "BucketOwnerPreferred" },
}, { dependsOn: [bucketPublicAccessBlock] });

// Allow public reads so CloudFront website-endpoint origin can serve content
const bucketPolicy = new aws.s3.BucketPolicy("kubegram-ui-bucket-policy", {
  bucket: bucket.id,
  policy: bucket.arn.apply(bucketArn =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`${bucketArn}/*`],
      }],
    })
  ),
}, { dependsOn: [bucketPublicAccessBlock] });

// Sync the built dist/ directory into S3 on every pulumi up.
// Skipped when dist is absent (pure infra bootstrap); always runs on CI where
// the build step creates dist/ before `pulumi up`.
const resolvedDistPath = nodepath.resolve(distPath);
const _sync = fs.existsSync(resolvedDistPath)
  ? new S3BucketFolder("kubegram-ui-sync", {
      path: resolvedDistPath,
      bucketName: bucket.bucket,
      acl: "public-read",
    }, { dependsOn: [bucketPolicy, bucketOwnershipControls] })
  : undefined;

// ACM certificate covering both root and www (us-west-2 required by CloudFront)
const cert = new aws.acm.Certificate("kubegram-cert", {
  domainName: domainName,
  subjectAlternativeNames: [wwwDomain],
  validationMethod: "DNS",
  tags: { Environment: "production" },
}, { provider: usEast1 });

// DNS validation records — one per domain in the cert (root + www SAN)
const certValidationRecord = new aws.route53.Record("kubegram-cert-validation", {
  name: cert.domainValidationOptions[0].resourceRecordName,
  zoneId: zone.then((z: aws.route53.GetZoneResult) => z.zoneId),
  type: cert.domainValidationOptions[0].resourceRecordType,
  records: [cert.domainValidationOptions[0].resourceRecordValue],
  ttl: 60,
});

const certValidationRecordWww = new aws.route53.Record("kubegram-cert-validation-www", {
  name: cert.domainValidationOptions[1].resourceRecordName,
  zoneId: zone.then((z: aws.route53.GetZoneResult) => z.zoneId),
  type: cert.domainValidationOptions[1].resourceRecordType,
  records: [cert.domainValidationOptions[1].resourceRecordValue],
  ttl: 60,
});

const certValidation = new aws.acm.CertificateValidation("kubegram-cert-validation-wait", {
  certificateArn: cert.arn,
  validationRecordFqdns: [certValidationRecord.fqdn, certValidationRecordWww.fqdn],
}, { provider: usEast1 });

// CloudFront Function: redirect www.kubegram.com → kubegram.com (301)
const wwwRedirectFunction = new aws.cloudfront.Function("www-redirect", {
  runtime: "cloudfront-js-2.0",
  publish: true,
  code: `
function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : "";
  if (host === "${wwwDomain}") {
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: "https://${domainName}" + request.uri }
      }
    };
  }
  return request;
}
`,
});

// CloudFront distribution
const distribution = new aws.cloudfront.Distribution("kubegram-ui-distribution", {
  enabled: true,
  // Both root and www aliases — cert covers both via SAN
  aliases: [domainName, wwwDomain],
  defaultRootObject: "index.html",
  origins: [{
    originId: "kubegram-ui-s3-origin",
    // Explicitly construct the website endpoint — more reliable than bucket.websiteEndpoint
    // which can resolve empty when Pulumi state was written during a partial run.
    domainName: pulumi.interpolate`${bucket.bucket}.s3-website-${aws.config.region}.amazonaws.com`,
    customOriginConfig: {
      originProtocolPolicy: "http-only",
      httpPort: 80,
      httpsPort: 443,
      originSslProtocols: ["TLSv1.2"],
    },
  }],
  defaultCacheBehavior: {
    targetOriginId: "kubegram-ui-s3-origin",
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD", "OPTIONS"],
    forwardedValues: {
      queryString: false,
      cookies: { forward: "none" },
    },
    minTtl: 0,
    defaultTtl: 3600,
    maxTtl: 86400,
    // Apply www → root redirect at viewer-request stage
    functionAssociations: [{
      eventType: "viewer-request",
      functionArn: wwwRedirectFunction.arn,
    }],
  },
  // SPA routing: serve index.html for 403/404 so React Router handles the path
  customErrorResponses: [
    {
      errorCode: 403,
      responseCode: 200,
      responsePagePath: "/index.html",
    },
    {
      errorCode: 404,
      responseCode: 200,
      responsePagePath: "/index.html",
    },
  ],
  restrictions: {
    geoRestriction: { restrictionType: "none" },
  },
  viewerCertificate: {
    acmCertificateArn: certValidation.certificateArn,
    sslSupportMethod: "sni-only",
    minimumProtocolVersion: "TLSv1.2_2021",
  },
});

// Route53 A alias: kubegram.com → CloudFront
const rootAliasRecord = new aws.route53.Record("kubegram-root-alias", {
  name: domainName,
  zoneId: zone.then((z: aws.route53.GetZoneResult) => z.zoneId),
  type: "A",
  aliases: [{
    name: distribution.domainName,
    zoneId: distribution.hostedZoneId,
    evaluateTargetHealth: true,
  }],
});

// Route53 CNAME: www.kubegram.com → CloudFront (www alias is in CloudFront, 301 redirect applied by CF Function)
const wwwRecord = new aws.route53.Record("kubegram-www-cname", {
  name: wwwDomain,
  zoneId: zone.then((z: aws.route53.GetZoneResult) => z.zoneId),
  type: "CNAME",
  records: [distribution.domainName],
  ttl: 300,
});

export const bucketName = bucket.id;
export const cloudFrontDomain = distribution.domainName;
export const distributionId = distribution.id;
export const websiteUrl = pulumi.interpolate`https://${domainName}`;
