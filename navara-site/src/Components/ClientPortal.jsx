import React, { useState, useEffect } from 'react';
import { getColors, getTextSizes } from '../utils/colorsAndText';
import NavBarMenu from './NavBarMenu';
import SignInPage from './SignInPage';

const ClientPortal = ({ isDarkMode = false }) => {
  const colors = getColors(isDarkMode);
  const textSizes = getTextSizes(isDarkMode);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('records');
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check if user is already signed in
  useEffect(() => {
    const signedIn = sessionStorage.getItem('navaraSignedIn');
    setIsSignedIn(signedIn === 'true');
  }, []);

  // Mock client data - in the future this will come from backend
  const client = {
    name: 'Steven Sitt',
    age: 13,
    dateOfBirth: '2010-03-15',
    insurance: {
      provider: 'Cigna',
      plan: 'Cigna HealthCare Plus',
      memberId: 'CIG789456123',
      groupNumber: 'GRP001234'
    },
    vitals: {
      weight: '185 lbs',
      height: '6\'1"',
      bloodType: 'O+',
      lastUpdated: '2024-12-15'
    },
    contact: {
      email: 'ralph.barides@email.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Anytown, NY 10001'
    },
    medications: [
      {
        name: 'Vyvanse',
        genericName: 'Lisdexamfetamine',
        dosage: '30mg',
        frequency: 'Once daily in the morning',
        diagnosis: 'ADHD (Attention Deficit Hyperactivity Disorder)',
        prescriber: 'Dr. Nisan Fetman',
        pharmacy: 'CVS Pharmacy - Main Street',
        lastRefill: '2024-12-01',
        nextRefill: '2024-12-29',
        refillsRemaining: 2,
        totalRefills: 5,
        prescriptionNumber: 'RX789456123',
        status: 'Active'
      }
    ],
    records: [
      {
        date: '2024-12-01',
        type: 'Behavioral Assessment',
        provider: 'Dr. Nisan Fetman',
        status: 'Completed',
        summary: 'Initial behavioral evaluation and treatment planning session'
      },
      {
        date: '2024-11-15',
        type: 'Diagnostic Evaluation',
        provider: 'Dr. Sarah Johnson',
        status: 'Completed',
        summary: 'Comprehensive psychological assessment for ADHD'
      }
    ],
    results: [
      {
        date: '2024-12-01',
        test: 'ADHD Assessment Scale',
        result: 'Moderate ADHD symptoms identified',
        status: 'Final'
      },
      {
        date: '2024-11-20',
        test: 'Behavioral Observation',
        result: 'Progress noted in attention span',
        status: 'Final'
      }
    ],
    notifications: [
      {
        date: '2024-12-20',
        type: 'appointment',
        message: 'Reminder: Follow-up appointment scheduled for Dec 28, 2024',
        read: false
      },
      {
        date: '2024-12-18',
        type: 'result',
        message: 'New test results available in your portal',
        read: false
      },
      {
        date: '2024-12-15',
        type: 'document',
        message: 'Treatment plan updated and ready for review',
        read: true
      }
    ],
    documents: [
      {
        name: 'Treatment Plan - Dec 2024',
        type: 'PDF',
        date: '2024-12-15',
        size: '1.2 MB'
      },
      {
        name: 'Insurance Authorization',
        type: 'PDF',
        date: '2024-11-30',
        size: '0.8 MB'
      },
      {
        name: 'Behavioral Assessment Report',
        type: 'PDF',
        date: '2024-12-01',
        size: '2.1 MB'
      }
    ],
    appointments: [
      {
        date: '2024-12-28',
        time: '2:00 PM',
        provider: 'Dr. Nisan Fetman',
        type: 'Follow-up Session',
        status: 'Scheduled'
      },
      {
        date: '2025-01-15',
        time: '10:30 AM',
        provider: 'Dr. Sarah Johnson',
        type: 'Diagnostic Review',
        status: 'Scheduled'
      }
    ]
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'records', name: 'Records', icon: 'fas fa-file-medical' },
    { id: 'results', name: 'Results', icon: 'fas fa-chart-line' },
    { id: 'notifications', name: 'Notifications', icon: 'fas fa-bell' },
    { id: 'documents', name: 'Documents', icon: 'fas fa-folder' },
    { id: 'refills', name: 'Refills', icon: 'fas fa-pills' },
    { id: 'profile', name: 'Profile', icon: 'fas fa-user' },
    { id: 'statistics', name: 'Statistics', icon: 'fas fa-chart-bar' },
    { id: 'history', name: 'History', icon: 'fas fa-history' },
    { id: 'appointments', name: 'Appointments', icon: 'fas fa-calendar-alt' }
  ];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoBack = () => {
    window.history.back();
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('navaraSignedIn');
    setIsSignedIn(false);
  };

  const handleSignIn = (signedIn) => {
    setIsSignedIn(signedIn);
  };

  // Show sign-in page if not authenticated
  if (!isSignedIn) {
    return <SignInPage isDarkMode={isDarkMode} onSignIn={handleSignIn} />;
  }

  const renderTabContent = () => {
    switch(activeTab) {
      case 'records':
        return (
          <div>
            <h2 style={{ 
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '24px',
              fontWeight: '700'
            }}>
              Medical Records
            </h2>
            {client.records.map((record, index) => (
              <div key={index} style={{
                background: colors.surface,
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: textSizes.lg.fontSize, fontFamily: textSizes.lg.fontFamily, color: colors.text, margin: 0 }}>
                    {record.type}
                  </h3>
                  <span style={{
                    background: record.status === 'Completed' ? colors.accent + '20' : colors.primary + '20',
                    color: record.status === 'Completed' ? colors.accent : colors.primary,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    fontWeight: '500'
                  }}>
                    {record.status}
                  </span>
                </div>
                <p style={{ color: colors.textSecondary, margin: '8px 0', fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily }}>
                  Provider: {record.provider} | Date: {record.date}
                </p>
                <p style={{ color: colors.text, margin: 0, fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily }}>
                  {record.summary}
                </p>
              </div>
            ))}
          </div>
        );

      case 'refills':
        return (
          <div>
            <h2 style={{ 
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '24px',
              fontWeight: '700'
            }}>
              Prescription Refills
            </h2>
            {client.medications.map((medication, index) => (
              <div key={index} style={{
                background: colors.surface,
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: textSizes.lg.fontSize, fontFamily: textSizes.lg.fontFamily, color: colors.text, margin: 0, marginBottom: '4px' }}>
                      {medication.name} ({medication.genericName})
                    </h3>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.textSecondary, margin: 0 }}>
                      {medication.dosage} - {medication.frequency}
                    </p>
                  </div>
                  <span style={{
                    background: medication.status === 'Active' ? colors.accent + '20' : colors.primary + '20',
                    color: medication.status === 'Active' ? colors.accent : colors.primary,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    fontWeight: '500'
                  }}>
                    {medication.status}
                  </span>
                </div>
                
                <div style={{ marginBottom: '16px', padding: '12px', background: colors.primary + '05', borderRadius: '8px' }}>
                  <p style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, margin: 0, marginBottom: '4px', fontWeight: '600' }}>
                    Prescribed for:
                  </p>
                  <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: 0 }}>
                    {medication.diagnosis}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, margin: 0, marginBottom: '4px', fontWeight: '600' }}>
                      Last Refill:
                    </p>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: 0 }}>
                      {medication.lastRefill}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, margin: 0, marginBottom: '4px', fontWeight: '600' }}>
                      Next Refill Available:
                    </p>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.primary, margin: 0, fontWeight: '600' }}>
                      {medication.nextRefill}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, margin: 0, marginBottom: '4px', fontWeight: '600' }}>
                      Refills Remaining:
                    </p>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: 0 }}>
                      {medication.refillsRemaining} of {medication.totalRefills}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, margin: 0, marginBottom: '4px', fontWeight: '600' }}>
                      Prescriber:
                    </p>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: 0 }}>
                      {medication.prescriber}
                    </p>
                  </div>
                </div>

                <div style={{ paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                  <p style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, margin: 0, marginBottom: '4px', fontWeight: '600' }}>
                    Pharmacy:
                  </p>
                  <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: 0, marginBottom: '8px' }}>
                    {medication.pharmacy}
                  </p>
                  <p style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, margin: 0 }}>
                    Prescription #: {medication.prescriptionNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'profile':
        return (
          <div>
            <h2 style={{ 
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '24px',
              fontWeight: '700'
            }}>
              Profile Information
            </h2>
            <div style={{
              background: colors.surface,
              borderRadius: '16px',
              padding: '32px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: textSizes.lg.fontSize, fontFamily: textSizes.lg.fontFamily, color: colors.primary, marginBottom: '16px' }}>
                    Personal Information
                  </h3>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, fontWeight: '600' }}>Name:</label>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: '4px 0 0 0' }}>{client.name}</p>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, fontWeight: '600' }}>Age:</label>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: '4px 0 0 0' }}>{client.age} years old</p>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, fontWeight: '600' }}>Date of Birth:</label>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: '4px 0 0 0' }}>{client.dateOfBirth}</p>
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: textSizes.lg.fontSize, fontFamily: textSizes.lg.fontFamily, color: colors.primary, marginBottom: '16px' }}>
                    Health Information
                  </h3>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, fontWeight: '600' }}>Height:</label>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: '4px 0 0 0' }}>{client.vitals.height}</p>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, fontWeight: '600' }}>Weight:</label>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: '4px 0 0 0' }}>{client.vitals.weight}</p>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, fontWeight: '600' }}>Blood Type:</label>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: '4px 0 0 0' }}>{client.vitals.bloodType}</p>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
                <h3 style={{ fontSize: textSizes.lg.fontSize, fontFamily: textSizes.lg.fontFamily, color: colors.primary, marginBottom: '16px' }}>
                  Insurance Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, fontWeight: '600' }}>Provider:</label>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: '4px 0 0 0' }}>{client.insurance.provider}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, fontWeight: '600' }}>Plan:</label>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: '4px 0 0 0' }}>{client.insurance.plan}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <h2 style={{ 
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '24px',
              fontWeight: '700'
            }}>
              Notifications
            </h2>
            {client.notifications.map((notification, index) => (
              <div key={index} style={{
                background: notification.read ? colors.surface : colors.surface,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '12px',
                border: notification.read ? `1px solid ${colors.border}` : `1px solid ${colors.primary}40`,
                borderLeft: notification.read ? `4px solid ${colors.border}` : `4px solid ${colors.primary}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className={
                    notification.type === 'appointment' ? 'fas fa-calendar-alt' :
                    notification.type === 'result' ? 'fas fa-chart-line' :
                    'fas fa-file-alt'
                  } style={{
                    fontSize: '16px',
                    color: colors.primary,
                    width: '20px'
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.text, margin: 0, marginBottom: '4px' }}>
                      {notification.message}
                    </p>
                    <p style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, margin: 0 }}>
                      {notification.date}
                    </p>
                  </div>
                  {!notification.read && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary,
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'appointments':
        return (
          <div>
            <h2 style={{ 
              fontSize: textSizes['2xl'].fontSize,
              fontFamily: textSizes['2xl'].fontFamily,
              color: colors.primary,
              marginBottom: '24px',
              fontWeight: '700'
            }}>
              Upcoming Appointments
            </h2>
            {client.appointments.map((appointment, index) => (
              <div key={index} style={{
                background: colors.surface,
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: textSizes.lg.fontSize, fontFamily: textSizes.lg.fontFamily, color: colors.text, margin: 0, marginBottom: '8px' }}>
                      {appointment.type}
                    </h3>
                    <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.textSecondary, margin: 0 }}>
                      {appointment.provider}
                    </p>
                  </div>
                  <span style={{
                    background: colors.primary + '20',
                    color: colors.primary,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: textSizes.sm.fontSize,
                    fontFamily: textSizes.sm.fontFamily,
                    fontWeight: '500'
                  }}>
                    {appointment.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '20px', color: colors.text }}>
                  <span style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily }}>
                    <i className="fas fa-calendar" style={{ marginRight: '8px', color: colors.primary }} />
                    {appointment.date}
                  </span>
                  <span style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily }}>
                    <i className="fas fa-clock" style={{ marginRight: '8px', color: colors.primary }} />
                    {appointment.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <i className="fas fa-file-medical-alt" style={{ fontSize: '48px', color: colors.textSecondary, marginBottom: '16px' }} />
            <h2 style={{ fontSize: textSizes.xl.fontSize, fontFamily: textSizes.xl.fontFamily, color: colors.text, marginBottom: '8px' }}>
              No Records Available
            </h2>
            <p style={{ fontSize: textSizes.base.fontSize, fontFamily: textSizes.base.fontFamily, color: colors.textSecondary }}>
              There are no records available for this section at this time.
            </p>
          </div>
        );
    }
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      background: colors.background,
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
      }}>
        {/* Sidebar */}
        <div style={{
          width: isMobile ? '100%' : '280px',
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          padding: '20px',
          display: isMobile && activeTab !== 'menu' ? 'none' : 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          minHeight: '100vh',
          position: 'relative',
        }}>
          {/* Client Info Header */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'center',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
            }}>
              <i className="fas fa-user" style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <h3 style={{ fontSize: textSizes.lg.fontSize, fontFamily: textSizes.lg.fontFamily, color: colors.text, margin: 0, marginBottom: '4px' }}>
              {client.name}
            </h3>
            <p style={{ fontSize: textSizes.sm.fontSize, fontFamily: textSizes.sm.fontFamily, color: colors.textSecondary, margin: 0 }}>
              Patient ID: #12345
            </p>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1 }}>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  background: activeTab === item.id ? colors.primary + '10' : 'transparent',
                  border: activeTab === item.id ? `1px solid ${colors.primary}30` : '1px solid transparent',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== item.id) {
                    e.target.style.background = colors.primary + '05';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== item.id) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <i className={item.icon} style={{
                  fontSize: '16px',
                  color: activeTab === item.id ? colors.primary : colors.textSecondary,
                  width: '20px'
                }} />
                <span style={{
                  fontSize: textSizes.base.fontSize,
                  fontFamily: textSizes.base.fontFamily,
                  color: activeTab === item.id ? colors.primary : colors.text,
                  fontWeight: activeTab === item.id ? '600' : '500'
                }}>
                  {item.name}
                </span>
              </button>
            ))}
          </nav>

          {/* Back Button at Bottom */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '20px',
          }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '8px',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#fee2e2';
                e.target.style.borderColor = '#fecaca';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = colors.surface;
                e.target.style.borderColor = colors.border;
              }}
            >
              <i className="fas fa-sign-out-alt" style={{
                fontSize: '14px',
                color: '#dc2626',
              }} />
              <span style={{
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: '#dc2626',
                fontWeight: '500'
              }}>
                Sign Out
              </span>
            </button>
            
            <button
              onClick={handleGoBack}
              style={{
                width: '100%',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = colors.primary + '10';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = colors.surface;
              }}
            >
              <i className="fas fa-arrow-left" style={{
                fontSize: '14px',
                color: colors.primary,
              }} />
              <span style={{
                fontSize: textSizes.sm.fontSize,
                fontFamily: textSizes.sm.fontFamily,
                color: colors.text,
                fontWeight: '500'
              }}>
                Back
              </span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '40px',
          background: colors.background,
          minHeight: '100vh',
          overflowY: 'auto',
        }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
