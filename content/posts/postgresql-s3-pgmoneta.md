---
title: "PostgreSQL S3 Cold Storage Backups with pgmoneta"
description: "Plan pgmoneta S3 cold storage backups for PostgreSQL with 2026 costs, Garage support, Prometheus metrics, restore drills, and retention tradeoffs explained."
coverImage: "https://commons.wikimedia.org/wiki/Special:FilePath/Wikimedia_Servers-0051_17.jpg"
coverImageAlt: "Rows of server racks in a data center representing PostgreSQL backup infrastructure and cold object storage."
coverImageWidth: 1200
coverImageHeight: 630
coverImageLoading: "eager"
ogImage: "https://commons.wikimedia.org/wiki/Special:FilePath/Wikimedia_Servers-0051_17.jpg"
date: "2026-06-20"
lastUpdated: "2026-06-21"
author: "Amr Shams"
authorTitle: "Software engineer and pgmoneta contributor"
authorBio: "Amr Shams writes about PostgreSQL backup systems, pgmoneta operations, object storage, and practical database reliability."
tags: ["postgresql backups", "pgmoneta", "s3 cold storage", "database reliability", "backup cost"]
---

# PostgreSQL Backups to S3 Cold Storage with pgmoneta

PostgreSQL backup storage looks simple until the first serious restore. The real question is not whether you uploaded a backup to object storage. The question is whether you can find it, verify it, restore it, afford the retrieval path, and explain the tradeoff before an incident.

Cold storage means backup storage optimized for low cost and long retention, not for immediate recovery. A cold backup may sit in an archive or infrequent-access tier for weeks, months, or years. That makes it useful for compliance and older restore points, but risky for the newest backup if recovery has to happen quickly.

