import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_VERSION = process.env.LINKEDIN_VERSION || '202601';

const linkedinApi = axios.create({
  baseURL: 'https://api.linkedin.com/rest',
  timeout: 15_000,
  headers: {
    'LinkedIn-Version': API_VERSION,
    'X-Restli-Protocol-Version': '2.0.0',
  },
});

axiosRetry(linkedinApi, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429,
});

/**
 * Fetch social metadata (likes, comments, shares) for a single post.
 * Uses the LinkedIn socialMetadata endpoint.
 */
export async function fetchPostAnalytics(accessToken, postUrn) {
  try {
    // Encode the URN for the query parameter
    const encodedUrn = encodeURIComponent(postUrn);
    const response = await linkedinApi.get(
      `/socialMetadata/${encodedUrn}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const data = response.data;
    return {
      likes: data.totalLikeCount || data.likesSummary?.totalLikes || 0,
      comments: data.totalCommentCount || data.commentsSummary?.totalComments || 0,
      shares: data.totalShareCount || data.sharesSummary?.totalShares || 0,
      impressions: 0, // Impressions require different API scope (r_organization_social)
    };
  } catch (error) {
    // If socialMetadata fails, try the socialActions endpoint as fallback
    try {
      const encodedUrn = encodeURIComponent(postUrn);
      const response = await linkedinApi.get(
        `/socialActions/${encodedUrn}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const data = response.data;
      return {
        likes: data.likesSummary?.totalLikes || 0,
        comments: data.commentsSummary?.totalFirstLevelComments || 0,
        shares: data.sharesSummary?.totalShares || 0,
        impressions: 0,
      };
    } catch {
      // Return zeros if both endpoints fail (limited scopes)
      console.warn(`Could not fetch analytics for ${postUrn}:`, error.response?.status || error.message);
      return { likes: 0, comments: 0, shares: 0, impressions: 0 };
    }
  }
}

/**
 * Fetch admin organizations for the authenticated user.
 * Requires w_organization_social or r_organization_social scope.
 */
export async function fetchAdminOrganizations(accessToken) {
  try {
    const response = await linkedinApi.get(
      '/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName,vanityName,logoV2(original~:playableStreams))))',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const orgs = response.data.elements || [];
    return orgs.map((el) => {
      const org = el['organization~'] || {};
      const logoElements = org['logoV2']?.['original~']?.elements || [];
      const logoUrl = logoElements[0]?.identifiers?.[0]?.identifier || null;
      return {
        organizationId: org.id,
        urn: `urn:li:organization:${org.id}`,
        name: org.localizedName || org.vanityName || 'Unknown Org',
        vanityName: org.vanityName,
        logoUrl,
      };
    });
  } catch (error) {
    console.warn('Could not fetch admin orgs:', error.response?.status || error.message);
    return [];
  }
}
