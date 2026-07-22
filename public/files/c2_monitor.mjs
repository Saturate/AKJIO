#!/usr/bin/env node
// c2_monitor.mjs - Monitor SmartLoader Polygon contract for C2 rotations
//
// Usage:
//   node tools/c2_monitor.mjs                  # Check current C2 + recent history
//   node tools/c2_monitor.mjs --history        # Full historical scan (slow, ~2min)
//   node tools/c2_monitor.mjs --watch [mins]   # Poll every N minutes (default: 30)
//   node tools/c2_monitor.mjs --json           # Output as JSON (for piping)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "analysis", "c2-history.json");

const CONTRACT = "0x1823A9a0Ec8e0C25dD957D0841e3D41a4474bAdc";
const OWNER = "0xde275ad38c3352a7cb6b0d3efcbf45900c9716f2";
const GET_MESSAGE = "0x3bc5de30";
const HARDCODED_FALLBACK = "85.209.129.2";

const RPCS = [
	"https://rpc-mainnet.matic.quiknode.pro",
	"https://polygon-bor-rpc.publicnode.com",
	"https://polygon.llamarpc.com",
	"https://polygon.drpc.org",
	"https://1rpc.io/matic",
];

// ── RPC helpers ──────────────────────────────────────────────────

async function rpcCall(rpcUrl, method, params, timeout = 10000) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);
	try {
		const res = await fetch(rpcUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
			signal: controller.signal,
		});
		return await res.json();
	} finally {
		clearTimeout(timer);
	}
}

async function rpcWithFallback(method, params) {
	for (const rpc of RPCS) {
		try {
			const r = await rpcCall(rpc, method, params);
			if (r.result !== undefined) return r;
		} catch {}
	}
	return null;
}

function decodeAbiString(hex) {
	if (!hex || hex === "0x") return null;
	const b = Buffer.from(hex.slice(2), "hex");
	if (b.length < 64) return null;
	const len = b.readUInt32BE(60);
	if (len === 0 || len > 500) return null;
	return b.subarray(64, 64 + len).toString("utf-8");
}

async function getC2AtBlock(block = "latest") {
	const r = await rpcWithFallback("eth_call", [
		{ to: CONTRACT, data: GET_MESSAGE },
		block,
	]);
	return r ? decodeAbiString(r.result) : null;
}

async function getBlockTimestamp(blockNum) {
	const r = await rpcWithFallback("eth_getBlockByNumber", [
		typeof blockNum === "number" ? "0x" + blockNum.toString(16) : blockNum,
		false,
	]);
	if (!r?.result?.timestamp) return null;
	return new Date(parseInt(r.result.timestamp, 16) * 1000);
}

async function getCurrentBlock() {
	const r = await rpcWithFallback("eth_blockNumber", []);
	return r?.result ? parseInt(r.result, 16) : null;
}

// ── Database ─────────────────────────────────────────────────────

function loadDb() {
	if (!existsSync(DB_PATH)) {
		return {
			contract: CONTRACT,
			owner: OWNER,
			hardcodedFallback: HARDCODED_FALLBACK,
			rotations: [],
			lastCheck: null,
			lastBlock: null,
		};
	}
	return JSON.parse(readFileSync(DB_PATH, "utf-8"));
}

