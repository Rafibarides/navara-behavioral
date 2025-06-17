module.exports = async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO || 'Rafibarides/navara-behavioral';
    
    if (!GITHUB_TOKEN) {
      return res.status(500).json({ error: 'GitHub token not configured' });
    }

    const siteData = req.body;
    
    // Validate that we have data
    if (!siteData || typeof siteData !== 'object') {
      return res.status(400).json({ error: 'Invalid site data provided' });
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
    
    return res.status(200).json({ 
      success: true, 
      message: 'Site data updated successfully',
      commit: result.commit.sha
    });

  } catch (error) {
    console.error('Error updating site data:', error);
    return res.status(500).json({ 
      error: 'Failed to update site data', 
      details: error.message 
    });
  }
}; 