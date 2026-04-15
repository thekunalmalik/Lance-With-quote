
import axios from 'axios';
import { addFile } from './web3';

// IPFS upload providers:
// - 4everland (recommended): uses wallet signature + 4EVER Pin temporary upload creds
// - nft.storage (fallback): requires API token
//
// Configure in `.env`:
// REACT_APP_IPFS_PROVIDER="4everland"  # or "nftstorage"
// REACT_APP_4EVERLAND_ACCESS_TOKEN="..."  # optional but recommended for pinning
// REACT_APP_NFT_STORAGE_API_KEY="..."      # only if using nft.storage fallback
const IPFS_PROVIDER = (process.env.REACT_APP_IPFS_PROVIDER || '4everland').toLowerCase();
const UPLOAD_API_URL = process.env.REACT_APP_UPLOAD_API_URL || 'http://localhost:8787';

const NFT_STORAGE_API_KEY = process.env.REACT_APP_NFT_STORAGE_API_KEY;
const NFT_STORAGE_URL = 'https://api.nft.storage/upload';

const FOUR_EVER_AUTH_URL = 'https://auth.api.4everland.org';
// IMPORTANT:
// The 4everland upload SDK expects the *base* S3 endpoint here (without bucket prefix).
// It will apply the bucket name itself when constructing requests.
const FOUR_EVER_BUCKET_ENDPOINT = process.env.REACT_APP_4EVERLAND_BUCKET_ENDPOINT || 'https://endpoint.4everland.co';
const FOUR_EVER_PIN_BASE_URL = 'https://api.4everland.dev';
const FOUR_EVER_ACCESS_TOKEN = process.env.REACT_APP_4EVERLAND_ACCESS_TOKEN;
const DEBUG_IPFS = String(process.env.REACT_APP_DEBUG_IPFS || '').toLowerCase() === 'true';

