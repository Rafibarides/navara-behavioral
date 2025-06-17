import React, { useState } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import siteData from '../../SiteData.json';

const Administrator = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  
  const [data, setData] = useState(siteData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('whoWeAre');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Simple password authentication
  const handleLogin = () => {
    if (password === 'navara2025admin') {
      setIsAuthenticated(true);
      setMessage('');
    } else {
      setMessage('Invalid password');
    }
  };

  // Handle publishing changes to GitHub via serverless functions
  const handlePublish = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // Use Netlify function deployed on the same domain
      const response = await fetch('/.netlify/functions/update-site-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        await response.json(); // Parse response but don't store unused result
        setMessage('Site data published successfully! Changes will be live in 1-2 minutes.');
      } else {
        const error = await response.text();
        setMessage(`Error publishing: ${error}`);
      }
    } catch (error) {
      setMessage(`Error: Unable to connect to publishing service. ${error.message}`);
    }
    
    setIsLoading(false);
  };

  // Update nested data
  const updateData = (path, value) => {
    const newData = { ...data };
    const keys = path.split('.');
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setData(newData);
  };

  // Add new strip to "Who We Are"
  const addWhoWeAreStrip = () => {
    const newStrip = {
      photo: "assets/NAVARA1.jpg",
      title: "New Strip",
      text: "Enter description here..."
    };
    
    const newStrips = [...data.sections.whoWeAre.strips, newStrip];
    updateData('sections.whoWeAre.strips', newStrips);
  };

  // Remove strip from "Who We Are"
  const removeWhoWeAreStrip = (index) => {
    const newStrips = data.sections.whoWeAre.strips.filter((_, i) => i !== index);
    updateData('sections.whoWeAre.strips', newStrips);
  };

  // Add new team member
  const addTeamMember = () => {
    const newMember = {
      photo: "assets/nisanFetman.png",
      eyesClosed: "assets/nisanFetmanEyesClosed.png",
      name: "New Team Member",
      position: "Position",
      introSentence: "Brief introduction...",
      fullText: "Full description..."
    };
    
    const newMembers = [...data.sections.team.members, newMember];
    updateData('sections.team.members', newMembers);
  };

  // Remove team member
  const removeTeamMember = (index) => {
    const newMembers = data.sections.team.members.filter((_, i) => i !== index);
    updateData('sections.team.members', newMembers);
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: colors.surface,
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{
            ...textSizes['2xl'],
            color: colors.text,
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Administrator Login
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              backgroundColor: colors.background,
              color: colors.text,
              ...textSizes.base
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              ...textSizes.base
            }}
          >
            Login
          </button>
          {message && (
            <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  const renderWhoWeAreSection = () => (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ ...textSizes.xl, color: colors.text }}>Who We Are Strips</h3>
        <button
          onClick={addWhoWeAreStrip}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            ...textSizes.sm
          }}
        >
          Add Strip
        </button>
      </div>
      
      {data.sections.whoWeAre.strips.map((strip, index) => (
        <div key={index} style={{
          backgroundColor: colors.surface,
          padding: '20px',
          marginBottom: '15px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ ...textSizes.lg, color: colors.text }}>Strip {index + 1}</h4>
            <button
              onClick={() => removeWhoWeAreStrip(index)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                ...textSizes.xs
              }}
            >
              Remove
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
              Photo URL:
            </label>
            <input
              type="text"
              value={strip.photo}
              onChange={(e) => {
                const newStrips = [...data.sections.whoWeAre.strips];
                newStrips[index].photo = e.target.value;
                updateData('sections.whoWeAre.strips', newStrips);
              }}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.background,
                color: colors.text,
                ...textSizes.sm
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
              Title:
            </label>
            <input
              type="text"
              value={strip.title}
              onChange={(e) => {
                const newStrips = [...data.sections.whoWeAre.strips];
                newStrips[index].title = e.target.value;
                updateData('sections.whoWeAre.strips', newStrips);
              }}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.background,
                color: colors.text,
                ...textSizes.sm
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
              Text:
            </label>
            <textarea
              value={strip.text}
              onChange={(e) => {
                const newStrips = [...data.sections.whoWeAre.strips];
                newStrips[index].text = e.target.value;
                updateData('sections.whoWeAre.strips', newStrips);
              }}
              rows={4}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.background,
                color: colors.text,
                ...textSizes.sm,
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderTeamSection = () => (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
          Section Title:
        </label>
        <input
          type="text"
          value={data.sections.team.title}
          onChange={(e) => updateData('sections.team.title', e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            backgroundColor: colors.background,
            color: colors.text,
            ...textSizes.sm
          }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
          Section Subtext:
        </label>
        <textarea
          value={data.sections.team.subtext}
          onChange={(e) => updateData('sections.team.subtext', e.target.value)}
          rows={2}
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            backgroundColor: colors.background,
            color: colors.text,
            ...textSizes.sm,
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ ...textSizes.xl, color: colors.text }}>Team Members</h3>
        <button
          onClick={addTeamMember}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            ...textSizes.sm
          }}
        >
          Add Team Member
        </button>
      </div>
      
      {data.sections.team.members.map((member, index) => (
        <div key={index} style={{
          backgroundColor: colors.surface,
          padding: '20px',
          marginBottom: '15px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ ...textSizes.lg, color: colors.text }}>Team Member {index + 1}</h4>
            <button
              onClick={() => removeTeamMember(index)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                ...textSizes.xs
              }}
            >
              Remove
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
                Photo URL:
              </label>
              <input
                type="text"
                value={member.photo}
                onChange={(e) => {
                  const newMembers = [...data.sections.team.members];
                  newMembers[index].photo = e.target.value;
                  updateData('sections.team.members', newMembers);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  backgroundColor: colors.background,
                  color: colors.text,
                  ...textSizes.sm
                }}
              />
            </div>
            
            <div>
              <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
                Eyes Closed Photo URL:
              </label>
              <input
                type="text"
                value={member.eyesClosed || ''}
                onChange={(e) => {
                  const newMembers = [...data.sections.team.members];
                  newMembers[index].eyesClosed = e.target.value;
                  updateData('sections.team.members', newMembers);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  backgroundColor: colors.background,
                  color: colors.text,
                  ...textSizes.sm
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
                Name:
              </label>
              <input
                type="text"
                value={member.name}
                onChange={(e) => {
                  const newMembers = [...data.sections.team.members];
                  newMembers[index].name = e.target.value;
                  updateData('sections.team.members', newMembers);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  backgroundColor: colors.background,
                  color: colors.text,
                  ...textSizes.sm
                }}
              />
            </div>
            
            <div>
              <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
                Position:
              </label>
              <input
                type="text"
                value={member.position}
                onChange={(e) => {
                  const newMembers = [...data.sections.team.members];
                  newMembers[index].position = e.target.value;
                  updateData('sections.team.members', newMembers);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  backgroundColor: colors.background,
                  color: colors.text,
                  ...textSizes.sm
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
              Intro Sentence:
            </label>
            <textarea
              value={member.introSentence}
              onChange={(e) => {
                const newMembers = [...data.sections.team.members];
                newMembers[index].introSentence = e.target.value;
                updateData('sections.team.members', newMembers);
              }}
              rows={2}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.background,
                color: colors.text,
                ...textSizes.sm,
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
              Full Text:
            </label>
            <textarea
              value={member.fullText}
              onChange={(e) => {
                const newMembers = [...data.sections.team.members];
                newMembers[index].fullText = e.target.value;
                updateData('sections.team.members', newMembers);
              }}
              rows={4}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.background,
                color: colors.text,
                ...textSizes.sm,
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderServicesSection = () => (
    <div>
      {Object.entries(data.sections.services).map(([serviceKey, service]) => (
        <div key={serviceKey} style={{
          backgroundColor: colors.surface,
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ ...textSizes.xl, color: colors.text, marginBottom: '20px', textTransform: 'capitalize' }}>
            {serviceKey} Service
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
                Title:
              </label>
              <input
                type="text"
                value={service.title}
                onChange={(e) => updateData(`sections.services.${serviceKey}.title`, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  backgroundColor: colors.background,
                  color: colors.text,
                  ...textSizes.sm
                }}
              />
            </div>
            
            <div>
              <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
                Logo URL:
              </label>
              <input
                type="text"
                value={service.logo}
                onChange={(e) => updateData(`sections.services.${serviceKey}.logo`, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  backgroundColor: colors.background,
                  color: colors.text,
                  ...textSizes.sm
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
              Photo URL:
            </label>
            <input
              type="text"
              value={service.photo}
              onChange={(e) => updateData(`sections.services.${serviceKey}.photo`, e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.background,
                color: colors.text,
                ...textSizes.sm
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
              Paragraph 1:
            </label>
            <textarea
              value={service.p1}
              onChange={(e) => updateData(`sections.services.${serviceKey}.p1`, e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.background,
                color: colors.text,
                ...textSizes.sm,
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
              Highlight:
            </label>
            <textarea
              value={service.highlight}
              onChange={(e) => updateData(`sections.services.${serviceKey}.highlight`, e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.background,
                color: colors.text,
                ...textSizes.sm,
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
              Paragraph 2:
            </label>
            <textarea
              value={service.p2}
              onChange={(e) => updateData(`sections.services.${serviceKey}.p2`, e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                backgroundColor: colors.background,
                color: colors.text,
                ...textSizes.sm,
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderAboutSection = () => (
    <div>
      <div style={{
        backgroundColor: colors.surface,
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <h3 style={{ ...textSizes.xl, color: colors.text, marginBottom: '20px' }}>About Section</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
            Hero Words (comma separated):
          </label>
          <input
            type="text"
            value={data.sections.about.heroWords.join(', ')}
            onChange={(e) => updateData('sections.about.heroWords', e.target.value.split(', '))}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              backgroundColor: colors.background,
              color: colors.text,
              ...textSizes.sm
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
            Main Content - Paragraph 1:
          </label>
          <textarea
            value={data.sections.about.mainContent.p1}
            onChange={(e) => updateData('sections.about.mainContent.p1', e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              backgroundColor: colors.background,
              color: colors.text,
              ...textSizes.sm,
              resize: 'vertical'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
            Main Content - Paragraph 2:
          </label>
          <textarea
            value={data.sections.about.mainContent.p2}
            onChange={(e) => updateData('sections.about.mainContent.p2', e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              backgroundColor: colors.background,
              color: colors.text,
              ...textSizes.sm,
              resize: 'vertical'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
            Different Section - Title:
          </label>
          <input
            type="text"
            value={data.sections.about.differentSection.title}
            onChange={(e) => updateData('sections.about.differentSection.title', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              backgroundColor: colors.background,
              color: colors.text,
              ...textSizes.sm
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ ...textSizes.sm, color: colors.text, display: 'block', marginBottom: '5px' }}>
            Different Section - Content:
          </label>
          <textarea
            value={data.sections.about.differentSection.content}
            onChange={(e) => updateData('sections.about.differentSection.content', e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              backgroundColor: colors.background,
              color: colors.text,
              ...textSizes.sm,
              resize: 'vertical'
            }}
          />
        </div>
      </div>
    </div>
  );

  const sectionTabs = [
    { key: 'whoWeAre', label: 'Who We Are' },
    { key: 'services', label: 'Services' },
    { key: 'about', label: 'About' },
    { key: 'team', label: 'Team' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: colors.surface,
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: `1px solid ${colors.border}`
        }}>
          <h1 style={{ ...textSizes['3xl'], color: colors.text, margin: 0 }}>
            Navara CMS Administrator
          </h1>
          <button
            onClick={handlePublish}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: isLoading ? colors.textSecondary : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              ...textSizes.base,
              fontWeight: 'bold'
            }}
          >
            {isLoading ? 'Publishing...' : 'Publish Changes'}
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div style={{
            backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
            color: message.includes('Error') ? '#721c24' : '#155724',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
          }}>
            {message}
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{
          backgroundColor: colors.surface,
          borderRadius: '8px',
          marginBottom: '20px',
          border: `1px solid ${colors.border}`,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.border}`
          }}>
            {sectionTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: activeSection === tab.key ? colors.primary : 'transparent',
                  color: activeSection === tab.key ? 'white' : colors.text,
                  border: 'none',
                  cursor: 'pointer',
                  ...textSizes.base,
                  borderRight: `1px solid ${colors.border}`
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          backgroundColor: colors.surface,
          padding: '30px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`
        }}>
          {activeSection === 'whoWeAre' && renderWhoWeAreSection()}
          {activeSection === 'services' && renderServicesSection()}
          {activeSection === 'about' && renderAboutSection()}
          {activeSection === 'team' && renderTeamSection()}
        </div>
      </div>
    </div>
  );
};

export default Administrator; 