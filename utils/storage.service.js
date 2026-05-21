import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import path from "path";

let blobServiceClient = null;

const getContainerName = () =>
  process.env.AZURE_STORAGE_CONTAINER || "wolfbox-files";

const getBlobServiceClient = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) return null;

  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  return blobServiceClient;
};

const getAccountCredentials = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
  const accountName = connectionString.match(/AccountName=([^;]+)/)?.[1];
  const accountKey = connectionString.match(/AccountKey=([^;]+)/)?.[1];

  if (!accountName || !accountKey) return null;

  return new StorageSharedKeyCredential(accountName, accountKey);
};

export const azureStorageDisponible = () => Boolean(getBlobServiceClient());

export const subirArchivoPrivado = async ({
  buffer,
  blobName,
  contentType = "application/octet-stream",
}) => {
  const client = getBlobServiceClient();

  if (!client) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING no esta configurado.");
  }

  const containerClient = client.getContainerClient(getContainerName());
  await containerClient.createIfNotExists();

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });

  return {
    provider: "azure_blob",
    blobName,
    url: blockBlobClient.url,
  };
};

export const eliminarArchivoPrivado = async (blobName) => {
  if (!blobName || !azureStorageDisponible()) return;

  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(getContainerName());
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.deleteIfExists();
};

export const crearUrlTemporalLectura = async (blobName) => {
  const client = getBlobServiceClient();
  const credentials = getAccountCredentials();

  if (!client || !credentials || !blobName) {
    return null;
  }

  const containerName = getContainerName();
  const containerClient = client.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const expiresOn = new Date(
    Date.now() + (Number(process.env.AZURE_STORAGE_URL_EXPIRES_MINUTES) || 5) * 60 * 1000
  );

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
    },
    credentials
  ).toString();

  return `${blockBlobClient.url}?${sas}`;
};

export const descargarArchivoPrivado = async (blobName) => {
  const client = getBlobServiceClient();

  if (!client || !blobName) {
    return null;
  }

  const containerClient = client.getContainerClient(getContainerName());
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  return blockBlobClient.download();
};

export const nombreSeguroArchivo = (nombre = "archivo") => {
  const ext = path.extname(nombre).toLowerCase();
  const base = path
    .basename(nombre, ext)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${base || "archivo"}${ext || ""}`;
};