function saveDb(db) {
	db.lastCheck = new Date().toISOString();
	writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function addRotation(db, block, date, c2) {
	const exists = db.rotations.find((r) => r.c2 === c2 && r.block === block);
	if (!exists) {
		db.rotations.push({ block, date, c2 });
		db.rotations.sort((a, b) => a.block - b.block);
		return true;
	}
	return false;
}

// ── Binary search for rotation boundaries ────────────────────────

async function findTransition(low, high, prevUrl) {
	while (high - low > 50000) {
		const mid = Math.floor((low + high) / 2);
		const url = await getC2AtBlock("0x" + mid.toString(16));
		await sleep(200);
		if (url === prevUrl) {
			low = mid;
		} else {
			high = mid;
		}
	}
	return high;
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

// ── Full history scan ────────────────────────────────────────────

async function scanHistory(db) {
	const currentBlock = await getCurrentBlock();
	if (!currentBlock) {
		console.error("Cannot get current block");
		return;
	}

	console.error(`Scanning contract history (block 78M to ${currentBlock})...`);
	console.error("This takes ~2 minutes (rate-limited RPC calls).\n");

	let prevUrl = null;
	const step = 500000;
	const start = 78000000;

	for (let block = start; block <= currentBlock; block += step) {
		const url = await getC2AtBlock("0x" + block.toString(16));
		await sleep(250);

		if (url && url !== prevUrl) {
			// Found a transition. Binary search for exact block.
			let transBlock = block;
			if (prevUrl !== null && block > start) {
				console.error(`  Transition near block ${block}, narrowing...`);
				transBlock = await findTransition(block - step, block, prevUrl);
			}

			const date = await getBlockTimestamp(transBlock);
			const dateStr = date ? date.toISOString().split("T")[0] : "?";
			const isNew = addRotation(db, transBlock, dateStr, url);
			console.error(
				`  ${isNew ? "NEW" : "   "} ${dateStr}  ${url}  (block ${transBlock})`,
			);
			prevUrl = url;
		} else if (!url && prevUrl) {
			prevUrl = null;
		}
	}

	// Check latest
	const latest = await getC2AtBlock("latest");
	if (latest && latest !== prevUrl) {
		const date = new Date().toISOString().split("T")[0];
		addRotation(db, currentBlock, date, latest);
		console.error(`  NEW ${date}  ${latest}  (latest)`);
	}

	db.lastBlock = currentBlock;
	saveDb(db);
}

// ── Quick check (since last known block) ─────────────────────────

async function quickCheck(db) {
	const current = await getC2AtBlock("latest");
	const currentBlock = await getCurrentBlock();
	const lastKnown =
		db.rotations.length > 0 ? db.rotations[db.rotations.length - 1].c2 : null;

	const result = {
		timestamp: new Date().toISOString(),
		currentC2: current,
		currentBlock,
		changed: current !== lastKnown,
		previousC2: lastKnown,
		totalRotations: db.rotations.length,
		contract: CONTRACT,
		owner: OWNER,
		hardcodedFallback: HARDCODED_FALLBACK,
	};

	if (result.changed && current) {
		const date = new Date().toISOString().split("T")[0];
		addRotation(db, currentBlock, date, current);
		db.lastBlock = currentBlock;
		saveDb(db);
	}

	return result;
}

// ── Watch mode ───────────────────────────────────────────────────

async function watch(db, intervalMins) {
	console.error(
		`Watching contract every ${intervalMins} minutes. Ctrl+C to stop.\n`,
	);

	while (true) {
		const result = await quickCheck(db);
		const time = new Date().toLocaleTimeString();

		if (result.changed) {
			console.log(
				`[${time}] C2 ROTATED: ${result.previousC2} -> ${result.currentC2}`,
			);
		} else {
			console.error(`[${time}] No change. C2: ${result.currentC2}`);
		}

		await sleep(intervalMins * 60 * 1000);
	}
}

// ── Output formatting ────────────────────────────────────────────

function printTable(db, result) {
	console.log(`\nSmartLoader C2 Monitor`);
	console.log(`Contract:  ${CONTRACT}`);
	console.log(`Owner:     ${OWNER}`);
	console.log(`Fallback:  ${HARDCODED_FALLBACK} (hardcoded in payload)`);
	console.log(`Checked:   ${result.timestamp}`);
	console.log(
		`Current:   ${result.currentC2}${result.changed ? "  ** NEW **" : ""}`,
	);
	console.log(`Block:     ${result.currentBlock}`);
	console.log();

	if (db.rotations.length > 0) {
		console.log(`Rotation History (${db.rotations.length} entries):`);
		console.log("─".repeat(65));
		console.log(`  #   Date         C2 IP`);
		console.log("─".repeat(65));
		for (let i = 0; i < db.rotations.length; i++) {
			const r = db.rotations[i];
			const marker = r.c2 === result.currentC2 ? " <-- active" : "";
			console.log(
				`  ${String(i + 1).padStart(2)}  ${r.date}   ${r.c2}${marker}`,
			);
		}
		console.log("─".repeat(65));
	}

	// Subnet analysis
	const subnets = {};
	for (const r of db.rotations) {
		const ip = r.c2.replace("http://", "");
		const parts = ip.split(".");
		const subnet = parts.slice(0, 2).join(".");
		subnets[subnet] = (subnets[subnet] || 0) + 1;
	}
	const repeated = Object.entries(subnets)
		.filter(([, c]) => c > 1)
		.sort((a, b) => b[1] - a[1]);
	if (repeated.length > 0) {
		console.log("\nRepeated subnets:");
		for (const [subnet, count] of repeated) {
			const ips = db.rotations
				.filter((r) => r.c2.includes(subnet))
				.map((r) => r.c2.replace("http://", ""));
			console.log(`  ${subnet}.x.x  (${count}x): ${ips.join(", ")}`);
		}
	}
}

// ── Main ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const historyMode = args.includes("--history");
const watchMode = args.includes("--watch");
const watchInterval = watchMode
	? parseInt(args[args.indexOf("--watch") + 1]) || 30
	: 0;

const db = loadDb();

if (historyMode) {
	await scanHistory(db);
	const result = await quickCheck(db);
	if (jsonMode) {
		console.log(JSON.stringify({ ...result, history: db.rotations }, null, 2));
	} else {
		printTable(db, result);
	}
} else if (watchMode) {
	if (db.rotations.length === 0) {
		console.error("No history yet. Run with --history first.\n");
	}
	await watch(db, watchInterval);
} else {
	const result = await quickCheck(db);
	if (jsonMode) {
		console.log(JSON.stringify({ ...result, history: db.rotations }, null, 2));
	} else {
		printTable(db, result);
	}
}
