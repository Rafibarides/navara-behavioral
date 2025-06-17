exports.handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO || 'Rafibarides/navara-behavioral';
    
    if (!GITHUB_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GitHub token not configured' }),
      };
    }

    const siteData = JSON.parse(event.body);
    
    // Validate that we have data
    if (!siteData || typeof siteData !== 'object') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid site data provided' }),
      };
    }

    // Get current file to get SHA
    const getCurrentFileResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/navara-site/SiteData.json`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!getCurrentFileResponse.ok) {
      throw new Error(`Failed to get current file: ${getCurrentFileResponse.statusText}`);
    }

    const currentFile = await getCurrentFileResponse.json();
    
    // Prepare the new content
    const content = JSON.stringify(siteData, null, 2);
    const encodedContent = Buffer.from(content).toString('base64');

    // Update the file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/navara-site/SiteData.json`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update site data via CMS - ${new Date().toISOString()}`,
          content: encodedContent,
          sha: currentFile.sha,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update file: ${updateResponse.statusText} - ${errorText}`);
    }

    const result = await updateResponse.json();
    
    // Try to trigger a new deployment by calling a build hook
    const BUILD_HOOK_URL = process.env.BUILD_HOOK_URL;
    if (BUILD_HOOK_URL) {
      try {
        await fetch(BUILD_HOOK_URL, { method: 'POST' });
      } catch (error) {
        console.log('Build hook trigger failed:', error.message);
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Site data updated successfully',
        commit: result.commit.sha
      }),
    };

  } catch (error) {
    console.error('Error updating site data:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to update site data', 
        details: error.message 
      }),
    };
  }
}; 