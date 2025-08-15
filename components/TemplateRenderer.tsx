
import React from 'react';
import { ModernTemplate, ProfessionalTemplate, CreativeTemplate } from './ResumeTemplates';
import { ResumeData, TemplateId, TemplateStyle } from '../types';

interface TemplateRendererProps {
  templateId: TemplateId;
  data: ResumeData;
  style: TemplateStyle;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ templateId, data, style }) => {
  const resumeId = "resume-preview-content";

  switch (templateId) {
    case TemplateId.MODERN:
      return <ModernTemplate id={resumeId} data={data} style={style} />;
    case TemplateId.PROFESSIONAL:
      return <ProfessionalTemplate id={resumeId} data={data} style={style} />;
    case TemplateId.CREATIVE:
      return <CreativeTemplate id={resumeId} data={data} style={style} />;
    default:
      return <ModernTemplate id={resumeId} data={data} style={style} />;
  }
};
