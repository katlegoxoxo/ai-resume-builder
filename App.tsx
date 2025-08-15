import React, { useState, useCallback, useReducer, useEffect, useRef } from 'react';
import { produce } from 'immer';
import {
  ResumeData, TemplateId, TemplateStyle, JobAnalysisResult, ATSCheckResult
} from './types';
import { INITIAL_RESUME_DATA, TEMPLATES, FONT_OPTIONS, COLOR_OPTIONS, INITIAL_STYLE } from './constants';
import * as geminiService from './services/geminiService';
import { exportToPDF, exportToDOCX } from './lib/exporter';
import { TemplateRenderer } from './components/TemplateRenderer';
import { IconAnalyze, IconCheck, IconDesign, IconDownload, IconMagic, IconPlus, IconStar, IconTrash, IconUpload, IconWarning } from './components/icons';

// --- Helper Components (defined outside to prevent re-renders) ---

const AnimatedCounter: React.FC<{ endValue: number; duration?: number; }> = ({ endValue, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      // Use an easing function for a smoother, more dynamic animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const progress = easeOutCubic(Math.min(elapsedTime / duration, 1));
      
      const nextValue = Math.floor(startValue + (endValue - startValue) * progress);
      setCount(nextValue);

      if (elapsedTime < duration) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue); // Ensure it finishes on the exact value
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [endValue, duration]);

  return <>{count}</>;
};

const Spinner: React.FC<{className?: string}> = ({className = "h-5 w-5 border-white"}) => (
  <div className={`animate-spin rounded-full border-b-2 ${className}`}></div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const Input: React.FC<InputProps> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      {...props}
      className="mt-1 block w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm placeholder:text-gray-400"
    />  </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}
const TextArea: React.FC<TextAreaProps> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea {...props} rows={4} className="mt-1 block w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm placeholder:text-gray-400" />
  </div>
);


// --- Main App Component ---

type ResumeAction =
  | { type: 'UPDATE_FIELD'; section: keyof ResumeData | 'workExperience' | 'education' | 'skills' | 'projects'; field: string; value: any; index?: number }
  | { type: 'UPDATE_BULLET'; workIndex: number; bulletIndex: number; value: string }
  | { type: 'ADD_ITEM'; section: 'workExperience' | 'education' | 'skills' | 'projects' }
  | { type: 'REMOVE_ITEM'; section: 'workExperience' | 'education' | 'skills' | 'projects'; id: string }
  | { type: 'SET_RESUME'; resume: ResumeData };

const resumeReducer = produce((draft: ResumeData, action: ResumeAction) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      if (action.index !== undefined && Array.isArray(draft[action.section])) {
        (draft[action.section] as any[])[action.index][action.field] = action.value;
      } else if (typeof draft[action.section] === 'object' && !Array.isArray(draft[action.section])) {
        (draft[action.section] as any)[action.field] = action.value;
      } else {
        (draft as any)[action.section] = action.value;
      }
      break;
    case 'UPDATE_BULLET':
      draft.workExperience[action.workIndex].description[action.bulletIndex] = action.value;
      break;
    case 'ADD_ITEM': {
      const newId = `${action.section}-${Date.now()}`;
      if (action.section === 'workExperience') draft.workExperience.push({ id: newId, jobTitle: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: [''] });
      if (action.section === 'education') draft.education.push({ id: newId, institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' });
      if (action.section === 'skills') draft.skills.push({ id: newId, name: '' });
      if (action.section === 'projects') draft.projects.push({ id: newId, name: '', description: '', url: '' });
      break;
    }
    case 'REMOVE_ITEM':
      (draft[action.section] as any[]) = (draft[action.section] as any[]).filter(item => item.id !== action.id);
      break;
    case 'SET_RESUME':
      return action.resume;
  }
});