pgmoneta is a PostgreSQL backup and restore system built for that operational reality. It supports full backups, incremental backups, point-in-time recovery, WAL handling, compression, encryption, TLS, metrics, and remote storage workflows, including S3-compatible object storage ([pgmoneta README](https://github.com/pgmoneta/pgmoneta), retrieved 2026-06-20).

What makes this problem awkward? The cheapest storage class is rarely the right home for the newest backup. PostgreSQL recovery is time-bound, key-bound, network-bound, and sometimes people-bound. The storage bill is only one part of the design.

> **Key Takeaways**
> - Cold storage can be cheap, but restore latency, retrieval fees, egress, and minimum storage duration decide the real bill.
> - pgmoneta adds backup-chain handling, verification, compression, encryption, WAL-aware restore, and S3-compatible remote storage.
> - As of June 20, 2026, Backblaze B2 lists `$6.95/TB/30-day`, Wasabi starts at `$6.99/TB/month`, and Cloudflare R2 Standard lists `$0.015/GB-month`.

![Rows of server racks used as the hero image for PostgreSQL backup infrastructure](https://commons.wikimedia.org/wiki/Special:FilePath/Wikimedia_Servers-0051_17.jpg)

## Why Should PostgreSQL Backups Use S3 Cold Storage?

As of 2026, AWS S3 pricing is split across storage, requests, retrieval, data transfer, lifecycle transitions, and management features, not one flat line item ([AWS, Amazon S3 Pricing](https://aws.amazon.com/s3/pricing/), retrieved 2026-06-20). S3 cold storage makes sense when old backups are rarely restored, but only if the restore path is designed before the failure.

Object storage is a good fit for database backups because it gives you a durable remote copy outside the PostgreSQL host. That separation matters. A local backup directory can disappear with the same disk, VM, region, or operator mistake that damaged the database.

Cold storage is the next layer. Recent backups usually need fast access. Older backups mostly need cheap retention, auditability, and a known retrieval process. That means the backup system has to separate hot restore needs from long-term retention needs.

<!-- [UNIQUE INSIGHT] -->
The mistake is treating "S3" as one storage tier. In practice, S3-compatible storage is an interface. The engineering decision is the policy behind it: which backups stay hot, which move cold, which are tested, and which are allowed to age out.

> **Citation capsule:** S3 cold storage is useful for PostgreSQL backups when restore expectations match the storage class. AWS states that S3 cost includes storage, requests, retrievals, transfers, and management features, so a backup design should price restore behavior, not just monthly capacity.

## What Does pgmoneta Add Beyond Uploading Files?

pgmoneta documents 4 storage engine types: local, SSH, S3, and Azure ([pgmoneta configuration documentation](https://github.com/pgmoneta/pgmoneta/blob/main/doc/CONFIGURATION.md), retrieved 2026-06-20). That matters because a backup system should own the workflow around the backup, not just copy a tar file to a bucket.

A shell script can upload a file. A backup system has to preserve restore semantics. pgmoneta handles PostgreSQL backup operations, backup metadata, incremental chains, WAL-aware restore, compression, encryption, verification, and remote storage workflows.

For S3 specifically, pgmoneta can use standard AWS S3 or an S3-compatible endpoint. The configuration supports fields such as `s3_bucket`, `s3_base_dir`, `s3_region`, `s3_endpoint`, `s3_port`, `s3_use_tls`, `s3_access_key_id`, and `s3_secret_access_key` ([pgmoneta S3 documentation](https://github.com/pgmoneta/pgmoneta/blob/main/doc/S3.md), retrieved 2026-06-20).

```ini
[pgmoneta]
storage_engine = s3
s3_region = us-east-1
s3_bucket = postgres-backups
s3_base_dir = production/primary
s3_storage_class = GLACIER_INSTANT_RETRIEVAL
s3_use_tls = on
s3_access_key_id = <redacted-access-key-id>
s3_secret_access_key = <redacted-secret-access-key>
```

Do not commit real S3 credentials. Treat the access key like production database credentials. The blog examples above are intentionally redacted.

> **Citation capsule:** pgmoneta is more than an upload tool. Its documented feature set includes full backups, incremental backups, point-in-time recovery, WAL shipping, compression, encryption, TLS, metrics, and remote management, which are the surrounding controls a PostgreSQL restore plan needs.

## Which S3 Storage Class Should You Choose?

As of June 20, 2026, Cloudflare R2 Standard lists `$0.015/GB-month`, Cloudflare R2 Infrequent Access lists `$0.01/GB-month`, Backblaze B2 lists `$6.95/TB/30-day`, and Wasabi starts at `$6.99/TB/month` ([Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/), [Backblaze Pricing](https://www.backblaze.com/cloud-storage/pricing), [Wasabi Pricing](https://wasabi.com/pricing), retrieved 2026-06-20). The right tier depends on restore urgency.

For recent PostgreSQL backups, choose a hot or instantly retrievable class. Your last few recovery points are the ones most likely to be used during a bad migration, data corruption event, or accidental delete.

For older monthly or quarterly backups, colder tiers can make sense. That includes AWS Glacier classes or provider-specific infrequent-access classes. The tradeoff is retrieval time, retrieval processing, minimum storage duration, and sometimes temporary restored-copy charges.

For teams that run frequent restore drills or move data between clouds, predictable egress can be worth more than the lowest storage number. Cloudflare R2 states there are no egress bandwidth charges for any storage class, while Wasabi advertises no fees for egress or API requests on its pricing page ([Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/), [Wasabi Pricing](https://wasabi.com/pricing), retrieved 2026-06-20).

| Provider option | Good fit | Watch carefully |
|---|---|---|
| AWS S3 Standard / IA / Glacier | Teams already on AWS that need lifecycle depth and many storage classes | Requests, retrievals, lifecycle transition cost, egress, and minimum duration |
| Cloudflare R2 | Restore drills, cross-cloud access, and egress-sensitive workloads | Operation classes, retrieval processing for Infrequent Access, and billing rounding |
| Backblaze B2 | Simple always-hot S3-compatible storage with low storage cost | Egress over the included allowance and Class D transaction cost |
| Wasabi | Predictable storage bills and frequent data access | Minimum terms, regional availability, and the July 1, 2026 price increase |
| Garage or private S3-compatible storage | Data sovereignty, lab environments, and private infrastructure | Operational ownership, replication design, and hardware durability |

<figure>
  <svg viewBox="0 0 760 380" role="img" aria-label="Storage-only monthly cost comparison for one terabyte of object storage" xmlns="http://www.w3.org/2000/svg">
    <rect width="760" height="380" fill="#f8fafc"/>
    <text x="32" y="42" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111827">Approximate storage-only cost for 1 TB</text>
    <text x="32" y="68" font-family="Arial, sans-serif" font-size="13" fill="#4b5563">Published prices retrieved 2026-06-20. Excludes requests, retrievals, taxes, support, and provider-specific rules.</text>
    <g font-family="Arial, sans-serif" font-size="14" fill="#111827">
      <text x="32" y="122">Cloudflare R2 Standard</text>
      <rect x="230" y="102" width="307" height="26" rx="4" fill="#2563eb"/>
      <text x="550" y="121">$15.00/TB-month</text>
      <text x="32" y="170">Cloudflare R2 Infrequent Access</text>
      <rect x="230" y="150" width="205" height="26" rx="4" fill="#0891b2"/>
      <text x="448" y="169">$10.00/TB-month</text>
      <text x="32" y="218">Backblaze B2</text>
      <rect x="230" y="198" width="142" height="26" rx="4" fill="#16a34a"/>
      <text x="385" y="217">$6.95/TB/30-day</text>
      <text x="32" y="266">Wasabi Pay-as-you-go</text>
      <rect x="230" y="246" width="143" height="26" rx="4" fill="#ea580c"/>
      <text x="386" y="265">$6.99/TB-month</text>
    </g>
    <line x1="230" y1="310" x2="640" y2="310" stroke="#cbd5e1" stroke-width="1"/>
    <text x="230" y="334" font-family="Arial, sans-serif" font-size="12" fill="#64748b">$0</text>
    <text x="366" y="334" font-family="Arial, sans-serif" font-size="12" fill="#64748b">$5</text>
    <text x="500" y="334" font-family="Arial, sans-serif" font-size="12" fill="#64748b">$10</text>
    <text x="633" y="334" font-family="Arial, sans-serif" font-size="12" fill="#64748b">$15</text>
  </svg>
  <figcaption>Source: Cloudflare, Backblaze, and Wasabi pricing pages, retrieved 2026-06-20. Storage-only comparison; real bills include workload behavior.</figcaption>
</figure>

> **Citation capsule:** Provider choice changes the backup bill shape. In 2026 pricing pages, R2 Standard is listed at `$0.015/GB-month`, B2 at `$6.95/TB/30-day`, and Wasabi at `$6.99/TB/month`, but retrieval and egress behavior can dominate restore-heavy workloads.

## How Much Does a PostgreSQL Backup Archive Cost?

For a simple 1 TB storage-only example in 2026, Cloudflare R2 Standard is about `$15/TB-month`, R2 Infrequent Access is about `$10/TB-month` before retrieval processing, Backblaze B2 is `$6.95/TB/30-day`, and Wasabi starts at `$6.99/TB/month` ([Cloudflare](https://developers.cloudflare.com/r2/pricing/), [Backblaze](https://www.backblaze.com/cloud-storage/pricing), [Wasabi](https://wasabi.com/pricing), retrieved 2026-06-20). This is the floor, not the full cost.

Use this model before choosing a provider:

```text
monthly backup storage cost =
  compressed full backups
+ incremental backup growth
+ retained WAL volume
+ request and lifecycle operations
+ retrieval processing
+ internet egress
+ minimum storage duration penalties
+ restore drill frequency
```

The hidden variable is WAL volume. A database with 1 TB of data and low write activity behaves very differently from a 1 TB database with heavy churn. Backups compress. WAL often tells the truth about write rate.

<!-- [PERSONAL EXPERIENCE] -->
When we review PostgreSQL backup costs, we price at least one restore per month. It is not enough to price storage at rest. A production backup plan that cannot afford regular restore drills will eventually drift into guesswork.

### Example Cost Model

| Scenario | Stored backup data | Provider class | Storage-only estimate | What is missing |
|---|---:|---|---:|---|
| Small production system | 1 TB | Backblaze B2 | `$6.95/month` | Restore bandwidth, requests |
| Small production system | 1 TB | Cloudflare R2 Standard | `$15/month` before free-tier effect | Operations, taxes |
| Compliance archive | 5 TB | Wasabi pay-as-you-go | `$34.95/month` before July 1, 2026 change | Minimum-policy details, support |
| Infrequent restore copy | 5 TB | Cloudflare R2 IA | `$50/month` storage plus retrieval processing | Retrieval cost during tests |

> **Citation capsule:** A useful PostgreSQL backup budget prices restore drills. Storage-only estimates can look small, but provider pricing pages separate capacity from operations, retrieval processing, egress, support, and minimum storage duration rules.

## How Do You Configure pgmoneta for S3-Compatible Storage?

pgmoneta's S3 documentation includes 8 core S3 fields for endpoint, bucket, region, credentials, base path, port, TLS, and storage class ([pgmoneta S3 documentation](https://github.com/pgmoneta/pgmoneta/blob/main/doc/S3.md), retrieved 2026-06-20). This is the portability point: AWS S3 and many S3-compatible providers use the same general access model.

For AWS S3, start with the provider's region and bucket:

![Network and server racks representing S3-compatible backup storage infrastructure](https://commons.wikimedia.org/wiki/Special:FilePath/Datacenter-telecom_edit2.jpg)

```ini
[pgmoneta]
storage_engine = s3
s3_region = us-east-1
s3_bucket = postgres-prod-backups
s3_base_dir = pgmoneta/primary
s3_storage_class = STANDARD_IA
s3_use_tls = on
s3_access_key_id = <redacted>
s3_secret_access_key = <redacted>
```

For S3-compatible storage, add the custom endpoint. This is the shape used for systems such as Garage and other providers that expose an S3 API:

```ini
[pgmoneta]
storage_engine = s3
s3_endpoint = <provider-endpoint-host>
s3_port = 443
s3_region = auto
s3_bucket = postgres-prod-backups
s3_base_dir = pgmoneta/primary
s3_use_tls = on
s3_access_key_id = <redacted>
s3_secret_access_key = <redacted>
```

### Garage as a Self-Hosted S3 Target

Garage deserves special attention because it changes the ownership model. Instead of renting object storage from AWS, Cloudflare, Backblaze, or Wasabi, you operate an S3-compatible storage system yourself. That can be attractive for labs, private infrastructure, small clusters, data-sovereignty requirements, or environments where you already own the disks.

pgmoneta documents Garage as an S3-compatible target using path-style URLs ([pgmoneta S3 documentation](https://github.com/pgmoneta/pgmoneta/blob/main/doc/S3.md), retrieved 2026-06-21). The minimal flow is simple: start Garage, configure pgmoneta with the Garage endpoint, start pgmoneta, then run `pgmoneta-cli s3 ls primary` to confirm that the remote path is reachable.

```ini
[pgmoneta]
storage_engine = s3
s3_access_key_id = <garage_access_key_id>
s3_secret_access_key = <garage_secret_access_key>
s3_bucket = <garage_bucket_name>
s3_base_dir = pgmoneta
s3_endpoint = <garage_endpoint_host>
s3_port = <garage_endpoint_port>
s3_region = garage
s3_use_tls = off
```

There is one important difference from AWS S3: when `s3_endpoint` is used, pgmoneta includes the bucket name in the request path, and `s3_storage_class` is not supported with custom endpoints. In plain terms, Garage is about control and portability, not cloud-provider storage classes.

The important design choice is `s3_base_dir`. Use a path that encodes environment and server identity, such as `prod/cluster-a/primary`. Keep dev, staging, and production backup paths separate. Don't make humans infer safety from bucket names alone.

> **Citation capsule:** pgmoneta supports S3-compatible storage through configurable endpoint, region, bucket, path, TLS, port, and credential settings. That lets teams use AWS S3, private S3-compatible systems, or alternate object storage providers without redesigning the PostgreSQL backup workflow.

## What Does Restore Actually Look Like?

pgmoneta's documented S3 restore flow downloads 3 metadata files first: `backup.sha512`, `backup.info`, and `backup.manifest`, then verifies `backup.info` integrity before downloading the data files ([pgmoneta CLI documentation](https://github.com/pgmoneta/pgmoneta/blob/main/doc/CLI.md), retrieved 2026-06-20). That order is exactly what you want from a serious restore tool.

The command shape is direct:

![Server rack corridor representing the restore side of a backup architecture](https://commons.wikimedia.org/wiki/Special:FilePath/Wikimedia_Servers-0051_19.jpg)

```sh
pgmoneta-cli s3 restore primary 20260316000957 /tmp/restore-primary
```

Under the hood, pgmoneta stages the S3 backup locally, applies the correct compression and encryption extensions, restores into the requested directory, and removes the staged local copy after success. That staging step means you still need enough local disk for the restore path.

Restore planning should answer five questions before an incident:

1. How much local disk is needed to stage and restore the largest backup?
2. Which storage classes require a restore or thaw request before download?
3. How long does a full restore take over the available network path?
4. Which key material is required for encrypted backups?
5. Who can run the restore command at 03:00 without guessing?

> **Citation capsule:** pgmoneta's S3 restore path is metadata-first. It downloads checksum and manifest files, verifies backup information, downloads the listed data files, restores locally, and cleans up staging after success. This makes restore behavior explicit rather than an ad hoc bucket download.

## How Should Retention Work in Production?

AWS states that S3 Standard-IA has a 30-day minimum, S3 Glacier Instant Retrieval and Flexible Retrieval have 90-day minimums, and S3 Glacier Deep Archive has a 180-day minimum ([AWS, Amazon S3 Pricing](https://aws.amazon.com/s3/pricing/), retrieved 2026-06-20). Retention policy has to respect those billing windows.

A practical policy separates restore speed from archive depth:

- Keep the last 7 daily recovery points in a hot or instantly retrievable class.
- Keep weekly backups for 4 to 8 weeks in a lower-cost class.
- Keep monthly backups for 6 to 12 months in cold storage.
- Keep compliance snapshots only when a legal or business requirement says so.

<!-- [UNIQUE INSIGHT] -->
The retention policy should be written backward from RTO. If the business needs a 1-hour restore for recent incidents, cold archive is not the right home for the newest backup. Use cold storage for old recovery points, not urgent ones.

pgmoneta also supports backup retention concepts in configuration, so object storage policy and pgmoneta retention policy should not fight each other. If object lifecycle rules delete data before pgmoneta expects it, restore metadata and object state can drift.

<figure>
  <svg viewBox="0 0 760 380" role="img" aria-label="Minimum storage duration comparison for backup storage classes" xmlns="http://www.w3.org/2000/svg">
    <rect width="760" height="380" fill="#f8fafc"/>
    <text x="32" y="42" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111827">Minimum storage duration matters for retention</text>
    <text x="32" y="68" font-family="Arial, sans-serif" font-size="13" fill="#4b5563">Deleting, moving, or replacing objects early can still leave a billable storage window.</text>
    <g font-family="Arial, sans-serif" font-size="14" fill="#111827">
      <text x="32" y="122">R2 Standard</text>
      <rect x="260" y="103" width="4" height="26" rx="2" fill="#2563eb"/>
      <text x="280" y="122">0 days</text>
      <text x="32" y="168">R2 Infrequent Access</text>
      <rect x="260" y="149" width="78" height="26" rx="4" fill="#0891b2"/>
      <text x="352" y="168">30 days</text>
      <text x="32" y="214">AWS S3 Standard-IA</text>
      <rect x="260" y="195" width="78" height="26" rx="4" fill="#16a34a"/>
      <text x="352" y="214">30 days</text>
      <text x="32" y="260">AWS Glacier Instant/Flexible</text>
      <rect x="260" y="241" width="234" height="26" rx="4" fill="#ea580c"/>
      <text x="508" y="260">90 days</text>
      <text x="32" y="306">AWS Glacier Deep Archive</text>
      <rect x="260" y="287" width="468" height="26" rx="4" fill="#7c3aed"/>
      <text x="632" y="306" fill="#ffffff">180 days</text>
    </g>
    <line x1="260" y1="340" x2="728" y2="340" stroke="#cbd5e1" stroke-width="1"/>
    <text x="260" y="360" font-family="Arial, sans-serif" font-size="12" fill="#64748b">0</text>
    <text x="338" y="360" font-family="Arial, sans-serif" font-size="12" fill="#64748b">30</text>
    <text x="494" y="360" font-family="Arial, sans-serif" font-size="12" fill="#64748b">90</text>
    <text x="720" y="360" font-family="Arial, sans-serif" font-size="12" fill="#64748b">180</text>
  </svg>
  <figcaption>Source: AWS S3 Pricing and Cloudflare R2 Pricing, retrieved 2026-06-20.</figcaption>
</figure>

> **Citation capsule:** Cold retention must align with minimum storage windows. AWS lists 30-day, 90-day, and 180-day minimums across infrequent and Glacier classes, so deleting or transitioning backups too early can create avoidable charges or operational surprises.

## Which Prometheus Metrics Should You Monitor?

pgmoneta documents 2 S3-specific Prometheus metrics: `pgmoneta_backup_remote_s3_elapsed_time` and `pgmoneta_backup_remote_s3_mbs` ([pgmoneta Prometheus documentation](https://github.com/pgmoneta/pgmoneta/blob/main/doc/manual/en/10-prometheus.md), retrieved 2026-06-21). Together they tell you how long the remote S3 step took and how much throughput pgmoneta achieved for that backup label.

| Metric | Unit | Labels | What it means | How to use it |
|---|---:|---|---|---|
| `pgmoneta_backup_remote_s3_elapsed_time` | seconds | `name`, `label` | Time spent on S3 remote storage operations during a backup | Alert on unusual increases; compare against backup window and RTO expectations |
| `pgmoneta_backup_remote_s3_mbs` | MB/s | `name`, `label` | Remote S3 throughput for a specific backup operation | Track network or provider slowdown; compare across storage providers and backup sizes |

These are backup-path metrics, not a complete disaster-recovery score. They answer, "Was the S3 transfer slow?" They do not answer, "Can I restore within the RTO?" For that, you still need restore drills and freshness alerts.

Monitor backup systems from the restore backward:

- Backup success and failure count.
- Age of the newest usable backup.
- Backup size and compression ratio.
- WAL volume between backups.
- S3 upload duration and throughput.
- Verification status.
- Restore drill duration.
- Object lifecycle transitions.
- Provider-side errors and throttling.

The best alert is not "S3 upload failed." The best alert is "the newest restorable backup is older than the RPO." That phrasing matches the business risk.

> **Citation capsule:** Backup monitoring should measure recoverability, not only job success. For pgmoneta S3 deployments, transfer duration and throughput help explain upload health, while backup age, verification status, and restore drill time explain whether the system can recover.

## What Production Architecture Should You Use?

A 3-tier backup architecture is the most practical default: hot recent backups, warm weekly backups, and cold monthly archives. This maps cost to restore probability. Recent incidents need speed. Old audit restores need durability and a documented retrieval path.

Here is a sane starting point:

```text
PostgreSQL primary
  -> pgmoneta full + incremental backups
  -> WAL capture for point-in-time recovery
  -> S3-compatible object storage
      -> hot tier: latest daily recovery points
      -> warm tier: weekly retained backups
      -> cold tier: monthly archives
  -> scheduled verification
  -> scheduled restore drill
  -> Prometheus alerts
```

Use pgmoneta compression before remote storage to cut capacity cost. Use pgmoneta encryption or provider-side encryption based on your threat model. Use TLS for S3 connections. Keep access keys scoped to the backup bucket and rotate them on a schedule.

Most teams should start boring: one provider, one bucket per environment, clear prefixes, no public access, lifecycle policy reviewed with the database team, and a restore drill on the calendar.

> **Citation capsule:** A production PostgreSQL backup architecture should combine pgmoneta-managed backups, WAL-aware recovery, S3-compatible remote storage, verification, restore drills, and monitoring. The storage provider is only one part of the system.

## Frequently Asked Questions

The 5 answers below use 2026 provider pricing and pgmoneta documentation retrieved on June 20, 2026. Treat the numbers as planning anchors, then recheck your provider and region before buying storage.

### Is S3 cold storage safe for PostgreSQL backups?

Yes, if restore time matches the storage class. AWS lists 30-day, 90-day, and 180-day minimum storage durations across colder classes, so cold storage is better for older backups than urgent recovery points. Keep recent backups hot, then move older restore points cold.

### Can pgmoneta restore directly from S3?

Yes. pgmoneta documents an S3 restore flow that downloads `backup.sha512`, `backup.info`, and `backup.manifest`, verifies metadata, downloads listed data files, restores locally, and cleans up staging. That gives the restore process 3 metadata checks before the main data transfer.

### Which S3-compatible provider is cheapest for backups?

For storage-only pricing retrieved June 20, 2026, Backblaze B2 lists `$6.95/TB/30-day`, Wasabi starts at `$6.99/TB/month`, and Cloudflare R2 Infrequent Access lists `$0.01/GB-month`. The cheapest real option depends on restores, egress, API requests, support, and retention rules.

### Should I use Glacier Deep Archive for every backup?

No. Deep archive classes are designed for old, rarely accessed data. AWS lists a 180-day minimum for S3 Glacier Deep Archive, and restore behavior is different from hot object storage. Use it for monthly or compliance archives, not the newest recovery point.

### How often should I test PostgreSQL restores?

Test at least monthly for production systems, and test after major backup configuration changes. A 1 TB backup can be cheap to store, but the real risk is not knowing whether credentials, local disk, encryption keys, WAL, manifests, and network paths still work together.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is S3 cold storage safe for PostgreSQL backups?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, if restore time matches the storage class. AWS lists 30-day, 90-day, and 180-day minimum storage durations across colder classes, so cold storage is better for older backups than urgent recovery points."
      }
    },
    {
      "@type": "Question",
      "name": "Can pgmoneta restore directly from S3?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. pgmoneta documents an S3 restore flow that downloads backup.sha512, backup.info, and backup.manifest, verifies metadata, downloads listed data files, restores locally, and cleans up staging."
      }
    },
    {
      "@type": "Question",
      "name": "Which S3-compatible provider is cheapest for backups?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For storage-only pricing retrieved June 20, 2026, Backblaze B2 lists $6.95/TB/30-day, Wasabi starts at $6.99/TB/month, and Cloudflare R2 Infrequent Access lists $0.01/GB-month."
      }
    },
    {
      "@type": "Question",
      "name": "Should I use Glacier Deep Archive for every backup?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. AWS lists a 180-day minimum for S3 Glacier Deep Archive, and restore behavior is different from hot object storage. Use it for monthly or compliance archives, not the newest recovery point."
      }
    },
    {
      "@type": "Question",
      "name": "How often should I test PostgreSQL restores?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Test at least monthly for production systems and after major backup configuration changes. The test validates credentials, local disk, encryption keys, WAL, manifests, and network paths together."
      }
    }
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "PostgreSQL Backups to S3 Cold Storage with pgmoneta",
  "description": "Plan pgmoneta S3 cold storage backups for PostgreSQL with 2026 costs, Garage support, Prometheus metrics, restore drills, and retention tradeoffs explained.",
  "datePublished": "2026-06-20",
  "dateModified": "2026-06-21",
  "author": {
    "@type": "Person",
    "name": "Amr Shams",
    "jobTitle": "Software engineer and pgmoneta contributor",
    "description": "Amr Shams writes about PostgreSQL backup systems, pgmoneta operations, object storage, and practical database reliability."
  },
  "publisher": {
    "@type": "Organization",
    "name": "pgmoneta",
    "url": "https://github.com/pgmoneta/pgmoneta"
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://commons.wikimedia.org/wiki/Special:FilePath/Wikimedia_Servers-0051_17.jpg",
    "width": 1200,
    "height": 630,
    "caption": "Rows of server racks in a data center representing PostgreSQL backup infrastructure and cold object storage."
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://pgmoneta.github.io/blog/postgresql-s3-cold-storage-backups/"
  },
  "keywords": [
    "PostgreSQL backups",
    "pgmoneta",
    "S3 cold storage",
    "Garage S3",
    "Prometheus metrics"
  ]
}
</script>

## Conclusion

Across the 8 cited technical and pricing sources in this guide, the same pattern repeats: storage price is only one part of backup reliability. S3-compatible cold storage is a strong fit for PostgreSQL backups when it is treated as part of a recovery system, not a bucket-shaped dumping ground.

pgmoneta gives you the backup workflow: PostgreSQL-aware backups, WAL-aware restore, compression, encryption, verification, metrics, and S3-compatible storage.

The senior-engineer version of this design is simple: keep recent backups fast, keep older backups cheap, verify continuously, test restores on a schedule, and price the moment you need the data back.

## Source Notes

This article cites 12 source entries: 5 pgmoneta project references, 4 provider pricing references, and 3 Wikimedia Commons image references. Provider pricing was retrieved on June 20, 2026 and should be rechecked before procurement.

- pgmoneta, README, retrieved 2026-06-20, https://github.com/pgmoneta/pgmoneta

- pgmoneta, S3 Storage Engine Configuration, retrieved 2026-06-20, https://github.com/pgmoneta/pgmoneta/blob/main/doc/S3.md

- pgmoneta, CLI documentation, retrieved 2026-06-20, https://github.com/pgmoneta/pgmoneta/blob/main/doc/CLI.md

- pgmoneta, Configuration documentation, retrieved 2026-06-20, https://github.com/pgmoneta/pgmoneta/blob/main/doc/CONFIGURATION.md

- pgmoneta, Prometheus documentation, retrieved 2026-06-21, https://github.com/pgmoneta/pgmoneta/blob/main/doc/manual/en/10-prometheus.md

- AWS, Amazon S3 Pricing, retrieved 2026-06-20, https://aws.amazon.com/s3/pricing/

- Cloudflare, R2 Pricing, retrieved 2026-06-20, https://developers.cloudflare.com/r2/pricing/

- Backblaze, Cloud Storage Pricing, retrieved 2026-06-20, https://www.backblaze.com/cloud-storage/pricing

- Wasabi, Hot Cloud Storage Pricing, retrieved 2026-06-20, https://wasabi.com/pricing

- Wikimedia Commons, Wikimedia Servers-0051 17 image, retrieved 2026-06-20, https://commons.wikimedia.org/wiki/File:Wikimedia_Servers-0051_17.jpg

- Wikimedia Commons, Datacenter-telecom edit2 image, retrieved 2026-06-20, https://commons.wikimedia.org/wiki/File:Datacenter-telecom_edit2.jpg

- Wikimedia Commons, Wikimedia Servers-0051 19 image, retrieved 2026-06-20, https://commons.wikimedia.org/wiki/File:Wikimedia_Servers-0051_19.jpg
