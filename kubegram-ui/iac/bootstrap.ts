import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketVersioningCommand,
} from "@aws-sdk/client-s3";
import {
  Route53Client,
  ListHostedZonesByNameCommand,
} from "@aws-sdk/client-route-53";

/**
 * Creates the S3 bucket used by Pulumi as a state backend.
 * Idempotent — skips creation if the bucket already exists.
 * Enables versioning so Pulumi state history is preserved.
 *
 * NOTE: In us-east-1, CreateBucketConfiguration must be omitted (AWS quirk).
 * Other regions require it to be set explicitly.
 */
export async function createPulumiStateBucket(
  bucketName: string,
  region: string = "us-east-1"
): Promise<string> {
  const s3 = new S3Client({ region });

  // Check if the bucket already exists
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✓ Pulumi state bucket already exists: ${bucketName}`);
    return bucketName;
  } catch (err: unknown) {
    const code = (err as { name?: string })?.name;
    if (code !== "NotFound" && code !== "NoSuchBucket" && code !== "404") {
      throw new Error(
        `Unexpected error checking bucket "${bucketName}": ${String(err)}`
      );
    }
  }

  // Create the bucket (omit CreateBucketConfiguration for us-east-1)
  const createParams: any =
    region === "us-east-1"
      ? { Bucket: bucketName }
      : {
        Bucket: bucketName,
        CreateBucketConfiguration: { LocationConstraint: region },
      };

  await s3.send(new CreateBucketCommand(createParams));
  console.log(`✓ Created Pulumi state bucket: ${bucketName}`);

  // Enable versioning so state history is preserved
  await s3.send(
    new PutBucketVersioningCommand({
      Bucket: bucketName,
      VersioningConfiguration: { Status: "Enabled" },
    })
  );
  console.log(`✓ Versioning enabled on bucket: ${bucketName}`);

  return bucketName;
}

/**
 * Verifies that a Route53 public hosted zone exists for the given domain.
 * Does not create a zone — zone creation requires DNS delegation at the
 * registrar level and cannot be automated safely.
 *
 * Returns the zone ID (without the "/hostedzone/" prefix) on success.
 * Throws a descriptive error if the zone is not found.
 */
export async function verifyRoute53Zone(domainName: string): Promise<string> {
  const route53 = new Route53Client({ region: "us-east-1" });

  const response = await route53.send(
    new ListHostedZonesByNameCommand({ DNSName: domainName, MaxItems: 5 })
  );

  // Route53 appends a trailing dot to zone names: "kubegram.com."
  const match = (response.HostedZones ?? []).find(
    (z) => z.Name === `${domainName}.`
  );

  if (!match?.Id) {
    throw new Error(
      `Route53 hosted zone for "${domainName}" not found.\n` +
      `Create it in the AWS Console or via CLI, then re-run this script.\n` +
      `  aws route53 create-hosted-zone --name ${domainName} --caller-reference $(date +%s)`
    );
  }

  const zoneId = match.Id.replace("/hostedzone/", "");
  console.log(`✓ Route53 zone found: ${zoneId} (${domainName})`);
  return zoneId;
}

async function main(): Promise<void> {
  const bucketName =
    process.env.PULUMI_STATE_BUCKET ?? "kubegram-pulumi-state";
  const region = process.env.AWS_DEFAULT_REGION ?? "us-east-1";
  const domainName = "kubegram.com";

  console.log("Kubegram IaC Bootstrap");
  console.log("======================");
  console.log(`  State bucket : ${bucketName}`);
  console.log(`  Region       : ${region}`);
  console.log(`  Domain       : ${domainName}`);
  console.log();

  await createPulumiStateBucket(bucketName, region);
  await verifyRoute53Zone(domainName);

  console.log();
  console.log(
    "Bootstrap complete. You can now run:\n" +
    `  PULUMI_BACKEND_URL=s3://${bucketName} pulumi up --stack production`
  );
}

main().catch((err) => {
  console.error("Bootstrap failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
