import { NotFoundError } from "cloudflare";
import "dotenv/config";
import { execFileSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createDatabase,
  createKVNamespace,
  createPages,
  getDatabase,
  getKVNamespaceList,
  getPages,
} from "./cloudflare";

const PROJECT_NAME = process.env.PROJECT_NAME || "moemail";
const DATABASE_NAME = process.env.DATABASE_NAME || "moemail-db";
const KV_NAMESPACE_NAME = process.env.KV_NAMESPACE_NAME || "moemail-kv";
const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN;
const KV_NAMESPACE_ID = process.env.KV_NAMESPACE_ID;

/**
 * 楠岃瘉蹇呰鐨勭幆澧冨彉閲?
 */
const validateEnvironment = () => {
  const requiredEnvVars = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"];
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

/**
 * 澶勭悊JSON閰嶇疆鏂囦欢
 */
const setupConfigFile = (examplePath: string, targetPath: string) => {
  try {
    // 濡傛灉鐩爣鏂囦欢宸插瓨鍦紝鍒欒烦杩?
    if (existsSync(targetPath)) {
      console.log(`鉁?Configuration ${targetPath} already exists.`);
      return;
    }

    if (!existsSync(examplePath)) {
      console.log(`鈿狅笍 Example file ${examplePath} does not exist, skipping...`);
      return;
    }

    const configContent = readFileSync(examplePath, "utf-8");
    const json = JSON.parse(configContent);

    // 澶勭悊鑷畾涔夐」鐩悕绉?
    if (PROJECT_NAME !== "moemail") {
      const wranglerFileName = targetPath.split("/").at(-1);

      switch (wranglerFileName) {
        case "wrangler.json":
          json.name = PROJECT_NAME;
          break;
        case "wrangler.email.json":
          json.name = `${PROJECT_NAME}-email-receiver-worker`;
          break;
        case "wrangler.cleanup.json":
          json.name = `${PROJECT_NAME}-cleanup-worker`;
          break;
        default:
          break;
      }
    }

    // 澶勭悊鏁版嵁搴撻厤缃?
    if (json.d1_databases && json.d1_databases.length > 0) {
      json.d1_databases[0].database_name = DATABASE_NAME;
    }

    // 鍐欏叆閰嶇疆鏂囦欢
    writeFileSync(targetPath, JSON.stringify(json, null, 2));
    console.log(`鉁?Configuration ${targetPath} setup successfully.`);
  } catch (error) {
    console.error(`鉂?Failed to setup ${targetPath}:`, error);
    throw error;
  }
};

/**
 * 璁剧疆鎵€鏈塛rangler閰嶇疆鏂囦欢
 */
const setupWranglerConfigs = () => {
  console.log("馃敡 Setting up Wrangler configuration files...");

  const configs = [
    { example: "wrangler.example.json", target: "wrangler.json" },
    { example: "wrangler.email.example.json", target: "wrangler.email.json" },
    { example: "wrangler.cleanup.example.json", target: "wrangler.cleanup.json" },
  ];

  // 澶勭悊姣忎釜閰嶇疆鏂囦欢
  for (const config of configs) {
    setupConfigFile(
      resolve(config.example),
      resolve(config.target)
    );
  }
};

/**
 * 鏇存柊鏁版嵁搴揑D鍒版墍鏈夐厤缃枃浠?
 */
const updateDatabaseConfig = (dbId: string) => {
  console.log(`馃摑 Updating database ID (${dbId}) in configurations...`);

  // 鏇存柊鎵€鏈夐厤缃枃浠?
  const configFiles = [
    "wrangler.json",
    "wrangler.email.json",
    "wrangler.cleanup.json",
  ];

  for (const filename of configFiles) {
    const configPath = resolve(filename);
    if (!existsSync(configPath)) continue;

    try {
      const json = JSON.parse(readFileSync(configPath, "utf-8"));
      if (json.d1_databases && json.d1_databases.length > 0) {
        json.d1_databases[0].database_id = dbId;
      }
      writeFileSync(configPath, JSON.stringify(json, null, 2));
      console.log(`鉁?Updated database ID in ${filename}`);
    } catch (error) {
      console.error(`鉂?Failed to update ${filename}:`, error);
    }
  }
};

/**
 * 鏇存柊KV鍛藉悕绌洪棿ID鍒版墍鏈夐厤缃枃浠?
 */
const updateKVConfig = (namespaceId: string) => {
  console.log(`馃摑 Updating KV namespace ID (${namespaceId}) in configurations...`);

  // KV鍛藉悕绌洪棿鍙湪涓粀rangler.json涓娇鐢?
  const wranglerPath = resolve("wrangler.json");
  if (existsSync(wranglerPath)) {
    try {
      const json = JSON.parse(readFileSync(wranglerPath, "utf-8"));
      if (json.kv_namespaces && json.kv_namespaces.length > 0) {
        json.kv_namespaces[0].id = namespaceId;
      }
      writeFileSync(wranglerPath, JSON.stringify(json, null, 2));
      console.log(`鉁?Updated KV namespace ID in wrangler.json`);
    } catch (error) {
      console.error(`鉂?Failed to update wrangler.json:`, error);
    }
  }
};

/**
 * 妫€鏌ュ苟鍒涘缓鏁版嵁搴?
 */
const checkAndCreateDatabase = async () => {
  console.log(`馃攳 Checking if database "${DATABASE_NAME}" exists...`);

  try {
    const database = await getDatabase();

    if (!database || !database.uuid) {
      throw new Error('Database object is missing a valid UUID');
    }

    updateDatabaseConfig(database.uuid);
    console.log(`鉁?Database "${DATABASE_NAME}" already exists (ID: ${database.uuid})`);
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log(`鈿狅笍 Database not found, creating new database...`);
      try {
        const database = await createDatabase();

        if (!database || !database.uuid) {
          throw new Error('Database object is missing a valid UUID');
        }

        updateDatabaseConfig(database.uuid);
        console.log(`鉁?Database "${DATABASE_NAME}" created successfully (ID: ${database.uuid})`);
      } catch (createError) {
        console.error(`鉂?Failed to create database:`, createError);
        throw createError;
      }
    } else {
      console.error(`鉂?An error occurred while checking the database:`, error);
      throw error;
    }
  }
};

