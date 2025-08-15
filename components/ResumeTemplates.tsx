import React from 'react';
import { ResumeData, TemplateStyle } from '../types';
import { Linkedin, Globe, Phone, Mail } from 'lucide-react';

interface TemplateProps {
  id: string;
  data: ResumeData;
  style: TemplateStyle;
}

const Section: React.FC<{ title: string; color: string; children: React.ReactNode; }> = ({ title, color, children }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold uppercase tracking-wider pb-1 mb-2" style={{ borderBottom: `2px solid ${color}` }}>
      {title}
    </h2>
    {children}
  </div>
);

// Template 1: Modern
export const ModernTemplate: React.FC<TemplateProps> = ({ id, data, style }) => (
  <div id={id} className={`bg-white p-8 shadow-lg ${style.fontFamily} text-gray-800 w-[8.5in] min-h-[11in]`}>
    <header className="text-center mb-8">
      <h1 className="text-4xl font-bold" style={{color: style.primaryColor}}>{data.personalInfo.name}</h1>
      <div className="flex justify-center items-center space-x-4 mt-2 text-sm text-gray-600">
        <span>{data.personalInfo.email}</span>
        <span>&bull;</span>
        <span>{data.personalInfo.phone}</span>
        <span>&bull;</span>
        <span>{data.personalInfo.linkedin}</span>
      </div>
    </header>
    <main>
      <Section title="Summary" color={style.primaryColor}><p className="text-sm">{data.summary}</p></Section>
      <Section title="Work Experience" color={style.primaryColor}>
        {data.workExperience.map(job => (
          <div key={job.id} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-bold text-md">{job.jobTitle}</h3>
              <span className="text-sm font-light">{job.startDate} - {job.isCurrent ? 'Present' : job.endDate}</span>
            </div>
            <p className="text-sm italic">{job.company}, {job.location}</p>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
              {job.description.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Education" color={style.primaryColor}>
        {data.education.map(edu => (
          <div key={edu.id} className="flex justify-between">
            <div>
              <h3 className="font-bold text-md">{edu.institution}</h3>
              <p className="text-sm">{edu.degree}, {edu.fieldOfStudy}</p>
            </div>
            <span className="text-sm font-light">{edu.startDate} - {edu.endDate}</span>
          </div>
        ))}
      </Section>
      <Section title="Skills" color={style.primaryColor}>
        <p className="text-sm">{data.skills.map(s => s.name).join(' | ')}</p>
      </Section>
    </main>
  </div>
);

// Template 2: Professional
export const ProfessionalTemplate: React.FC<TemplateProps> = ({ id, data, style }) => (
  <div id={id} className={`bg-white p-8 shadow-lg ${style.fontFamily} text-gray-800 w-[8.5in] min-h-[11in] flex`}>
    <aside className="w-1/3 pr-8" style={{backgroundColor: style.primaryColor, color: 'white'}}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">{data.personalInfo.name}</h1>
        <div className="space-y-3 text-sm">
          <div className="flex items-center"><Mail className="w-4 h-4 mr-2" /><span>{data.personalInfo.email}</span></div>
          <div className="flex items-center"><Phone className="w-4 h-4 mr-2" /><span>{data.personalInfo.phone}</span></div>
          <div className="flex items-center"><Linkedin className="w-4 h-4 mr-2" /><span>{data.personalInfo.linkedin}</span></div>
          <div className="flex items-center"><Globe className="w-4 h-4 mr-2" /><span>{data.personalInfo.website}</span></div>
        </div>
        <div className="mt-8">
          <h2 className="text-lg font-semibold uppercase tracking-wider mb-2">Skills</h2>
          <ul className="list-none space-y-1 text-sm">
            {data.skills.map(s => <li key={s.id}>{s.name}</li>)}
          </ul>
        </div>
        <div className="mt-8">
          <h2 className="text-lg font-semibold uppercase tracking-wider mb-2">Education</h2>
           {data.education.map(edu => (
            <div key={edu.id} className="text-sm mb-2">
              <h3 className="font-bold">{edu.institution}</h3>
              <p>{edu.degree}</p>
              <p>{edu.fieldOfStudy}</p>
              <p className="opacity-80">{edu.startDate}-{edu.endDate}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
    <main className="w-2/3 pl-8">
      <Section title="Summary" color={style.primaryColor}><p className="text-sm">{data.summary}</p></Section>
      <Section title="Work Experience" color={style.primaryColor}>
        {data.workExperience.map(job => (
          <div key={job.id} className="mb-4">
            <h3 className="font-bold text-md">{job.jobTitle} | {job.company}</h3>
            <p className="text-sm italic mb-1">{job.location} | {job.startDate} - {job.isCurrent ? 'Present' : job.endDate}</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {job.description.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        ))}
      </Section>
    </main>
  </div>
);


// Template 3: Creative (New Design)
const CreativeSection: React.FC<{ title: string; color: string; children: React.ReactNode; }> = ({ title, color, children }) => (
    <section className="mb-8">
      <div className="flex items-center mb-4">
        <div className="flex-grow border-t" style={{ borderColor: color, opacity: 0.5 }}></div>
        <h2 className="text-lg font-bold uppercase tracking-widest mx-4" style={{ color }}>{title}</h2>
        <div className="flex-grow border-t" style={{ borderColor: color, opacity: 0.5 }}></div>
      </div>
      {children}
    </section>
  );
  
export const CreativeTemplate: React.FC<TemplateProps> = ({ id, data, style }) => (
    <div id={id} className={`bg-white shadow-lg ${style.fontFamily} text-gray-800 w-[8.5in] min-h-[11in] p-10 text-sm`}>
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold" style={{ color: style.primaryColor }}>{data.personalInfo.name}</h1>
        <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-600">
          <a href={`mailto:${data.personalInfo.email}`} className="flex items-center hover:text-primary-dark"><Mail size={14} className="mr-1.5" />{data.personalInfo.email}</a>
          <span className="text-gray-300 hidden md:inline">|</span>
          <a href={`tel:${data.personalInfo.phone}`} className="flex items-center hover:text-primary-dark"><Phone size={14} className="mr-1.5" />{data.personalInfo.phone}</a>
          <span className="text-gray-300 hidden md:inline">|</span>
          <a href={`https://${data.personalInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary-dark"><Linkedin size={14} className="mr-1.5" />{data.personalInfo.linkedin}</a>
          {data.personalInfo.website && (
            <>
              <span className="text-gray-300 hidden md:inline">|</span>
              <a href={data.personalInfo.website.startsWith('http') ? data.personalInfo.website : `https://${data.personalInfo.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary-dark"><Globe size={14} className="mr-1.5" />{data.personalInfo.website}</a>
            </>
          )}
        </div>
      </header>
  
      {/* Main Content */}
      <main>
        {/* Summary */}
        <CreativeSection title="Summary" color={style.primaryColor}>
          <p className="text-center leading-relaxed">{data.summary}</p>
        </CreativeSection>
  
        {/* Work Experience */}
        <CreativeSection title="Experience" color={style.primaryColor}>
          <div className="space-y-5">
            {data.workExperience.map(job => (
              <div key={job.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base">{job.jobTitle}</h3>
                    <p className="text-sm italic text-gray-700">{job.company}, {job.location}</p>
                  </div>
                  <span className="text-xs font-medium text-right text-gray-600 whitespace-nowrap pl-4">{job.startDate} - {job.isCurrent ? 'Present' : job.endDate}</span>
                </div>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-gray-700">
                  {job.description.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </CreativeSection>
        
        {/* Skills */}
        <CreativeSection title="Skills" color={style.primaryColor}>
            <div className="flex flex-wrap justify-center gap-2">
                {data.skills.map(s => (
                    <span key={s.id} className="text-xs font-medium px-3 py-1 rounded" style={{ backgroundColor: style.primaryColor + '20', color: style.primaryColor }}>
                    {s.name}
                    </span>
                ))}
            </div>
        </CreativeSection>

        {/* Education & Projects Grid */}
        <div className="grid grid-cols-2 gap-x-12">
            <div>
                 <CreativeSection title="Education" color={style.primaryColor}>
                    <div className="space-y-4">
                        {data.education.map(edu => (
                        <div key={edu.id}>
                            <h3 className="font-bold">{edu.institution}</h3>
                            <p className="">{edu.degree}</p>
                            <p className="italic text-gray-600">{edu.fieldOfStudy}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{edu.startDate} - {edu.endDate}</p>
                        </div>
                        ))}
                    </div>
                </CreativeSection>
            </div>
             <div>
                {data.projects.length > 0 && (
                     <CreativeSection title="Projects" color={style.primaryColor}>
                        <div className="space-y-4">
                        {data.projects.map(proj => (
                            <div key={proj.id}>
                                <a href={proj.url.startsWith('http') ? proj.url : `https://${proj.url}`} className="font-bold hover:underline" style={{ color: style.primaryColor }} target="_blank" rel="noopener noreferrer">
                                {proj.name}
                                </a>
                                <p className="mt-1 text-gray-700">{proj.description}</p>
                            </div>
                        ))}
                        </div>
                    </CreativeSection>
                )}
            </div>
        </div>
      </main>
    </div>
  );