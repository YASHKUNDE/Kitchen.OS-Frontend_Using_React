import React, { useState, useRef } from 'react';
import './Information.css';

// --- Icons (SVG Components) ---
const IconHotel = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" /><path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16" /><rect width="20" height="15" x="2" y="4" rx="2" /><path d="M6 8h.01" /><path d="M6 12h.01" /><path d="M6 16h.01" /></svg>;
const IconBank = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M3 10h18" /><path d="M5 6l7-3 7 3" /><path d="M4 10v11" /><path d="M20 10v11" /><path d="M8 14v.01" /><path d="M12 14v.01" /><path d="M16 14v.01" /></svg>;
const IconUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconSettings = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconCloud = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>;
const IconShield = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconArrowRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
const IconArrowLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>;
const IconMenu = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>;
const IconClose = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
const IconUtensils = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>;
const IconAlert = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>;

// --- Main Component ---

const Information = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    hotelName: '', hotelAddress: '', hotelContact: '', hotelEmail: '', hotelWebsite: '', establishmentType: '',
    accountHolderName: '', bankName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '', branchName: '', upiId: '', accountType: '',
    ownerName: '', ownerDesignation: '', ownerPhone: '', ownerEmail: '', ownerAltPhone: '', ownerPan: '', ownerAddress: '',
    currency: 'INR', timezone: 'Asia/Kolkata', tableCount: '', taxRate: '', gstNumber: '', fssaiNumber: '',
    enableGST: false, enableNotifications: true, enableSMS: false, autoBackup: true, agreeTerms: false
  });

  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert("File size should be less than 5MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    let isValid = true;
    const required = (field, msg) => {
      if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
        newErrors[field] = msg || 'This field is required';
        isValid = false;
      }
    };

    if (step === 1) {
      required('hotelName', 'Hotel name is required');
      required('hotelAddress', 'Address is required');
      required('hotelContact', 'Contact number is required');
      if (formData.hotelEmail && !/\S+@\S+\.\S+/.test(formData.hotelEmail)) { newErrors.hotelEmail = 'Invalid email format'; isValid = false; }
      required('establishmentType', 'Please select a type');
    } else if (step === 2) {
      required('accountHolderName');
      required('bankName');
      required('accountNumber');
      if (formData.accountNumber !== formData.confirmAccountNumber) { newErrors.confirmAccountNumber = 'Account numbers do not match'; isValid = false; }
      required('ifscCode');
      required('accountType');
    } else if (step === 3) {
      required('ownerName');
      required('ownerDesignation');
      required('ownerPhone');
      required('ownerEmail');
    } else if (step === 4) {
      required('tableCount');
      required('taxRate');
    } else if (step === 5) {
      if (!formData.agreeTerms) { newErrors.agreeTerms = 'You must agree to the terms'; isValid = false; }
    }
    setErrors(newErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) { setCurrentStep(prev => prev + 1); window.scrollTo(0, 0); }
      else { handleSubmit(); }
    }
  };

  const prevStep = () => { if (currentStep > 1) setCurrentStep(prev => prev - 1); };
  const goToStep = (step) => { if (step <= currentStep) { setCurrentStep(step); setIsSidebarOpen(false); } };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setIsSuccess(true); }, 2000);
  };

  const renderInput = (label, name, type = "text", placeholder = "", required = false, options = null) => {
    const hasError = errors[name];
    const inputClasses = `i-form-input ${hasError ? 'error' : ''}`;

    return (
      <div className="i-form-group">
        <label className="i-form-label">{label} {required && <span className="required">*</span>}</label>
        {type === 'select' ? (
          <select name={name} value={formData[name]} onChange={handleInputChange} className={inputClasses}>
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea name={name} value={formData[name]} onChange={handleInputChange} className={inputClasses} rows="3" placeholder={placeholder}></textarea>
        ) : (
          <input type={type} name={name} value={formData[name]} onChange={handleInputChange} placeholder={placeholder} className={inputClasses} />
        )}
        {hasError && <span className="error-text"><IconAlert /> {hasError}</span>}
      </div>
    );
  };

  // --- Step Content Components ---
  const Step1Content = () => (
    <div className="i-form-grid">
      <div className="i-form-group full-width">
        <div className="i-image-upload" onClick={() => fileInputRef.current.click()}>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
          {!logoPreview ? (
            <div className="i-upload-placeholder">
              <div className="i-icon-circle"><IconCloud /></div>
              <h4>Upload Hotel Logo</h4>
              <p>PNG, JPG or SVG (max. 5MB)</p>
              <button type="button" className="i-btn-secondary small">Browse Files</button>
            </div>
          ) : (
            <div className="i-upload-preview">
              <img src={logoPreview} alt="Logo Preview" />
              <button type="button" className="i-btn-change" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>Change Logo</button>
            </div>
          )}
        </div>
      </div>
      {renderInput("Hotel / Restaurant Name", "hotelName", "text", "Enter hotel name", true)}
      {renderInput("Full Address", "hotelAddress", "textarea", "Enter complete address", true)}
      {renderInput("Contact Number", "hotelContact", "tel", "+91 9876543210", true)}
      {renderInput("Email Address", "hotelEmail", "email", "hotel@example.com")}
      {renderInput("Website", "hotelWebsite", "url", "https://www.yourhotel.com")}
      {renderInput("Establishment Type", "establishmentType", "select", "Select type", true, [
        { value: 'restaurant', label: 'Restaurant' }, { value: 'hotel', label: 'Hotel' }, { value: 'cafe', label: 'Café' }, { value: 'bar', label: 'Bar' }
      ])}
    </div>
  );

  const Step2Content = () => (
    <>
      <div className="i-info-box">
        <IconShield />
        <p>Your bank details are encrypted and securely stored. We use bank-grade security to protect your financial information.</p>
      </div>
      <div className="i-form-grid">
        {renderInput("Account Holder Name", "accountHolderName", "text", "As per bank records", true)}
        {renderInput("Bank Name", "bankName", "text", "Enter bank name", true)}
        {renderInput("Account Number", "accountNumber", "text", "Enter account number", true)}
        {renderInput("Confirm Account Number", "confirmAccountNumber", "text", "Re-enter account number", true)}
        {renderInput("IFSC Code", "ifscCode", "text", "e.g., SBIN0001234", true)}
        {renderInput("Branch Name", "branchName", "text", "Enter branch name")}
        {renderInput("UPI ID", "upiId", "text", "yourname@upi")}
        {renderInput("Account Type", "accountType", "select", "Select account type", true, [
          { value: 'current', label: 'Current Account' }, { value: 'savings', label: 'Savings Account' }
        ])}
      </div>
    </>
  );

  const Step3Content = () => (
    <div className="i-form-grid">
      {renderInput("Full Name", "ownerName", "text", "Enter full name", true)}
      {renderInput("Designation", "ownerDesignation", "select", "Select designation", true, [
        { value: 'owner', label: 'Owner' }, { value: 'proprietor', label: 'Proprietor' }, { value: 'manager', label: 'Manager' }
      ])}
      {renderInput("Mobile Number", "ownerPhone", "tel", "+91 9876543210", true)}
      {renderInput("Email Address", "ownerEmail", "email", "owner@example.com", true)}
      {renderInput("Alternate Phone", "ownerAltPhone", "tel", "+91 9876543210")}
      {renderInput("PAN Number", "ownerPan", "text", "ABCDE1234F")}
      {renderInput("Residential Address", "ownerAddress", "textarea", "Enter complete residential address")}
    </div>
  );

  const Step4Content = () => (
    <div className="i-form-grid">
      {renderInput("Currency", "currency", "select", "", true, [{ value: 'INR', label: '₹ Indian Rupee (INR)' }, { value: 'USD', label: '$ US Dollar (USD)' }])}
      {renderInput("Timezone", "timezone", "select", "", true, [{ value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' }, { value: 'America/New_York', label: 'America/New York (EST)' }])}
      {renderInput("Number of Tables", "tableCount", "number", "e.g., 25", true)}
      {renderInput("Default Tax Rate (%)", "taxRate", "number", "e.g., 5", true)}

      <div className="i-form-group full-width">
        <div className={`i-toggle-wrapper ${formData.enableGST ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, enableGST: !p.enableGST }))}>
          <div className="i-toggle-switch"></div>
          <span className="i-toggle-label">Enable GST / Tax Registration</span>
        </div>
      </div>

      {formData.enableGST && (
        <div className="i-form-group full-width animate-fade-in">
          <div className="i-form-grid">
            {renderInput("GSTIN Number", "gstNumber", "text", "22AAAAA0000A1Z5")}
            {renderInput("FSSAI License Number", "fssaiNumber", "text", "Enter FSSAI number")}
          </div>
        </div>
      )}

      <div className="i-form-group full-width checkbox-group">
        <label className={`i-checkbox-card ${formData.enableNotifications ? 'checked' : ''}`}>
          <input type="checkbox" name="enableNotifications" checked={formData.enableNotifications} onChange={handleInputChange} />
          <div className="i-checkbox-visual"><IconCheck /></div>
          <div className="i-checkbox-content">
            <h4>Email Notifications</h4>
            <p>Receive daily reports, order alerts, and system notifications via email</p>
          </div>
        </label>
      </div>
    </div>
  );

  const Step5Content = () => (
    <div className="i-preview-container">
      <div className="i-preview-card">
        <div className="i-preview-header">
          <h3><IconHotel /> Hotel Details</h3>
          <button onClick={() => setCurrentStep(1)} className="i-edit-btn">Edit</button>
        </div>
        <div className="i-preview-grid">
          <div className="i-preview-item full"><span>Address</span><p>{formData.hotelAddress || '-'}</p></div>
          <div className="i-preview-item"><span>Contact</span><p>{formData.hotelContact || '-'}</p></div>
          <div className="i-preview-item"><span>Email</span><p>{formData.hotelEmail || '-'}</p></div>
          <div className="i-preview-item"><span>Type</span><p>{formData.establishmentType || '-'}</p></div>
        </div>
      </div>

      <div className="i-preview-card">
        <div className="i-preview-header">
          <h3><IconBank /> Bank Details</h3>
          <button onClick={() => setCurrentStep(2)} className="i-edit-btn">Edit</button>
        </div>
        <div className="i-preview-grid">
          <div className="i-preview-item"><span>Account Holder</span><p>{formData.accountHolderName || '-'}</p></div>
          <div className="i-preview-item"><span>Bank Name</span><p>{formData.bankName || '-'}</p></div>
          <div className="i-preview-item"><span>Account Number</span><p>{formData.accountNumber ? `****${formData.accountNumber.slice(-4)}` : '-'}</p></div>
          <div className="i-preview-item"><span>IFSC</span><p>{formData.ifscCode || '-'}</p></div>
        </div>
      </div>

      <div className="i-form-group full-width checkbox-group" style={{ marginTop: '1rem' }}>
        <label className={`i-checkbox-card ${formData.agreeTerms ? 'checked' : ''}`}>
          <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleInputChange} />
          <div className="i-checkbox-visual"><IconCheck /></div>
          <div className="i-checkbox-content">
            <h4>I agree to the Terms & Conditions</h4>
            <p>By submitting, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </label>
        {errors.agreeTerms && <span className="i-error-text">{errors.agreeTerms}</span>}
      </div>
    </div>
  );

  const SuccessContent = () => (
    <div className="i-success-container">
      <div className="i-success-icon"><IconCheck /></div>
      <h2>Setup Complete!</h2>
      <p>Your Kitchen.OS profile has been successfully created. Redirecting you to the dashboard...</p>
      <div className="i-success-actions">
        <button className="i-btn-primary" onClick={() => window.location.reload()}>Go to Dashboard</button>
      </div>
    </div>
  );

  if (isSuccess) {
    return (
      <div className="i-app-container">
        <div className="i-layout-wrapper">
          <main className="i-main-area">
            <div className="i-main-content">
              <div className="i-form-card" style={{ boxShadow: 'none', border: 'none' }}>
                <SuccessContent />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="i-app-container">
      <div className="i-layout-wrapper">

        {/* Mobile Header */}
        <header className="i-mobile-header">
          <button className="i-menu-btn" onClick={() => setIsSidebarOpen(true)}><IconMenu /></button>
          <div className="i-mobile-logo"><IconUtensils /><span>Kitchen<span>.OS</span></span></div>
          <div style={{ width: '44px' }}></div>
        </header>

        {/* Mobile Progress */}
        <div className="i-mobile-progress">
          <div className="i-progress-bar-bg">
            <div className="i-progress-bar-fill" style={{ width: `${(currentStep / 5) * 100}%` }}></div>
          </div>
          <span>Step {currentStep} of 5</span>
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && <div className="i-mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

        {/* Sidebar */}
        <aside className={`i-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="i-sidebar-content">
            <button className="close-btn" onClick={() => setIsSidebarOpen(false)}><IconClose /></button>
            <div className="i-logo">
              <div className="i-logo-icon"><IconUtensils /></div>
              <div className="i-logo-text">Kitchen<span>.OS</span></div>
            </div>
            <nav className="i-steps-nav">
              {[
                { id: 1, title: 'Hotel Details', desc: 'Basic business info' },
                { id: 2, title: 'Bank Account', desc: 'Payment setup' },
                { id: 3, title: 'Owner Details', desc: 'Owner information' },
                { id: 4, title: 'Preferences', desc: 'System config' },
                { id: 5, title: 'Review & Submit', desc: 'Confirm details' }
              ].map(step => (
                <button
                  key={step.id}
                  className={`i-step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                  onClick={() => goToStep(step.id)}
                >
                  <div className="i-step-number">{currentStep > step.id ? <IconCheck /> : step.id}</div>
                  <div className="i-step-text">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="i-main-area">
          <div className="i-main-content">
            <div className="i-form-card">

              {/* Section Header */}
              <div className="i-section-header">
                <div className="i-header-icon">
                  {currentStep === 1 && <IconHotel />}
                  {currentStep === 2 && <IconBank />}
                  {currentStep === 3 && <IconUser />}
                  {currentStep === 4 && <IconSettings />}
                  {currentStep === 5 && <IconCheck />}
                </div>
                <div>
                  <h2 className="i-header-title">
                    {currentStep === 1 && "Hotel / Restaurant Details"}
                    {currentStep === 2 && "Bank Account Details"}
                    {currentStep === 3 && "Owner / Proprietor Details"}
                    {currentStep === 4 && "System Preferences"}
                    {currentStep === 5 && "Review Your Details"}
                  </h2>
                  <p className="i-header-subtitle">
                    {currentStep === 1 && "Enter your establishment's basic information"}
                    {currentStep === 2 && "Add your bank details for payments and settlements"}
                    {currentStep === 3 && "Primary owner or authorized person information"}
                    {currentStep === 4 && "Configure Kitchen.OS settings for your business"}
                    {currentStep === 5 && "Please verify all information before submitting"}
                  </p>
                </div>
              </div>

              {/* Dynamic Content */}
              <div className="i-form-section">
                {currentStep === 1 && <Step1Content />}
                {currentStep === 2 && <Step2Content />}
                {currentStep === 3 && <Step3Content />}
                {currentStep === 4 && <Step4Content />}
                {currentStep === 5 && <Step5Content />}
              </div>

              {/* Actions */}
              <div className="i-form-actions">
                <button className="i-btn-secondary" onClick={prevStep} style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}>
                  <IconArrowLeft /> Previous
                </button>

                <button className={`i-btn-primary ${currentStep === 5 ? 'i-btn-success' : ''}`} onClick={nextStep} disabled={isSubmitting}>
                  {isSubmitting ? (<span className="spinner"></span>) : (
                    <>
                      {currentStep === 5 ? 'Submit & Complete' : 'Continue'}
                      {currentStep !== 5 && <IconArrowRight />}
                      {currentStep === 5 && <IconCheck />}
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Information;