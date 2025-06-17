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

    // Prepare the new content
    const content = JSON.stringify(siteData, null, 2);
    const encodedContent = Buffer.from(content).toString('base64');

    // Update both files in parallel
    const filesToUpdate = [
      'navara-site/SiteData.json',
      'navara-site/public/SiteData.json'
    ];

    // Function to update a single file
    const updateFile = async (filePath) => {
      try {
        // Get current file to get SHA
        const getCurrentFileResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
          {
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!getCurrentFileResponse.ok) {
          throw new Error(`Failed to get current file ${filePath}: ${getCurrentFileResponse.statusText}`);
        }

        const currentFile = await getCurrentFileResponse.json();

        // Update the file
        const updateResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
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
          throw new Error(`Failed to update file ${filePath}: ${updateResponse.statusText} - ${errorText}`);
        }

        return await updateResponse.json();
      } catch (error) {
        console.error(`Error updating ${filePath}:`, error);
        // Return a partial success if one file fails
        return { error: error.message, filePath };
      }
    };

    // Update both files in parallel
    const results = await Promise.all(filesToUpdate.map(updateFile));
    
    // Check if any updates succeeded
    const successfulUpdates = results.filter(result => !result.error);
    const failedUpdates = results.filter(result => result.error);
    
    if (successfulUpdates.length === 0) {
      throw new Error('All file updates failed');
    }

    const result = successfulUpdates[0]; // Use the first successful result
    
    // Try to trigger a new deployment by calling a build hook
    const BUILD_HOOK_URL = process.env.BUILD_HOOK_URL;
    if (BUILD_HOOK_URL) {
      try {
        const buildHookResponse = await fetch(BUILD_HOOK_URL, { 
          method: 'POST',
          timeout: 5000 // 5 second timeout for build hook
        });
        console.log('Build hook triggered:', buildHookResponse.ok);
      } catch (error) {
        console.log('Build hook trigger failed:', error.message);
        // Don't fail the whole operation if build hook fails
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Site data updated successfully',
        commit: result.commit ? result.commit.sha : 'partial-success',
        filesUpdated: successfulUpdates.length,
        filesFailed: failedUpdates.length,
        errors: failedUpdates.length > 0 ? failedUpdates.map(f => f.error) : undefined
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