/**
 * 杩佺Щ鏁版嵁搴?
 */
const migrateDatabase = () => {
  console.log("馃摑 Migrating remote database...");
  try {
    execSync("pnpm run db:migrate-remote", { stdio: "inherit" });
    console.log("鉁?Database migration completed successfully");
  } catch (error) {
    console.error("鉂?Database migration failed:", error);
    throw error;
  }
};

/**
 * 妫€鏌ュ苟鍒涘缓KV鍛藉悕绌洪棿
 */
const checkAndCreateKVNamespace = async () => {
  console.log(`馃攳 Checking if KV namespace "${KV_NAMESPACE_NAME}" exists...`);

  if (KV_NAMESPACE_ID) {
    updateKVConfig(KV_NAMESPACE_ID);
    console.log(`鉁?User specified KV namespace (ID: ${KV_NAMESPACE_ID})`);
    return;
  }

  try {
    let namespace;

    const namespaceList = await getKVNamespaceList();
    namespace = namespaceList.find(ns => ns.title === KV_NAMESPACE_NAME);

    if (namespace && namespace.id) {
      updateKVConfig(namespace.id);
      console.log(`鉁?KV namespace "${KV_NAMESPACE_NAME}" found by name (ID: ${namespace.id})`);
    } else {
      console.log("鈿狅笍 KV namespace not found by name, creating new KV namespace...");
      namespace = await createKVNamespace();
      updateKVConfig(namespace.id);
      console.log(`鉁?KV namespace "${KV_NAMESPACE_NAME}" created successfully (ID: ${namespace.id})`);
    }
  } catch (error) {
    console.error(`鉂?An error occurred while checking the KV namespace:`, error);
    throw error;
  }
};

/**
 * Sync configured email domains into the SITE_CONFIG KV namespace.
 */
const syncEmailDomainsToKV = () => {
  console.log("Syncing EMAIL_DOMAINS to SITE_CONFIG KV...");

  const wranglerPath = resolve("wrangler.json");
  if (!existsSync(wranglerPath)) {
    throw new Error("wrangler.json not found, cannot sync EMAIL_DOMAINS");
  }

  const json = JSON.parse(readFileSync(wranglerPath, "utf-8"));
  const emailDomains = json.vars?.EMAIL_DOMAINS;
  const namespaceId = json.kv_namespaces?.[0]?.id;

  if (!emailDomains || typeof emailDomains !== "string") {
    throw new Error("EMAIL_DOMAINS not found in wrangler.json");
  }

  if (!namespaceId || typeof namespaceId !== "string") {
    throw new Error("SITE_CONFIG KV namespace ID not found in wrangler.json");
  }

  execFileSync(
    "pnpm",
    [
      "dlx",
      "wrangler",
      "kv",
      "key",
      "put",
      "EMAIL_DOMAINS",
      emailDomains,
      "--namespace-id",
      namespaceId,
    ],
    { stdio: "inherit" }
  );

  console.log("EMAIL_DOMAINS synced to SITE_CONFIG KV");
};

