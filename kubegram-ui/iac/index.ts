import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Get configuration
const config = new pulumi.Config();
const isReleased = config.getBoolean("isReleased") || false;
const domainName = "kubegram.com";

let bucketName: pulumi.Output<string> | undefined;
let cloudFrontDomain: pulumi.Output<string> | undefined;
let websiteUrl: pulumi.Output<string> | undefined;

if (!isReleased) {
  // Look up the hosted zone for the domain
  const zone = aws.route53.getZone({
    name: domainName,
  });

  // Create S3 bucket for static website hosting
  const bucket = new aws.s3.Bucket("kubegram-ui-landing-bucket", {
    website: {
      indexDocument: "index.html",
      errorDocument: "index.html",
    },
  });

  // Create an ACM Certificate
  const cert = new aws.acm.Certificate("kubegram-cert", {
    domainName: domainName,
    validationMethod: "DNS",
    tags: {
      Environment: "production",
    },
  });

  // Create DNS record for certificate validation
  const certValidationDomain = new aws.route53.Record("kubegram-cert-validation", {
    name: cert.domainValidationOptions[0].resourceRecordName,
    zoneId: zone.then(z => z.zoneId),
    type: cert.domainValidationOptions[0].resourceRecordType,
    records: [cert.domainValidationOptions[0].resourceRecordValue],
    ttl: 60,
  });

  // Wait for certificate validation
  const certValidation = new aws.acm.CertificateValidation("kubegram-cert-validation-wait", {
    certificateArn: cert.arn,
    validationRecordFqdns: [certValidationDomain.fqdn],
  });

  // Create CloudFront Distribution
  const distribution = new aws.cloudfront.Distribution("kubegram-ui-distribution", {
    enabled: true,
    aliases: [domainName],
    origins: [{
      originId: bucket.arn,
      domainName: bucket.websiteEndpoint,
      customOriginConfig: {
        originProtocolPolicy: "http-only",
        httpPort: 80,
        httpsPort: 443,
        originSslProtocols: ["TLSv1.2"],
      },
    }],
    defaultRootObject: "index.html",
    defaultCacheBehavior: {
      targetOriginId: bucket.arn,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      forwardedValues: {
        queryString: false,
        cookies: {
          forward: "none",
        },
      },
      minTtl: 0,
      defaultTtl: 3600,
      maxTtl: 86400,
    },
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },
    viewerCertificate: {
      acmCertificateArn: certValidation.certificateArn,
      sslSupportMethod: "sni-only",
    },
  });

  // Create Alias Record in Route53
  const aliasRecord = new aws.route53.Record("kubegram-alias-record", {
    name: domainName,
    zoneId: zone.then(z => z.zoneId),
    type: "A",
    aliases: [{
      name: distribution.domainName,
      zoneId: distribution.hostedZoneId,
      evaluateTargetHealth: true,
    }],
  });

  // Bucket Policy to allow Public Read (Deprecated but functional for static sites often, though CloudFront OAC is current best practice. 
  // Keeping simple as per 'deploy it that away' instruction, but ensuring it works with website endpoint).
  const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
    bucket: bucket.id,
    policy: pulumi.all([bucket.arn]).apply(([bucketArn]) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`${bucketArn}/*`]
      }]
    })),
  });

  // Exports
  // Assignments for export
  bucketName = bucket.id;
  cloudFrontDomain = distribution.domainName;
  websiteUrl = pulumi.interpolate`https://${domainName}`;
} else {
  pulumi.log.info("App is released. Infrastructure is being torn down (or not created).");
}

export { bucketName, cloudFrontDomain, websiteUrl };
