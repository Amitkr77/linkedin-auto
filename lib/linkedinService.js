import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_VERSION = process.env.LINKEDIN_VERSION || '202601';

const linkedinApi = axios.create({
  baseURL: 'https://api.linkedin.com/rest',
  timeout: 15_000,
  headers: {
    'LinkedIn-Version': API_VERSION,
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Type': 'application/json',
  },
});

axiosRetry(linkedinApi, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error),
});

export async function uploadImageAsset(accessToken, authorUrn, imageBuffer, mimeType) {
  const initResponse = await linkedinApi.post(
    '/images?action=initializeUpload',
    { initializeUploadRequest: { owner: authorUrn } },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const { uploadUrl, image: imageUrn } = initResponse.data.value;

  await axios.put(uploadUrl, imageBuffer, {
    headers: { 'Content-Type': mimeType },
    timeout: 30_000,
    maxBodyLength: 10 * 1024 * 1024,
  });

  return imageUrn;
}

export async function createLinkedInPost(accessToken, authorUrn, text, imageUrn = null) {
  const payload = {
    author: authorUrn,
    commentary: text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
  };

  if (imageUrn) {
    payload.content = { media: { id: imageUrn } };
  }

  const response = await linkedinApi.post('/posts', payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.headers['x-restli-id'];
}