/**
 * 妫€鏌ュ苟鍒涘缓Pages椤圭洰
 */
const checkAndCreatePages = async () => {
  console.log(`馃攳 Checking if project "${PROJECT_NAME}" exists...`);

  try {
    await getPages();
    console.log("鉁?Project already exists, proceeding with update...");
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log("鈿狅笍 Project not found, creating new project...");
      const pages = await createPages();

      if (!CUSTOM_DOMAIN && pages.subdomain) {
        console.log("鈿狅笍 CUSTOM_DOMAIN is empty, using pages default domain...");
        console.log("馃摑 Updating environment variables...");

        // 鏇存柊鐜鍙橀噺涓洪粯璁ょ殑Pages鍩熷悕
        const appUrl = `https://${pages.subdomain}`;
        updateEnvVar("CUSTOM_DOMAIN", appUrl);
      }
    } else {
      console.error(`鉂?An error occurred while checking the project:`, error);
      throw error;
    }
  }
};

/**
 * 鎺ㄩ€丳ages瀵嗛挜
 */
const pushPagesSecret = () => {
  console.log("馃攼 Pushing environment secrets to Pages...");

  // 瀹氫箟杩愯鏃舵墍闇€鐨勭幆澧冨彉閲忓垪琛?
  const runtimeEnvVars = [
    'AUTH_GITHUB_ID', 
    'AUTH_GITHUB_SECRET', 
    'AUTH_GOOGLE_ID', 
    'AUTH_GOOGLE_SECRET', 
    'AUTH_SECRET'
  ];

  try {
    // 纭繚.env鏂囦欢瀛樺湪
    if (!existsSync(resolve('.env'))) {
      setupEnvFile();
    }

    // 璇诲彇.env鏂囦欢鍐呭
    const envContent = readFileSync(resolve('.env'), 'utf-8');
    
    // 瑙ｆ瀽鐜鍙橀噺涓哄璞?
    const secrets: Record<string, string> = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      
      // 璺宠繃娉ㄩ噴鍜岀┖琛?
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }
      
      // 瑙ｆ瀽閿€煎
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        return;
      }
      
      const key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();
      
      // 绉婚櫎寮曞彿
      value = value.replace(/^["']|["']$/g, '');
      
      // 鍙繚鐣欒繍琛屾椂鎵€闇€鐨勭幆澧冨彉閲忥紝涓斿€间笉涓虹┖
      if (runtimeEnvVars.includes(key) && value.length > 0) {
        secrets[key] = value;
      }
    });

    // 妫€鏌ユ槸鍚︽湁闇€瑕佹帹閫佺殑secrets
    if (Object.keys(secrets).length === 0) {
      console.log("鈿狅笍 No runtime secrets found to push");
      return;
    }

    // 鍒涘缓JSON鏍煎紡鐨勪复鏃舵枃浠?
    const runtimeEnvFile = resolve('.env.runtime.json');
    writeFileSync(runtimeEnvFile, JSON.stringify(secrets, null, 2));

    console.log(`馃摑 Found ${Object.keys(secrets).length} secrets to push:`, Object.keys(secrets).join(', '));

    // 浣跨敤涓存椂鏂囦欢鎺ㄩ€乻ecrets
    execSync(`pnpm dlx wrangler pages secret bulk ${runtimeEnvFile}`, { 
      stdio: "inherit" 
    });

    // 娓呯悊涓存椂鏂囦欢
    if (existsSync(runtimeEnvFile)) {
      execSync(`rm ${runtimeEnvFile}`, { stdio: "inherit" });
    }

    console.log("鉁?Secrets pushed successfully");
  } catch (error) {
    console.error("鉂?Failed to push secrets:", error);
    
    // 纭繚娓呯悊涓存椂鏂囦欢
    const runtimeEnvFile = resolve('.env.runtime.json');
    if (existsSync(runtimeEnvFile)) {
      try {
        execSync(`rm ${runtimeEnvFile}`, { stdio: "inherit" });
      } catch (cleanupError) {
        console.error("鈿狅笍 Failed to cleanup temporary file:", cleanupError);
      }
    }
    
    throw error;
  }
};