export default function App() {
  const [resumeData, dispatch] = useReducer(resumeReducer, INITIAL_RESUME_DATA);
  const [template, setTemplate] = useState<TemplateId>(TemplateId.MODERN);
  const [style, setStyle] = useState<TemplateStyle>(INITIAL_STYLE);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [analysis, setAnalysis] = useState<JobAnalysisResult | null>(null);
  const [atsCheck, setAtsCheck] = useState<ATSCheckResult | null>(null);
  const [loading, setLoading] = useState({ analysis: false, ats: false, suggestions: '', parsing: false, coverLetter: false });
  const [activeTab, setActiveTab] = useState('edit');
  const [coverLetter, setCoverLetter] = useState<string | null>(null);

  const handleFieldChange = (section: keyof ResumeData | 'workExperience' | 'education' | 'skills' | 'projects', field: string, value: any, index?: number) => {
    dispatch({ type: 'UPDATE_FIELD', section, field, value, index });
  };
  const handleBulletChange = (workIndex: number, bulletIndex: number, value: string) => {
    dispatch({ type: 'UPDATE_BULLET', workIndex, bulletIndex, value });
  };

  const handleAddItem = (section: 'workExperience' | 'education' | 'skills' | 'projects') => dispatch({ type: 'ADD_ITEM', section });
  const handleRemoveItem = (section: 'workExperience' | 'education' | 'skills' | 'projects', id: string) => dispatch({ type: 'REMOVE_ITEM', section, id });

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(prev => ({ ...prev, parsing: true }));
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const dataUrl = event.target?.result as string;
            const base64Data = dataUrl.split(',')[1];
            if (!base64Data) throw new Error("Could not read file data.");
            
            const parsedData = await geminiService.parseResume({
                data: base64Data,
                mimeType: file.type,
            });

            dispatch({ type: 'SET_RESUME', resume: parsedData });
            setActiveTab('edit'); // Switch to edit tab to show results
            alert("Your resume has been parsed and the form has been filled out!");

        } catch (error) {
            console.error(error);
            alert((error as Error).message);
        } finally {
            setLoading(prev => ({ ...prev, parsing: false }));
            e.target.value = ''; // Reset file input
        }
    };
    reader.onerror = () => {
        alert("Failed to read the file.");
        setLoading(prev => ({ ...prev, parsing: false }));
        e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateSuggestions = async (workIndex: number) => {
    const job = resumeData.workExperience[workIndex];
    if (!job.jobTitle || !job.company) {
      alert("Please enter a Job Title and Company first.");
      return;
    }
    setLoading(prev => ({ ...prev, suggestions: job.id }));
    try {
      const suggestions = await geminiService.generateSmartSuggestions(job.jobTitle, job.company);
      handleFieldChange('workExperience', 'description', suggestions, workIndex);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, suggestions: '' }));
    }
  };

  const handleAnalyzeJob = useCallback(async () => {
    if (!jobDescription.trim()) {
      alert("Please paste a job description first.");
      return;
    }
    setLoading(prev => ({ ...prev, analysis: true }));
    setAnalysis(null);
    setCoverLetter(null);
    try {
      const result = await geminiService.analyzeJobDescription(resumeData, jobDescription);
      setAnalysis(result);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  }, [resumeData, jobDescription]);

  const handleAtsCheck = useCallback(async () => {
    setLoading(prev => ({ ...prev, ats: true }));
    setAtsCheck(null);
    try {
      const result = await geminiService.checkATSCompatibility(resumeData);
      setAtsCheck(result);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setLoading(prev => ({ ...prev, ats: false }));
    }
  }, [resumeData]);

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription.trim() || !analysis) {
        alert("Please analyze a job description first.");
        return;
    }
    setLoading(prev => ({ ...prev, coverLetter: true }));
    setCoverLetter(null);
    try {
        const result = await geminiService.generateCoverLetter(resumeData, jobDescription);
        setCoverLetter(result);
    } catch (error) {
        alert((error as Error).message);
    } finally {
        setLoading(prev => ({ ...prev, coverLetter: false }));
    }
  };

  const renderForm = () => (
    <div className="space-y-6">
      {/* Personal Info */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" placeholder="e.g., Jane Doe" value={resumeData.personalInfo.name} onChange={e => handleFieldChange('personalInfo', 'name', e.target.value)} />
          <Input label="Email" type="email" placeholder="e.g., jane.doe@example.com" value={resumeData.personalInfo.email} onChange={e => handleFieldChange('personalInfo', 'email', e.target.value)} />
          <Input label="Phone" type="tel" placeholder="e.g., 123-456-7890" value={resumeData.personalInfo.phone} onChange={e => handleFieldChange('personalInfo', 'phone', e.target.value)} />
          <Input label="LinkedIn" placeholder="e.g., linkedin.com/in/janedoe" value={resumeData.personalInfo.linkedin} onChange={e => handleFieldChange('personalInfo', 'linkedin', e.target.value)} />
          <Input label="Website/Portfolio" placeholder="e.g., janedoe.dev" value={resumeData.personalInfo.website} onChange={e => handleFieldChange('personalInfo', 'website', e.target.value)} />
          <Input label="Address" placeholder="e.g., San Francisco, CA" value={resumeData.personalInfo.address} onChange={e => handleFieldChange('personalInfo', 'address', e.target.value)} />
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-bold text-lg mb-2">Professional Summary</h3>
        <TextArea label="Summary" placeholder="A brief, compelling summary of your career, skills, and goals." value={resumeData.summary} onChange={e => handleFieldChange('summary', 'summary', e.target.value)} />
      </div>

      {/* Work Experience */}
      <div>
        <h3 className="font-bold text-lg mb-4">Work Experience</h3>
        {resumeData.workExperience.map((job, index) => (
          <div key={job.id} className="p-4 bg-white rounded-lg shadow mb-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Job Title" placeholder="e.g., Senior Software Engineer" value={job.jobTitle} onChange={e => handleFieldChange('workExperience', 'jobTitle', e.target.value, index)} />
              <Input label="Company" placeholder="e.g., Tech Solutions Inc." value={job.company} onChange={e => handleFieldChange('workExperience', 'company', e.target.value, index)} />
              <Input label="Location" placeholder="e.g., San Francisco, CA" value={job.location} onChange={e => handleFieldChange('workExperience', 'location', e.target.value, index)} />
              <div className="flex space-x-4">
                <Input label="Start Date" placeholder="e.g., Jan 2018" value={job.startDate} onChange={e => handleFieldChange('workExperience', 'startDate', e.target.value, index)} />
                <Input label="End Date" placeholder="e.g., Present" value={job.endDate} onChange={e => handleFieldChange('workExperience', 'endDate', e.target.value, index)} disabled={job.isCurrent} />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description / Achievements</h4>
              {job.description.map((desc, descIndex) => (
                <input key={descIndex} value={desc}
                  placeholder="Describe an achievement or responsibility"
                  onChange={e => handleBulletChange(index, descIndex, e.target.value)}
                  className="mb-2 block w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm placeholder:text-gray-400"
                />
              ))}
              <button
                onClick={() => handleGenerateSuggestions(index)}
                disabled={loading.suggestions === job.id}
                className="mt-2 text-sm inline-flex items-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm text-white bg-accent hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              >
                {loading.suggestions === job.id ? <Spinner className="h-4 w-4 border-white"/> : <IconMagic className="w-4 h-4 mr-2" />}
                AI Suggestions
              </button>
            </div>
            <button onClick={() => handleRemoveItem('workExperience', job.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><IconTrash className="w-5 h-5" /></button>
          </div>
        ))}
        <button onClick={() => handleAddItem('workExperience')} className="mt-2 text-sm inline-flex items-center text-primary hover:text-primary-dark font-semibold"><IconPlus className="w-4 h-4 mr-1" /> Add Experience</button>
      </div>

       {/* Education */}
      <div>
        <h3 className="font-bold text-lg mb-4 mt-6">Education</h3>
        {resumeData.education.map((edu, index) => (
            <div key={edu.id} className="p-4 bg-white rounded-lg shadow mb-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Institution" placeholder="e.g., State University" value={edu.institution} onChange={e => handleFieldChange('education', 'institution', e.target.value, index)} />
                    <Input label="Degree" placeholder="e.g., Master of Science" value={edu.degree} onChange={e => handleFieldChange('education', 'degree', e.target.value, index)} />
                    <Input label="Field of Study" placeholder="e.g., Computer Science" value={edu.fieldOfStudy} onChange={e => handleFieldChange('education', 'fieldOfStudy', e.target.value, index)} />
                    <div className="flex space-x-4">
                        <Input label="Start Date" placeholder="e.g., 2013" value={edu.startDate} onChange={e => handleFieldChange('education', 'startDate', e.target.value, index)} />
                        <Input label="End Date" placeholder="e.g., 2015" value={edu.endDate} onChange={e => handleFieldChange('education', 'endDate', e.target.value, index)} />
                    </div>
                </div>
                <button onClick={() => handleRemoveItem('education', edu.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><IconTrash className="w-5 h-5" /></button>
            </div>
        ))}
        <button onClick={() => handleAddItem('education')} className="mt-2 text-sm inline-flex items-center text-primary hover:text-primary-dark font-semibold"><IconPlus className="w-4 h-4 mr-1" /> Add Education</button>
      </div>

       {/* Skills */}
      <div>
        <h3 className="font-bold text-lg mb-4 mt-6">Skills</h3>
        <div className="p-4 bg-white rounded-lg shadow">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {resumeData.skills.map((skill, index) => (
                <div key={skill.id} className="relative">
                    <input value={skill.name} onChange={e => handleFieldChange('skills', 'name', e.target.value, index)}
                        className="w-full pr-8 px-3 py-2 bg-white text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm placeholder:text-gray-400"
                        placeholder="e.g., TypeScript"
                    />
                    <button onClick={() => handleRemoveItem('skills', skill.id)} className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-red-500"><IconTrash className="w-4 h-4" /></button>
                </div>
            ))}
            </div>
             <button onClick={() => handleAddItem('skills')} className="mt-4 text-sm inline-flex items-center text-primary hover:text-primary-dark font-semibold"><IconPlus className="w-4 h-4 mr-1" /> Add Skill</button>
        </div>
      </div>

       {/* Projects */}
        <div>
            <h3 className="font-bold text-lg mb-4 mt-6">Projects</h3>
            {resumeData.projects.map((proj, index) => (
                <div key={proj.id} className="p-4 bg-white rounded-lg shadow mb-4 relative">
                    <div className="grid grid-cols-1 gap-4">
                        <Input label="Project Name" placeholder="e.g., Portfolio Website" value={proj.name} onChange={e => handleFieldChange('projects', 'name', e.target.value, index)} />
                        <Input label="Project URL" placeholder="e.g., myproject.com" value={proj.url} onChange={e => handleFieldChange('projects', 'url', e.target.value, index)} />
                        <TextArea label="Description" placeholder="A brief description of the project." value={proj.description} onChange={e => handleFieldChange('projects', 'description', e.target.value, index)} />
                    </div>
                    <button onClick={() => handleRemoveItem('projects', proj.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><IconTrash className="w-5 h-5" /></button>
                </div>
            ))}
            <button onClick={() => handleAddItem('projects')} className="mt-2 text-sm inline-flex items-center text-primary hover:text-primary-dark font-semibold"><IconPlus className="w-4 h-4 mr-1" /> Add Project</button>
        </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-2">Job Description Analysis</h3>
        <p className="text-sm text-gray-600 mb-4">Paste the job description below to analyze how your resume matches up.</p>
        <TextArea label="Job Description" placeholder="Paste the full job description here to analyze it against your resume." value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
        <button
          onClick={handleAnalyzeJob}
          disabled={loading.analysis}
          className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {loading.analysis ? <Spinner /> : <IconAnalyze className="w-5 h-5 mr-2" />}
          Analyze Match
        </button>
      </div>
      {analysis && (
        <div className="p-4 bg-white rounded-lg shadow-md animate-fade-in-up">
          <h4 className="font-bold text-lg mb-4">Analysis Report</h4>
          <div className="text-center mb-4">
            <p className="text-gray-600">Match Score</p>
            <p className={`text-5xl font-bold ${analysis.matchScore > 75 ? 'text-green-500' : 'text-yellow-500'}`}>{analysis.matchScore}%</p>
          </div>
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold flex items-center"><IconStar className="w-4 h-4 mr-2 text-green-500" /> Improvement Suggestions</h5>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-1 pl-2">
                {analysis.improvementSuggestions.summary && <li><strong>Summary:</strong> {analysis.improvementSuggestions.summary}</li>}
                {analysis.improvementSuggestions.experience && <li><strong>Experience:</strong> {analysis.improvementSuggestions.experience}</li>}
              </ul>
            </div>
            <div>
              <h5 className="font-semibold flex items-center"><IconWarning className="w-4 h-4 mr-2 text-yellow-500" /> Keyword Gaps</h5>
              <div className="flex flex-wrap gap-2 mt-2">
                {analysis.keywordGaps.map(k => <span key={k} className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{k}</span>)}
              </div>
            </div>
            <div>
              <h5 className="font-semibold flex items-center"><IconWarning className="w-4 h-4 mr-2 text-red-500" /> Missing Skills</h5>
              <div className="flex flex-wrap gap-2 mt-2">
                {analysis.missingSkills.map(k => <span key={k} className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{k}</span>)}
              </div>
            </div>
          </div>
        </div>
      )}
      {analysis && (
        <div className="mt-6 animate-fade-in-up">
          <h3 className="font-bold text-lg mb-2">AI Cover Letter Generator</h3>
          <p className="text-sm text-gray-600 mb-4">Generate a tailored cover letter for this job based on your resume.</p>
          <button
            onClick={handleGenerateCoverLetter}
            disabled={loading.coverLetter || loading.analysis}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-accent hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            {loading.coverLetter ? <Spinner /> : <IconMagic className="w-5 h-5 mr-2" />}
            Generate Cover Letter
          </button>
          {loading.coverLetter && <div className="text-center p-4">Generating your cover letter...</div>}
          {coverLetter && (
              <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
                  <h4 className="font-semibold text-gray-800 mb-2">Your Generated Cover Letter:</h4>
                  <TextArea
                      label=""
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={15}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                      placeholder="Your cover letter will appear here..."
                  />
                  <button
                      onClick={() => {
                        navigator.clipboard.writeText(coverLetter);
                        alert('Copied to clipboard!');
                      }}
                      className="mt-2 text-sm inline-flex items-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-gray-700"
                  >
                      Copy to Clipboard
                  </button>
              </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDesignAndExport = () => (
    <div className="space-y-6">
      {/* ATS Check */}
      <div>
        <h3 className="font-bold text-lg mb-2">ATS Compatibility Check</h3>
        <p className="text-sm text-gray-600 mb-4">Run a quick check to see how well your resume might be parsed by an Applicant Tracking System.</p>
        <button onClick={handleAtsCheck} disabled={loading.ats} className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
          {loading.ats ? <Spinner /> : <IconCheck className="w-5 h-5 mr-2" />}
          Run ATS Check
        </button>
        {atsCheck && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-md animate-fade-in-up">
            <h4 className="font-bold text-lg mb-4 text-black">ATS Report</h4>
            <div className="text-center mb-4">
              <p className="text-gray-600">ATS Score</p>
              <p className={`text-5xl font-bold ${atsCheck.atsScore > 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                <AnimatedCounter endValue={atsCheck.atsScore} />
                <span className="text-3xl text-gray-400">/100</span>
              </p>
            </div>
            <ul className="list-disc list-inside text-sm text-black mt-4 pl-2 space-y-1">
              {atsCheck.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </div>
      {/* Design */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4 text-black">Design &amp; Customization</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Template</label>
            <div className="flex space-x-2 mt-1">
              {TEMPLATES.map(t => <button key={t.id} onClick={() => setTemplate(t.id)} className={`px-4 py-2 text-sm rounded-md ${template === t.id ? 'bg-primary text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{t.name}</button>)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Font Family</label>
            <select value={style.fontFamily} onChange={e => setStyle(s => ({ ...s, fontFamily: e.target.value }))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white text-black border border-black focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
              {FONT_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
            <div className="flex space-x-2 mt-1">
              {COLOR_OPTIONS.map(c => <button key={c.id} onClick={() => setStyle(s => ({ ...s, primaryColor: c.hex }))} className="w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" style={{ backgroundColor: c.hex }}></button>)}
            </div>
          </div>
        </div>
      </div>
      {/* Export */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4">Export Resume</h3>
        <div className="flex space-x-4">
          <button onClick={() => exportToPDF('resume-preview-content', 'resume')} className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700">
            <IconDownload className="w-5 h-5 mr-2" /> PDF
          </button>
          <button onClick={() => exportToDOCX(resumeData, 'resume')} className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            <IconDownload className="w-5 h-5 mr-2" /> DOCX
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center"><IconMagic className="w-6 h-6 mr-2 text-primary" />Intelligent Resume Generator</h1>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto py-6 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner lg:col-span-5">
          {/* CV Uploader Section */}
          <div className="mb-6 p-4 border border-dashed rounded-lg bg-white shadow-sm">
            <h3 className="font-bold text-lg text-gray-800">Start Here</h3>
            <p className="text-sm text-gray-600 mb-3">Upload your existing CV to auto-fill the form.</p>
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleResumeUpload}
              disabled={loading.parsing}
            />
            <label
              htmlFor="resume-upload"
              className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent font-medium rounded-md shadow-sm text-white transition-colors
                         ${loading.parsing ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark cursor-pointer'}`}
            >
              {loading.parsing ? (
                <>
                  <Spinner />
                  <span className="ml-2">Parsing Your Resume...</span>
                </>
              ) : (
                <>
                  <IconUpload className="w-5 h-5 mr-2" />
                  <span>Upload & Parse CV</span>
                </>
              )}
            </label>
          </div>

          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button onClick={() => setActiveTab('edit')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'edit' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Edit Content</button>
              <button onClick={() => setActiveTab('analyze')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analyze' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Job Analysis</button>
              <button onClick={() => setActiveTab('design')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'design' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Design & Export</button>
            </nav>
          </div>
          {activeTab === 'edit' && renderForm()}
          {activeTab === 'analyze' && renderAnalysis()}
          {activeTab === 'design' && renderDesignAndExport()}
        </div>
        <div className="lg:col-span-7 flex justify-center items-start">
          <div className="transform scale-[0.8] lg:scale-[0.9] origin-top">
            <TemplateRenderer templateId={template} data={resumeData} style={style} />
          </div>
        </div>
      </main>
    </div>
  );
}