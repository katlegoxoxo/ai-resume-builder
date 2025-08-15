// Note: You will need to install lucide-react:
// npm install lucide-react
import React from 'react';
import { FileText, Download, Wand2, Search, Settings, FileDown, Brush, CheckCircle, AlertTriangle, Lightbulb, Trash2, PlusCircle, Star, UploadCloud } from 'lucide-react';

interface IconProps {
  className?: string;
}

export const IconResume: React.FC<IconProps> = ({ className }) => <FileText className={className} />;
export const IconDownload: React.FC<IconProps> = ({ className }) => <Download className={className} />;
export const IconMagic: React.FC<IconProps> = ({ className }) => <Wand2 className={className} />;
export const IconAnalyze: React.FC<IconProps> = ({ className }) => <Search className={className} />;
export const IconSettings: React.FC<IconProps> = ({ className }) => <Settings className={className} />;
export const IconExport: React.FC<IconProps> = ({ className }) => <FileDown className={className} />;
export const IconDesign: React.FC<IconProps> = ({ className }) => <Brush className={className} />;
export const IconCheck: React.FC<IconProps> = ({ className }) => <CheckCircle className={className} />;
export const IconWarning: React.FC<IconProps> = ({ className }) => <AlertTriangle className={className} />;
export const IconSuggestion: React.FC<IconProps> = ({ className }) => <Lightbulb className={className} />;
export const IconTrash: React.FC<IconProps> = ({ className }) => <Trash2 className={className} />;
export const IconPlus: React.FC<IconProps> = ({ className }) => <PlusCircle className={className} />;
export const IconStar: React.FC<IconProps> = ({ className }) => <Star className={className} />;
export const IconUpload: React.FC<IconProps> = ({ className }) => <UploadCloud className={className} />;