/**
 * 閮ㄧ讲Pages搴旂敤
 */
const deployPages = () => {
  console.log("馃毀 Deploying to Cloudflare Pages...");
  try {
    execSync("pnpm run deploy:pages", { stdio: "inherit" });
    console.log("鉁?Pages deployment completed successfully");
  } catch (error) {
    console.error("鉂?Pages deployment failed:", error);
    throw error;
  }
};

/**
 * 閮ㄧ讲Email Worker
 */
const deployEmailWorker = () => {
  console.log("馃毀 Deploying Email Worker...");
  try {
    execSync("pnpm dlx wrangler deploy --config wrangler.email.json", { stdio: "inherit" });
    console.log("鉁?Email Worker deployed successfully");
  } catch (error) {
    console.error("鉂?Email Worker deployment failed:", error);
    // 缁х画鎵ц鑰屼笉涓柇
  }
};

/**
 * 閮ㄧ讲Cleanup Worker
 */
const deployCleanupWorker = () => {
  console.log("馃毀 Deploying Cleanup Worker...");
  try {
    execSync("pnpm dlx wrangler deploy --config wrangler.cleanup.json", { stdio: "inherit" });
    console.log("鉁?Cleanup Worker deployed successfully");
  } catch (error) {
    console.error("鉂?Cleanup Worker deployment failed:", error);
    // 缁х画鎵ц鑰屼笉涓柇
  }
};

/**
 * 鍒涘缓鎴栨洿鏂扮幆澧冨彉閲忔枃浠?
 */
const setupEnvFile = () => {
  console.log("馃搫 Setting up environment file...");
  const envFilePath = resolve(".env");
  const envExamplePath = resolve(".env.example");

  // 濡傛灉.env鏂囦欢涓嶅瓨鍦紝鍒欎粠.env.example澶嶅埗鍒涘缓
  if (!existsSync(envFilePath) && existsSync(envExamplePath)) {
    console.log("鈿狅笍 .env file does not exist, creating from example...");

    // 浠庣ず渚嬫枃浠跺鍒?
    let envContent = readFileSync(envExamplePath, "utf-8");

    // 濉厖褰撳墠鐨勭幆澧冨彉閲?
    const envVarMatches = envContent.match(/^([A-Z_]+)\s*=\s*".*?"/gm);
    if (envVarMatches) {
      for (const match of envVarMatches) {
        const varName = match.split("=")[0].trim();
        if (process.env[varName]) {
          const regex = new RegExp(`${varName}\\s*=\\s*".*?"`, "g");
          envContent = envContent.replace(regex, `${varName} = "${process.env[varName]}"`);
        }
      }
    }

    writeFileSync(envFilePath, envContent);
    console.log("鉁?.env file created from example");
  } else if (existsSync(envFilePath)) {
    console.log("鉁?.env file already exists");
  } else {
    console.error("鉂?.env.example file not found!");
    throw new Error(".env.example file not found");
  }
};

/**
 * 鏇存柊鐜鍙橀噺
 */
const updateEnvVar = (name: string, value: string) => {
  // 棣栧厛鏇存柊杩涚▼鐜鍙橀噺
  process.env[name] = value;

  // 鐒跺悗灏濊瘯鏇存柊.env鏂囦欢
  const envFilePath = resolve(".env");
  if (!existsSync(envFilePath)) {
    setupEnvFile();
  }

  let envContent = readFileSync(envFilePath, "utf-8");
  const regex = new RegExp(`^${name}\\s*=\\s*".*?"`, "m");

  if (envContent.match(regex)) {
    envContent = envContent.replace(regex, `${name} = "${value}"`);
  } else {
    envContent += `\n${name} = "${value}"`;
  }

  writeFileSync(envFilePath, envContent);
  console.log(`鉁?Updated ${name} in .env file`);
};

/**
 * 涓诲嚱鏁?
 */
const main = async () => {
  try {
    console.log("馃殌 Starting deployment process...");

    validateEnvironment();
    setupEnvFile();
    setupWranglerConfigs();
    await checkAndCreateDatabase();
    migrateDatabase();
    await checkAndCreateKVNamespace();
    syncEmailDomainsToKV();
    await checkAndCreatePages();
    pushPagesSecret();
    deployPages();
    deployEmailWorker();
    deployCleanupWorker();

    console.log("馃帀 Deployment completed successfully");
  } catch (error) {
    console.error("鉂?Deployment failed:", error);
    process.exit(1);
  }
};

main();

