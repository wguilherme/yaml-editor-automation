
const AzureRepositoriesNameExceptions = JSON.parse(process.env.AZURE_REPOSITORIES_NAME_EXCEPTIONS || '{}');

export const AZURE_REPOSITORIES_NAME_EXCEPTIONS: {
  [key: string]: string;
} = AzureRepositoriesNameExceptions