async function uploadWithNftStorage(file) {
  if (!NFT_STORAGE_API_KEY || String(NFT_STORAGE_API_KEY).trim() === '' || String(NFT_STORAGE_API_KEY).includes('YOUR_')) {
    throw new Error(
      'NFT.storage API key is not configured. Set REACT_APP_NFT_STORAGE_API_KEY in your .env, restart `npm start`, and try again.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);

  console.log('Uploading file to NFT.storage:', file.name);
  const response = await fetch(NFT_STORAGE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${NFT_STORAGE_API_KEY}` },
    body: formData
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'NFT.storage upload failed (401 Unauthorized). Your API token is missing/invalid/expired. ' +
        'Update REACT_APP_NFT_STORAGE_API_KEY in .env and restart the dev server.'
      );
    }
    const bodyText = await response.text().catch(() => '');
    throw new Error(`NFT.storage upload failed with status ${response.status}: ${response.statusText}${bodyText ? `\n${bodyText}` : ''}`);
  }

  const result = await response.json();
  const cid = result?.value?.cid;
  if (!cid) throw new Error('Invalid response from NFT.storage API (missing cid)');
  return { cid };
}

async function uploadWith4everland(file, account) {
  // Lazy import so the app can still run even if the dependency isn't installed yet.
  const { AuthClient, BucketClient, PinningClient } = await import('@4everland/upload-pin');

  if (!window.ethereum) {
    throw new Error('No wallet provider detected. Please install MetaMask to upload via 4everland.');
  }

  // Handle multiple injected wallets (MetaMask + Phantom, etc). Prefer MetaMask.
  let provider = window.ethereum;
  if (provider.providers && Array.isArray(provider.providers)) {
    const mm = provider.providers.find(p => p.isMetaMask);
    provider = mm || provider.providers[0];
  }

  // Ensure site is authorized and we have a usable account
  const sanitizeAccount = (val) => {
    if (!val) return null;
    const s = String(val).trim();
    // handle accidental JSON-stringified address in localStorage
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
    return s;
  };
  const desiredAccount = sanitizeAccount(account);
  let activeAccount = desiredAccount;
  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    // Always use the provider-selected account to avoid signature/account mismatch
    if (accounts && accounts[0]) activeAccount = accounts[0];
    if (desiredAccount && activeAccount && desiredAccount.toLowerCase() !== activeAccount.toLowerCase()) {
      console.warn('4everland upload: provided account differs from wallet selected account; using wallet account', {
        provided: desiredAccount,
        wallet: activeAccount
      });
    }
  } catch (e) {
    throw new Error(`Wallet connection required for upload: ${e?.message || e}`);
  }
  if (!activeAccount) {
    throw new Error('No wallet account available for 4everland upload. Please connect your wallet first.');
  }

  const authclient = new AuthClient(FOUR_EVER_AUTH_URL);
  const signText = await authclient.getSignText(activeAccount);

  // Ask wallet to sign the auth challenge
  let signature;
  try {
    signature = await provider.request({
      method: 'personal_sign',
      params: [signText, activeAccount]
    });
  } catch (e) {
    throw new Error(`4everland auth signature rejected: ${e?.message || e}`);
  }

  const verified = await authclient.verifySign(activeAccount, signature);
  const { accessKeyId, secretAccessKey, sessionToken, folderPath, accessBucket } = verified || {};
  if (!accessKeyId || !secretAccessKey || !sessionToken || !folderPath || !accessBucket) {
    throw new Error('4everland auth failed: missing temporary upload credentials');
  }

  if (DEBUG_IPFS) {
    console.log('4everland verifySign credentials:', {
      accessBucket,
      folderPath,
      endpoint: FOUR_EVER_BUCKET_ENDPOINT,
      accessKeyIdPrefix: String(accessKeyId).slice(0, 6) + '…'
    });
  }

  const bucketclient = new BucketClient({
    accessKeyId,
    secretAccessKey,
    sessionToken,
    endpoint: FOUR_EVER_BUCKET_ENDPOINT
  });

  console.log('Uploading file to 4everland:', file.name);
  // 4everland SDK returns folderPath already suffixed with "/"
  const base = String(folderPath || '');
  const key = base.endsWith('/') ? `${base}${file.name}` : `${base}/${file.name}`;
  // NOTE: SDK API is `uploadObject` (not `upload`)
  const task = bucketclient.uploadObject({
    Bucket: accessBucket,
    Key: key,
    Body: file,
    ContentType: file.type || 'application/octet-stream'
  });
  task.progress?.((e) => {
    // keep logs light; this is useful for debugging large files
    if (e?.loaded && e?.total) console.log(`4everland upload progress: ${e.loaded}/${e.total}`);
  });

  let done;
  try {
    done = await task.done();
  } catch (e) {
    // Surface helpful context without leaking secrets
    const msg = e?.message || String(e);
    throw new Error(
      `4everland upload failed: ${msg}\n` +
      `context: bucket=${accessBucket} key=${key} endpoint=${FOUR_EVER_BUCKET_ENDPOINT} account=${activeAccount}`
    );
  }
  const cid = done?.cid;
  if (!cid) throw new Error('4everland upload completed but did not return a CID');

  // Optional: pin the CID to your 4EVER Pin account for persistence
  if (FOUR_EVER_ACCESS_TOKEN) {
    try {
      const pinclient = new PinningClient({ baseURL: FOUR_EVER_PIN_BASE_URL, accessToken: FOUR_EVER_ACCESS_TOKEN });
      await pinclient.addPin({ cid, name: file.name });
    } catch (pinErr) {
      console.warn('4everland pin failed (upload CID still valid):', pinErr?.message || pinErr);
    }
  } else {
    console.warn('REACT_APP_4EVERLAND_ACCESS_TOKEN not set; skipping pin step (CID may still work but persistence may vary).');
  }

  return { cid };
}

// Fallback to alternative: If you prefer Pinata instead
// const PINATA_API_KEY = "YOUR_PINATA_API_KEY";
// const PINATA_API_SECRET = "YOUR_PINATA_API_SECRET";
// const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

/**
 * Fetches all files from IPFS (using smart contract storage)
 * No need for QuickNode for this - we get files from blockchain
 */
export async function fetchFilesfromIPFS(pageNumber = 1, perPage = 10) {
  // Files are stored on blockchain, so we get them from smart contract
  // This function is maintained for API compatibility
  console.log("Files are retrieved from blockchain via smart contract");
  return { pins: [] };
}

export async function uploadFiletoIPFS(file, milestoneId, account) {
  if (!file) throw new Error("No file provided for upload");

  try {
    let cid;
    if (IPFS_PROVIDER === 'backend') {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file to backend:', file.name);
      const resp = await fetch(`${UPLOAD_API_URL.replace(/\/$/, '')}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Backend upload failed (${resp.status}): ${text || resp.statusText}`);
      }

      const json = await resp.json();
      cid = json?.cid;
      if (!cid) throw new Error('Backend upload returned no cid');
    } else if (IPFS_PROVIDER === '4everland') {
      const res = await uploadWith4everland(file, account);
      cid = res.cid;
    } else if (IPFS_PROVIDER === 'nftstorage') {
      const res = await uploadWithNftStorage(file);
      cid = res.cid;
    } else {
      throw new Error(`Unknown IPFS provider "${IPFS_PROVIDER}". Set REACT_APP_IPFS_PROVIDER to "backend", "4everland", or "nftstorage".`);
    }

    const name = file.name;
    const requestId = `nft-storage-${Date.now()}`; // Generate a unique request ID

    console.log("File uploaded successfully to IPFS:", { cid, name, requestId });

    // Call addFile to record on blockchain
    try {
      await addFile(milestoneId, name, requestId, cid, account);
      return { cid, name, requestId };
    } catch (blockchainError) {
      console.error('Error adding file to blockchain:', blockchainError);
      throw new Error(`File uploaded to IPFS but failed to record on blockchain: ${blockchainError.message}`);
    }
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
}



/**
 * Downloads a file from IPFS and triggers a download in the browser.
 * Supports multiple gateway fallbacks for better reliability.
 * @param {string} cid - The IPFS content identifier.
 * @param {string} filename - The name to save the downloaded file as.
 */
export const downloadFileFromIPFS = async (cid, filename = 'downloadedFile') => {
  if (!cid) {
    throw new Error("No CID provided for download");
  }

  console.log("Starting download for CID:", cid);

  // List of IPFS gateways to try
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`
  ];

  let lastError = null;

  for (const url of gateways) {
    try {
      console.log(`Attempting download from: ${url}`);
      
      // Make a request to the IPFS gateway to get the file data as a blob
      const response = await fetch(url, {
        headers: {
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`Gateway returned status: ${response.status}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Create a download link and click it to trigger download
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = filename || 'file';
      document.body.appendChild(link);
      link.click();

      // Clean up the link after download
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      console.log(`File downloaded successfully as ${filename} from ${url}`);
      return true; // Success
    } catch (error) {
      console.log(`Gateway ${url} failed: ${error.message}`);
      lastError = error;
      // Try next gateway
      continue;
    }
  }

  // All gateways failed
  const errorMessage = `Failed to download file from IPFS after trying all gateways. Last error: ${lastError?.message}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
};

/**
 * Verifies if a file is on IPFS using the provided CID.
 * @param {string} cid - The IPFS content identifier for the file.
 * @returns {Promise<string>} - A promise that resolves with the verification message.
 */
export const verifyIPFSFile = async (cid) => {
  try {
    const response = await axios.post(
      'https://api.quicknode.com/functions/rest/v1/functions/c7f2c204-4dd5-4aa4-9803-2b90b1cb8d12/call', 
      { user_data: { cid } }, // Ensure the structure matches what your function expects
      {
        headers: {
          'Authorization': 'Bearer QN_c8aa28a4799341c085c01650882a8753', // Ensure this is a valid API key and wrapped in backticks
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error verifying IPFS file:', error);
    throw new Error('An error occurred while verifying the file.');
  }
};