import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext adapter config for Cloudflare Workers.
 *
 * Defaults are deliberate here. Incremental cache (R2) and tag
 * revalidation (D1/DO) are left off because nothing in this app uses
 * ISR — every route is either static or dynamically server-rendered per
 * request, since the tracker and map are personal to the signed-in user.
 * Adding those bindings would mean provisioning storage that nothing
 * reads.
 */
export default defineCloudflareConfig();
